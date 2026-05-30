package services

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/integrations/registry"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// RegistryVerificationService orchestrates external registry checks.
type RegistryVerificationService struct {
	repo      repository.RepositoryInterface
	adapters  *registry.AdapterRegistry
	cacheTTL  time.Duration
}

// NewRegistryVerificationService creates the service.
func NewRegistryVerificationService(repo repository.RepositoryInterface) *RegistryVerificationService {
	return &RegistryVerificationService{
		repo:     repo,
		adapters: registry.NewAdapterRegistry(),
		cacheTTL: registry.DefaultCacheTTL,
	}
}

// VerifyBatch checks a batch against a specific registry.
// It first checks the cache, then calls the adapter if stale/missing.
func (s *RegistryVerificationService) VerifyBatch(ctx context.Context, tenantID, batchID uuid.UUID, registryTypeStr, certificateNo string) (*models.RegistryVerification, error) {
	// Validate registry type
	regType, err := registry.NormalizeRegistryType(registryTypeStr)
	if err != nil {
		return nil, err
	}

	// Check cache
	cached, err := s.repo.GetRegistryVerificationByBatchAndType(ctx, batchID, string(regType), certificateNo)
	if err == nil && cached != nil && cached.ExpiresAt != nil && cached.ExpiresAt.After(time.Now()) {
		slog.Info("registry verification cache hit", "batch_id", batchID, "registry", regType)
		return cached, nil
	}

	// Get adapter
	adapter := s.adapters.Get(regType)
	if adapter == nil {
		return nil, fmt.Errorf("no adapter registered for registry type: %s", regType)
	}

	// Fetch batch metadata for the adapter
	batch, err := s.repo.GetBatch(ctx, batchID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to load batch for verification: %w", err)
	}

	metadata := extractBatchMetadata(batch)

	// Call adapter
	result, err := adapter.Verify(ctx, certificateNo, metadata)
	if err != nil {
		slog.Error("registry verification failed", "batch_id", batchID, "registry", regType, "error", err)
		result = &registry.VerifyResult{
			Status:       models.RegistryStatusError,
			TrustTier:    models.TrustTierSelfDeclared,
			ErrorMessage: err.Error(),
		}
	}

	now := time.Now()
	expires := now.Add(s.cacheTTL)

	verification := &models.RegistryVerification{
		ID:            uuid.New().String(),
		TenantID:      tenantID.String(),
		BatchID:       batchID.String(),
		RegistryType:  string(regType),
		CertificateNo: certificateNo,
		Status:        string(result.Status),
		TrustTier:     string(result.TrustTier),
		VerifiedData:  &result.VerifiedData,
		ErrorMessage:  result.ErrorMessage,
		VerifiedAt:    &now,
		ExpiresAt:     &expires,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.repo.CreateRegistryVerification(ctx, verification); err != nil {
		slog.Error("failed to cache registry verification", "error", err)
		// Don't fail the request because caching failed
	}

	return verification, nil
}

// GetBatchVerifications returns all cached verifications for a batch.
func (s *RegistryVerificationService) GetBatchVerifications(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) {
	return s.repo.GetRegistryVerificationsByBatch(ctx, batchID)
}

// GetBatchVerificationSummary returns a lightweight summary with overall trust.
func (s *RegistryVerificationService) GetBatchVerificationSummary(ctx context.Context, batchID uuid.UUID) (*models.BatchVerificationSummary, error) {
	verifications, err := s.repo.GetRegistryVerificationsByBatch(ctx, batchID)
	if err != nil {
		return nil, err
	}

	overall := models.TrustTierSelfDeclared
	for _, v := range verifications {
		if models.TrustTier(v.TrustTier) == models.TrustTierOfficialAPI {
			overall = models.TrustTierOfficialAPI
			break
		}
		if models.TrustTier(v.TrustTier) == models.TrustTierRegistry && overall != models.TrustTierOfficialAPI {
			overall = models.TrustTierRegistry
		}
	}

	return &models.BatchVerificationSummary{
		BatchID:       batchID.String(),
		Verifications: verifications,
		OverallTrust:  overall,
	}, nil
}

// AutoVerifyBatch runs verification against all configured adapters for a batch.
func (s *RegistryVerificationService) AutoVerifyBatch(ctx context.Context, tenantID, batchID uuid.UUID) ([]models.RegistryVerification, error) {
	batch, err := s.repo.GetBatch(ctx, batchID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to load batch: %w", err)
	}
	if batch == nil {
		return nil, fmt.Errorf("batch not found")
	}

	metadata := extractBatchMetadata(batch)
	var results []models.RegistryVerification

	for _, adapter := range s.adapters.All() {
		// Determine certificate number from batch specs
		certNo := resolveCertificateNo(adapter.Type(), metadata)
		if certNo == "" {
			continue // Skip if no certificate number available
		}

		v, err := s.VerifyBatch(ctx, tenantID, batchID, string(adapter.Type()), certNo)
		if err != nil {
			slog.Error("auto-verify failed for adapter", "adapter", adapter.Name(), "error", err)
			continue
		}
		results = append(results, *v)
	}

	return results, nil
}

func extractBatchMetadata(batch *models.Batch) map[string]string {
	m := map[string]string{
		"batch_name":       batch.BatchName,
		"model_name":       batch.ModelName,
		"product_type":     string(batch.ProductType),
		"market_region":    string(batch.MarketRegion),
		"status":           batch.Status,
	}
	// Add spec fields if available
	if batch.Specs.BISNumber != "" {
		m["bis_number"] = batch.Specs.BISNumber
	}
	if batch.Specs.EPRNumber != "" {
		m["epr_number"] = batch.Specs.EPRNumber
	}
	if batch.Specs.HSNCode != "" {
		m["hsn_code"] = batch.Specs.HSNCode
	}
	if batch.Specs.UN383TestDate != "" {
		m["un38_test_date"] = batch.Specs.UN383TestDate
	}
	if batch.Specs.IEC62133TestDate != "" {
		m["iec62133_test_date"] = batch.Specs.IEC62133TestDate
	}
	return m
}

func resolveCertificateNo(t models.RegistryType, metadata map[string]string) string {
	switch t {
	case models.RegistryTypeBIS:
		return metadata["bis_number"]
	case models.RegistryTypeCPCB:
		return metadata["epr_number"]
	case models.RegistryTypeUN38_3:
		return metadata["un38_certificate"]
	case models.RegistryTypeEUNANDO:
		// EU NANDO doesn't use a cert number directly; adapter handles lookup
		return ""
	default:
		return ""
	}
}
