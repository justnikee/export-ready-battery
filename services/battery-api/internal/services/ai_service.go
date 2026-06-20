package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Groq API Configuration
const groqAPIURL = "https://api.groq.com/openai/v1/chat/completions"
const groqModel = "llama-3.3-70b-versatile"

// DatasheetParseResult is the structured output from parsing a battery datasheet.
// It covers all fields that can realistically appear on a manufacturer spec sheet.
type DatasheetParseResult struct {
	// === Identity ===
	ModelName       string `json:"model_name"`
	PartNumber      string `json:"part_number"`
	SerialNumberFmt string `json:"serial_number_format"`

	// === Electrical Specifications ===
	Chemistry         string `json:"chemistry"`
	Capacity          string `json:"capacity"`
	Voltage           string `json:"voltage"`
	EnergyDensity     string `json:"energy_density"`
	InternalResistance string `json:"internal_resistance"`
	MaxChargeCurrent  string `json:"max_charge_current"`
	MaxDischargeCurrent string `json:"max_discharge_current"`
	CutoffVoltage     string `json:"cutoff_voltage"`

	// === Physical ===
	Weight      string `json:"weight"`
	Dimensions  string `json:"dimensions"`
	TerminalType string `json:"terminal_type"`
	IPRating    string `json:"ip_rating"`

	// === Performance ===
	CycleLife           string `json:"cycle_life"`
	CalendarLife        string `json:"calendar_life"`
	ExpectedLifetimeCycles string `json:"expected_lifetime_cycles"` // mapped from cycle_life if numeric
	OperatingTemp       string `json:"operating_temperature"`
	StorageTemp         string `json:"storage_temperature"`
	SelfDischarge       string `json:"self_discharge"`

	// === Manufacturer ===
	Manufacturer        string `json:"manufacturer"`
	ManufacturerAddress string `json:"manufacturer_address"`
	ManufacturerEmail   string `json:"manufacturer_email"`
	CountryOfOrigin     string `json:"country_of_origin"`
	FactoryLocation     string `json:"factory_location"` // may differ from country_of_origin

	// === Certifications & Safety ===
	Certifications []string `json:"certifications"` // UN38.3, CE, UL, BIS, IEC62133, RoHS, REACH, KC, PSE, etc.
	UN38_3         bool     `json:"un38_3"`
	CEMarking      bool     `json:"ce_marking"`
	ULListed       bool     `json:"ul_listed"`
	BISCertified   bool     `json:"bis_certified"`
	IEC62133       bool     `json:"iec_62133"`
	RoHSCompliant  bool     `json:"rohs_compliant"`
	REACHCompliant bool     `json:"reach_compliant"`

	// === EU Battery Regulation (2023/1542) ===
	NotifiedBodyNumber      string `json:"notified_body_number"`
	EURepresentative        string `json:"eu_representative"`
	EURepresentativeEmail   string `json:"eu_representative_email"`
	EURepresentativeAddress string `json:"eu_representative_address"`
	RemovableAndReplaceable bool   `json:"removable_and_replaceable"`
	CarbonFootprint         string `json:"carbon_footprint"`
	CarbonPerformanceClass  string `json:"carbon_performance_class"` // A-G
	WarrantyMonths          string `json:"warranty_months"`

	// === India BIS / Compliance ===
	BISNumber   string `json:"bis_number"`
	EPRNumber   string `json:"epr_number"`
	HSNCode     string `json:"hsn_code"`
	ISStandard  string `json:"is_standard"` // e.g. IS 16046

	// === Material Composition (EU Art. 8) ===
	MaterialComposition map[string]string `json:"material_composition"` // lithium, cobalt, nickel, manganese, graphite, lead -> pct strings
	RecycledContentPct  string            `json:"recycled_content_pct"`
	RecycledCobalt      string            `json:"recycled_cobalt"`
	RecycledLithium     string            `json:"recycled_lithium"`
	RecycledNickel      string            `json:"recycled_nickel"`
	RecycledLead        string            `json:"recycled_lead"`

	// === Hazardous Substances ===
	HazardousLeadPresent    bool `json:"hazardous_lead_present"`
	HazardousMercuryPresent bool `json:"hazardous_mercury_present"`
	HazardousCadmiumPresent bool `json:"hazardous_cadmium_present"`
	HazardousDeclaration    string `json:"hazardous_declaration"`

	// === Metadata ===
	Confidence       float64 `json:"confidence"`
	Method           string  `json:"method"` // "regex" or "llm"
	ProcessingTimeMs int     `json:"processing_time_ms,omitempty"`

	// FieldSources records, for a tracked subset of fields (see trackedProvenanceFields),
	// which extraction stage produced the value: "regex", "llm", or "missing". Powers the
	// frontend's per-field confidence preview. Keep in sync with the field list consumed by
	// apps/battery-web/components/batches/batch-form-steps/ai-field-preview-table.tsx.
	FieldSources map[string]string `json:"field_sources,omitempty"`
}

// trackedProvenanceFields are the JSON-tagged field names for which FieldSources is populated.
// This is deliberately a subset of DatasheetParseResult — only the fields the frontend's AI
// preview table and applyPdfResult actually surface, not all ~50 struct fields.
var trackedProvenanceFields = []string{
	"model_name", "chemistry", "capacity", "voltage", "weight",
	"manufacturer", "manufacturer_address", "manufacturer_email", "country_of_origin",
	"ce_marking", "carbon_footprint", "carbon_performance_class", "notified_body_number",
	"eu_representative", "eu_representative_email", "eu_representative_address",
	"removable_and_replaceable", "expected_lifetime_cycles", "warranty_months",
	"bis_number", "epr_number", "hsn_code", "hazardous_declaration", "certifications",
}

