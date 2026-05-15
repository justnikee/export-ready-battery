package textile

import (
	"encoding/json"
	"fmt"

	"anvayalabs-battery/internal/compliance"
	"anvayalabs-battery/internal/models"
)

// Regulatory reference strings for EU textile market.
const (
	euMarket              = "EU"
	euESPRRef             = "EU ESPR (Ecodesign for Sustainable Products Regulation)"
	euESPRArt7Ref         = "EU ESPR Art. 7 — Product information (fiber composition, durability, recycled content)"
	euESPRArt8Ref         = "EU ESPR Art. 8 — Chemical compliance / restricted substances"
	euESPRArt9Ref         = "EU ESPR Art. 9 — Carbon footprint declaration"
	euREACHRef            = "REACH Regulation (EC) No 1907/2006 — SVHC > 0.1% w/w"
	euZDHCRef             = "ZDHC MRSL (Manufacturing Restricted Substances List)"
	euSupplyChainRef      = "EU ESPR Art. 11 — Supply chain due diligence"
)

// euBaseCheckpoints counts hard rules that always run.
// 1. company_name, 2. address, 3. eu_authorized_representative_name,
// 4. eu_authorized_representative_address, 5. manufacturer,
// 6. fiber_composition_declared, 7. fiber_total_100, 8. gsm,
// 9. country_of_origin, 10. production_stage, 11. expected_lifetime_washes,
// 12. recycled_content_pct, 13. chemical_compliance_zdhc,
// 14. hazardous_substances.declaration, 15. water_usage_liters,
// 16. energy_usage_kwh.
const euBaseCheckpoints = 16

// syntheticFibers lists fiber names that are known to shed microplastics.
var syntheticFibers = map[string]bool{
	"polyester": true,
	"nylon":     true,
	"acrylic":   true,
}

// EUValidator validates textile batch and tenant data against the EU ESPR
// and related regulations (REACH, ZDHC MRSL).
type EUValidator struct{}

// NewEUValidator returns a ready-to-use EUValidator.
func NewEUValidator() *EUValidator { return &EUValidator{} }

