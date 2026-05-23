package textile

import (
	"encoding/json"
	"fmt"

	"github.com/anvayalabs/textile-api/internal/compliance"
	"github.com/anvayalabs/textile-api/internal/models"
)

// Regulatory reference strings for India textile market.
const (
	indiaMarket           = "INDIA"
	indiaLegalMetrologyRef = "Legal Metrology Rules 2011 — fibre composition labeling"
	indiaQCORef           = "Textiles QCO (Quality Control Order) — BIS ISI mark"
	indiaBISRef           = "BIS IS 17243 / IS 16322 — textile product certification"
	indiaCPCBRef          = "CPCB Water Norms for Dyeing Units"
	indiaLaborRef         = "Child Labour (Prohibition & Regulation) Act 1986"
	indiaTraceabilityRef  = "India textile traceability baseline"
)

// indiaBaseCheckpoints counts hard rules that always run.
// 1. company_name, 2. address, 3. fiber_composition_declared,
// 4. fiber_total_100, 5. gsm_declared, 6. gsm_valid,
// 7. country_of_origin, 8. production_stage, 9. manufacturer,
// 10. expected_lifetime_washes, 11. labor_compliance_declared.
const indiaBaseCheckpoints = 11

// IndiaValidator validates textile batch and tenant data against India's
// regulatory framework: Legal Metrology fibre labeling, BIS/QCO certification,
// CPCB water norms for dyeing units, and labour compliance.
type IndiaValidator struct{}

// NewIndiaValidator returns a ready-to-use IndiaValidator.
func NewIndiaValidator() *IndiaValidator { return &IndiaValidator{} }