// NLCreateResult is the structured output from natural language
type NLCreateResult struct {
	BatchName       string `json:"batch_name"`
	ModelName       string `json:"model_name"`
	Chemistry       string `json:"chemistry"`
	Capacity        string `json:"capacity"`
	Voltage         string `json:"voltage"`
	Quantity        int    `json:"quantity"`
	MarketRegion    string `json:"market_region"`
	CustomerName    string `json:"customer_name,omitempty"`
	Weight          string `json:"weight,omitempty"`
	BatteryCategory string `json:"battery_category,omitempty"`
}

const (
	cacheMaxEntries = 100
	cacheTTL        = 1 * time.Hour
)

type parseCacheEntry struct {
	result    *DatasheetParseResult
	timestamp time.Time
	hash      string
}

// AIService handles AI-powered parsing and generation
type AIService struct {
	groqAPIKey string
	client     *http.Client

	parseCache   map[string]*parseCacheEntry
	parseCacheMu sync.RWMutex
}

// NewAIService creates a new AI service
func NewAIService(groqAPIKey string) *AIService {
	return &AIService{
		groqAPIKey: groqAPIKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		parseCache: make(map[string]*parseCacheEntry),
	}
}

// hashText computes a SHA-256 hash of normalized text for cache keys.
func hashText(text string) string {
	// Normalize: lowercase, collapse whitespace
	normalized := strings.ToLower(text)
	normalized = regexp.MustCompile(`\s+`).ReplaceAllString(normalized, " ")
	normalized = strings.TrimSpace(normalized)
	h := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(h[:])
}

// getCachedResult returns a cached parse result if it exists and is not expired.
func (s *AIService) getCachedResult(textHash string) *DatasheetParseResult {
	s.parseCacheMu.RLock()
	entry, ok := s.parseCache[textHash]
	s.parseCacheMu.RUnlock()

	if !ok {
		return nil
	}
	if time.Since(entry.timestamp) > cacheTTL {
		// Expired — clean up
		s.parseCacheMu.Lock()
		delete(s.parseCache, textHash)
		s.parseCacheMu.Unlock()
		return nil
	}
	return entry.result
}

// setCachedResult stores a parse result in the cache, evicting oldest if full.
func (s *AIService) setCachedResult(textHash string, result *DatasheetParseResult) {
	s.parseCacheMu.Lock()
	defer s.parseCacheMu.Unlock()

	// If at capacity, evict oldest entry
	if len(s.parseCache) >= cacheMaxEntries {
		var oldestKey string
		var oldestTime time.Time
		for k, v := range s.parseCache {
			if oldestKey == "" || v.timestamp.Before(oldestTime) {
				oldestKey = k
				oldestTime = v.timestamp
			}
		}
		if oldestKey != "" {
			delete(s.parseCache, oldestKey)
		}
	}

	s.parseCache[textHash] = &parseCacheEntry{
		result:    result,
		timestamp: time.Now(),
		hash:      textHash,
	}
}

// ParseDatasheet attempts to extract battery specs from text.
// Check cache first, then regex (fast/free), then Groq LLM if confidence is low.
func (s *AIService) ParseDatasheet(ctx context.Context, text string) (*DatasheetParseResult, error) {
	start := time.Now()

	// 1. Check cache
	textHash := hashText(text)
	if cached := s.getCachedResult(textHash); cached != nil {
		cached.ProcessingTimeMs = int(time.Since(start).Milliseconds())
		cached.Method = "cached"
		return cached, nil
	}

	// 2. Regex extraction
	regexResult := s.extractWithRegex(text)
	regexConfidence := s.calculateConfidence(regexResult)

	if regexConfidence >= 0.70 {
		regexResult.Confidence = regexConfidence
		regexResult.Method = "regex"
		regexResult.ProcessingTimeMs = int(time.Since(start).Milliseconds())
		regexResult.FieldSources = buildFieldSources(regexResult, nil)
		s.setCachedResult(textHash, regexResult)
		return regexResult, nil
	}

	// 3. LLM fallback
	if s.groqAPIKey == "" {
		regexResult.Confidence = regexConfidence
		regexResult.Method = "regex"
		regexResult.FieldSources = buildFieldSources(regexResult, nil)
		s.setCachedResult(textHash, regexResult)
		return regexResult, nil
	}

	llmResult, err := s.extractWithLLM(ctx, text)
	if err != nil {
		regexResult.Confidence = regexConfidence
		regexResult.Method = "regex"
		regexResult.FieldSources = buildFieldSources(regexResult, nil)
		s.setCachedResult(textHash, regexResult)
		return regexResult, nil
	}

	merged := s.mergeResults(regexResult, llmResult)
	merged.Confidence = s.calculateConfidence(merged)
	merged.Method = "llm"
	merged.ProcessingTimeMs = int(time.Since(start).Milliseconds())
	s.setCachedResult(textHash, merged)
	return merged, nil
}

