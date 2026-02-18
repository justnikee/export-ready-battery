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
}

func validateEUActivation(batch *models.Batch, tenant *models.Tenant, missing *[]string, errors *[]string) {
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

	// Batch-level EU compliance: prefer structured calculator result, fall back to freetext
	if len(batch.CarbonFootprintResult) == 0 && batch.Specs.CarbonFootprint == "" {
		*missing = append(*missing, "batch.carbon_footprint_result (use carbon calculator or provide specs.carbon_footprint)")
	}
	if batch.Specs.MaterialComposition == nil {
		*missing = append(*missing, "batch.specs.material_composition")
	} else {
		mc := batch.Specs.MaterialComposition
		if mc.CobaltPct <= 0 && mc.LithiumPct <= 0 && mc.NickelPct <= 0 && mc.ManganesePct <= 0 && mc.GraphitePct <= 0 && mc.LeadPct <= 0 {
			*missing = append(*missing, "batch.specs.material_composition (non-zero values required)")
		}
	}
	if batch.Specs.HazardousSubstances == nil || batch.Specs.HazardousSubstances.Declaration == "" {
		*missing = append(*missing, "batch.specs.hazardous_substances.declaration")
	}
	if batch.Specs.RecycledContentPct == nil {
		*missing = append(*missing, "batch.specs.recycled_content_pct")
	}
	if batch.Specs.ExpectedLifetimeCycles == nil || *batch.Specs.ExpectedLifetimeCycles <= 0 {
		*missing = append(*missing, "batch.specs.expected_lifetime_cycles")
	}
	if batch.Specs.WarrantyMonths == nil || *batch.Specs.WarrantyMonths <= 0 {
		*missing = append(*missing, "batch.specs.warranty_months")
	}
}
