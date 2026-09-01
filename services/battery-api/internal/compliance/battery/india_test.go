package battery_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/battery-api/internal/compliance/battery"
	"github.com/anvayalabs/battery-api/internal/models"
)

// ============================================================================
// Helpers
// ============================================================================

func validIndiaBatch() *models.Batch {
	now := time.Now()
	cycles := 3000
	pastDate := now.AddDate(0, -3, 0).Format("2006-01-02")
	return &models.Batch{
		ModelName:              "EV-Pack-3K",
		MarketRegion:           models.MarketRegionIndia,
		DomesticValueAdd:       60.0,
		PLICompliant:           false,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			Chemistry: "LFP",
			Capacity:  "100Ah",
			Certifications: []string{"AIS-156", "AIS-038", "BIS"},
			ExpectedLifetimeCycles: &cycles,
			CellSource:              "DOMESTIC",
			BISNumber:               "R-41001234",
			EPRNumber:               "EPR/E-Waste/2024/00001",
			BISCertificateIssueDate: pastDate,
			UN383TestDate:           pastDate,
			IEC62133TestDate:        pastDate,
			MSDSIssueDate:           pastDate,
		},
	}
}

func validIndiaTenant() *models.Tenant {
	t := &models.Tenant{
		CompanyName: "Tata Energy",
	}
	t.EnsureBatteryProfile()
	t.BatteryProfile.EPRRegistrationNumber = "B-29016/2024-25/CPCB"
	t.BatteryProfile.BISRNumber = "R-41001234"
	t.BatteryProfile.IECCode = "TATPL1234C"
	t.BatteryProfile.MorthManufacturerCode = "MFGR01"
	// Certificate uploads are required when registration numbers are provided
	t.BatteryProfile.EPRCertificatePath = "https://storage.example.com/epr.pdf"
	t.BatteryProfile.EPRStatus = "VERIFIED"
	t.BatteryProfile.BISCertificatePath = "https://storage.example.com/bis.pdf"
	t.BatteryProfile.BISStatus = "VERIFIED"
	t.BatteryProfile.PLICertificatePath = "https://storage.example.com/pli.pdf"
	t.BatteryProfile.PLIStatus = "VERIFIED"
	return t
}

// ============================================================================
// IndiaValidator — ValidateBatch tests
// ============================================================================

func TestIndiaValidator_ValidBatch_Passes(t *testing.T) {
	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(validIndiaBatch(), validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "expected valid India batch to pass, missing: %v errors: %v", result.Missing, result.Errors)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestIndiaValidator_MissingAISCerts(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BatteryCategory = models.BatteryCategoryLMT
	batch.Specs.Certifications = nil // Remove all certs

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)

	var foundAIS156, foundAIS038 bool
	for _, m := range result.Missing {
		if contains(m, "AIS-156") {
			foundAIS156 = true
		}
		if contains(m, "AIS-038") {
			foundAIS038 = true
		}
	}
	assert.True(t, foundAIS156, "expected AIS-156 in missing fields")
	assert.True(t, foundAIS038, "expected AIS-038 in missing fields")
}

func TestIndiaValidator_PartialAISCerts_OnlyMissingOne(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BatteryCategory = models.BatteryCategoryEV
	batch.Specs.Certifications = []string{"AIS-156"} // only AIS-156, missing AIS-038

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)

	for _, m := range result.Missing {
		assert.False(t, contains(m, "AIS-156"), "AIS-156 is present but reported missing: %s", m)
	}
	found038 := false
	for _, m := range result.Missing {
		if contains(m, "AIS-038") {
			found038 = true
		}
	}
	assert.True(t, found038)
}

func TestIndiaValidator_IndustrialSkipsAIS(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BatteryCategory = models.BatteryCategoryIndustrial
	batch.Specs.Certifications = nil

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "industrial India batch should not require AIS, missing=%v errors=%v", result.Missing, result.Errors)
	for _, m := range result.Missing {
		assert.False(t, contains(m, "AIS-156"), m)
		assert.False(t, contains(m, "AIS-038"), m)
	}
}

func TestIndiaValidator_EmptyCategory_WarnsDoesNotBlockAIS(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BatteryCategory = ""
	batch.Specs.Certifications = nil

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "empty category should warn, not block AIS, missing=%v", result.Missing)
	found := false
	for _, w := range result.Warnings {
		if contains(w, "battery category") || contains(w, "AIS") {
			found = true
		}
	}
	assert.True(t, found, "expected category/AIS warning, got %v", result.Warnings)
}

func TestIndiaValidator_MissingTenantCredentials(t *testing.T) {
	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(validIndiaBatch(), &models.Tenant{}) // empty tenant
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.epr_registration_number")
	assert.Contains(t, result.Missing, "tenant.bis_r_number")
	assert.Contains(t, result.Missing, "tenant.iec_code")
	assert.Contains(t, result.Missing, "tenant.morth_manufacturer_code")
}

func TestIndiaValidator_PLIClaim_InsufficientDVA_Errors(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = true
	batch.DomesticValueAdd = 30.0 // below 50% threshold

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)

	found := false
	for _, e := range result.Errors {
		if contains(e, "PLI") {
			found = true
		}
	}
	assert.True(t, found, "expected PLI error in result.Errors")
}

func TestIndiaValidator_PLIClaim_SufficientDVA_Passes(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = true
	batch.DomesticValueAdd = 55.0

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "PLI claim with DVA=55%% should pass, missing=%v errors=%v", result.Missing, result.Errors)
}

