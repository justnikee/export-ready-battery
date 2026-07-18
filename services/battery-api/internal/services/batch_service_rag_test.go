package services

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/schema"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// mockIndiaValidator implements compliance.Validator for testing
type mockIndiaValidator struct{}

func (v *mockIndiaValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	return compliance.Result{
		Score: 80.0,
		Valid: false,
		Gaps: []compliance.Gap{
			{
				Field:      "carbon_footprint",
				Market:     "India",
				Regulation: "BWM 2022",
				Message:    "Missing carbon footprint declaration",
				Severity:   "ERROR",
			},
		},
	}, nil
}

func TestBatchService_RAGContextInjection(t *testing.T) {
	mockRepo := &repository.MockRepository{}
	schemaReg := schema.NewRegistry(nil)
	complianceReg := compliance.NewRegistry()

	// Register a mock validator that generates a gap
	complianceReg.Register(models.ProductTypeBattery, models.MarketRegionIndia, &mockIndiaValidator{})

	batchService := NewBatchService(schemaReg, complianceReg, mockRepo)

	// Set Gemini in offline mode (empty key)
	gemini := ai.NewGeminiProvider("", 5*time.Second)
	batchService.SetGeminiProvider(gemini)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := &models.Batch{
		ID:           batchID,
		TenantID:     tenantID,
		ProductType:  models.ProductTypeBattery,
		MarketRegion: models.MarketRegionIndia,
		Specs:        models.BatchSpec{},
	}
	tenant := &models.Tenant{
		ID: tenantID,
	}

	// Mock semantic query to return matched chunks
	expectedChunks := []*models.AIRegulationChunk{
		{
			Title:     "EU Battery Regulation 2023/1542",
			SourceDoc: "EU_2023_1542.pdf",
			Section:   "Article 7",
			Content:   "Carbon footprint declaration shall be drawn up",
		},
	}
	mockRepo.On("QueryTextChunks", mock.Anything, "Missing carbon footprint declaration", 1).
		Return(expectedChunks, nil)

	// Verify UpdateBatchComplianceResult is called with enriched message
	mockRepo.On("UpdateBatchComplianceResult", mock.Anything, batchID, 80.0, mock.MatchedBy(func(gapsJSON json.RawMessage) bool {
		var gaps []compliance.Gap
		if err := json.Unmarshal(gapsJSON, &gaps); err != nil {
			return false
		}
		if len(gaps) != 1 {
			return false
		}
		// Expect RAG context citation to be appended to the gap message
		expectedMsg := "Missing carbon footprint declaration (Relevant rule: EU Battery Regulation 2023/1542, Article 7: Carbon footprint declaration shall be drawn up)"
		return gaps[0].Message == expectedMsg
	})).Return(nil)

	batchService.RunAndSaveCompliance(context.Background(), batchID, batch, tenant)

	mockRepo.AssertExpectations(t)
}
