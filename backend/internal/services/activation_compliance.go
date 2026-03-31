package services

import (
	"fmt"

	"exportready-battery/internal/models"
)

// ActivationComplianceResult captures missing or invalid fields for activation
type ActivationComplianceResult struct {
	Valid   bool     `json:"valid"`
	Missing []string `json:"missing"`
	Errors  []string `json:"errors"`
}

// ValidateActivationCompliance enforces design_system.md rules at batch activation.
func ValidateActivationCompliance(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
	missing := []string{}
	errors := []string{}

	// Common required fields (all markets)
	if batch.ModelName == "" {
		missing = append(missing, "batch.model_name")
	}
	if batch.Specs.Chemistry == "" {
		missing = append(missing, "batch.specs.chemistry")
	}
	// Capacity is treated as rated capacity for compliance purposes
	if batch.Specs.Capacity == "" {
		missing = append(missing, "batch.specs.capacity (rated_capacity)")
	}
	if batch.ManufacturingStartDate == nil {
		missing = append(missing, "batch.manufacturing_start_date")
	}
	if batch.ManufacturingEndDate == nil {
		missing = append(missing, "batch.manufacturing_end_date")
	}

	// Market-specific requirements
	switch batch.MarketRegion {
	case models.MarketRegionIndia:
		validateIndiaActivation(batch, tenant, &missing, &errors)
	case models.MarketRegionEU:
		validateEUActivation(batch, tenant, &missing, &errors)
	case models.MarketRegionGlobal:
		validateIndiaActivation(batch, tenant, &missing, &errors)
		validateEUActivation(batch, tenant, &missing, &errors)
	}

	return ActivationComplianceResult{
		Valid:   len(missing) == 0 && len(errors) == 0,
		Missing: missing,
		Errors:  errors,
	}
}

func validateIndiaActivation(batch *models.Batch, tenant *models.Tenant, missing *[]string, errors *[]string) {
	// Tenant-level India compliance
	if tenant.EPRRegistrationNumber == "" {
		*missing = append(*missing, "tenant.epr_registration_number")
	}
	if tenant.BISRNumber == "" {
		*missing = append(*missing, "tenant.bis_r_number")
	}
	if tenant.IECCode == "" {
		*missing = append(*missing, "tenant.iec_code")
	}
	if tenant.MorthManufacturerCode == "" {
		*missing = append(*missing, "tenant.morth_manufacturer_code")
	}

	// Batch-level India compliance
	if batch.CellSource == "" {
		*missing = append(*missing, "batch.cell_source")
	}

	if batch.CellSource == "IMPORTED" {
		if batch.BillOfEntryNo == "" {
			*missing = append(*missing, "batch.bill_of_entry_no")
		}
		if batch.CountryOfOrigin == "" {
			*missing = append(*missing, "batch.country_of_origin")
		}
		if batch.CustomsDate == nil {
			*missing = append(*missing, "batch.customs_date")
		}
	}

	// Domestic value addition is mandatory (can be 0 for imports)
	if batch.CellSource == "DOMESTIC" && batch.DomesticValueAdd <= 0 {
		*missing = append(*missing, "batch.domestic_value_add")
	}

	// PLI claim requires DVA >= 50%
	if batch.PLICompliant && batch.DomesticValueAdd < 50 {
		*errors = append(*errors, fmt.Sprintf("PLI claim invalid: domestic_value_add %.1f%% < 50%%", batch.DomesticValueAdd))
	}

	// AIS-156 / AIS-038 Safety Type-Approval Certificates
	// Required for India market export-readiness per MoRTH notification
	hasAIS156 := false
	hasAIS038 := false
	for _, cert := range batch.Specs.Certifications {
		switch cert {
		case "AIS-156":
			hasAIS156 = true
		case "AIS-038":
			hasAIS038 = true
		}
	}
	if !hasAIS156 {
		*missing = append(*missing, "batch.specs.certifications: AIS-156 (safety type-approval for traction batteries)")
	}
	if !hasAIS038 {
		*missing = append(*missing, "batch.specs.certifications: AIS-038 (rev.2 — battery safety for EVs)")
	}
}