// CreateBatchFromNL converts natural language to structured batch draft.
func (s *AIService) CreateBatchFromNL(ctx context.Context, text, defaultMarket string) (*NLCreateResult, error) {
	if s.groqAPIKey == "" {
		return nil, fmt.Errorf("LLM service not configured")
	}

	prompt := fmt.Sprintf(`You are a battery manufacturing assistant. Parse the user's request into structured JSON.

Rules:
- chemistry must be one of: LFP, NMC, NMC811, NMC622, NCA, LCO, LTO, LMO, Sodium-ion, Li-ion
- market_region must be one of: INDIA, EU, GLOBAL
- capacity should include units (e.g., "150Ah", "5000mAh")
- voltage should include units (e.g., "48V", "3.7V")
- quantity is the number of units requested
- battery_category (for EU) should be one of: EV, LMT, INDUSTRIAL, PORTABLE, SLI

User request: "%s"
Default market (if not specified): %s

Respond with ONLY valid JSON in this exact format:
{
  "batch_name": "string or null",
  "model_name": "string or null",
  "chemistry": "string or null",
  "capacity": "string or null",
  "voltage": "string or null",
  "quantity": number or null,
  "market_region": "string or null",
  "customer_name": "string or null",
  "weight": "string or null",
  "battery_category": "string or null"
}`, text, defaultMarket)

	response, err := s.callGroq(ctx, prompt)
	if err != nil {
		return nil, err
	}

	jsonStr := s.extractJSON(response)
	if jsonStr == "" {
		return nil, fmt.Errorf("no JSON found in LLM response")
	}

	var result NLCreateResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	return &result, nil
}

// ==================== Regex Extractor ====================

