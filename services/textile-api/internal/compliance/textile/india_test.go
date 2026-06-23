package textile_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/textile-api/internal/compliance/textile"
	"github.com/anvayalabs/textile-api/internal/models"
)

func validTextileBatch() *models.Batch {
	return &models.Batch{
		ProductType:  models.ProductTypeTextile,
		MarketRegion: models.MarketRegionIndia,
		BatchName:    "Cotton Jersey Lot",
		ModelName:    "Jersey Tee",
		Specs: models.BatchSpec{
			ManufacturerAddress: "Anvaya Textile Works",
			MaterialProfile:     "100% organic cotton",
			ProductionStage:     "finished_goods",
			LotSize:             "240 units",
			GSM:                 180,
			DyeProcess:          "reactive",
			WaterUsageLiters:    150,
			ExpectedLifetimeWashes: ptrInt(100),
			BiodegradablePct:    ptrFloat64(0),
			FiberComposition: &models.FiberComposition{
				CottonPct: 100,
			},
			LaborCompliance: &models.LaborCompliance{
				SA8000Certified: true,
				AuditScore:      85,
				AuditDate:       "2026-01-15",
			},
		},
	}
}

func validTextileTenant() *models.Tenant {
	return &models.Tenant{
		CompanyName: "Anvaya Labs Textile",
		Address:     "Surat, Gujarat, India",
	}
}

func TestIndiaValidator_ValidBatch_Passes(t *testing.T) {
	batch := validTextileBatch()
	batch.MarketRegion = models.MarketRegionIndia

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "expected valid batch to pass, got missing=%v errors=%v", result.Missing, result.Errors)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestIndiaValidator_MissingCompanyName_Fails(t *testing.T) {
	batch := validTextileBatch()
	tenant := validTextileTenant()
	tenant.CompanyName = ""

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.company_name")
}

func TestIndiaValidator_MissingFiberComposition_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.FiberComposition = nil

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.fiber_composition")
}

func TestIndiaValidator_InvalidFiberTotal_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.FiberComposition = &models.FiberComposition{
		CottonPct:    60,
		PolyesterPct: 20,
	}

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors, "Fiber composition must total 100% (currently 80.0%)")
}

func TestIndiaValidator_MissingGSM_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.GSM = 0

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.gsm")
}

func TestIndiaValidator_InvalidGSM_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.GSM = 2500

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
}

func TestIndiaValidator_MissingProductionStage_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.ProductionStage = ""

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.production_stage")
}

func TestIndiaValidator_MissingExpectedLifetime_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.ExpectedLifetimeWashes = ptrInt(0)

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.expected_lifetime_washes")
}

func TestIndiaValidator_MissingLaborCompliance_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.LaborCompliance = nil

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.labor_compliance")
}

func TestIndiaValidator_LaborComplianceNoCert_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.LaborCompliance = &models.LaborCompliance{
		SA8000Certified:    false,
		BSCIAudited:        false,
		SedexMember:        false,
		FairTradeCertified: false,
	}

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors, "At least one labour compliance certification (SA8000, BSCI, SEDEX, or Fair Trade) is required")
}

func TestIndiaValidator_LowAuditScore_Warning(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.LaborCompliance.AuditScore = 30

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.NotEmpty(t, result.Warnings)
	found := false
	for _, w := range result.Warnings {
		if w == "Labour audit score 30 is below recommended 50% threshold" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected low audit score warning")
}

func TestIndiaValidator_DyedButNoWaterUsage_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.WaterUsageLiters = 0

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.water_usage_liters")
}

func TestIndiaValidator_NoDyeNoWaterRequired_Passes(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.DyeProcess = "none"
	batch.Specs.WaterUsageLiters = 0

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
}

func TestIndiaValidator_WaterUsageExceedsLimit_Warning(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.WaterUsageLiters = 250

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.NotEmpty(t, result.Warnings)
	found := false
	for _, w := range result.Warnings {
		if w == "Water usage 250.0 L/kg exceeds CPCB recommended limit of 200 L/kg for dyeing units" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected water usage exceed warning")
}

func TestIndiaValidator_MissingBISCert_Warning(t *testing.T) {
	batch := validTextileBatch()

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	found := false
	for _, w := range result.Warnings {
		if w == "BIS ISI mark certification is recommended for QCO-mandated textile categories" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected BIS certification warning")
}

func ptrInt(v int) *int {
	return &v
}

func ptrFloat64(v float64) *float64 {
	return &v
}
