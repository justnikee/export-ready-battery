package services

import (
	"fmt"
	"sync"

	"github.com/anvayalabs/textile-api/internal/compliance"
	"github.com/anvayalabs/textile-api/internal/compliance/textile"
	"github.com/anvayalabs/textile-api/internal/models"
)

// defaultRegistry is a lazily-initialized compliance registry containing the
// built-in validators. It is used by ValidateActivationCompliance so that
// the standalone function can delegate market-specific rules to the same
// validators used by the BatchService, eliminating drift between the
// activation gate and the compliance scoring engine.
var defaultRegistry *compliance.Registry
var defaultRegistryOnce sync.Once

func getDefaultRegistry() *compliance.Registry {
	defaultRegistryOnce.Do(func() {
		r := compliance.NewRegistry()
		r.Register(models.ProductTypeTextile, models.MarketRegionIndia, textile.NewIndiaValidator())
		r.Register(models.ProductTypeTextile, models.MarketRegionEU, textile.NewEUValidator())
		defaultRegistry = r
	})
	return defaultRegistry
}

// ActivationComplianceResult captures missing or invalid fields for activation
type ActivationComplianceResult struct {
	Valid    bool     `json:"valid"`
	Missing  []string `json:"missing"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings,omitempty"`
}

// ValidateActivationCompliance enforces design_system.md rules at batch activation.
//
// Deprecated: Use BatchService.ValidateActivation when a registry is available.
// This standalone function remains for backward compatibility in tests and
// delegates market-specific rules to the built-in compliance registry.
func ValidateActivationCompliance(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
	return validateActivationWithRegistry(batch, tenant, getDefaultRegistry())
}

// validateActivationWithRegistry performs activation gating by running
// activation-common checks first, then delegating market-specific regulatory
// validation to the provided compliance registry.
func validateActivationWithRegistry(batch *models.Batch, tenant *models.Tenant, registry *compliance.Registry) ActivationComplianceResult {
	if batch == nil || tenant == nil {
		return ActivationComplianceResult{
			Valid:   false,
			Missing: []string{"batch and tenant are required"},
		}
	}

	productType := batch.ProductType
	if !productType.IsValid() || productType == models.ProductTypeElectronics {
		productType = models.DefaultProductType()
	}

	missing := []string{}
	errors := []string{}
	warnings := []string{}

	// Common required fields (all markets)
	if batch.ModelName == "" {
		missing = append(missing, "batch.model_name")
	}
	if productType == models.ProductTypeTextile {
		if batch.Specs.MaterialProfile == "" {
			missing = append(missing, "batch.specs.material_profile")
		}
		if batch.Specs.GSM <= 0 {
			missing = append(missing, "batch.specs.gsm")
		}
		if batch.Specs.FiberComposition == nil {
			missing = append(missing, "batch.specs.fiber_composition")
		}
	}
	if batch.ManufacturingStartDate == nil {
		missing = append(missing, "batch.manufacturing_start_date")
	}
	if batch.ManufacturingEndDate == nil {
		missing = append(missing, "batch.manufacturing_end_date")
	}

	// Market-specific regulatory validation via the registry.
	result, err := registry.ValidateBatch(productType, batch.MarketRegion, batch, tenant)
	if err != nil {
		// If no validator is registered, treat it as a hard error.
		errors = append(errors, fmt.Sprintf("compliance registry error: %v", err))
	} else {
		missing = append(missing, result.Missing...)
		errors = append(errors, result.Errors...)
		warnings = append(warnings, result.Warnings...)
	}

	return ActivationComplianceResult{
		Valid:    len(missing) == 0 && len(errors) == 0,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
	}
}
