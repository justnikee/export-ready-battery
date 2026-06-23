package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/anvayalabs/textile-api/internal/compliance"
	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/repository"
	"github.com/anvayalabs/textile-api/internal/schema"

	"github.com/google/uuid"
)

// BatchService wires the schema registry and compliance engine into batch creation
// and activation. It is stateless beyond its injected dependencies.
type BatchService struct {
	schemaRegistry     *schema.Registry
	schemaValidator    *schema.SchemaValidator
	complianceRegistry *compliance.Registry
	repo               repository.RepositoryInterface
}

// NewBatchService creates a BatchService. All parameters are required.
func NewBatchService(
	schemaReg *schema.Registry,
	complianceReg *compliance.Registry,
	repo repository.RepositoryInterface,
) *BatchService {
	return &BatchService{
		schemaRegistry:     schemaReg,
		schemaValidator:    schema.NewSchemaValidator(schemaReg),
		complianceRegistry: complianceReg,
		repo:               repo,
	}
}

// ValidateSpecs checks that specsJSON satisfies the active schema for productType.
// Returns a ValidationResult. An error is returned only for infrastructure
// failures (e.g. schema not loadable) — NOT for invalid specs.
func (s *BatchService) ValidateSpecs(ctx context.Context, productType models.ProductType, specsJSON json.RawMessage) (schema.ValidationResult, error) {
	return s.schemaValidator.Validate(ctx, productType, 0, specsJSON)
}

// RunAndSaveCompliance executes the compliance engine for the given batch and
// tenant, then persists the score and gap list to the database.
//
// This method is FIRE-AND-FORGET safe: callers (e.g. ActivateBatch) should
// call it in a goroutine so a slow compliance run does not block the HTTP
// response. Errors are logged internally.
func (s *BatchService) RunAndSaveCompliance(ctx context.Context, batchID uuid.UUID, batch *models.Batch, tenant *models.Tenant) {
	result, err := s.complianceRegistry.ValidateBatch(
		batch.ProductType,
		batch.MarketRegion,
		batch,
		tenant,
	)
	if err != nil {
		slog.Error("compliance: engine error",
			"batch_id", batchID,
			"error", err,
		)
		return
	}

	gapsJSON := result.GapsJSON()

	if saveErr := s.repo.UpdateBatchComplianceResult(ctx, batchID, result.Score, gapsJSON); saveErr != nil {
		slog.Error("compliance: failed to save result",
			"batch_id", batchID,
			"score", result.Score,
			"error", saveErr,
		)
		return
	}

	slog.Info("compliance: score saved",
		"batch_id", batchID,
		"score", fmt.Sprintf("%.1f", result.Score),
		"gaps", len(result.Gaps),
	)
}

// GetActiveSchema returns the active schema for the given product type.
// Exposed for the schema API handler.
func (s *BatchService) GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error) {
	return s.schemaRegistry.GetActive(ctx, productType)
}

// RunComplianceCheck executes a dry-run compliance check against raw specs JSON
// without persisting anything. Used by the POST /api/v1/compliance/check endpoint
// so the frontend can show real-time compliance feedback as the user edits data.
func (s *BatchService) RunComplianceCheck(ctx context.Context, productType models.ProductType, marketRegion models.MarketRegion, specsJSON json.RawMessage) (compliance.Result, error) {
	return s.complianceRegistry.Validate(productType, marketRegion, specsJSON)
}

// ValidateActivation runs the activation compliance gate against a batch.
// It checks activation-common fields and then delegates market-specific
// regulatory validation to the compliance registry.
func (s *BatchService) ValidateActivation(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
	return validateActivationWithRegistry(batch, tenant, s.complianceRegistry)
}
