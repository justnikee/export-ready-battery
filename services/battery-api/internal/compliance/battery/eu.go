package battery

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
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
const euTotalCheckpoints = 15

// EUValidator validates battery batch and tenant data against the EU Battery
// Regulation 2023/1542, covering carbon footprint disclosure (Art. 7),
// recycled content targets (Art. 8), supply chain due diligence (Art. 11),
// and REACH/RoHS hazardous substance declarations.
//
// Implements compliance.Validator and compliance.BatchValidator.
type EUValidator struct {
	repo repository.RepositoryInterface
}

// NewEUValidator returns a ready-to-use EUValidator.
func NewEUValidator() *EUValidator { return &EUValidator{} }

// WithRepository injects a repository so the validator can query active
// compliance rules from the database. Falls back to hard-coded defaults
// if the repository is nil or the rules table is empty.
func (v *EUValidator) WithRepository(repo repository.RepositoryInterface) *EUValidator {
	v.repo = repo
	return v
}

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

// recycledThresholds holds the minimum recycled-content percentages for EU Art. 8.
type recycledThresholds struct {
	Cobalt   float64
	Lithium  float64
	Nickel   float64
	Lead     float64
}

// hardCodedThresholds returns the default EU 2030 thresholds used when the DB
// compliance_rules table is empty or the repository is not injected.
func hardCodedThresholds() recycledThresholds {
	return recycledThresholds{Cobalt: 16.0, Lithium: 6.0, Nickel: 6.0, Lead: 85.0}
}

// getRecycledThresholds queries the database for active compliance rules.
// Falls back to hard-coded defaults on any error so validation never blocks
// on a DB failure.
func (v *EUValidator) getRecycledThresholds(ctx context.Context) recycledThresholds {
	if v.repo == nil {
		return hardCodedThresholds()
	}

	rules, err := v.repo.GetActiveComplianceRules(ctx, "battery", "eu")
	if err != nil {
		slog.Warn("compliance: failed to load EU compliance rules, using defaults", "error", err)
		return hardCodedThresholds()
	}
	if len(rules) == 0 {
		return hardCodedThresholds()
	}

	t := hardCodedThresholds()
	for _, r := range rules {
		if r.ThresholdValue == nil {
			continue
		}
		switch r.RuleKey {
		case "recycled_cobalt_min_pct":
			t.Cobalt = *r.ThresholdValue
		case "recycled_lithium_min_pct":
			t.Lithium = *r.ThresholdValue
		case "recycled_nickel_min_pct":
			t.Nickel = *r.ThresholdValue
		case "recycled_lead_min_pct":
			t.Lead = *r.ThresholdValue
		}
	}
	return t
}

