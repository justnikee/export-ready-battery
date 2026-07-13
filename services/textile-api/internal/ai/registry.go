package ai

import (
	"bytes"
	"fmt"
	"text/template"
)

type Task struct {
	Name          string
	SystemPrompt  string
	UserTemplate  string
	PromptVersion int
	JSONMode      bool
	MaxTokens     int
	Temperature   float64
	ProviderOrder []string
	MaxInputChars int
	JSONValidator func(raw []byte) []ValidationError
}

var Registry = map[string]Task{
	TaskTextileDatasheetParse: {
		Name:          TaskTextileDatasheetParse,
		SystemPrompt:  "You are a textile specification and certificate extraction assistant. Respond only with valid JSON.",
		PromptVersion: 1,
		JSONMode:      true,
		MaxTokens:     2048,
		Temperature:   0.1,
		MaxInputChars: 4000,
		UserTemplate: `You are a textile specification and certificate extraction assistant. Extract ALL possible fields from this textile datasheet or GOTS/OEKO-TEX certificate text.

Extract these fields as JSON. Use null for missing fields:
{
  "material_profile": "string or null (e.g. '100% organic cotton' or '60% cotton / 40% polyester')",
  "gsm": number or null (e.g. 180, fabric density/weight in grams per square meter),
  "manufacturer": "company name or null",
  "manufacturer_address": "string or null",
  "country_of_origin": "2-letter ISO code (e.g. IN, BD, TR, VN) or null",
  "lot_size": "string or null (e.g. '500 units' or '2000 meters')",
  "fiber_composition": {
    "cotton_pct": number or null,
    "polyester_pct": number or null,
    "wool_pct": number or null,
    "silk_pct": number or null,
    "linen_pct": number or null,
    "viscose_pct": number or null,
    "nylon_pct": number or null,
    "acrylic_pct": number or null,
    "hemp_pct": number or null,
    "other_pct": number or null
  },
  "certifications": ["list of certifications: GOTS, OEKO-TEX, GRS, BSCI, FAIRTRADE, etc."],
  "recycled_content_pct": number or null,
  "biodegradable_pct": number or null,
  "expected_lifetime_washes": number or null,
  "eu_representative": "string or null",
  "eu_representative_email": "string or null"
}

Text content:
"""
{{.Text}}
"""

Respond with ONLY the JSON object, no markdown, no explanation.`,
	},
}

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