// Validate implements compliance.Validator.
func (v *IndiaValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("textile india validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

// ValidateBatch implements compliance.BatchValidator.
func (v *IndiaValidator) ValidateBatch(batch *models.Batch, tenant *models.Tenant) (compliance.Result, error) {
	missing := []string{}
	errors := []string{}
	warnings := []string{}
	var gaps []compliance.Gap

	addMissing := func(field, msg, regulation string) {
		missing = append(missing, field)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     indiaMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addError := func(field, msg, regulation string) {
		errors = append(errors, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     indiaMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}
	addWarning := func(field, msg, regulation string) {
		warnings = append(warnings, msg)
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     indiaMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "WARNING",
		})
	}

	// ----------------------------------------------------------------
	// Tenant-level India compliance credentials
	// ----------------------------------------------------------------

	if tenant.CompanyName == "" {
		addMissing("tenant.company_name",
			"Company name is required for textile traceability and BIS registration", indiaTraceabilityRef)
	}
	if tenant.Address == "" {
		addMissing("tenant.address",
			"Manufacturer address is required for BIS/QCO registration", indiaQCORef)
	}

	// ----------------------------------------------------------------
	// Fiber composition — mandatory under Legal Metrology Rules 2011
	// ----------------------------------------------------------------

	if batch.Specs.FiberComposition == nil {
		addMissing("batch.specs.fiber_composition",
			"Fiber composition is mandatory under Legal Metrology Rules 2011", indiaLegalMetrologyRef)
	} else {
		total := fiberTotalPct(batch.Specs.FiberComposition)
		if total < 99.0 || total > 101.0 {
			addError("batch.specs.fiber_composition",
				fmt.Sprintf("Fiber composition must total 100%% (currently %.1f%%)", total),
				indiaLegalMetrologyRef)
		}
	}

	// ----------------------------------------------------------------
	// GSM — QCO quality parameter
	// ----------------------------------------------------------------

	if batch.Specs.GSM <= 0 {
		addMissing("batch.specs.gsm",
			"GSM (grams per square metre) is required under QCO quality parameters", indiaQCORef)
	} else if batch.Specs.GSM >= 2000 {
		addError("batch.specs.gsm",
			fmt.Sprintf("GSM must be below 2000 (got %.0f)", batch.Specs.GSM),
			indiaQCORef)
	}

	// ----------------------------------------------------------------
	// Core traceability fields
	// ----------------------------------------------------------------

	if batch.Specs.ProductionStage == "" {
		addMissing("batch.specs.production_stage",
			"Production stage is required for textile lot traceability", indiaTraceabilityRef)
	}

	// ----------------------------------------------------------------
	// Durability / expected lifetime
	// ----------------------------------------------------------------

	if batch.Specs.ExpectedLifetimeWashes == nil || *batch.Specs.ExpectedLifetimeWashes <= 0 {
		addMissing("batch.specs.expected_lifetime_washes",
			"Expected lifetime in washes is required for consumer protection and durability claims", indiaTraceabilityRef)
	}

	// ----------------------------------------------------------------
	// Labour compliance (SA8000 / BSCI / SEDEX / Fair Trade)
	// ----------------------------------------------------------------

	if batch.Specs.LaborCompliance == nil {
		addMissing("batch.specs.labor_compliance",
			"Labour compliance declaration is required (SA8000, BSCI, SEDEX, or Fair Trade)", indiaLaborRef)
	} else {
		lc := batch.Specs.LaborCompliance
		if !lc.SA8000Certified && !lc.BSCIAudited && !lc.SedexMember && !lc.FairTradeCertified {
			addError("batch.specs.labor_compliance",
				"At least one labour compliance certification (SA8000, BSCI, SEDEX, or Fair Trade) is required",
				indiaLaborRef)
		}
		if lc.AuditScore > 0 && lc.AuditScore < 50 {
			addWarning("batch.specs.labor_compliance.audit_score",
				fmt.Sprintf("Labour audit score %.0f is below recommended 50%% threshold", lc.AuditScore),
				indiaLaborRef)
		}
	}

	// ----------------------------------------------------------------
	// Dynamic: dyeing process → water usage required (CPCB norms)
	// ----------------------------------------------------------------

	hardCheckpoints := indiaBaseCheckpoints
	if batch.Specs.DyeProcess != "" && batch.Specs.DyeProcess != "none" {
		hardCheckpoints++ // water_usage required
		if batch.Specs.WaterUsageLiters <= 0 {
			addMissing("batch.specs.water_usage_liters",
				fmt.Sprintf("Water usage is required when dye process is '%s' (CPCB norms for dyeing units)", batch.Specs.DyeProcess),
				indiaCPCBRef)
		} else if batch.Specs.WaterUsageLiters > 200 {
			addWarning("batch.specs.water_usage_liters",
				fmt.Sprintf("Water usage %.1f L/kg exceeds CPCB recommended limit of 200 L/kg for dyeing units", batch.Specs.WaterUsageLiters),
				indiaCPCBRef)
		}
	}

	// ----------------------------------------------------------------
	// BIS textile certification — soft warning (batch-level or tenant-level)
	// ----------------------------------------------------------------

	hasBISCert := false
	// TODO: re-enable certification checks when textile cert fields are restored
	if !hasBISCert {
		addWarning("batch.specs.certifications[BIS]",
			"BIS ISI mark certification is recommended for QCO-mandated textile categories", indiaBISRef)
	}

	// ----------------------------------------------------------------
	// Score calculation
	// ----------------------------------------------------------------

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(hardCheckpoints, criticalFailures)

	return compliance.Result{
		Valid:    criticalFailures == 0,
		Score:    score,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}

// fiberTotalPct sums all percentage fields in a FiberComposition.
func fiberTotalPct(fc *models.FiberComposition) float64 {
	if fc == nil {
		return 0
	}
	return fc.CottonPct + fc.PolyesterPct + fc.WoolPct + fc.SilkPct +
		fc.LinenPct + fc.ViscosePct + fc.NylonPct + fc.AcrylicPct +
		fc.HempPct + fc.OtherPct
}
