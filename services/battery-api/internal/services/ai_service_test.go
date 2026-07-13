package services

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
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
	svc := NewAIService(nil, nil) // no gateway -> forces the regex-only fallback path

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
	svc := NewAIService(nil, mockRepo)

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
		Task:          ai.TaskDatasheetParse,
		Result:        resultBytes,
		Method:        "llm",
		Confidence:    0.95,
		Model:         "llama-3.3-70b-versatile",
	}

	mockRepo.On("GetAIParseCache", mock.Anything, textHash, PromptVersion, ai.TaskDatasheetParse).Return(cacheEntry, nil)

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
	svc := NewAIService(nil, mockRepo) // Regex path (gateway nil)

	text := `Model: AB-9000
Chemistry: LiFePO4
Capacity: 150Ah
Voltage: 48V
Weight: 12.5 kg
Manufacturer: Acme Battery Co
CE marking
standard safety certified`
	textHash := hashText(text)

	// Expect GetAIParseCache -> nil (miss)
	mockRepo.On("GetAIParseCache", mock.Anything, textHash, PromptVersion, ai.TaskDatasheetParse).Return(nil, nil)

	// Expect SetAIParseCache to be called to save the regex result.
	mockRepo.On("SetAIParseCache", mock.Anything, mock.MatchedBy(func(entry *models.AIParseCacheEntry) bool {
		return entry.TextHash == textHash &&
			entry.PromptVersion == PromptVersion &&
			entry.Task == ai.TaskDatasheetParse &&
			entry.Method == "regex" &&
			entry.Model == ""
	})).Return(nil)

	res, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "regex", res.Method)
	assert.Equal(t, "AB-9000", res.ModelName)

	mockRepo.AssertExpectations(t)
}

// mockGatewayProvider is a mock for ai.Provider specifically for services testing
type mockGatewayProvider struct {
	name       string
	configured bool
	response   ai.Response
	err        error
}

func (m *mockGatewayProvider) Name() string       { return m.name }
func (m *mockGatewayProvider) IsConfigured() bool { return m.configured }
func (m *mockGatewayProvider) Complete(_ context.Context, _ ai.Request) (ai.Response, error) {
	return m.response, m.err
}

func TestParseDatasheet_LLMGatewaySuccess(t *testing.T) {
	// Create mock provider that will succeed
	mockProvider := &mockGatewayProvider{
		name:       "groq",
		configured: true,
		response: ai.Response{
			Text:     `{"model_name":"LLM-SUPER-MODEL","chemistry":"NMC"}`,
			Provider: "groq",
			Model:    "llama-3.3-70b-versatile",
		},
	}

	gw := ai.NewTestGateway(mockProvider)
	svc := NewAIService(gw, nil)

	// Low regex confidence text to force LLM fallback
	text := "Sample text that does not match regex"

	res, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "llm", res.Method)
	assert.Equal(t, "LLM-SUPER-MODEL", res.ModelName)
	assert.Equal(t, "NMC", res.Chemistry)
}

func TestCreateBatchFromNL_GatewaySuccess(t *testing.T) {
	mockProvider := &mockGatewayProvider{
		name:       "gemini",
		configured: true,
		response: ai.Response{
			Text:     `{"batch_name":"NL-BATCH-1","model_name":"NL-MODEL","quantity":15}`,
			Provider: "gemini",
			Model:    "gemini-1.5-flash",
		},
	}

	gw := ai.NewTestGateway(mockProvider)
	svc := NewAIService(gw, nil)

	res, err := svc.CreateBatchFromNL(t.Context(), "request text", "EU")
	assert.NoError(t, err)
	assert.Equal(t, "NL-BATCH-1", res.BatchName)
	assert.Equal(t, "NL-MODEL", res.ModelName)
	assert.Equal(t, 15, res.Quantity)
}

