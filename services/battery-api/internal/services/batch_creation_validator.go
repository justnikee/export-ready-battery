package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// BatchCreationValidationResult is the output of batch creation validation.
type BatchCreationValidationResult struct {
	Valid  bool                   `json:"valid"`
	Errors []BatchValidationError `json:"errors,omitempty"`
}

// BatchValidationError represents a single validation failure.
type BatchValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// BatchCreationValidator extracts all validation logic from the CreateBatch handler.
// It does NOT mutate the request and does NOT interact with the database directly;
// the tenant is received as a parameter.
type BatchCreationValidator struct {
	batchService      *BatchService
	validationService *ValidationService
	repo              repository.RepositoryInterface
}

// NewBatchCreationValidator creates a new BatchCreationValidator.
func NewBatchCreationValidator(batchService *BatchService, validationService *ValidationService, repo repository.RepositoryInterface) *BatchCreationValidator {
	return &BatchCreationValidator{
		batchService:      batchService,
		validationService: validationService,
		repo:              repo,
	}
}

// Validate runs all batch creation validation rules and returns a structured result.
// The request is NOT mutated. Security overrides that the handler would silently
// apply are instead surfaced as validation errors.
func (v *BatchCreationValidator) Validate(ctx context.Context, req models.CreateBatchRequest, tenant *models.Tenant) BatchCreationValidationResult {
	var errs []BatchValidationError
	addError := func(field, message string) {
		errs = append(errs, BatchValidationError{Field: field, Message: message})
	}

	// 2. tenant_id required
	if req.TenantID == uuid.Nil {
		addError("tenant_id", "tenant_id is required")
	}

	// 5. batch_name required
	if req.BatchName == "" {
		addError("batch_name", "batch_name is required")
	}

	// 6. Default market region to GLOBAL for validation purposes
	marketRegion := req.MarketRegion
	if marketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}

	// 7. Validate market region
	if !marketRegion.IsValid() {
		addError("market_region", "Invalid market_region. Must be INDIA, EU, or GLOBAL")
	}

	// Default product type for internal validation logic (mirrors handler behaviour)
	productType := req.ProductType
	if productType == "" || !productType.IsValid() {
		productType = models.DefaultProductType()
	}

	// 8. Schema validation via batchService.ValidateSpecs
	if v.batchService != nil {
		specsJSON, marshalErr := json.Marshal(req.Specs)
		if marshalErr != nil {
			addError("specs", "Invalid specs format")
		} else {
			validationResult, validationErr := v.batchService.ValidateSpecs(ctx, productType, specsJSON)
			if validationErr != nil {
				// Infrastructure failure (schema unreachable) — skip.
			} else if !validationResult.Valid {
				for _, fe := range validationResult.Errors {
					addError(fe.Field, fe.Message)
				}
			}
		}
	}

	// 9. BOM validation via ValidateBOM
	if len(req.Specs.Components) > 0 {
		bomResult := ValidateBOM(req.Specs.Components)
		if !bomResult.Valid {
			for _, msg := range bomResult.Errors {
				addError("components", msg)
			}
		}
	}

	// 10. EU mode: CE certification soft warning (log only, not an error) — skipped.

	// 11. India Mode + Battery: PLI/DVA/HSN/customs logic
	if marketRegion == models.MarketRegionIndia && productType == models.ProductTypeBattery {
		// a. cell_source validation
		if req.CellSource != "" && req.CellSource != "IMPORTED" && req.CellSource != "DOMESTIC" {
			addError("cell_source", "cell_source must be IMPORTED or DOMESTIC")
		}

		// b. IMPORTED security overrides — return errors instead of silently overriding
		if req.CellSource == "IMPORTED" {
			if req.PLICompliant {
				addError("pli_compliant", "IMPORTED cells cannot be PLI compliant. PLICompliant will be forced to false.")
			}
			if req.DomesticValueAdd > 0 {
				addError("domestic_value_add", "IMPORTED cells cannot have domestic value add. DomesticValueAdd will be forced to 0.")
			}
			if req.AuditedDomesticValueAdd != nil {
				addError("audited_domestic_value_add", "IMPORTED cells cannot have audited domestic value add. AuditedDomesticValueAdd will be blocked.")
			}
			if req.DVASource != "" && req.DVASource != DVASourceEstimated {
				addError("dva_source", "IMPORTED cells require DVA source to be ESTIMATED. DVASource will be forced to ESTIMATED.")
			}
		}

		// c. DVA source validation via validationService.ValidateDVASource
		dvaSourceResult := v.validationService.ValidateDVASource(req.DVASource)
		if !dvaSourceResult.Valid {
			addError("dva_source", dvaSourceResult.Message)
		}

		// Default to ESTIMATED if not provided for local calculation
		dvaSource := req.DVASource
		if dvaSource == "" {
			dvaSource = DVASourceEstimated
		}

		// d. DVA calculation (ESTIMATED vs AUDITED)
		var calculatedDVA float64
		if dvaSource == DVASourceAudited {
			if req.AuditedDomesticValueAdd != nil {
				calculatedDVA = *req.AuditedDomesticValueAdd
			} else {
				addError("audited_domestic_value_add", "Audited DVA mode requires audited_domestic_value_add value")
			}
		} else {
			// ESTIMATED: calculate DVA server-side from specs financial fields
			if req.Specs.SalePriceINR > 0 {
				calculatedDVA = ((req.Specs.SalePriceINR - req.Specs.ImportCostINR) / req.Specs.SalePriceINR) * 100
				if calculatedDVA < 0 {
					calculatedDVA = 0
				}
			}
		}

		// e. India Mode + IMPORTED: require customs declaration fields
		if req.CellSource == "IMPORTED" {
			if req.BillOfEntryNo == "" || req.CountryOfOrigin == "" {
				addError("bill_of_entry_no", "Imported batches must include Bill of Entry and Country of Origin per Customs regulations")
			}
			// For pure imports with no local value add (ESTIMATED mode only)
			if dvaSource == DVASourceEstimated {
				if req.Specs.SalePriceINR == 0 || req.Specs.ImportCostINR >= req.Specs.SalePriceINR {
					calculatedDVA = 0
				}
			}
		} else if req.CellSource == "DOMESTIC" {
			// f. DOMESTIC: require value add > 0
			if calculatedDVA <= 0 {
				addError("domestic_value_add", "Domestic batches must have Domestic Value Add > 0%. Please enter Sale Price and Import Cost.")
			}

			// g. PLI: if PLICompliant=true, require DVA >= 50%
			if req.PLICompliant && calculatedDVA < 50.0 {
				addError("pli_compliant", fmt.Sprintf("PLI Scheme requires minimum 50%% Domestic Value Add. Calculated DVA: %.2f%%. Minimum 50%% required for PLI Benefits.", calculatedDVA))
			}
		}

		// h. PLI compliance validation via validationService.ValidatePLICompliance
		if err := v.validationService.ValidatePLICompliance(dvaSource, req.AuditedDomesticValueAdd, calculatedDVA, req.PLICompliant); err != nil {
			addError("pli_compliant", err.Error())
		}
	}

	// 12. Tenant fetch from repo — handled by caller; tenant received as parameter.

	// 13. IEC code validation (soft warning in original handler; not surfaced as hard error).

	// 14. India + IMPORTED: tenant must have IECCode
	if marketRegion == models.MarketRegionIndia && req.CellSource == "IMPORTED" {
		if tenant == nil || tenant.BatteryProfile == nil || tenant.BatteryProfile.IECCode == "" {
			addError("iec_code", "IEC Code is required in Organization Settings for importing battery cells")
		}
	}

	// 15. India + Battery: HSN code validation
	if marketRegion == models.MarketRegionIndia && productType == models.ProductTypeBattery {
		hsnResult := v.validationService.ValidateHSNCode(req.HSNCode)
		if !hsnResult.Valid {
			addError("hsn_code", hsnResult.Message)
		}
	}

	// 16. Customs date parse YYYY-MM-DD
	if req.CustomsDate != "" {
		_, err := time.Parse("2006-01-02", req.CustomsDate)
		if err != nil {
			addError("customs_date", "Invalid customs_date format. Use YYYY-MM-DD")
		}
	}

	// 17. Manufacturing start date parse YYYY-MM-DD
	var manufacturingStart *time.Time
	if req.ManufacturingStartDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.ManufacturingStartDate)
		if err != nil {
			addError("manufacturing_start_date", "Invalid manufacturing_start_date format. Use YYYY-MM-DD")
		} else {
			manufacturingStart = &parsedDate
		}
	}

	// 18. Manufacturing end date parse YYYY-MM-DD
	var manufacturingEnd *time.Time
	if req.ManufacturingEndDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.ManufacturingEndDate)
		if err != nil {
			addError("manufacturing_end_date", "Invalid manufacturing_end_date format. Use YYYY-MM-DD")
		} else {
			manufacturingEnd = &parsedDate
		}
	}

	// 19. End date >= start date
	if manufacturingStart != nil && manufacturingEnd != nil && manufacturingEnd.Before(*manufacturingStart) {
		addError("manufacturing_end_date", "manufacturing_end_date must be on or after manufacturing_start_date")
	}

	return BatchCreationValidationResult{
		Valid:  len(errs) == 0,
		Errors: errs,
	}
}
