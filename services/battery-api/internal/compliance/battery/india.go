// Package battery provides compliance validators for battery Digital Product Passports.
// Each file in this package targets a specific market/regulation combination and
// implements both the compliance.Validator and compliance.BatchValidator interfaces.
package battery

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// Regulatory reference strings used in Gap objects for India market.
const (
	indiaMarket    = "INDIA"
	indiaAIS156Ref = "AIS-156:2022 (MoRTH traction battery type-approval)"
	indiaAIS038Ref = "AIS-038 Rev.2 (battery safety for EVs)"
	indiaPLIRef    = "PLI Scheme Phase II — NITI Aayog DVA ≥50%"
	indiaBWMRef    = "Battery Waste Management Rules 2022 (EPR)"
	indiaBISRef    = "BIS CRS IS 16046 (portable sealed secondary cells/batteries)"
	indiaCustoms   = "Customs Act 1962 / Foreign Trade Policy"
	indiaUN38Ref   = "UN Manual of Tests and Criteria Part III 38.3"
)

// indiaBaseCheckpoints counts the hard rules that always run regardless of
// cell source: 4 tenant credentials + 3 certificate uploads + 4 test dates +
// cell_source itself + PLI claim. AIS-156/038 are added when the batch is
// traction (EV/LMT). Sub-checks conditional on cell_source are added dynamically.
const indiaBaseCheckpoints = 13

// isTractionBattery reports whether MoRTH AIS-156 / AIS-038 apply.
func isTractionBattery(cat models.BatteryCategory) bool {
	return cat == models.BatteryCategoryEV || cat == models.BatteryCategoryLMT
}

// isCertificateUploaded returns true if a PDF path is present and has not
// been rejected. PENDING means uploaded, not registry-verified.
func isCertificateUploaded(path, status string) bool {
	if path == "" {
		return false
	}
	return status == "PENDING" || status == "VERIFIED"
}

// IndiaValidator validates battery batch and tenant data against India's regulatory
// framework: AIS-156, AIS-038, BIS CRS IS 16046, EPR (BWM Rules 2022), PLI Phase II,
// and MoRTH manufacturer registration.
//
// Implements compliance.Validator and compliance.BatchValidator.
type IndiaValidator struct {
	repo repository.RepositoryInterface
}

// NewIndiaValidator returns a ready-to-use IndiaValidator.
func NewIndiaValidator() *IndiaValidator { return &IndiaValidator{} }

// WithRepository injects a repository so the validator can query active
// compliance rules from the database. Falls back to hard-coded defaults
// if the repository is nil or the rules table is empty.
func (v *IndiaValidator) WithRepository(repo repository.RepositoryInterface) *IndiaValidator {
	v.repo = repo
	return v
}

// indiaThresholds holds India-specific regulatory thresholds.
type indiaThresholds struct {
	PLIDVAMin          float64
	RecycledContentMin float64
}

// hardCodedIndiaThresholds returns default thresholds when DB rules are unavailable.
func hardCodedIndiaThresholds() indiaThresholds {
	return indiaThresholds{PLIDVAMin: 50.0, RecycledContentMin: 5.0}
}

// getIndiaThresholds queries the database for active India compliance rules.
func (v *IndiaValidator) getIndiaThresholds(ctx context.Context) indiaThresholds {
	if v.repo == nil {
		return hardCodedIndiaThresholds()
	}
	rules, err := v.repo.GetActiveComplianceRules(ctx, "battery", "india")
	if err != nil {
		slog.Warn("compliance: failed to load India compliance rules, using defaults", "error", err)
		return hardCodedIndiaThresholds()
	}
	if len(rules) == 0 {
		return hardCodedIndiaThresholds()
	}
	t := hardCodedIndiaThresholds()
	for _, r := range rules {
		if r.ThresholdValue == nil {
			continue
		}
		switch r.RuleKey {
		case "pli_dva_min_pct":
			t.PLIDVAMin = *r.ThresholdValue
		case "recycled_content_min_pct":
			t.RecycledContentMin = *r.ThresholdValue
		}
	}
	return t
}

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

// ValidateIndiaTenant checks only tenant-level India compliance credentials
// and certificate uploads. It does NOT require a batch and is safe to call
// during onboarding to preview activation readiness.
// Returns the list of compliance gaps found.
func ValidateIndiaTenant(tenant *models.Tenant) []compliance.Gap {
	return indiaTenantGaps(tenant, "")
}