func (s *AIService) extractWithRegex(text string) *DatasheetParseResult {
	r := &DatasheetParseResult{
		MaterialComposition: make(map[string]string),
	}
	lower := strings.ToLower(text)

	// === Model / Part Number ===
	modelPatterns := []string{
		`(?i)(?:model|model\s*no\.?|part\s*#?|p/n|型号|型號)[\s:]*([A-Z0-9\-_/]{3,25})`,
		`(?i)^\s*([A-Z]{2,4}[\-_]?[0-9]{2,4}[A-Z0-9\-_]*)\s*$`,
	}
	for _, pat := range modelPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 1 {
			r.ModelName = strings.TrimSpace(m[1])
			break
		}
	}

	// === Part Number (separate from model) ===
	if m := regexp.MustCompile(`(?i)(?:part\s*number|part\s*no\.?|p/n)[\s:]*([A-Z0-9\-_/]{3,25})`).FindStringSubmatch(text); len(m) > 1 {
		r.PartNumber = strings.TrimSpace(m[1])
		if r.ModelName == "" {
			r.ModelName = r.PartNumber
		}
	}

	// === Chemistry ===
	chemMap := []struct {
		code     string
		patterns []string
	}{
		{"LFP", []string{`LiFePO4`, `LFP`, `lithium iron phosphate`, `磷酸铁锂`, `リン酸鉄`}},
		{"NMC811", []string{`NMC811`, `NCM811`, `NMC 811`, `NCM 811`}},
		{"NMC622", []string{`NMC622`, `NCM622`, `NMC 622`}},
		{"NMC", []string{`NMC(?!8)`, `NCM(?!8)`, `nickel manganese cobalt`, `三元锂`, `ニッケルマンガン`}},
		{"NCA", []string{`NCA(?!.)`, `nickel cobalt aluminium`, `nickel cobalt aluminum`}},
		{"LCO", []string{`LiCoO2`, `LCO`, `lithium cobalt oxide`}},
		{"LTO", []string{`Li4Ti5O12`, `LTO`, `lithium titanate`}},
		{"LMO", []string{`LiMn2O4`, `LMO`, `lithium manganese oxide`, `lithium manganate`}},
		{"Sodium-ion", []string{`sodium.ion`, `Na.ion`, `sodium ion`, `ナトリウムイオン`}},
	}
	for _, entry := range chemMap {
		for _, p := range entry.patterns {
			if regexp.MustCompile(`(?i)`+p).MatchString(text) {
				r.Chemistry = entry.code
				break
			}
		}
		if r.Chemistry != "" {
			break
		}
	}

	// === Capacity ===
	capPatterns := []string{
		`(?i)(?:rated\s+capacity|nominal\s+capacity|capacity|额定容量|典型容量|标称容量)[\s:]*([0-9,.]+)\s*(mAh|Ah|Wh|kWh)`,
		`(?i)(?:capacity)[\s:]*([0-9,.]+)\s*(mAh|Ah|Wh)`,
		`(?i)([0-9,.]+)\s*(mAh|Ah)\s*(?:nominal|rated)`,
	}
	for _, pat := range capPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 2 {
			r.Capacity = strings.TrimSpace(m[1]) + " " + strings.ToUpper(m[2])
			break
		}
	}

	// === Voltage ===
	voltPatterns := []string{
		`(?i)(?:nominal\s+voltage|rated\s+voltage|voltage|标称电压|额定电压)[\s:]*([0-9,.]+)\s*(V|v)`,
		`(?i)(?:working\s+voltage|operating\s+voltage)[\s:]*([0-9,.]+)\s*V`,
		`([0-9.]+)\s*V\s*(?:nominal|rated|标称)`,
	}
	for _, pat := range voltPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 1 {
			r.Voltage = strings.TrimSpace(m[1]) + "V"
			break
		}
	}

	// === Energy Density ===
	if m := regexp.MustCompile(`(?i)(?:energy\s+density|能量密度|エネルギー密度)[\s:]*([0-9,.]+)\s*(Wh/kg|wh/kg|Wh/L)`).FindStringSubmatch(text); len(m) > 1 {
		r.EnergyDensity = strings.TrimSpace(m[1]) + " Wh/kg"
	}

	// === Internal Resistance ===
	if m := regexp.MustCompile(`(?i)(?:internal\s+resistance|ac\s+impedance|内阻)[\s:≤]*([0-9,.]+)\s*(mΩ|Ω|ohm)`).FindStringSubmatch(text); len(m) > 2 {
		r.InternalResistance = strings.TrimSpace(m[1]) + " " + m[2]
	}

	// === Max Charge / Discharge Current ===
	if m := regexp.MustCompile(`(?i)(?:max(?:imum)?\s+charge\s+current|charge\s+current)[\s:]*([0-9,.]+)\s*(A|mA|C)`).FindStringSubmatch(text); len(m) > 2 {
		r.MaxChargeCurrent = strings.TrimSpace(m[1]) + " " + m[2]
	}
	if m := regexp.MustCompile(`(?i)(?:max(?:imum)?\s+discharge\s+current|discharge\s+current)[\s:]*([0-9,.]+)\s*(A|mA|C)`).FindStringSubmatch(text); len(m) > 2 {
		r.MaxDischargeCurrent = strings.TrimSpace(m[1]) + " " + m[2]
	}

	// === Cutoff Voltage ===
	if m := regexp.MustCompile(`(?i)(?:cut.off\s+voltage|end\s+voltage|discharge\s+cut.off)[\s:]*([0-9,.]+)\s*V`).FindStringSubmatch(text); len(m) > 1 {
		r.CutoffVoltage = strings.TrimSpace(m[1]) + "V"
	}

	// === Weight ===
	weightPatterns := []string{
		`(?i)(?:weight|net\s+weight|重量|質量)[\s:]*([0-9,.]+)\s*(g|kg|grams|mg|oz|lbs)`,
		`(?i)([0-9,.]+)\s*(kg|g)\s*(?:weight|net)`,
	}
	for _, pat := range weightPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 2 {
			r.Weight = strings.TrimSpace(m[1]) + " " + strings.ToLower(m[2])
			break
		}
	}

	// === Dimensions ===
	dimPatterns := []string{
		`(?i)(?:dimension|size|外形尺寸|サイズ)[\s:]*([0-9,.]+\s*[x×]\s*[0-9,.]+\s*[x×]\s*[0-9,.]+)\s*(mm|cm)?`,
		`(?i)([0-9,.]+)\s*mm?\s*[x×]\s*([0-9,.]+)\s*mm?\s*[x×]\s*([0-9,.]+)\s*mm?`,
	}
	for _, pat := range dimPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 1 {
			r.Dimensions = strings.TrimSpace(m[1])
			if len(m) > 3 {
				r.Dimensions = m[1] + " x " + m[2] + " x " + m[3] + " mm"
			}
			break
		}
	}

	// === Terminal Type ===
	if m := regexp.MustCompile(`(?i)(?:terminal|connector|端子)[\s:]*([A-Za-z0-9\-_\s]{2,20})`).FindStringSubmatch(text); len(m) > 1 {
		r.TerminalType = strings.TrimSpace(m[1])
	}

	// === IP Rating ===
	if m := regexp.MustCompile(`(?i)(IP6[0-9]|IP5[0-9]|IP[0-9]{2})`).FindStringSubmatch(text); len(m) > 1 {
		r.IPRating = m[1]
	}

	// === Cycle Life ===
	cyclePatterns := []string{
		`(?i)(?:cycle\s+life|cycles|循环寿命|サイクル寿命)[\s:≥]*([0-9,.]+)\s*(?:cycles?|次|times)?`,
		`(?i)([0-9,.]+)\s*cycles?\s*[@＠]`,
	}
	for _, pat := range cyclePatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 1 {
			r.CycleLife = strings.TrimSpace(m[1])
			// Also map to expected_lifetime_cycles if pure numeric
			if n, err := strconv.Atoi(r.CycleLife); err == nil && n > 0 {
				r.ExpectedLifetimeCycles = r.CycleLife
			}
			break
		}
	}

	// === Calendar Life ===
	if m := regexp.MustCompile(`(?i)(?:calendar\s+life|shelf\s+life|service\s+life)[\s:]*([0-9,.]+)\s*(years?|yr|months?)`).FindStringSubmatch(text); len(m) > 2 {
		r.CalendarLife = strings.TrimSpace(m[1]) + " " + m[2]
	}

	// === Operating Temperature ===
	if m := regexp.MustCompile(`(?i)(?:operating\s+temperature|工作温度|動作温度)[\s:]*([\-–−0-9,.]+\s*°?\s*[CF]\s*[~到to-–−]+\s*[\-–−0-9,.]+\s*°?\s*[CF])`).FindStringSubmatch(text); len(m) > 1 {
		r.OperatingTemp = strings.TrimSpace(m[1])
	}

	// === Storage Temperature ===
	if m := regexp.MustCompile(`(?i)(?:storage\s+temperature|保存温度)[\s:]*([\-–−0-9,.]+\s*°?\s*[CF]\s*[~到to-–−]+\s*[\-–−0-9,.]+\s*°?\s*[CF])`).FindStringSubmatch(text); len(m) > 1 {
		r.StorageTemp = strings.TrimSpace(m[1])
	}

	// === Self Discharge ===
	if m := regexp.MustCompile(`(?i)(?:self.discharge|自放电)[\s:]*([0-9,.]+)\s*%?\s*/\s*month`).FindStringSubmatch(text); len(m) > 1 {
		r.SelfDischarge = strings.TrimSpace(m[1]) + "%/month"
	}

	// === Manufacturer ===
	mfgPatterns := []string{
		`(?i)(?:manufacturer|maker|brand|factory|produced\s+by|made\s+by|制造商|厂家|メーカー)[\s:]*([A-Za-z0-9\s\-&.]{2,35})`,
		`(?i)(?:company|corporation|corp\.?|ltd\.?|inc\.?)[\s:]*([A-Za-z0-9\s\-&.]{2,35})`,
	}
	for _, pat := range mfgPatterns {
		if m := regexp.MustCompile(pat).FindStringSubmatch(text); len(m) > 1 {
			r.Manufacturer = strings.TrimSpace(m[1])
			break
		}
	}

	// === Manufacturer Address ===
	if m := regexp.MustCompile(`(?i)(?:address|addr\.?|地址|所在地)[\s:]*([A-Za-z0-9\s,\.\-#]{10,80})`).FindStringSubmatch(text); len(m) > 1 {
		r.ManufacturerAddress = strings.TrimSpace(m[1])
	}

	// === Country of Origin ===
	countryMap := map[string][]string{
		"CN": {"china", "中国", "prc", "shenzhen", "dongguan", "ningde", "byd", "catl", "eve", "lishen"},
		"KR": {"korea", "韩国", "republic of korea", "lg chem", "samsung sdi", "sk on"},
		"JP": {"japan", "日本", "panasonic", "sanyo", "gs yuasa"},
		"DE": {"germany", "德国", "deutschland", "varta", "akasol"},
		"US": {"usa", "united states", "america", "tesla", "microvast"},
		"IN": {"india", "印度", "exide", "amara raja"},
		"TW": {"taiwan", "台湾", "formosa"},
	}
	for code, patterns := range countryMap {
		for _, p := range patterns {
			if strings.Contains(lower, p) {
				r.CountryOfOrigin = code
				break
			}
		}
		if r.CountryOfOrigin != "" {
			break
		}
	}

	// === Certifications ===
	certDetectors := map[string]struct {
		pattern string
		field   *bool
	}{
		"UN38.3":  {`UN38\.3|un38\.3`, &r.UN38_3},
		"CE":      {`\bCE\b|CE\s+mark|CE\s+认证`, &r.CEMarking},
		"UL":      {`\bUL\b|UL\s+listed|UL\s+认证`, &r.ULListed},
		"BIS":     {`\bBIS\b|IS\s+16046|BIS\s+认证`, &r.BISCertified},
		"IEC62133":{`IEC\s*62133|IEC62133`, &r.IEC62133},
		"RoHS":    {`RoHS|rohs|RoHS\s+ compliant`, &r.RoHSCompliant},
		"REACH":   {`REACH|reach\s+compliant`, &r.REACHCompliant},
	}
	for cert, detector := range certDetectors {
		if regexp.MustCompile(`(?i)`+detector.pattern).MatchString(text) {
			r.Certifications = append(r.Certifications, cert)
			*detector.field = true
		}
	}

	// === Notified Body Number ===
	if m := regexp.MustCompile(`(?i)(?:notified\s+body|notification\s+body|nb\s*#?)[\s:]*([0-9]{3,5})`).FindStringSubmatch(text); len(m) > 1 {
		r.NotifiedBodyNumber = m[1]
	}

	// === EU Representative ===
	if m := regexp.MustCompile(`(?i)(?:eu\s+representative|authorized\s+representative|ec\s+rep)[\s:]*([A-Za-z0-9\s,\.\-&]{5,60})`).FindStringSubmatch(text); len(m) > 1 {
		r.EURepresentative = strings.TrimSpace(m[1])
	}

	// === Carbon Footprint ===
	if m := regexp.MustCompile(`(?i)(?:carbon\s+footprint|co2|co₂)[\s:]*([0-9,.]+)\s*(kg\s*co2e?|g\s*co2e?|kg\s*co₂e?)`).FindStringSubmatch(text); len(m) > 1 {
		r.CarbonFootprint = strings.TrimSpace(m[1])
	}

	// === Carbon Performance Class ===
	if m := regexp.MustCompile(`(?i)carbon\s+class\s*[:]?\s*([A-G])`).FindStringSubmatch(text); len(m) > 1 {
		r.CarbonPerformanceClass = strings.ToUpper(m[1])
	}

	// === Warranty ===
	if m := regexp.MustCompile(`(?i)(?:warranty|guarantee)[\s:]*([0-9,.]+)\s*(months?|years?|yr)`).FindStringSubmatch(text); len(m) > 2 {
		val := strings.TrimSpace(m[1])
		unit := strings.ToLower(m[2])
		if strings.HasPrefix(unit, "year") || strings.HasPrefix(unit, "yr") {
			if y, err := strconv.Atoi(val); err == nil {
				r.WarrantyMonths = strconv.Itoa(y * 12)
			}
		} else {
			r.WarrantyMonths = val
		}
	}

	// === BIS Number ===
	if m := regexp.MustCompile(`(?i)(?:bis\s*(?:registration|r|cert|certificate)?\s*#?|is\s*16046)[\s:]*([A-Z0-9\-]{5,15})`).FindStringSubmatch(text); len(m) > 1 {
		r.BISNumber = strings.TrimSpace(m[1])
	}

	// === EPR Number ===
	if m := regexp.MustCompile(`(?i)(?:epr\s*(?:registration|no\.?)?)[\s:]*([A-Z0-9\-]{5,15})`).FindStringSubmatch(text); len(m) > 1 {
		r.EPRNumber = strings.TrimSpace(m[1])
	}

	// === IS Standard ===
	if regexp.MustCompile(`(?i)IS\s*16046`).MatchString(text) {
		r.ISStandard = "IS 16046"
	}

	// === Material Composition ===
	r.MaterialComposition = s.extractMaterialComposition(text)

	// === Recycled Content ===
	if m := regexp.MustCompile(`(?i)(?:recycled\s+content|recycled\s+material)[\s:]*([0-9,.]+)\s*%`).FindStringSubmatch(text); len(m) > 1 {
		r.RecycledContentPct = strings.TrimSpace(m[1])
	}

	// === Hazardous Substances ===
	if regexp.MustCompile(`(?i)(?:lead\s*free|no\s*lead|pb\s*free)`).MatchString(text) {
		r.HazardousLeadPresent = false
	} else if m := regexp.MustCompile(`(?i)lead\s*(?:content|compound)[\s:]*([0-9,.]+)\s*ppm`).FindStringSubmatch(text); m != nil {
		if ppm, _ := strconv.Atoi(m[1]); ppm > 0 {
			r.HazardousLeadPresent = true
		}
	}
	if regexp.MustCompile(`(?i)(?:mercury\s*free|no\s*mercury|hg\s*free)`).MatchString(text) {
		r.HazardousMercuryPresent = false
	}
	if regexp.MustCompile(`(?i)(?:cadmium\s*free|no\s*cadmium|cd\s*free)`).MatchString(text) {
		r.HazardousCadmiumPresent = false
	}

	// === Hazardous Declaration ===
	if regexp.MustCompile(`(?i)(?:rohs\s+compliant|rohs\s+directive|2011/65/eu)`).MatchString(text) {
		r.HazardousDeclaration = "RoHS compliant per Directive 2011/65/EU"
	} else if regexp.MustCompile(`(?i)(?:free\s+of\s*hazardous|no\s*hazardous\s+substances)`).MatchString(text) {
		r.HazardousDeclaration = "Free of hazardous substances per EU Battery Regulation"
	}

	// === Removable & Replaceable ===
	if regexp.MustCompile(`(?i)(?:removable|replaceable|user\s+replaceable|serviceable)`).MatchString(text) {
		r.RemovableAndReplaceable = true
	}

	return r
}

