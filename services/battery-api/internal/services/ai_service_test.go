package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildFieldSources_RegexOnly(t *testing.T) {
	regex := &DatasheetParseResult{
		ModelName: "ABC-123",
		Chemistry: "LFP",
		// Capacity intentionally left blank to exercise the "missing" branch.
	}

	sources := buildFieldSources(regex, nil)

	assert.Equal(t, "regex", sources["model_name"])
	assert.Equal(t, "regex", sources["chemistry"])
	assert.Equal(t, "missing", sources["capacity"])
	assert.Equal(t, "missing", sources["certifications"])
	// Every tracked field must have an entry, never be silently omitted.
	for _, field := range trackedProvenanceFields {
		_, ok := sources[field]
		assert.True(t, ok, "expected source entry for tracked field %q", field)
	}
}

func TestBuildFieldSources_LLMPrefersOverRegex(t *testing.T) {
	regex := &DatasheetParseResult{
		ModelName:    "REGEX-MODEL",
		Manufacturer: "Regex Co",
	}
	llm := &DatasheetParseResult{
		ModelName:      "LLM-MODEL", // present on both — LLM should win, matching prefer()
		CarbonFootprint: "12 kg CO2e",
		Certifications: []string{"CE"},
	}

	sources := buildFieldSources(regex, llm)

	assert.Equal(t, "llm", sources["model_name"], "LLM value present, should take priority over regex")
	assert.Equal(t, "regex", sources["manufacturer"], "only regex found this field")
	assert.Equal(t, "llm", sources["carbon_footprint"], "only LLM found this field")
	assert.Equal(t, "llm", sources["certifications"])
	assert.Equal(t, "missing", sources["hsn_code"], "neither extractor found this field")
}

func TestMergeResults_PopulatesFieldSources(t *testing.T) {
	svc := &AIService{}
	regex := &DatasheetParseResult{
		ModelName:           "REGEX-MODEL",
		MaterialComposition: map[string]string{},
	}
	llm := &DatasheetParseResult{
		Chemistry:           "NMC",
		MaterialComposition: map[string]string{},
	}

	merged := svc.mergeResults(regex, llm)

	assert.NotNil(t, merged.FieldSources)
	assert.Equal(t, "regex", merged.FieldSources["model_name"])
	assert.Equal(t, "llm", merged.FieldSources["chemistry"])
	assert.Equal(t, "missing", merged.FieldSources["capacity"])
}

func TestParseDatasheet_RegexOnlyPathSetsFieldSources(t *testing.T) {
	svc := NewAIService("") // no Groq key -> forces the regex-only fallback path

	text := `Model: AB-9000
Chemistry: LiFePO4
Capacity: 150Ah
Voltage: 48V
Weight: 12.5 kg
Manufacturer: Acme Battery Co
CE marking
UN38.3 certified`

	result, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "regex", result.Method)
	assert.NotNil(t, result.FieldSources)
	assert.Equal(t, "regex", result.FieldSources["model_name"])
	assert.Equal(t, "regex", result.FieldSources["chemistry"])
	assert.Equal(t, "missing", result.FieldSources["hsn_code"])
}