// ValidateEUTenant checks only tenant-level EU compliance credentials
// (company name, address, authorized representative). It does NOT require
// a batch and is safe to call during onboarding.
// Returns the list of compliance gaps found.
func ValidateEUTenant(tenant *models.Tenant) []compliance.Gap {
	var gaps []compliance.Gap

	addMissing := func(field, msg, regulation string) {
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     euMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   "ERROR",
		})
	}

	tenant.EnsureBatteryProfile()

	if tenant.CompanyName == "" {
		addMissing("tenant.company_name",
			"Manufacturer company name is required for EU DPP", euBatRegRef)
	}
	if tenant.Address == "" {
		addMissing("tenant.address",
			"Manufacturer address is required for EU DPP", euBatRegRef)
	}
	if tenant.BatteryProfile.EUAuthorizedRepresentativeName == "" {
		addMissing("tenant.eu_authorized_representative_name",
			"EU Authorized Representative name is mandatory for non-EU manufacturers", euBatRegRef)
	}
	if tenant.BatteryProfile.EUAuthorizedRepresentativeAddress == "" {
		addMissing("tenant.eu_authorized_representative_address",
			"EU Authorized Representative address is mandatory", euBatRegRef)
	}
	if tenant.BatteryProfile.EUContactEmail == "" {
		addMissing("tenant.eu_contact_email",
			"EU point-of-contact email is mandatory for DPP access queries", euBatRegRef)
	}

	return gaps
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

	tenantGaps := ValidateEUTenant(tenant)
	for _, g := range tenantGaps {
		if g.Severity == "ERROR" {
			missing = append(missing, g.Field)
		}
	}
	gaps = append(gaps, tenantGaps...)

	// ----------------------------------------------------------------
	// Battery category classification (EU 2023/1542 Art. 2)
	// ----------------------------------------------------------------

	if batch.Specs.BatteryCategory == "" {
		addMissing("batch.specs.battery_category",
			"Battery category is mandatory (EV, LMT, INDUSTRIAL, PORTABLE, or SLI)", euBatRegRef)
	} else if !batch.Specs.BatteryCategory.IsValid() {
		addError("batch.specs.battery_category",
			fmt.Sprintf("Invalid battery_category: %s (must be EV, LMT, INDUSTRIAL, PORTABLE, or SLI)", batch.Specs.BatteryCategory),
			euBatRegRef)
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

		// Recycled content thresholds — query DB for active rules, fall back to hard-coded defaults.
		thresholds := v.getRecycledThresholds(context.Background())

		if mc.CobaltPct > 0 && mc.RecycledCobaltPct < thresholds.Cobalt {
			msg := fmt.Sprintf("Recycled cobalt content %.1f%% is below EU minimum %.1f%%", mc.RecycledCobaltPct, thresholds.Cobalt)
			if mc.RecycledCobaltPct <= 0 {
				msg = fmt.Sprintf("Recycled cobalt content not declared (EU minimum: ≥%.1f%%)", thresholds.Cobalt)
			}
			addError("batch.specs.material_composition.recycled_cobalt_pct", msg, euArt8Ref)
		}
		if mc.LithiumPct > 0 && mc.RecycledLithiumPct < thresholds.Lithium {
			msg := fmt.Sprintf("Recycled lithium content %.1f%% is below EU minimum %.1f%%", mc.RecycledLithiumPct, thresholds.Lithium)
			if mc.RecycledLithiumPct <= 0 {
				msg = fmt.Sprintf("Recycled lithium content not declared (EU minimum: ≥%.1f%%)", thresholds.Lithium)
			}
			addError("batch.specs.material_composition.recycled_lithium_pct", msg, euArt8Ref)
		}
		if mc.NickelPct > 0 && mc.RecycledNickelPct < thresholds.Nickel {
			msg := fmt.Sprintf("Recycled nickel content %.1f%% is below EU minimum %.1f%%", mc.RecycledNickelPct, thresholds.Nickel)
			if mc.RecycledNickelPct <= 0 {
				msg = fmt.Sprintf("Recycled nickel content not declared (EU minimum: ≥%.1f%%)", thresholds.Nickel)
			}
			addError("batch.specs.material_composition.recycled_nickel_pct", msg, euArt8Ref)
		}
		if mc.LeadPct > 0 && mc.RecycledLeadPct < thresholds.Lead {
			msg := fmt.Sprintf("Recycled lead content %.1f%% is below EU minimum %.1f%%", mc.RecycledLeadPct, thresholds.Lead)
			if mc.RecycledLeadPct <= 0 {
				msg = fmt.Sprintf("Recycled lead content not declared (EU minimum: ≥%.1f%%)", thresholds.Lead)
			}
			addError("batch.specs.material_composition.recycled_lead_pct", msg, euArt8Ref)
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
	// Component-level disclosure (EU 2023/1542 Art. 77 — cell chemistry)
	// ----------------------------------------------------------------

	if len(batch.Specs.Components) > 0 {
		cellCount := 0
		cellWithChemistry := 0
		for _, comp := range batch.Specs.Components {
			if comp.ComponentType == "cell" {
				cellCount++
				if comp.Chemistry != "" {
					cellWithChemistry++
				}
			}
		}
		if cellCount > 0 && cellWithChemistry < cellCount {
			addError("batch.specs.components",
				fmt.Sprintf("All cell-level components must declare chemistry (%d/%d cells have chemistry)", cellWithChemistry, cellCount),
				euBatRegRef)
		}
		// Aggregate component recycled content and validate against thresholds
		agg := aggregateComponentRecycledContent(batch.Specs.Components)
		thresholds := v.getRecycledThresholds(context.Background())
		if agg.CobaltTotal > 0 && agg.RecycledCobalt < thresholds.Cobalt {
			addWarning("batch.specs.components.recycled_cobalt_pct",
				fmt.Sprintf("Component-level aggregated recycled cobalt %.1f%% is below EU minimum %.1f%%", agg.RecycledCobalt, thresholds.Cobalt),
				euArt8Ref)
		}
		if agg.LithiumTotal > 0 && agg.RecycledLithium < thresholds.Lithium {
			addWarning("batch.specs.components.recycled_lithium_pct",
				fmt.Sprintf("Component-level aggregated recycled lithium %.1f%% is below EU minimum %.1f%%", agg.RecycledLithium, thresholds.Lithium),
				euArt8Ref)
		}
		if agg.NickelTotal > 0 && agg.RecycledNickel < thresholds.Nickel {
			addWarning("batch.specs.components.recycled_nickel_pct",
				fmt.Sprintf("Component-level aggregated recycled nickel %.1f%% is below EU minimum %.1f%%", agg.RecycledNickel, thresholds.Nickel),
				euArt8Ref)
		}
		if agg.LeadTotal > 0 && agg.RecycledLead < thresholds.Lead {
			addWarning("batch.specs.components.recycled_lead_pct",
				fmt.Sprintf("Component-level aggregated recycled lead %.1f%% is below EU minimum %.1f%%", agg.RecycledLead, thresholds.Lead),
				euArt8Ref)
		}
	} else if batch.Specs.BatteryCategory == models.BatteryCategoryEV || batch.Specs.BatteryCategory == models.BatteryCategoryLMT || batch.Specs.BatteryCategory == models.BatteryCategoryIndustrial {
		// EV, LMT, and Industrial batteries typically have sub-assemblies;
		// warn if no component breakdown is provided.
		addWarning("batch.specs.components",
			"No component breakdown provided. EU Battery Regulation Art. 77 requires cell-level disclosure for batteries with sub-assemblies.",
			euBatRegRef)
	}

	// ----------------------------------------------------------------
	// Supplier risk profiling (EU 2023/1542 Art. 11 — Supply chain due diligence)
	// ----------------------------------------------------------------

	if v.repo != nil {
		var supplierUUIDs []uuid.UUID
		seen := map[string]struct{}{}
		for _, comp := range batch.Specs.Components {
			if comp.SupplierID != nil && *comp.SupplierID != "" {
				if _, ok := seen[*comp.SupplierID]; !ok {
					seen[*comp.SupplierID] = struct{}{}
					if suid, err := uuid.Parse(*comp.SupplierID); err == nil {
						supplierUUIDs = append(supplierUUIDs, suid)
					}
				}
			}
		}
		if len(supplierUUIDs) > 0 {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			profiles, err := v.repo.GetSupplierRiskProfilesBySuppliers(ctx, batch.TenantID, supplierUUIDs)
			if err != nil {
				slog.Warn("eu validator: failed to load supplier risk profiles", "error", err, "batch_id", batch.ID)
			} else {
				profileMap := make(map[string]models.SupplierRiskProfile, len(profiles))
				for _, p := range profiles {
					profileMap[p.SupplierID] = p
				}
				for _, suid := range supplierUUIDs {
					key := suid.String()
					if prof, ok := profileMap[key]; ok {
						if prof.OverallScore > 70 {
							addError("batch.specs.components.supplier_risk",
								fmt.Sprintf("Supplier %s has extreme risk score (%d/100). Country tier %d. Minerals: %v.",
									key, prof.OverallScore, prof.CountryRiskTier, prof.MineralRiskFlags),
								euArt11Ref)
						} else if prof.OverallScore > 40 {
							addWarning("batch.specs.components.supplier_risk",
								fmt.Sprintf("Supplier %s has elevated risk score (%d/100). Country tier %d.",
									key, prof.OverallScore, prof.CountryRiskTier),
								euArt11Ref)
						}
						if prof.RMAPValid != nil && !*prof.RMAPValid {
							addError("batch.specs.components.supplier_rmap",
								fmt.Sprintf("Supplier %s does not have a valid RMAP audit.", key),
								euArt11Ref)
						}
						if prof.NextAuditDue != nil && time.Now().After(*prof.NextAuditDue) {
							addError("batch.specs.components.supplier_audit_overdue",
								fmt.Sprintf("Supplier %s audit is overdue (due %s).", key, prof.NextAuditDue.Format("2006-01-02")),
								euArt11Ref)
						}
					} else {
						addError("batch.specs.components.supplier_risk",
							fmt.Sprintf("Supplier %s has no risk profile. Run due diligence assessment.", key),
							euArt11Ref)
					}
				}
			}
		}
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
		PerMarket: map[string]compliance.MarketScore{
			euMarket: {Score: score, Valid: criticalFailures == 0, Gaps: gaps},
		},
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}

// aggregatedRecycledContent holds weighted recycled content across all components.
type aggregatedRecycledContent struct {
	CobaltTotal    float64
	RecycledCobalt float64
	LithiumTotal   float64
	RecycledLithium float64
	NickelTotal    float64
	RecycledNickel float64
	LeadTotal      float64
	RecycledLead   float64
}

// aggregateComponentRecycledContent computes weighted-average recycled content
// across all components, weighted by component weight.
func aggregateComponentRecycledContent(components []models.Component) aggregatedRecycledContent {
	var totalWeight float64
	var agg aggregatedRecycledContent
	for _, c := range components {
		w := c.WeightKg * float64(c.Quantity)
		if w <= 0 {
			w = 1 // fallback for unweighted components
		}
		totalWeight += w
		agg.CobaltTotal += w
		agg.RecycledCobalt += w * c.RecycledCobaltPct / 100
		agg.LithiumTotal += w
		agg.RecycledLithium += w * c.RecycledLithiumPct / 100
		agg.NickelTotal += w
		agg.RecycledNickel += w * c.RecycledNickelPct / 100
		agg.LeadTotal += w
		agg.RecycledLead += w * c.RecycledLeadPct / 100
	}
	if totalWeight > 0 {
		agg.RecycledCobalt = (agg.RecycledCobalt / totalWeight) * 100
		agg.RecycledLithium = (agg.RecycledLithium / totalWeight) * 100
		agg.RecycledNickel = (agg.RecycledNickel / totalWeight) * 100
		agg.RecycledLead = (agg.RecycledLead / totalWeight) * 100
	}
	return agg
}
