// Package battery provides compliance validators for battery Digital Product Passports.
// Each file in this package targets a specific market/regulation combination and
// implements both the compliance.Validator and compliance.BatchValidator interfaces.
package battery

import (
	"encoding/json"
	"fmt"

	"anvayalabs-battery/internal/compliance"
	"anvayalabs-battery/internal/models"
)

// Regulatory reference strings used in Gap objects for India market.
const (
	indiaMarket    = "INDIA"
	indiaAIS156Ref = "AIS-156:2022 (MoRTH traction battery type-approval)"
	indiaAIS038Ref = "AIS-038 Rev.2 (battery safety for EVs)"
	indiaPLIRef    = "PLI Scheme Phase II — NITI Aayog DVA ≥50%"
	indiaBWMRef    = "Battery Waste Management Rules 2022 (EPR)"
	indiaBISRef    = "BIS CRS IS 16046 (mandatory lithium-ion certification)"
	indiaCustoms   = "Customs Act 1962 / Foreign Trade Policy"
)

// indiaBaseCheckpoints counts the hard rules that always run regardless of
// cell source: 4 tenant credentials + cell_source itself + PLI claim + AIS-156 + AIS-038.
// Sub-checks that are conditional on cell_source are added dynamically.
const indiaBaseCheckpoints = 8

// IndiaValidator validates battery batch and tenant data against India's regulatory
// framework: AIS-156, AIS-038, BIS CRS IS 16046, EPR (BWM Rules 2022), PLI Phase II,
// and MoRTH manufacturer registration.
//
// Implements compliance.Validator and compliance.BatchValidator.
type IndiaValidator struct{}

// NewIndiaValidator returns a ready-to-use IndiaValidator.
func NewIndiaValidator() *IndiaValidator { return &IndiaValidator{} }

// Validate implements compliance.Validator.
// It unmarshals specs into a Batch's Spec field and delegates to ValidateBatch
// with an empty Tenant — tenant-level checks will appear as missing fields.
// Use ValidateBatch for a complete compliance check including tenant credentials.
func (v *IndiaValidator) Validate(specs json.RawMessage) (compliance.Result, error) {
	var batch models.Batch
	if err := json.Unmarshal(specs, &batch.Specs); err != nil {
		return compliance.Result{}, fmt.Errorf("india validator: failed to parse specs: %w", err)
	}
	return v.ValidateBatch(&batch, &models.Tenant{})
}

// ValidateBatch implements compliance.BatchValidator, running all India-specific
// compliance rules against the full structured batch + tenant context.
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

	if tenant.EPRRegistrationNumber == "" {
		addMissing("tenant.epr_registration_number",
			"EPR registration number is mandatory under BWM Rules 2022", indiaBWMRef)
	}
	if tenant.BISRNumber == "" {
		addMissing("tenant.bis_r_number",
			"BIS R-Number (CRS IS 16046) is mandatory for lithium-ion batteries", indiaBISRef)
	}
	if tenant.IECCode == "" {
		addMissing("tenant.iec_code",
			"Import Export Code (IEC) is required for India market operations", "DGFT IEC Regulations")
	}
	if tenant.MorthManufacturerCode == "" {
		addMissing("tenant.morth_manufacturer_code",
			"MoRTH manufacturer code is required for vehicle battery registration", "MoRTH Notification S.O. 3400(E)")
	}

	// ----------------------------------------------------------------
	// Cell source declaration
	// ----------------------------------------------------------------

	if batch.CellSource == "" {
		addMissing("batch.cell_source",
			"Cell source (IMPORTED or DOMESTIC) must be declared", indiaAIS156Ref)
	} else if batch.CellSource == "IMPORTED" {
		if batch.BillOfEntryNo == "" {
			addMissing("batch.bill_of_entry_no",
				"Bill of Entry number is required for imported cells", indiaCustoms)
		}
		if batch.CountryOfOrigin == "" {
			addMissing("batch.country_of_origin",
				"Country of origin is required for imported cells", indiaCustoms)
		}
		if batch.CustomsDate == nil {
			addMissing("batch.customs_date",
				"Customs clearance date is required for imported cells", indiaCustoms)
		}
	} else if batch.CellSource == "DOMESTIC" && batch.DomesticValueAdd <= 0 {
		addMissing("batch.domestic_value_add",
			"Domestic value add percentage must be declared for domestically sourced cells", indiaPLIRef)
	}

	// ----------------------------------------------------------------
	// PLI claim validation — DVA must be ≥50% to be eligible
	// ----------------------------------------------------------------

	if batch.PLICompliant && batch.DomesticValueAdd < 50 {
		addError("batch.domestic_value_add",
			fmt.Sprintf("PLI claim invalid: domestic_value_add %.1f%% is below the mandatory 50%% threshold", batch.DomesticValueAdd),
			indiaPLIRef)
	}

	// ----------------------------------------------------------------
	// AIS-156 and AIS-038 type-approval certificates
	// Both are mandatory under MoRTH for traction/EV batteries.
	// ----------------------------------------------------------------

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
		addMissing("batch.specs.certifications[AIS-156]",
			"AIS-156 safety type-approval certificate is mandatory for traction batteries", indiaAIS156Ref)
	}
	if !hasAIS038 {
		addMissing("batch.specs.certifications[AIS-038]",
			"AIS-038 Rev.2 battery safety certificate is mandatory for EV batteries", indiaAIS038Ref)
	}

	// ----------------------------------------------------------------
	// Soft warnings — recommended but not blocking
	// ----------------------------------------------------------------

	if batch.BISNumber == "" {
		addWarning("batch.bis_number",
			"BIS batch-level certification number is recommended for IS 16046 compliance traceability", indiaBISRef)
	}
	if batch.EPRNumber == "" {
		addWarning("batch.epr_number",
			"EPR batch-level registration number is recommended for BWM traceability", indiaBWMRef)
	}

	// Compute denominator from only the hard (ERROR-severity) checkpoints that
	// actually ran, so warnings never inflate the denominator or distort the score.
	hardCheckpoints := indiaBaseCheckpoints
	switch batch.CellSource {
	case "IMPORTED":
		hardCheckpoints += 3 // bill_of_entry_no, country_of_origin, customs_date
	case "DOMESTIC":
		hardCheckpoints += 1 // domestic_value_add
	}

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
