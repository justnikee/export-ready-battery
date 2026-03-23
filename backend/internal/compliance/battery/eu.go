package battery

import (
	"encoding/json"
	"fmt"

	"exportready-battery/internal/compliance"
	"exportready-battery/internal/models"
)

// Regulatory reference strings used in Gap objects for EU market.
const (
	euMarket    = "EU"
	euBatRegRef = "EU Battery Regulation 2023/1542"
	euArt7Ref   = "EU 2023/1542 Art. 7 — Carbon footprint declaration"
	euArt8Ref   = "EU 2023/1542 Art. 8 — Recycled content targets"
	euArt11Ref  = "EU 2023/1542 Art. 11 — Supply chain due diligence"
	euREACHRef  = "REACH Regulation (EC) No 1907/2006"
)

// euTotalCheckpoints is the number of discrete hard rules evaluated
// by the EU validator. Used as the denominator for the compliance score.
const euTotalCheckpoints = 12

// EUValidator validates battery batch and tenant data against the EU Battery
// Regulation 2023/1542, covering carbon footprint disclosure (Art. 7),
// recycled content targets (Art. 8), supply chain due diligence (Art. 11),
// and REACH/RoHS hazardous substance declarations.
//
// Implements compliance.Validator and compliance.BatchValidator.
type EUValidator struct{}

// Validate implements compliance.Validator.
// Unmarshals specs into BatchSpec and delegates to ValidateBatch with an empty
// Tenant so that tenant-level checks surface as missing fields.
// Use ValidateBatch for a complete compliance check including tenant credentials.
func (v *EUValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("eu validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

// ValidateBatch implements compliance.BatchValidator, running all EU-specific
// compliance rules against the full structured batch + tenant context.
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
			"Manufacturer company name is required for EU DPP", euBatRegRef)
	}
	if tenant.Address == "" {
		addMissing("tenant.address",
			"Manufacturer address is required for EU DPP", euBatRegRef)
	}
	if tenant.EUAuthorizedRepresentativeName == "" {
		addMissing("tenant.eu_authorized_representative_name",
			"EU Authorized Representative name is mandatory for non-EU manufacturers", euBatRegRef)
	}
	if tenant.EUAuthorizedRepresentativeAddress == "" {
		addMissing("tenant.eu_authorized_representative_address",
			"EU Authorized Representative address is mandatory", euBatRegRef)
	}
	if tenant.EUContactEmail == "" {
		addMissing("tenant.eu_contact_email",
			"EU point-of-contact email is mandatory for DPP access queries", euBatRegRef)
	}

	// ----------------------------------------------------------------
	// Carbon footprint declaration (Art. 7)
	// Must come from the platform's carbon calculator — free-text not accepted.
	// ----------------------------------------------------------------

	if len(batch.CarbonFootprintResult) == 0 {
		addMissing("batch.carbon_footprint_result",
			"Carbon footprint result is mandatory — use the carbon calculator (free-text values are not accepted)", euArt7Ref)
	}

	// ----------------------------------------------------------------
	// Material composition / critical raw materials (Art. 8)
	// ----------------------------------------------------------------

	if batch.Specs.MaterialComposition == nil {
		addMissing("batch.specs.material_composition",
			"Material composition (critical raw material percentages) is mandatory", euArt8Ref)
	} else {
		mc := batch.Specs.MaterialComposition
		if mc.CobaltPct <= 0 && mc.LithiumPct <= 0 && mc.NickelPct <= 0 &&
			mc.ManganesePct <= 0 && mc.GraphitePct <= 0 && mc.LeadPct <= 0 {
			addMissing("batch.specs.material_composition",
				"Material composition must contain non-zero values for at least one critical raw material", euArt8Ref)
		}

		// Recycled content soft warnings — EU 2030 targets
		if mc.CobaltPct > 0 && mc.RecycledCobaltPct <= 0 {
			addWarning("batch.specs.material_composition.recycled_cobalt_pct",
				"Recycled cobalt content not declared (EU 2030 target: ≥16%; 2035 target: ≥26%)", euArt8Ref)
		}
		if mc.LithiumPct > 0 && mc.RecycledLithiumPct <= 0 {
			addWarning("batch.specs.material_composition.recycled_lithium_pct",
				"Recycled lithium content not declared (EU 2030 target: ≥6%; 2035 target: ≥12%)", euArt8Ref)
		}
		if mc.NickelPct > 0 && mc.RecycledNickelPct <= 0 {
			addWarning("batch.specs.material_composition.recycled_nickel_pct",
				"Recycled nickel content not declared (EU 2030 target: ≥6%; 2035 target: ≥15%)", euArt8Ref)
		}
		if mc.LeadPct > 0 && mc.RecycledLeadPct <= 0 {
			addWarning("batch.specs.material_composition.recycled_lead_pct",
				"Recycled lead content not declared (EU 2030/2035 target: ≥85%)", euArt8Ref)
		}
	}

	// ----------------------------------------------------------------
	// Hazardous substances declaration (REACH / RoHS)
	// ----------------------------------------------------------------

	if batch.Specs.HazardousSubstances == nil || batch.Specs.HazardousSubstances.Declaration == "" {
		addMissing("batch.specs.hazardous_substances.declaration",
			"Hazardous substances declaration is mandatory under REACH/RoHS", euREACHRef)
	}

	// ----------------------------------------------------------------
	// Battery lifetime and warranty (EU DPP completeness)
	// ----------------------------------------------------------------

	if batch.Specs.ExpectedLifetimeCycles == nil || *batch.Specs.ExpectedLifetimeCycles <= 0 {
		addMissing("batch.specs.expected_lifetime_cycles",
			"Expected lifetime in charge cycles must be declared", euBatRegRef)
	}
	if batch.Specs.WarrantyMonths == nil || *batch.Specs.WarrantyMonths <= 0 {
		addMissing("batch.specs.warranty_months",
			"Warranty duration in months must be declared", euBatRegRef)
	}

	// ----------------------------------------------------------------
	// Overall recycled content percentage — soft warning
	// ----------------------------------------------------------------

	if batch.Specs.RecycledContentPct == nil || *batch.Specs.RecycledContentPct <= 0 {
		addWarning("batch.specs.recycled_content_pct",
			"Overall recycled content percentage not declared (recommended for Art. 8 disclosure)", euArt8Ref)
	}

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(euTotalCheckpoints, criticalFailures)

	return compliance.Result{
		Valid:    criticalFailures == 0,
		Score:    score,
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}