func (s *AIService) extractMaterialComposition(text string) map[string]string {
	result := make(map[string]string)

	materials := []struct {
		key      string
		patterns []string
	}{
		{"lithium", []string{`lithium`, `li\b`}},
		{"cobalt", []string{`cobalt`, `co\b`}},
		{"nickel", []string{`nickel`, `ni\b`}},
		{"manganese", []string{`manganese`, `mn\b`}},
		{"graphite", []string{`graphite`, `carbon\s*(?:anode|material)`}},
		{"lead", []string{`lead`, `pb\b`}},
	}

	for _, mat := range materials {
		for _, pat := range mat.patterns {
			regex := regexp.MustCompile(fmt.Sprintf(`(?i)%s[^0-9]{0,15}([0-9.]+)\s*%%`, pat))
			if m := regex.FindStringSubmatch(text); len(m) > 1 {
				val, _ := strconv.ParseFloat(m[1], 64)
				if val > 0 && val <= 100 {
					result[mat.key] = m[1]
					break
				}
			}
		}
	}

	return result
}

func (s *AIService) calculateConfidence(r *DatasheetParseResult) float64 {
	// Core fields (highest weight)
	coreFields := []string{r.ModelName, r.Chemistry, r.Capacity, r.Voltage, r.Weight}
	coreFilled := 0
	for _, f := range coreFields {
		if f != "" {
			coreFilled++
		}
	}
	coreScore := float64(coreFilled) / float64(len(coreFields)) * 0.50

	// Secondary fields
	secondaryFields := []string{r.Manufacturer, r.CountryOfOrigin, r.CycleLife, r.EnergyDensity}
	secFilled := 0
	for _, f := range secondaryFields {
		if f != "" {
			secFilled++
		}
	}
	secScore := float64(secFilled) / float64(len(secondaryFields)) * 0.25

	// Compliance fields
	compScore := 0.0
	if len(r.Certifications) > 0 {
		compScore += 0.10
	}
	if r.CarbonFootprint != "" || r.CarbonPerformanceClass != "" {
		compScore += 0.05
	}
	if r.NotifiedBodyNumber != "" || r.EURepresentative != "" {
		compScore += 0.05
	}
	if len(r.MaterialComposition) > 0 {
		compScore += 0.05
	}

	return coreScore + secScore + compScore
}

