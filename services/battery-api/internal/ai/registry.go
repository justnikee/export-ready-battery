package ai

import (
	"bytes"
	"fmt"
	"text/template"
)

// Task defines the version, templates, and runtime parameters for a single
// AI use case. This prevents prompts and extraction schemas from being
// scattered across the codebase.
type Task struct {
	Name          string
	SystemPrompt  string
	UserTemplate  string   // Go template syntax (e.g. {{.Text}})
	PromptVersion int      // bumping this invalidates the L2 cache
	JSONMode      bool     // forces json_object response format
	MaxTokens     int      // default is 2048 if 0
	Temperature   float64  // controls completion creativity
	ProviderOrder []string // optional overrides (nil = use gateway chain defaults)
	MaxInputChars int      // safety truncation limit for user text
	JSONValidator func(raw []byte) []ValidationError // validation rules on JSON completions
}

// Registry maps registered task names to their definitions.
// Thread-safe: read-only map after package initialization.
var Registry = map[string]Task{
	TaskDatasheetParse: {
		Name:          TaskDatasheetParse,
		SystemPrompt:  "You are a battery specification extraction assistant. Respond only with valid JSON.",
		PromptVersion: 1, // mapped to PromptVersion cache key
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a battery specification extraction assistant. Extract ALL possible fields from this manufacturer datasheet text.

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
{{.Text}}
"""

Respond with ONLY the JSON object, no markdown, no explanation.`,
	},
	TaskNLBatchCreate: {
		Name:          TaskNLBatchCreate,
		SystemPrompt:  "You are a battery manufacturing assistant. Parse the user's request into structured JSON.",
		PromptVersion: 1,
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a battery manufacturing assistant. Parse the user's request into structured JSON.

Rules:
- chemistry must be one of: LFP, NMC, NMC811, NMC622, NCA, LCO, LTO, LMO, Sodium-ion, Li-ion
- market_region must be one of: INDIA, EU
- capacity should include units (e.g., "150Ah", "5000mAh")
- voltage should include units (e.g., "48V", "3.7V")
- quantity is the number of units requested
- battery_category (for EU) should be one of: EV, LMT, INDUSTRIAL, PORTABLE, SLI
- hsn_code (for India) is an 8-digit code starting with 8507 (e.g., "85076000"); only set if explicitly stated
- cell_source (for India) must be one of: DOMESTIC, IMPORTED — infer from phrases like "domestic cells", "imported cells", "made in India"
- carbon_performance_class (for EU) is a single letter A–G; only set if explicitly stated

Only fill compliance fields (hsn_code, cell_source, carbon_performance_class) when the request clearly implies them; otherwise use null.

User request: "{{.Text}}"
Default market (if not specified): {{.DefaultMarket}}

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
  "battery_category": "string or null",
  "hsn_code": "string or null",
  "cell_source": "string or null",
  "carbon_performance_class": "string or null"
}`,
	},
	TaskBISParse: {
		Name:          TaskBISParse,
		SystemPrompt:  "You are a Bureau of Indian Standards (BIS) Certificate extraction assistant. Respond only with valid JSON.",
		PromptVersion: 1,
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a Bureau of Indian Standards (BIS) Certificate extraction assistant. Extract BIS-specific fields from this certificate text.

Extract these fields as JSON. Use null for missing fields:
{
  "model_name": "string or null (extract product/model/series name)",
  "bis_number": "string or null (e.g. R-41xxxxxx)",
  "is_standard": "string or null (e.g. IS 16046:2018 or IS 16046 (Part 2):2018)",
  "manufacturer": "company name or null",
  "manufacturer_address": "string or null",
  "bis_certified": true,
  "certifications": ["BIS"]
}

Certificate text:
"""
{{.Text}}
"""

Respond with ONLY the JSON object, no markdown, no explanation.`,
	},
	TaskUN383Parse: {
		Name:          TaskUN383Parse,
		SystemPrompt:  "You are a UN38.3 lithium battery test report extraction assistant. Respond only with valid JSON.",
		PromptVersion: 1,
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a UN38.3 lithium battery test report extraction assistant. Extract UN38.3 compliance fields from this test summary text.

Extract these fields as JSON. Use null for missing fields:
{
  "model_name": "string or null (extract battery model name/designation)",
  "un38_3": true,
  "certifications": ["UN38.3"],
  "weight": "string with units or null (e.g. 0.45 kg)",
  "dimensions": "string or null",
  "chemistry": "LFP/NMC/NMC811/NMC622/NCA/LCO/LTO/LMO/Sodium-ion/Li-ion or null"
}

Test report text:
"""
{{.Text}}
"""

Respond with ONLY the JSON object, no markdown, no explanation.`,
	},
	TaskMSDSParse: {
		Name:          TaskMSDSParse,
		SystemPrompt:  "You are a Material Safety Data Sheet (MSDS) extraction assistant. Respond only with valid JSON.",
		PromptVersion: 1,
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a Material Safety Data Sheet (MSDS) extraction assistant. Extract hazardous material declaration and chemistry info from this safety sheet text.

Extract these fields as JSON. Use null for missing fields:
{
  "model_name": "string or null (extract product commercial name/model)",
  "chemistry": "LFP/NMC/NMC811/NMC622/NCA/LCO/LTO/LMO/Sodium-ion/Li-ion or null",
  "hazardous_lead_present": true/false (true if Lead Pb content is declared present as a hazard),
  "hazardous_mercury_present": true/false (true if Mercury Hg content is declared present as a hazard),
  "hazardous_cadmium_present": true/false (true if Cadmium Cd content is declared present as a hazard),
  "hazardous_declaration": "string or null (hazardous warning summary or RoHS/REACH compliance text)",
  "manufacturer": "company name or null",
  "manufacturer_address": "string or null"
}

MSDS text:
"""
{{.Text}}
"""

Respond with ONLY the JSON object, no markdown, no explanation.`,
	},
}

// RenderUserPrompt renders the user prompt template with standard string/interface parameters.
func (t Task) RenderUserPrompt(params map[string]interface{}) (string, error) {
	tmpl, err := template.New(t.Name).Parse(t.UserTemplate)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, params); err != nil {
		return "", fmt.Errorf("failed to render template: %w", err)
	}

	return buf.String(), nil
}