func TestIndiaValidator_ImportedCells_RequiresCustomsFields(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.CellSource = "IMPORTED"
	// BillOfEntryNo, CountryOfOrigin, CustomsDate all empty

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.bill_of_entry_no")
	assert.Contains(t, result.Missing, "batch.specs.cell_country_of_origin")
	assert.Contains(t, result.Missing, "batch.specs.customs_date")
}

func TestIndiaValidator_ImportedCells_AllCustomsFields_Passes(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.CellSource = "IMPORTED"
	batch.Specs.BillOfEntryNo = "BE/2024/001234"
	batch.Specs.CountryOfOrigin = "CN"
	batch.Specs.CustomsDate = time.Now().Format("2006-01-02")
	batch.DomesticValueAdd = 0 // not required for imported

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "imported cells with all customs fields should pass, missing=%v errors=%v", result.Missing, result.Errors)
}

func TestIndiaValidator_DomesticCells_MissingDVA(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.CellSource = "DOMESTIC"
	batch.DomesticValueAdd = 0

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.domestic_value_add")
}

func TestIndiaValidator_Score_DecreasesWithGaps(t *testing.T) {
	v := &battery.IndiaValidator{}
	perfect, _ := v.ValidateBatch(validIndiaBatch(), validIndiaTenant())
	broken, _ := v.ValidateBatch(validIndiaBatch(), &models.Tenant{})
	assert.Greater(t, perfect.Score, broken.Score)
	assert.Less(t, broken.Score, 100.0)
}

func TestIndiaValidator_Gaps_HaveCorrectMarket(t *testing.T) {
	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(validIndiaBatch(), &models.Tenant{})
	require.NoError(t, err)
	for _, g := range result.Gaps {
		assert.Equal(t, "INDIA", g.Market, "gap %q should be tagged as INDIA market", g.Field)
	}
}

func TestIndiaValidator_Warnings_DoNotBlockActivation(t *testing.T) {
	// A batch with all hard requirements met but missing BISNumber + EPRNumber
	// (which are soft warnings) should still be valid.
	batch := validIndiaBatch()
	batch.Specs.BISNumber = ""
	batch.Specs.EPRNumber = ""

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "warnings only should not block activation, errors=%v missing=%v", result.Errors, result.Missing)
	assert.NotEmpty(t, result.Warnings)
}

func TestIndiaValidator_MissingEPRCertificate_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = false // avoid PLI cert check

	tenant := validIndiaTenant()
	tenant.BatteryProfile.EPRCertificatePath = "" // uploaded PDF missing

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.epr_certificate")
}

func TestIndiaValidator_MissingBISCertificate_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = false // avoid PLI cert check

	tenant := validIndiaTenant()
	tenant.BatteryProfile.BISCertificatePath = "" // uploaded PDF missing

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.bis_certificate")
}

func TestIndiaValidator_PLICompliant_MissingPLICertificate_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = true
	batch.DomesticValueAdd = 55.0 // sufficient DVA

	tenant := validIndiaTenant()
	tenant.BatteryProfile.PLICertificatePath = "" // PLI cert missing

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.pli_certificate")
}

func TestIndiaValidator_RejectedCertificate_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.PLICompliant = false

	tenant := validIndiaTenant()
	tenant.BatteryProfile.EPRStatus = "REJECTED"

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.epr_certificate")
}

func TestIndiaValidator_NoRegistrationNumber_NoCertificateRequired(t *testing.T) {
	// If EPR registration number is empty, certificate is not required
	batch := validIndiaBatch()
	batch.PLICompliant = false

	tenant := validIndiaTenant()
	tenant.BatteryProfile.EPRRegistrationNumber = ""
	tenant.BatteryProfile.EPRCertificatePath = ""

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	// Should still be valid (only BIS cert check might fail)
	assert.NotContains(t, result.Missing, "tenant.epr_certificate")
}

func TestIndiaValidator_MissingTestDates_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BISCertificateIssueDate = ""
	batch.Specs.UN383TestDate = ""
	batch.Specs.IEC62133TestDate = ""
	batch.Specs.MSDSIssueDate = ""

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.bis_certificate_issue_date")
	assert.Contains(t, result.Missing, "batch.specs.un38_3_test_date")
	assert.Contains(t, result.Missing, "batch.specs.iec_62133_test_date")
	assert.Contains(t, result.Missing, "batch.specs.msds_issue_date")
}

func TestIndiaValidator_FutureTestDate_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	future := time.Now().AddDate(0, 1, 0).Format("2006-01-02")
	batch.Specs.BISCertificateIssueDate = future

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	found := false
	for _, e := range result.Errors {
		if contains(e, "future") {
			found = true
		}
	}
	assert.True(t, found, "expected future date error")
}

func TestIndiaValidator_InvalidTestDateFormat_BlocksActivation(t *testing.T) {
	batch := validIndiaBatch()
	batch.Specs.BISCertificateIssueDate = "01-03-2024" // wrong format

	v := &battery.IndiaValidator{}
	result, err := v.ValidateBatch(batch, validIndiaTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	found := false
	for _, e := range result.Errors {
		if contains(e, "YYYY-MM-DD") {
			found = true
		}
	}
	assert.True(t, found, "expected format error")
}

// ============================================================================
// IndiaValidator — Validate (raw JSON interface)
// ============================================================================

func TestIndiaValidator_ValidateJSON_ReturnsResult(t *testing.T) {
	v := &battery.IndiaValidator{}
	// Passing empty JSON — tenant fields will all be missing but it should not error.
	result, err := v.Validate([]byte(`{"chemistry":"LFP","capacity":"100Ah"}`))
	require.NoError(t, err)
	// Empty tenant will trigger missing fields — just check no panic and error-free call.
	assert.NotNil(t, result)
}

// ============================================================================
// helpers
// ============================================================================

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || containsStr(s, sub))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
