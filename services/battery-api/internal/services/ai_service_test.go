package services

import (
	"encoding/json"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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
	svc := NewAIService("", nil) // no Groq key -> forces the regex-only fallback path

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

func TestParseDatasheet_L2CacheHit(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	svc := NewAIService("", mockRepo)

	text := "Sample text for cache hit"
	textHash := hashText(text)

	expectedResult := &DatasheetParseResult{
		ModelName: "CACHED-MODEL",
		Chemistry: "LFP",
	}
	resultBytes, err := json.Marshal(expectedResult)
	assert.NoError(t, err)

	cacheEntry := &models.AIParseCacheEntry{
		TextHash:      textHash,
		PromptVersion: PromptVersion,
		Task:          TaskDatasheetParse,
		Result:        resultBytes,
		Method:        "llm",
		Confidence:    0.95,
		Model:         groqModel,
	}

	mockRepo.On("GetAIParseCache", mock.Anything, textHash, PromptVersion, TaskDatasheetParse).Return(cacheEntry, nil)

	// Call ParseDatasheet which should check L1 (miss) -> L2 (hit) -> populate L1.
	res, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "CACHED-MODEL", res.ModelName)
	assert.Equal(t, "LFP", res.Chemistry)
	assert.Equal(t, "cached", res.Method) // Outer wrapper sets method to "cached" on hit

	// A second call should hit L1 directly (no second L2 call).
	res2, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "CACHED-MODEL", res2.ModelName)
	assert.Equal(t, "cached", res2.Method)

	mockRepo.AssertExpectations(t)
}

func TestParseDatasheet_L2CacheMissAndWrite(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	svc := NewAIService("", mockRepo) // Regex path (Groq empty)

	text := `Model: AB-9000
Chemistry: LiFePO4
Capacity: 150Ah
Voltage: 48V
Weight: 12.5 kg
Manufacturer: Acme Battery Co
CE marking
UN38.3 certified`
	textHash := hashText(text)

	// Expect GetAIParseCache -> nil (miss)
	mockRepo.On("GetAIParseCache", mock.Anything, textHash, PromptVersion, TaskDatasheetParse).Return(nil, nil)

	// Expect SetAIParseCache to be called to save the regex result.
	mockRepo.On("SetAIParseCache", mock.Anything, mock.MatchedBy(func(entry *models.AIParseCacheEntry) bool {
		return entry.TextHash == textHash &&
			entry.PromptVersion == PromptVersion &&
			entry.Task == TaskDatasheetParse &&
			entry.Method == "regex" &&
			entry.Model == ""
	})).Return(nil)

	res, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "regex", res.Method)
	assert.Equal(t, "AB-9000", res.ModelName)

	mockRepo.AssertExpectations(t)
}

