package textile

import (
	"encoding/json"
	"fmt"

	"anvayalabs-battery/internal/compliance"
	"anvayalabs-battery/internal/models"
)

const (
	textileEUMarket         = "EU"
	textileESPRRef          = "EU ESPR textile passport baseline"
	textileREACHSVHCRef     = "REACH / SVHC textile disclosure baseline"
	textileSupplyChainEURef = "Textile supply-chain disclosure baseline"
	textileEUTotalChecks    = 13
)

// EUValidator enforces a minimal textile passport baseline for EU workflows.
// It validates the core textile schema fields plus REACH/SVHC declaration data.
type EUValidator struct{}

func NewEUValidator() *EUValidator { return &EUValidator{} }

func (v *EUValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("textile eu validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

func (v *EUValidator) ValidateBatch(batch *models.Batch, tenant *models.Tenant) (compliance.Result, error) {
	missing := []string{}
	errors := []string{}
	warnings := []string{}
	var gaps []compliance.Gap

	addMissing := func(field, msg, regulation string) {
		missing = append(missing, field)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     textileEUMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addWarning := func(field, msg, regulation string) {
		warnings = append(warnings, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     textileEUMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "WARNING",
		})
	}

	if tenant.CompanyName == "" {
		addMissing("tenant.company_name", "Manufacturer company name is required for textile passport disclosures", textileESPRRef)
	}
	if tenant.Address == "" {
		addMissing("tenant.address", "Manufacturer address is required for textile passport disclosures", textileESPRRef)
	}
	if batch.Specs.Manufacturer == "" {
		addMissing("batch.specs.manufacturer", "Template or lot manufacturer is required", textileESPRRef)
	}
	if batch.Specs.MaterialProfile == "" {
		addMissing("batch.specs.material_profile", "Material profile is required for textile passport composition disclosure", textileESPRRef)
	}
	if batch.Specs.CountryOfOrigin == "" {
		addMissing("batch.specs.country_of_origin", "Country of origin is required for textile traceability", textileESPRRef)
	}
	if batch.Specs.ProductionStage == "" {
		addMissing("batch.specs.production_stage", "Production stage is required for textile passport workflow context", textileESPRRef)
	}
	if batch.Specs.HazardousSubstances == nil || batch.Specs.HazardousSubstances.Declaration == "" {
		addMissing("batch.specs.hazardous_substances.declaration", "REACH / SVHC declaration is required for textile compliance review", textileREACHSVHCRef)
	}
	if batch.Specs.SupplyChainProvenance == nil || batch.Specs.SupplyChainProvenance.DueDiligencePolicy == "" {
		addWarning("batch.specs.supply_chain_provenance.due_diligence_policy", "Supply-chain due-diligence policy is recommended before generating textile supplier dossiers", textileSupplyChainEURef)
	}
	if len(batch.Specs.Certifications) == 0 {
		addWarning("batch.specs.certifications", "No textile certifications declared; downstream partner packets may be incomplete", textileESPRRef)
	}

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(textileEUTotalChecks, criticalFailures)

	return compliance.Result{
		Valid:    criticalFailures == 0,
		Score:    score,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}