// Validate implements compliance.Validator.
func (v *EUValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("textile eu validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

// ValidateBatch implements compliance.BatchValidator.
func (v *EUValidator) ValidateBatch(batch *models.Batch, tenant *models.Tenant) (compliance.Result, error) {
	missing := []string{}
	errors := []string{}
	warnings := []string{}
	var gaps []compliance.Gap

	addMissing := func(field, msg, regulation string) {
		missing = append(missing, field)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     euMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addError := func(field, msg, regulation string) {
		errors = append(errors, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     euMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addWarning := func(field, msg, regulation string) {
		warnings = append(warnings, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     euMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "WARNING",
		})
	}

	// ----------------------------------------------------------------
	// Tenant-level EU compliance — Authorized Representative
	// ----------------------------------------------------------------

	if tenant.CompanyName == "" {
		addMissing("tenant.company_name",
			"Manufacturer company name is required for EU textile passport disclosures", euESPRRef)
	}
	if tenant.Address == "" {
		addMissing("tenant.address",
			"Manufacturer address is required for EU textile passport disclosures", euESPRRef)
	}
	if tenant.EUAuthorizedRepresentativeName == "" {
		addMissing("tenant.eu_authorized_representative_name",
			"EU Authorized Representative name is mandatory for non-EU manufacturers", euESPRRef)
	}
	if tenant.EUAuthorizedRepresentativeAddress == "" {
		addMissing("tenant.eu_authorized_representative_address",
			"EU Authorized Representative address is mandatory", euESPRRef)
	}

	// ----------------------------------------------------------------
	// Core product information (ESPR Art. 7)
	// ----------------------------------------------------------------

	if batch.Specs.Manufacturer == "" {
		addMissing("batch.specs.manufacturer",
			"Template or lot manufacturer is required", euESPRArt7Ref)
	}

	if batch.Specs.FiberComposition == nil {
		addMissing("batch.specs.fiber_composition",
			"Fiber composition is mandatory under ESPR Art. 7", euESPRArt7Ref)
	} else {
		total := fiberTotalPct(batch.Specs.FiberComposition)
		if total < 99.0 || total > 101.0 {
			addError("batch.specs.fiber_composition",
				fmt.Sprintf("Fiber composition must total 100%% (currently %.1f%%)", total),
				euESPRArt7Ref)
		}
	}

	if batch.Specs.GSM <= 0 {
		addMissing("batch.specs.gsm",
			"GSM is required for textile passport composition disclosure", euESPRArt7Ref)
	} else if batch.Specs.GSM >= 2000 {
		addError("batch.specs.gsm",
			fmt.Sprintf("GSM must be below 2000 (got %.0f)", batch.Specs.GSM),
			euESPRArt7Ref)
	}

	if batch.Specs.CountryOfOrigin == "" {
		addMissing("batch.specs.country_of_origin",
			"Country of origin is required for textile traceability", euESPRArt7Ref)
	}
	if batch.Specs.ProductionStage == "" {
		addMissing("batch.specs.production_stage",
			"Production stage is required for textile passport workflow context", euESPRArt7Ref)
	}

	// ----------------------------------------------------------------
	// Durability (ESPR Art. 7 — expected lifetime)
	// ----------------------------------------------------------------

	if batch.Specs.ExpectedLifetimeWashes == nil || *batch.Specs.ExpectedLifetimeWashes <= 0 {
		addMissing("batch.specs.expected_lifetime_washes",
			"Expected lifetime in washes is mandatory for ESPR durability disclosure", euESPRArt7Ref)
	}

	// ----------------------------------------------------------------
	// Recycled content (ESPR Art. 7)
	// ----------------------------------------------------------------

	if batch.Specs.RecycledContentPct != nil && *batch.Specs.RecycledContentPct < 0 {
		addError("batch.specs.recycled_content_pct",
			"Recycled content percentage cannot be negative", euESPRArt7Ref)
	}

	// ----------------------------------------------------------------
	// Chemical compliance — ZDHC MRSL (ESPR Art. 8)
	// ----------------------------------------------------------------

	if batch.Specs.ChemicalComplianceZDHC == nil {
		addMissing("batch.specs.chemical_compliance_zdhc",
			"ZDHC MRSL chemical compliance data is mandatory under ESPR Art. 8", euZDHCRef)
	} else {
		zdhc := batch.Specs.ChemicalComplianceZDHC
		if zdhc.ZDHCLevel == "" || zdhc.ZDHCLevel == "NA" {
			addMissing("batch.specs.chemical_compliance_zdhc.zdhc_level",
				"ZDHC conformance level (1, 2, or 3) is required", euZDHCRef)
		}
		if !zdhc.MRSLTested {
			addMissing("batch.specs.chemical_compliance_zdhc.mrsl_tested",
				"MRSL tested status must be true for ESPR chemical compliance", euZDHCRef)
		}
	}

	// ----------------------------------------------------------------
	// Hazardous substances — REACH SVHC (EC) No 1907/2006
	// ----------------------------------------------------------------

	if batch.Specs.HazardousSubstances == nil || batch.Specs.HazardousSubstances.Declaration == "" {
		addMissing("batch.specs.hazardous_substances.declaration",
			"REACH / SVHC declaration is mandatory for textile compliance review", euREACHRef)
	}

	// ----------------------------------------------------------------
	// Environmental parameters — water & energy usage (ESPR Art. 9)
	// ----------------------------------------------------------------

	if batch.Specs.WaterUsageLiters <= 0 {
		addMissing("batch.specs.water_usage_liters",
			"Water usage is required for ESPR environmental parameter disclosure", euESPRArt9Ref)
	}
	if batch.Specs.EnergyUsageKWh <= 0 {
		addMissing("batch.specs.energy_usage_kwh",
			"Energy usage is required for ESPR environmental parameter disclosure", euESPRArt9Ref)
	}

	// ----------------------------------------------------------------
	// Warnings — non-blocking informational gaps
	// ----------------------------------------------------------------

	// Microplastic shedding warning for high synthetic content
	syntheticPct := syntheticFiberPct(batch.Specs.FiberComposition)
	if syntheticPct > 20.0 {
		addWarning("batch.specs.fiber_composition.microplastic_info",
			fmt.Sprintf("Synthetic fiber content %.1f%% exceeds 20%% — microplastic shedding information will be required under future ESPR delegated acts", syntheticPct),
			euESPRArt8Ref)
	}

	if batch.Specs.BiodegradablePct == nil || *batch.Specs.BiodegradablePct <= 0 {
		addWarning("batch.specs.biodegradable_pct",
			"Biodegradability percentage not declared (recommended for ESPR circularity assessment)", euESPRArt7Ref)
	}

	if batch.Specs.SupplyChainProvenance == nil || batch.Specs.SupplyChainProvenance.DueDiligencePolicy == "" {
		addWarning("batch.specs.supply_chain_provenance.due_diligence_policy",
			"Supply-chain due-diligence policy is recommended before generating textile supplier dossiers", euSupplyChainRef)
	}

	if len(batch.Specs.Certifications) == 0 {
		addWarning("batch.specs.certifications",
			"No textile certifications declared; downstream partner packets may be incomplete", euESPRRef)
	}

	// ----------------------------------------------------------------
	// Score calculation
	// ----------------------------------------------------------------

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(euBaseCheckpoints, criticalFailures)

	return compliance.Result{
		Valid:    criticalFailures == 0,
		Score:    score,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}

// syntheticFiberPct returns the combined percentage of known synthetic fibers.
func syntheticFiberPct(fc *models.FiberComposition) float64 {
	if fc == nil {
		return 0
	}
	return fc.PolyesterPct + fc.NylonPct + fc.AcrylicPct
}