// fieldNonEmpty reports whether the named tracked field (see trackedProvenanceFields) has a
// non-empty/non-zero value on r. r may be nil, in which case it always reports false.
func fieldNonEmpty(r *DatasheetParseResult, field string) bool {
	if r == nil {
		return false
	}
	switch field {
	case "model_name":
		return r.ModelName != ""
	case "chemistry":
		return r.Chemistry != ""
	case "capacity":
		return r.Capacity != ""
	case "voltage":
		return r.Voltage != ""
	case "weight":
		return r.Weight != ""
	case "manufacturer":
		return r.Manufacturer != ""
	case "manufacturer_address":
		return r.ManufacturerAddress != ""
	case "manufacturer_email":
		return r.ManufacturerEmail != ""
	case "country_of_origin":
		return r.CountryOfOrigin != ""
	case "ce_marking":
		return r.CEMarking
	case "carbon_footprint":
		return r.CarbonFootprint != ""
	case "carbon_performance_class":
		return r.CarbonPerformanceClass != ""
	case "notified_body_number":
		return r.NotifiedBodyNumber != ""
	case "eu_representative":
		return r.EURepresentative != ""
	case "eu_representative_email":
		return r.EURepresentativeEmail != ""
	case "eu_representative_address":
		return r.EURepresentativeAddress != ""
	case "removable_and_replaceable":
		return r.RemovableAndReplaceable
	case "expected_lifetime_cycles":
		return r.ExpectedLifetimeCycles != ""
	case "warranty_months":
		return r.WarrantyMonths != ""
	case "bis_number":
		return r.BISNumber != ""
	case "epr_number":
		return r.EPRNumber != ""
	case "hsn_code":
		return r.HSNCode != ""
	case "hazardous_declaration":
		return r.HazardousDeclaration != ""
	case "certifications":
		return len(r.Certifications) > 0
	default:
		return false
	}
}