func validateEUActivation(batch *models.Batch, tenant *models.Tenant, missing *[]string, errors *[]string) {
	// Battery Category is required for all EU-destined batteries (Art 2)
	if batch.Specs.BatteryCategory == "" {
		*missing = append(*missing, "batch.specs.battery_category (EV, LMT, INDUSTRIAL, PORTABLE, or SLI)")
	} else if !batch.Specs.BatteryCategory.IsValid() {
		*errors = append(*errors, fmt.Sprintf("Invalid battery_category: %s (must be EV, LMT, INDUSTRIAL, PORTABLE, or SLI)", batch.Specs.BatteryCategory))
	}

	// Tenant-level EU compliance
	if tenant.CompanyName == "" {
		*missing = append(*missing, "tenant.company_name")
	}
	if tenant.Address == "" {
		*missing = append(*missing, "tenant.address")
	}
	if tenant.EUAuthorizedRepresentativeName == "" {
		*missing = append(*missing, "tenant.eu_authorized_representative_name")
	}
	if tenant.EUAuthorizedRepresentativeAddress == "" {
		*missing = append(*missing, "tenant.eu_authorized_representative_address")
	}
	if tenant.EUContactEmail == "" {
		*missing = append(*missing, "tenant.eu_contact_email")
	}

	// Batch-level EU compliance: strictly require calculator result (free-text not accepted)
	if len(batch.CarbonFootprintResult) == 0 {
		*missing = append(*missing, "batch.carbon_footprint_result (use carbon calculator — free-text not accepted)")
	}
	if batch.Specs.MaterialComposition == nil {
		*missing = append(*missing, "batch.specs.material_composition")
	} else {
		mc := batch.Specs.MaterialComposition
		if mc.CobaltPct <= 0 && mc.LithiumPct <= 0 && mc.NickelPct <= 0 && mc.ManganesePct <= 0 && mc.GraphitePct <= 0 && mc.LeadPct <= 0 {
			*missing = append(*missing, "batch.specs.material_composition (non-zero values required)")
		}

		// EU Art 8: Soft warnings for recycled content targets (not strictly blockages yet)
		if mc.CobaltPct > 0 && mc.RecycledCobaltPct <= 0 {
			*errors = append(*errors, "Soft Warning: Recycled Cobalt content missing (EU target: 16% by 2030)")
		}
		if mc.LithiumPct > 0 && mc.RecycledLithiumPct <= 0 {
			*errors = append(*errors, "Soft Warning: Recycled Lithium content missing (EU target: 6% by 2030)")
		}
		if mc.NickelPct > 0 && mc.RecycledNickelPct <= 0 {
			*errors = append(*errors, "Soft Warning: Recycled Nickel content missing (EU target: 6% by 2030)")
		}
		if mc.LeadPct > 0 && mc.RecycledLeadPct <= 0 {
			*errors = append(*errors, "Soft Warning: Recycled Lead content missing (EU target: 85% by 2030)")
		}
	}
	if batch.Specs.HazardousSubstances == nil || batch.Specs.HazardousSubstances.Declaration == "" {
		*missing = append(*missing, "batch.specs.hazardous_substances.declaration")
	}
	// The overall recycled content is now covered per-material above, but keep legacy field check as warning
	if batch.Specs.RecycledContentPct == nil || *batch.Specs.RecycledContentPct <= 0 {
		*errors = append(*errors, "Soft Warning: Overall recycled content percentage not declared")
	}
	if batch.Specs.ExpectedLifetimeCycles == nil || *batch.Specs.ExpectedLifetimeCycles <= 0 {
		*missing = append(*missing, "batch.specs.expected_lifetime_cycles")
	}
	if batch.Specs.WarrantyMonths == nil || *batch.Specs.WarrantyMonths <= 0 {
		*missing = append(*missing, "batch.specs.warranty_months")
	}
}