// indiaTenantGaps applies India producer-duty checks. Category gates BIS
// (portable CRS only) and MoRTH (EV/LMT traction only). Empty category:
// EPR+IEC still required for an India-market tenant; BIS/MoRTH are warnings.
func indiaTenantGaps(tenant *models.Tenant, cat models.BatteryCategory) []compliance.Gap {
	var gaps []compliance.Gap

	add := func(field, msg, regulation, severity string) {
		gaps = append(gaps, compliance.Gap{
			Field:      field,
			Market:     indiaMarket,
			Regulation: regulation,
			Message:    msg,
			Severity:   severity,
		})
	}

	tenant.EnsureBatteryProfile()

	if tenant.BatteryProfile.EPRRegistrationNumber == "" {
		add("tenant.epr_registration_number",
			"EPR registration number is required for batteries placed on the Indian market (BWM Rules 2022). Filing stays on the CPCB portal.",
			indiaBWMRef, "ERROR")
	}
	if tenant.BatteryProfile.IECCode == "" {
		add("tenant.iec_code",
			"Import Export Code (IEC) is required for India market operations", "DGFT IEC Regulations", "ERROR")
	}

	if cat == models.BatteryCategoryPortable {
		if tenant.BatteryProfile.BISRNumber == "" {
			add("tenant.bis_r_number",
				"BIS R-Number (CRS IS 16046) is required for portable sealed secondary cells/batteries. CRS does not schedule EV/industrial/SLI packs.",
				indiaBISRef, "ERROR")
		}
	} else if tenant.BatteryProfile.BISRNumber == "" {
		add("tenant.bis_r_number",
			"BIS CRS IS 16046 applies to portable sealed secondary cells/batteries, not EV/industrial/SLI as a general sale rule.",
			indiaBISRef, "WARNING")
	}

	if isTractionBattery(cat) {
		if tenant.BatteryProfile.MorthManufacturerCode == "" {
			add("tenant.morth_manufacturer_code",
				"MoRTH manufacturer code is required for EV/LMT traction batteries", "MoRTH Notification S.O. 3400(E)", "ERROR")
		}
	} else if tenant.BatteryProfile.MorthManufacturerCode == "" {
		add("tenant.morth_manufacturer_code",
			"MoRTH manufacturer code applies to vehicle traction batteries (EV/LMT), not portable/stationary/SLI.",
			"MoRTH Notification S.O. 3400(E)", "WARNING")
	}

	if tenant.BatteryProfile.EPRRegistrationNumber != "" &&
		!isCertificateUploaded(tenant.BatteryProfile.EPRCertificatePath, tenant.BatteryProfile.EPRStatus) {
		add("tenant.epr_certificate",
			"EPR certificate PDF must be uploaded (not registry-verified by this platform)", indiaBWMRef, "ERROR")
	}
	if cat == models.BatteryCategoryPortable && tenant.BatteryProfile.BISRNumber != "" &&
		!isCertificateUploaded(tenant.BatteryProfile.BISCertificatePath, tenant.BatteryProfile.BISStatus) {
		add("tenant.bis_certificate",
			"BIS certificate PDF must be uploaded (not registry-verified by this platform)", indiaBISRef, "ERROR")
	}
	return gaps
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

	cat := batch.Specs.BatteryCategory
	tenantGaps := indiaTenantGaps(tenant, cat)
	for _, g := range tenantGaps {
		if g.Severity == "ERROR" {
			missing = append(missing, g.Field)
		} else {
			warnings = append(warnings, g.Message)
		}
	}
	gaps = append(gaps, tenantGaps...)

	// ----------------------------------------------------------------
	// PLI certificate — batch-dependent check (kept in ValidateBatch)
	// ----------------------------------------------------------------
	if batch.PLICompliant &&
		!isCertificateUploaded(tenant.BatteryProfile.PLICertificatePath, tenant.BatteryProfile.PLIStatus) {
		addMissing("tenant.pli_certificate",
			"PLI certificate PDF must be uploaded to claim PLI compliance (not registry-verified by this platform)", indiaPLIRef)
	}

	// ----------------------------------------------------------------
	// Test date validation — legal declarations for India market
	// ----------------------------------------------------------------

	if cat == models.BatteryCategoryPortable && batch.Specs.BISCertificateIssueDate == "" {
		addMissing("batch.specs.bis_certificate_issue_date",
			"BIS certificate issue date is required for portable CRS (IS 16046)", indiaBISRef)
	}
	if batch.Specs.UN383TestDate == "" {
		addWarning("batch.specs.un38_3_test_date",
			"UN 38.3 test date is recommended before lithium transport — it is a transport classification, not a digital-passport duty", indiaUN38Ref)
	}
	if batch.Specs.IEC62133TestDate == "" {
		addMissing("batch.specs.iec_62133_test_date",
			"IEC 62133 test date is required for cell safety certification", "IEC 62133")
	}
	if batch.Specs.MSDSIssueDate == "" {
		addMissing("batch.specs.msds_issue_date",
			"MSDS issue date is required for hazardous substance declaration", "MSDS")
	}

	// Validate dates are not in the future
	today := time.Now().Truncate(24 * time.Hour)
	for _, d := range []struct {
		field string
		value string
		label string
		ref   string
	}{
		{"batch.specs.bis_certificate_issue_date", batch.Specs.BISCertificateIssueDate, "BIS certificate issue", indiaBISRef},
		{"batch.specs.un38_3_test_date", batch.Specs.UN383TestDate, "UN38.3 test", indiaUN38Ref},
		{"batch.specs.iec_62133_test_date", batch.Specs.IEC62133TestDate, "IEC 62133 test", "IEC 62133"},
		{"batch.specs.msds_issue_date", batch.Specs.MSDSIssueDate, "MSDS issue", "MSDS"},
	} {
		if d.value != "" {
			parsed, err := time.Parse("2006-01-02", d.value)
			if err != nil {
				addError(d.field, fmt.Sprintf("%s date must be in YYYY-MM-DD format", d.label), d.ref)
			} else if parsed.After(today) {
				addError(d.field, fmt.Sprintf("%s date cannot be in the future", d.label), d.ref)
			}
		}
	}

	// ----------------------------------------------------------------
	// Cell source declaration
	// ----------------------------------------------------------------

	if batch.Specs.CellSource == "" {
		addMissing("batch.specs.cell_source",
			"Cell source (IMPORTED or DOMESTIC) must be declared", indiaAIS156Ref)
	} else if batch.Specs.CellSource == "IMPORTED" {
		if batch.Specs.BillOfEntryNo == "" {
			addMissing("batch.specs.bill_of_entry_no",
				"Bill of Entry number is required for imported cells", indiaCustoms)
		}
		cellOrigin := strings.TrimSpace(batch.Specs.CellCountryOfOrigin)
		if cellOrigin == "" {
			cellOrigin = strings.TrimSpace(batch.Specs.CountryOfOrigin)
		}
		if cellOrigin == "" {
			addMissing("batch.specs.cell_country_of_origin",
				"Cell country of origin is required for imported cells", indiaCustoms)
		}
		if batch.Specs.CustomsDate == "" {
			addMissing("batch.specs.customs_date",
				"Customs clearance date is required for imported cells", indiaCustoms)
		}
	} else if batch.Specs.CellSource == "DOMESTIC" && batch.DomesticValueAdd <= 0 {
		addMissing("batch.domestic_value_add",
			"Domestic value add percentage must be declared for domestically sourced cells", indiaPLIRef)
	}

	// ----------------------------------------------------------------
	// PLI claim validation — DVA must be ≥50% to be eligible
	// ----------------------------------------------------------------

	thresholds := v.getIndiaThresholds(context.Background())

	if batch.PLICompliant && batch.DomesticValueAdd < thresholds.PLIDVAMin {
		addError("batch.domestic_value_add",
			fmt.Sprintf("PLI claim invalid: domestic_value_add %.1f%% is below the mandatory %.0f%% threshold", batch.DomesticValueAdd, thresholds.PLIDVAMin),
			indiaPLIRef)
	}

	// ----------------------------------------------------------------
	// AIS-156 and AIS-038 type-approval certificates
	// MoRTH traction rules apply to EV and LMT only — not stationary /
	// portable / SLI. Empty category: warn, do not block.
	// ----------------------------------------------------------------

	if cat == "" {
		addWarning("batch.specs.battery_category",
			"Set battery category so AIS type-approval can be applied (required for EV/LMT traction packs)", indiaAIS156Ref)
	} else if isTractionBattery(cat) {
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
				"AIS-038 Rev.2 battery safety certificate is mandatory for EV/LMT batteries", indiaAIS038Ref)
		}
	}

	// ----------------------------------------------------------------
	// Soft warnings — recommended but not blocking
	// ----------------------------------------------------------------

	if batch.Specs.BISNumber == "" {
		addWarning("batch.specs.bis_number",
			"BIS batch-level certification number is recommended for IS 16046 compliance traceability", indiaBISRef)
	}
	if batch.Specs.EPRNumber == "" {
		addWarning("batch.specs.epr_number",
			"EPR batch-level registration number is recommended for BWM traceability", indiaBWMRef)
	}

	hsn := strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(batch.Specs.HSNCode), ".", ""), " ", "")
	if hsn == "" {
		addWarning("batch.specs.hsn_code",
			"HSN 8507xxxx is recommended before activation for DGFT/export filings", indiaCustoms)
	} else if len(hsn) != 8 || !strings.HasPrefix(hsn, "8507") {
		addError("batch.specs.hsn_code",
			"HSN Code must be exactly 8 digits starting with 8507 (e.g. 85076000)", indiaCustoms)
	}

	// Compute denominator from only the hard (ERROR-severity) checkpoints that
	// actually ran, so warnings never inflate the denominator or distort the score.
	hardCheckpoints := indiaBaseCheckpoints
	switch batch.Specs.CellSource {
	case "IMPORTED":
		hardCheckpoints += 3 // bill_of_entry_no, country_of_origin, customs_date
	case "DOMESTIC":
		hardCheckpoints += 1 // domestic_value_add
	}
	if isTractionBattery(batch.Specs.BatteryCategory) {
		hardCheckpoints += 2 // AIS-156, AIS-038
	}

	criticalFailures := len(missing) + len(errors)
	score := compliance.ScoreFromCheckpoints(hardCheckpoints, criticalFailures)

	return compliance.Result{
		Valid: criticalFailures == 0,
		Score: score,
		PerMarket: map[string]compliance.MarketScore{
			indiaMarket: {Score: score, Valid: criticalFailures == 0, Gaps: gaps},
		},
		Missing:  missing,
		Errors:   errors,
		Warnings: warnings,
		Gaps:     gaps,
	}, nil
}