// buildFieldSources records, per tracked field, which extraction stage produced the final
// value: "llm" if the LLM result has it (LLM always wins on merge, see prefer() below),
// "regex" if only the regex pass found it, or "missing" if neither did. llm may be nil for
// the regex-only paths (high regex confidence, no Groq key configured, or LLM call failed).
func buildFieldSources(regex, llm *DatasheetParseResult) map[string]string {
	sources := make(map[string]string, len(trackedProvenanceFields))
	for _, field := range trackedProvenanceFields {
		switch {
		case fieldNonEmpty(llm, field):
			sources[field] = "llm"
		case fieldNonEmpty(regex, field):
			sources[field] = "regex"
		default:
			sources[field] = "missing"
		}
	}
	return sources
}

func (s *AIService) mergeResults(regex, llm *DatasheetParseResult) *DatasheetParseResult {
	merged := *regex

	// Helper: prefer LLM if non-empty
	prefer := func(llmVal, regexVal string) string {
		if llmVal != "" {
			return llmVal
		}
		return regexVal
	}

	merged.ModelName = prefer(llm.ModelName, regex.ModelName)
	merged.PartNumber = prefer(llm.PartNumber, regex.PartNumber)
	merged.Chemistry = prefer(llm.Chemistry, regex.Chemistry)
	merged.Capacity = prefer(llm.Capacity, regex.Capacity)
	merged.Voltage = prefer(llm.Voltage, regex.Voltage)
	merged.EnergyDensity = prefer(llm.EnergyDensity, regex.EnergyDensity)
	merged.InternalResistance = prefer(llm.InternalResistance, regex.InternalResistance)
	merged.MaxChargeCurrent = prefer(llm.MaxChargeCurrent, regex.MaxChargeCurrent)
	merged.MaxDischargeCurrent = prefer(llm.MaxDischargeCurrent, regex.MaxDischargeCurrent)
	merged.CutoffVoltage = prefer(llm.CutoffVoltage, regex.CutoffVoltage)
	merged.Weight = prefer(llm.Weight, regex.Weight)
	merged.Dimensions = prefer(llm.Dimensions, regex.Dimensions)
	merged.TerminalType = prefer(llm.TerminalType, regex.TerminalType)
	merged.IPRating = prefer(llm.IPRating, regex.IPRating)
	merged.CycleLife = prefer(llm.CycleLife, regex.CycleLife)
	merged.CalendarLife = prefer(llm.CalendarLife, regex.CalendarLife)
	merged.ExpectedLifetimeCycles = prefer(llm.ExpectedLifetimeCycles, regex.ExpectedLifetimeCycles)
	merged.OperatingTemp = prefer(llm.OperatingTemp, regex.OperatingTemp)
	merged.StorageTemp = prefer(llm.StorageTemp, regex.StorageTemp)
	merged.SelfDischarge = prefer(llm.SelfDischarge, regex.SelfDischarge)
	merged.Manufacturer = prefer(llm.Manufacturer, regex.Manufacturer)
	merged.ManufacturerAddress = prefer(llm.ManufacturerAddress, regex.ManufacturerAddress)
	merged.CountryOfOrigin = prefer(llm.CountryOfOrigin, regex.CountryOfOrigin)
	merged.FactoryLocation = prefer(llm.FactoryLocation, regex.FactoryLocation)
	merged.NotifiedBodyNumber = prefer(llm.NotifiedBodyNumber, regex.NotifiedBodyNumber)
	merged.EURepresentative = prefer(llm.EURepresentative, regex.EURepresentative)
	merged.EURepresentativeEmail = prefer(llm.EURepresentativeEmail, regex.EURepresentativeEmail)
	merged.EURepresentativeAddress = prefer(llm.EURepresentativeAddress, regex.EURepresentativeAddress)
	merged.CarbonFootprint = prefer(llm.CarbonFootprint, regex.CarbonFootprint)
	merged.CarbonPerformanceClass = prefer(llm.CarbonPerformanceClass, regex.CarbonPerformanceClass)
	merged.WarrantyMonths = prefer(llm.WarrantyMonths, regex.WarrantyMonths)
	merged.BISNumber = prefer(llm.BISNumber, regex.BISNumber)
	merged.EPRNumber = prefer(llm.EPRNumber, regex.EPRNumber)
	merged.HSNCode = prefer(llm.HSNCode, regex.HSNCode)
	merged.ISStandard = prefer(llm.ISStandard, regex.ISStandard)
	merged.RecycledContentPct = prefer(llm.RecycledContentPct, regex.RecycledContentPct)
	merged.HazardousDeclaration = prefer(llm.HazardousDeclaration, regex.HazardousDeclaration)

	// Merge certifications (union)
	certSet := make(map[string]bool)
	for _, c := range regex.Certifications {
		certSet[c] = true
	}
	for _, c := range llm.Certifications {
		certSet[c] = true
	}
	merged.Certifications = nil
	for c := range certSet {
		merged.Certifications = append(merged.Certifications, c)
	}

	// Merge booleans (OR)
	merged.UN38_3 = regex.UN38_3 || llm.UN38_3
	merged.CEMarking = regex.CEMarking || llm.CEMarking
	merged.ULListed = regex.ULListed || llm.ULListed
	merged.BISCertified = regex.BISCertified || llm.BISCertified
	merged.IEC62133 = regex.IEC62133 || llm.IEC62133
	merged.RoHSCompliant = regex.RoHSCompliant || llm.RoHSCompliant
	merged.REACHCompliant = regex.REACHCompliant || llm.REACHCompliant
	merged.HazardousLeadPresent = regex.HazardousLeadPresent || llm.HazardousLeadPresent
	merged.HazardousMercuryPresent = regex.HazardousMercuryPresent || llm.HazardousMercuryPresent
	merged.HazardousCadmiumPresent = regex.HazardousCadmiumPresent || llm.HazardousCadmiumPresent
	merged.RemovableAndReplaceable = regex.RemovableAndReplaceable || llm.RemovableAndReplaceable

	// Merge material composition (prefer LLM values)
	if merged.MaterialComposition == nil {
		merged.MaterialComposition = make(map[string]string)
	}
	for k, v := range llm.MaterialComposition {
		if v != "" {
			merged.MaterialComposition[k] = v
		}
	}
	for k, v := range regex.MaterialComposition {
		if _, ok := merged.MaterialComposition[k]; !ok && v != "" {
			merged.MaterialComposition[k] = v
		}
	}

	merged.FieldSources = buildFieldSources(regex, llm)

	return &merged
}

