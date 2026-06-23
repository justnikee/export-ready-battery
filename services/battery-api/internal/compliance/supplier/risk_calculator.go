package supplier

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// RiskCalculator computes supplier risk scores.
type RiskCalculator struct {
	repo repository.RepositoryInterface
}

// NewRiskCalculator creates a new risk calculator.
func NewRiskCalculator(repo repository.RepositoryInterface) *RiskCalculator {
	return &RiskCalculator{repo: repo}
}

// ComputeProfile calculates or refreshes a supplier's risk profile.
func (c *RiskCalculator) ComputeProfile(ctx context.Context, supplierID, tenantID uuid.UUID) (*models.SupplierRiskProfile, error) {
	// Load supplier
	supplier, err := c.repo.GetSupplierByID(ctx, supplierID)
	if err != nil {
		return nil, err
	}
	if supplier == nil {
		return nil, nil
	}

	// 1. Country risk tier
	countryCode := normalizeCountryCode(supplier.Country)
	countryTier := GetCountryRiskTier(countryCode)

	// 2. Mineral risk flags — derived from supplier documents
	mineralFlags := c.deriveMineralFlags(ctx, supplierID)

	// 3. RMAP validity — check latest approved audit_report document
	rmapValid := c.checkRMAPValidity(ctx, supplierID, tenantID)

	// 4. Audit dates
	lastAudit, nextAudit := c.deriveAuditDates(ctx, supplierID)

	// 5. Overall score (0–100, lower is better)
	score := calculateOverallScore(countryTier, mineralFlags, rmapValid, lastAudit, nextAudit)

	profile := &models.SupplierRiskProfile{
		ID:              uuid.New().String(),
		SupplierID:      supplierID.String(),
		TenantID:        tenantID.String(),
		OverallScore:    score,
		CountryRiskTier: int(countryTier),
		MineralRiskFlags: mineralFlags,
		RMAPValid:       &rmapValid,
		LastAuditDate:   lastAudit,
		NextAuditDue:    nextAudit,
		ComputedAt:      time.Now(),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Upsert — if profile exists, update; else create
	existing, err := c.repo.GetSupplierRiskProfileBySupplier(ctx, supplierID)
	if err == nil && existing != nil {
		profile.ID = existing.ID
		profile.CreatedAt = existing.CreatedAt
		if err := c.repo.UpdateSupplierRiskProfile(ctx, profile); err != nil {
			slog.Error("failed to update supplier risk profile", "error", err, "supplier_id", supplierID)
			return nil, err
		}
	} else {
		if err := c.repo.CreateSupplierRiskProfile(ctx, profile); err != nil {
			slog.Error("failed to create supplier risk profile", "error", err, "supplier_id", supplierID)
			return nil, err
		}
	}

	return profile, nil
}

// deriveMineralFlags scans supplier documents for mineral-related uploads.
func (c *RiskCalculator) deriveMineralFlags(ctx context.Context, supplierID uuid.UUID) []string {
	docs, err := c.repo.ListSupplierDocuments(ctx, supplierID, "")
	if err != nil {
		return nil
	}
	var flags []string
	for _, doc := range docs {
		lowerName := strings.ToLower(doc.FileName)
		if strings.Contains(lowerName, "cobalt") || strings.Contains(lowerName, "co") {
			flags = appendIfUnique(flags, "cobalt")
		}
		if strings.Contains(lowerName, "lithium") || strings.Contains(lowerName, "li") {
			flags = appendIfUnique(flags, "lithium")
		}
		if strings.Contains(lowerName, "nickel") || strings.Contains(lowerName, "ni") {
			flags = appendIfUnique(flags, "nickel")
		}
		if strings.Contains(lowerName, "graphite") {
			flags = appendIfUnique(flags, "graphite")
		}
		if strings.Contains(lowerName, "manganese") || strings.Contains(lowerName, "mn") {
			flags = appendIfUnique(flags, "manganese")
		}
		if strings.Contains(lowerName, "lead") || strings.Contains(lowerName, "pb") {
			flags = appendIfUnique(flags, "lead")
		}
	}
	return flags
}

// checkRMAPValidity returns true if supplier has an approved audit_report document.
func (c *RiskCalculator) checkRMAPValidity(ctx context.Context, supplierID, tenantID uuid.UUID) bool {
	docs, err := c.repo.ListSupplierDocuments(ctx, supplierID, "approved")
	if err != nil {
		return false
	}
	for _, doc := range docs {
		if doc.DocType == "audit_report" {
			return true
		}
	}
	return false
}

// deriveAuditDates extracts audit dates from supplier documents.
func (c *RiskCalculator) deriveAuditDates(ctx context.Context, supplierID uuid.UUID) (*time.Time, *time.Time) {
	docs, err := c.repo.ListSupplierDocuments(ctx, supplierID, "approved")
	if err != nil || len(docs) == 0 {
		return nil, nil
	}
	var latest time.Time
	for _, doc := range docs {
		if doc.DocType == "audit_report" && doc.ReviewedAt != nil {
			if doc.ReviewedAt.After(latest) {
				latest = *doc.ReviewedAt
			}
		}
	}
	if latest.IsZero() {
		return nil, nil
	}
	nextDue := latest.AddDate(1, 0, 0) // Annual audit cycle
	return &latest, &nextDue
}

// calculateOverallScore computes a 0–100 risk score.
// Lower is better. 0 = lowest risk, 100 = highest risk.
func calculateOverallScore(countryTier CountryRiskTier, mineralFlags []string, rmapValid bool, lastAudit, nextAudit *time.Time) int {
	score := 0

	// Country tier contributes 0–40 points
	score += int(countryTier) * 10

	// Mineral flags contribute 0–20 points (4 points per flag)
	score += len(mineralFlags) * 4
	if score > 20 {
		score = 20
	}

	// RMAP validity: -15 if valid, +0 if not
	if rmapValid {
		score -= 15
	}

	// Audit freshness: -10 if audited within last year, +10 if overdue or never
	if lastAudit != nil {
		if time.Since(*lastAudit) < 365*24*time.Hour {
			score -= 10
		} else if nextAudit != nil && time.Now().After(*nextAudit) {
			score += 10
		}
	} else {
		score += 10 // never audited
	}

	// Clamp
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	return score
}

func appendIfUnique(slice []string, item string) []string {
	for _, s := range slice {
		if s == item {
			return slice
		}
	}
	return append(slice, item)
}

func normalizeCountryCode(country string) string {
	country = strings.TrimSpace(strings.ToUpper(country))
	// Common name → ISO code mappings
	mappings := map[string]string{
		"UNITED STATES": "US", "USA": "US", "AMERICA": "US",
		"UNITED KINGDOM": "GB", "UK": "GB", "GREAT BRITAIN": "GB",
		"CHINA": "CN", "PEOPLE'S REPUBLIC OF CHINA": "CN",
		"INDIA": "IN", "REPUBLIC OF INDIA": "IN",
		"GERMANY": "DE", "DEUTSCHLAND": "DE",
		"FRANCE": "FR",
		"JAPAN": "JP",
		"SOUTH KOREA": "KR", "REPUBLIC OF KOREA": "KR", "KOREA": "KR",
		"BRAZIL": "BR", "BRASIL": "BR",
		"RUSSIA": "RU", "RUSSIAN FEDERATION": "RU",
		"CANADA": "CA",
		"AUSTRALIA": "AU",
		"MEXICO": "MX", "MÉXICO": "MX",
		"INDONESIA": "ID",
		"NETHERLANDS": "NL", "THE NETHERLANDS": "NL",
		"SAUDI ARABIA": "SA", "KINGDOM OF SAUDI ARABIA": "SA",
		"TURKEY": "TR", "TÜRKIYE": "TR",
		"SWITZERLAND": "CH", "SWISS CONFEDERATION": "CH",
		"TAIWAN": "TW", "REPUBLIC OF CHINA": "TW",
		"POLAND": "PL",
		"SWEDEN": "SE",
		"BELGIUM": "BE",
		"THAILAND": "TH",
		"ISRAEL": "IL",
		"SINGAPORE": "SG", "REPUBLIC OF SINGAPORE": "SG",
		"AUSTRIA": "AT",
		"NIGERIA": "NG",
		"UNITED ARAB EMIRATES": "AE", "UAE": "AE",
		"NORWAY": "NO",
		"DENMARK": "DK",
		"MALAYSIA": "MY",
		"PHILIPPINES": "PH",
		"SOUTH AFRICA": "ZA", "REPUBLIC OF SOUTH AFRICA": "ZA",
		"EGYPT": "EG",
		"BANGLADESH": "BD",
		"VIETNAM": "VN", "VIET NAM": "VN", "SOCIALIST REPUBLIC OF VIETNAM": "VN",
		"FINLAND": "FI",
		"CHILE": "CL",
		"PAKISTAN": "PK",
		"COLOMBIA": "CO",
		"NEW ZEALAND": "NZ", "AOTEAROA": "NZ",
		"IRELAND": "IE",
		"SPAIN": "ES", "ESPAÑA": "ES",
		"PORTUGAL": "PT",
		"ARGENTINA": "AR",
		"ALGERIA": "DZ",
		"CZECH REPUBLIC": "CZ", "CZECHIA": "CZ",
		"ROMANIA": "RO",
		"IRAQ": "IQ",
		"PERU": "PE",
		"KAZAKHSTAN": "KZ",
		"QATAR": "QA", "STATE OF QATAR": "QA",
		"HUNGARY": "HU",
		"MOROCCO": "MA",
		"KUWAIT": "KW", "STATE OF KUWAIT": "KW",
		"SRI LANKA": "LK",
		"ECUADOR": "EC",
		"ETHIOPIA": "ET",
		"KENYA": "KE",
		"MYANMAR": "MM", "BURMA": "MM",
		"UZBEKISTAN": "UZ",
		"ANGOLA": "AO",
		"DOMINICAN REPUBLIC": "DO",
		"GHANA": "GH",
		"TANZANIA": "TZ",
		"VENEXUELA": "VE", "BOLIVARIAN REPUBLIC OF VENEZUELA": "VE",
		"GUATEMALA": "GT",
		"CUBA": "CU",
		"SYRIA": "SY", "SYRIAN ARAB REPUBLIC": "SY",
		"LUXEMBOURG": "LU",
		"BULGARIA": "BG",
		"CROATIA": "HR",
		"URUGUAY": "UY",
		"COSTA RICA": "CR",
		"PANAMA": "PA",
		"SERBIA": "RS",
		"SLOVAKIA": "SK",
		"LITHUANIA": "LT",
		"SLOVENIA": "SI",
		"OMAN": "OM", "SULTANATE OF OMAN": "OM",
		"AZERBAIJAN": "AZ",
		"TUNISIA": "TN",
		"JORDAN": "JO", "HASHEMITE KINGDOM OF JORDAN": "JO",
		"LEBANON": "LB",
		"LIBYA": "LY", "STATE OF LIBYA": "LY",
		"NEPAL": "NP",
		"YEMEN": "YE", "REPUBLIC OF YEMEN": "YE",
		"SUDAN": "SD", "REPUBLIC OF THE SUDAN": "SD",
		"CONGO": "CG", "REPUBLIC OF THE CONGO": "CG",
		"DEMOCRATIC REPUBLIC OF THE CONGO": "CD", "DRC": "CD",
		"SENEGAL": "SN",
		"CAMBODIA": "KH", "KINGDOM OF CAMBODIA": "KH",
		"ZIMBABWE": "ZW",
		"BOLIVIA": "BO",
		"PARAGUAY": "PY",
		"HONDURAS": "HN",
		"BOSNIA AND HERZEGOVINA": "BA",
		"ARMENIA": "AM", "REPUBLIC OF ARMENIA": "AM",
		"ALBANIA": "AL", "REPUBLIC OF ALBANIA": "AL",
		"LATVIA": "LV", "REPUBLIC OF LATVIA": "LV",
		"ESTONIA": "EE", "REPUBLIC OF ESTONIA": "EE",
		"NORTH MACEDONIA": "MK", "MACEDONIA": "MK",
		"MOLDOVA": "MD", "REPUBLIC OF MOLDOVA": "MD",
		"KYRGYZSTAN": "KG", "KYRGYZ REPUBLIC": "KG",
		"TAJIKISTAN": "TJ", "REPUBLIC OF TAJIKISTAN": "TJ",
		"TURKMENISTAN": "TM",
		"MONGOLIA": "MN",
		"BHUTAN": "BT", "KINGDOM OF BHUTAN": "BT",
		"MALDIVES": "MV", "REPUBLIC OF MALDIVES": "MV",
		"ICELAND": "IS",
		"MALTA": "MT", "REPUBLIC OF MALTA": "MT",
		"CYPRUS": "CY", "REPUBLIC OF CYPRUS": "CY",
		"GEORGIA": "GE",
		"MONTENEGRO": "ME",
		"BRUNEI": "BN", "BRUNEI DARUSSALAM": "BN",
		"PAPUA NEW GUINEA": "PG",
		"FIJI": "FJ", "REPUBLIC OF FIJI": "FJ",
		"SOLOMON ISLANDS": "SB",
		"TIMOR-LESTE": "TL", "EAST TIMOR": "TL",
	}
	if code, ok := mappings[country]; ok {
		return code
	}
	// If already 2-letter code, return as-is
	if len(country) == 2 {
		return country
	}
	return ""
}