func TestDeterministicGoldenSet(t *testing.T) {
	files := []string{
		"datasheet_lfp_1",
		"datasheet_nmc_1",
		"datasheet_injection_1",
	}

	for _, name := range files {
		t.Run(name, func(t *testing.T) {
			textBytes, err := os.ReadFile("testdata/golden/" + name + ".txt")
			require.NoError(t, err)
			expectedBytes, err := os.ReadFile("testdata/golden/" + name + ".expected.json")
			require.NoError(t, err)

			var expected DatasheetParseResult
			err = json.Unmarshal(expectedBytes, &expected)
			require.NoError(t, err)

			// Setup Mock Provider that returns the expected JSON (in case LLM path is hit)
			mockProvider := &mockGatewayProvider{
				name:       "groq",
				configured: true,
				response: ai.Response{
					Text:     string(expectedBytes),
					Provider: "groq",
					Model:    "llama-3.3-70b-versatile",
				},
			}
			gw := ai.NewTestGateway(mockProvider)
			svc := NewAIService(gw, nil)

			res, err := svc.ParseDatasheet(context.Background(), string(textBytes))
			require.NoError(t, err)

			// Assert fields match expectation
			assert.Equal(t, expected.ModelName, res.ModelName)
			assert.Equal(t, expected.Chemistry, res.Chemistry)
			assert.Equal(t, expected.Voltage, res.Voltage)
			assert.Equal(t, expected.Capacity, res.Capacity)
			assert.Equal(t, expected.Weight, res.Weight)
			assert.Equal(t, expected.Dimensions, res.Dimensions)
			assert.Equal(t, expected.Manufacturer, res.Manufacturer)
			assert.Equal(t, expected.UN38_3, res.UN38_3)
			assert.Equal(t, expected.CEMarking, res.CEMarking)
			assert.Equal(t, expected.RoHSCompliant, res.RoHSCompliant)
			assert.Equal(t, expected.IEC62133, res.IEC62133)
			assert.Equal(t, expected.CountryOfOrigin, res.CountryOfOrigin)
			assert.Equal(t, expected.CarbonPerformanceClass, res.CarbonPerformanceClass)
		})
	}
}

func TestClassifyDocumentType(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected string
	}{
		{
			name:     "BIS Cert",
			text:     "This is to certify that Bureau of Indian Standards has registered...",
			expected: ai.TaskBISParse,
		},
		{
			name:     "UN38.3 report",
			text:     "The lithium batteries were tested according to UN38.3 test summary.",
			expected: ai.TaskUN383Parse,
		},
		{
			name:     "MSDS sheet",
			text:     "Material Safety Data Sheet sections: Composition and Hazards.",
			expected: ai.TaskMSDSParse,
		},
		{
			name:     "General datasheet",
			text:     "High capacity battery cells models details.",
			expected: ai.TaskDatasheetParse,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, classifyDocumentType(tc.text))
		})
	}
}

func TestParseDatasheet_DocTypeRouting(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	mockProvider := &mockGatewayProvider{
		name:       "groq",
		configured: true,
		response: ai.Response{
			Text:     `{"model_name":"BIS-MODEL","bis_certified":true}`,
			Provider: "groq",
			Model:    "llama-3.3-70b-versatile",
		},
	}
	gw := ai.NewTestGateway(mockProvider)
	svc := NewAIService(gw, mockRepo)

	text := "Bureau of Indian Standards certificate details for model BIS-MODEL"
	textHash := hashText(text)

	// Expect GetAIParseCache for TaskBISParse
	mockRepo.On("GetAIParseCache", mock.Anything, textHash, PromptVersion, ai.TaskBISParse).Return(nil, nil)

	// Expect SetAIParseCache for TaskBISParse
	mockRepo.On("SetAIParseCache", mock.Anything, mock.MatchedBy(func(entry *models.AIParseCacheEntry) bool {
		return entry.TextHash == textHash &&
			entry.Task == ai.TaskBISParse &&
			entry.Method == "llm"
	})).Return(nil)

	res, err := svc.ParseDatasheet(t.Context(), text)
	assert.NoError(t, err)
	assert.Equal(t, "BIS-MODEL", res.ModelName)
	mockRepo.AssertExpectations(t)
}