// ==================== Groq LLM Integration ====================

func (s *AIService) extractWithLLM(ctx context.Context, text string) (*DatasheetParseResult, error) {
	prompt := fmt.Sprintf(`You are a battery specification extraction assistant. Extract ALL possible fields from this manufacturer datasheet text.

Extract these fields as JSON. Use null for missing fields:
{
  "model_name": "string or null",
  "part_number": "string or null",
  "chemistry": "LFP/NMC/NMC811/NMC622/NCA/LCO/LTO/LMO/Sodium-ion/Li-ion or null",
  "capacity": "string with units (e.g., 150Ah, 5000mAh) or null",
  "voltage": "string with units (e.g., 48V, 3.7V) or null",
  "energy_density": "string with Wh/kg or null",
  "internal_resistance": "string with mΩ or null",
  "max_charge_current": "string with A or null",
  "max_discharge_current": "string with A or null",
  "cutoff_voltage": "string with V or null",
  "weight": "string with units or null",
  "dimensions": "string (e.g., 120 x 65 x 18 mm) or null",
  "terminal_type": "string or null",
  "ip_rating": "string (e.g., IP67) or null",
  "cycle_life": "number of cycles or null",
  "calendar_life": "string or null",
  "expected_lifetime_cycles": "number or null",
  "operating_temperature": "string (e.g., -20°C to 60°C) or null",
  "storage_temperature": "string or null",
  "self_discharge": "string or null",
  "manufacturer": "company name or null",
  "manufacturer_address": "string or null",
  "country_of_origin": "2-letter ISO code (CN, KR, JP, DE, US, IN, TW) or null",
  "factory_location": "string or null",
  "certifications": ["list of certs: UN38.3, CE, UL, BIS, IEC62133, RoHS, REACH, KC, PSE, etc."],
  "un38_3": true/false,
  "ce_marking": true/false,
  "ul_listed": true/false,
  "bis_certified": true/false,
  "iec_62133": true/false,
  "rohs_compliant": true/false,
  "reach_compliant": true/false,
  "notified_body_number": "string or null",
  "eu_representative": "string or null",
  "eu_representative_email": "string or null",
  "eu_representative_address": "string or null",
  "removable_and_replaceable": true/false,
  "carbon_footprint": "string with kg CO2e or null",
  "carbon_performance_class": "A-G or null",
  "warranty_months": "number as string or null",
  "bis_number": "string or null",
  "epr_number": "string or null",
  "hsn_code": "string or null",
  "is_standard": "string or null",
  "material_composition": {"lithium": "pct", "cobalt": "pct", "nickel": "pct", "manganese": "pct", "graphite": "pct", "lead": "pct"},
  "recycled_content_pct": "string or null",
  "recycled_cobalt": "string or null",
  "recycled_lithium": "string or null",
  "recycled_nickel": "string or null",
  "recycled_lead": "string or null",
  "hazardous_lead_present": true/false,
  "hazardous_mercury_present": true/false,
  "hazardous_cadmium_present": true/false,
  "hazardous_declaration": "string or null"
}

Rules:
- Chemistry must be standardized to exactly: LFP, NMC, NMC811, NMC622, NCA, LCO, LTO, LMO, Sodium-ion, or Li-ion
- Capacity and voltage MUST include units
- Country must be 2-letter ISO code
- Material composition percentages should be strings (e.g., "3.5")
- For certifications, return true/false booleans AND include them in the certifications array
- Warranty: convert years to months if needed (e.g., "24" for 2 years)
- If cycle_life is numeric, also populate expected_lifetime_cycles with same value

Datasheet text:
"""
%s
"""

Respond with ONLY the JSON object, no markdown, no explanation.`, truncateText(text, 4000))

	response, err := s.callGroq(ctx, prompt)
	if err != nil {
		return nil, err
	}

	jsonStr := s.extractJSON(response)
	if jsonStr == "" {
		return nil, fmt.Errorf("no JSON found in LLM response")
	}

	var result DatasheetParseResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse LLM JSON: %w", err)
	}

	return &result, nil
}

func (s *AIService) callGroq(ctx context.Context, prompt string) (string, error) {
	reqBody := map[string]interface{}{
		"model": groqModel,
		"messages": []map[string]string{
			{"role": "system", "content": "You are a battery specification extraction assistant. Respond only with valid JSON."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.1,
		"max_tokens": 2048,
		"response_format": map[string]string{"type": "json_object"},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", groqAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+s.groqAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("groq API error %d: %s", resp.StatusCode, string(body))
	}

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			TotalTokens int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		return "", err
	}

	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in groq response")
	}

	return groqResp.Choices[0].Message.Content, nil
}

func (s *AIService) extractJSON(text string) string {
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start >= 0 && end > start {
		return text[start : end+1]
	}
	return text
}

func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}
