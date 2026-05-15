package textile

import (
	"encoding/json"
	"fmt"

	"anvayalabs-battery/internal/compliance"
	"anvayalabs-battery/internal/models"
)

const (
	textileIndiaMarket      = "INDIA"
	textileIndiaBaselineRef = "India textile traceability baseline"
	textileIndiaTotalChecks = 8
)

// IndiaValidator is a minimal textile traceability validator.
// It exists so GLOBAL textile compliance can aggregate across markets until
// dedicated India textile regulations are modelled separately.
type IndiaValidator struct{}

func NewIndiaValidator() *IndiaValidator { return &IndiaValidator{} }

func (v *IndiaValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("textile india validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

func (v *IndiaValidator) ValidateBatch(batch *models.Batch, tenant *models.Tenant) (compliance.Result, error) {
	missing := []string{}
	errors := []string{}
	warnings := []string{}
	var gaps []compliance.Gap

	addMissing := func(field, msg string) {
		missing = append(missing, field)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     textileIndiaMarket,
			Regulation: textileIndiaBaselineRef,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addWarning := func(field, msg string) {
		warnings = append(warnings, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     textileIndiaMarket,
			Regulation: textileIndiaBaselineRef,
			Message:    msg,
			Severity:   "WARNING",
		})
	}

	if tenant.CompanyName == "" {
		addMissing("tenant.company_name", "Company name is required for textile shipment traceability")
	}
	if batch.Specs.MaterialProfile == "" {
		addMissing("batch.specs.material_profile", "Material profile is required for textile lot traceability")
	}
	if batch.Specs.CountryOfOrigin == "" {
		addMissing("batch.specs.country_of_origin", "Country of origin is required for textile lot traceability")
	}
	if batch.Specs.ProductionStage == "" {
		addMissing("batch.specs.production_stage", "Production stage is required for textile lot traceability")
	}
	if batch.Specs.LotSize == "" {
		addWarning("batch.specs.lot_size", "Lot size is recommended for textile operational handoff")
	}

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(textileIndiaTotalChecks, criticalFailures)

	return compliance.Result{
		Valid:    criticalFailures == 0,
		Score:    score,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}