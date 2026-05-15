package textile_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/compliance/textile"
	"anvayalabs-battery/internal/models"
)

func validEUTextileBatch() *models.Batch {
	return &models.Batch{
		ProductType:  models.ProductTypeTextile,
		MarketRegion: models.MarketRegionEU,
		BatchName:    "Cotton Jersey Lot",
		ModelName:    "Jersey Tee",
		Specs: models.BatchSpec{
			Manufacturer:    "Anvaya Textile Works",
			MaterialProfile: "100% organic cotton",
			CountryOfOrigin: "India",
			ProductionStage: "finished_goods",
			LotSize:         "240 units",
			GSM:             180,
			DyeProcess:      "reactive",
			WaterUsageLiters: 150,
			EnergyUsageKWh:   25,
			ExpectedLifetimeWashes: ptrInt(100),
			RecycledContentPct: ptrFloat64(15),
			BiodegradablePct: ptrFloat64(95),
			FiberComposition: &models.FiberComposition{
				CottonPct: 100,
			},
			ChemicalComplianceZDHC: &models.ChemicalComplianceZDHC{
				ZDHCLevel:  "2",
				MRSLTested: true,
			},
			HazardousSubstances: &models.HazardousSubstances{
				Declaration: "No SVHC substances above reporting threshold.",
			},
			SupplyChainProvenance: &models.SupplyChainProvenance{
				DueDiligencePolicy: "https://example.com/policies/textile-dd",
			},
			Certifications: []string{"GOTS", "OEKO-TEX"},
		},
	}
}

func validEUTextileTenant() *models.Tenant {
	t := &models.Tenant{
		CompanyName: "Anvaya Labs Textile",
		Address:     "Surat, Gujarat, India",
	}
	t.EnsureBatteryProfile()
	t.BatteryProfile.EUAuthorizedRepresentativeName = "EU Textile Rep GmbH"
	t.BatteryProfile.EUAuthorizedRepresentativeAddress = "Berlin, Germany"
	return t
}

func TestEUValidator_ValidBatch_Passes(t *testing.T) {
	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(validEUTextileBatch(), validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "expected valid batch to pass, got missing=%v errors=%v", result.Missing, result.Errors)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestEUValidator_MissingCompanyName_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	tenant := validEUTextileTenant()
	tenant.CompanyName = ""

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.company_name")
}

func TestEUValidator_MissingEURepName_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	tenant := validEUTextileTenant()
	tenant.BatteryProfile.EUAuthorizedRepresentativeName = ""

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, tenant)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.eu_authorized_representative_name")
}

func TestEUValidator_MissingFiberComposition_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.FiberComposition = nil

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.fiber_composition")
}

func TestEUValidator_InvalidFiberTotal_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.FiberComposition = &models.FiberComposition{
		CottonPct:    60,
		PolyesterPct: 20,
	}

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors, "Fiber composition must total 100% (currently 80.0%)")
}

func TestEUValidator_MissingGSM_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.GSM = 0

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.gsm")
}

func TestEUValidator_InvalidGSM_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.GSM = 2500

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
}

func TestEUValidator_MissingExpectedLifetime_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.ExpectedLifetimeWashes = ptrInt(0)

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.expected_lifetime_washes")
}

func TestEUValidator_MissingZDHC_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.ChemicalComplianceZDHC = nil

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.chemical_compliance_zdhc")
}

func TestEUValidator_ZDHCLevelNA_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.ChemicalComplianceZDHC.ZDHCLevel = "NA"

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.chemical_compliance_zdhc.zdhc_level")
}

func TestEUValidator_MRSLNotTested_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.ChemicalComplianceZDHC.MRSLTested = false

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.chemical_compliance_zdhc.mrsl_tested")
}

func TestEUValidator_MissingHazardousDeclaration_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.HazardousSubstances = nil

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.hazardous_substances.declaration")
}

func TestEUValidator_MissingWaterUsage_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.WaterUsageLiters = 0

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.water_usage_liters")
}

func TestEUValidator_MissingEnergyUsage_Fails(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.EnergyUsageKWh = 0

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.energy_usage_kwh")
}

func TestEUValidator_MicroplasticWarning(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.FiberComposition = &models.FiberComposition{
		PolyesterPct: 50,
		CottonPct:    50,
	}

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.NotEmpty(t, result.Warnings)
	found := false
	for _, w := range result.Warnings {
		if w == "Synthetic fiber content 50.0% exceeds 20% — microplastic shedding information will be required under future ESPR delegated acts" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected microplastic shedding warning")
}

func TestEUValidator_NoMicroplasticWarningForNaturalFiber(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.FiberComposition = &models.FiberComposition{
		CottonPct: 100,
	}

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	for _, w := range result.Warnings {
		assert.NotContains(t, w, "microplastic")
	}
}

func TestEUValidator_MissingBiodegradableWarning(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.BiodegradablePct = ptrFloat64(0)

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	found := false
	for _, w := range result.Warnings {
		if w == "Biodegradability percentage not declared (recommended for ESPR circularity assessment)" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected biodegradable warning")
}

func TestEUValidator_MissingCertificationsWarning(t *testing.T) {
	batch := validEUTextileBatch()
	batch.Specs.Certifications = []string{}

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	found := false
	for _, w := range result.Warnings {
		if w == "No textile certifications declared; downstream partner packets may be incomplete" {
			found = true
			break
		}
	}
	assert.True(t, found, "expected certifications warning")
}

func TestEUValidator_SyntheticPctHelper(t *testing.T) {
	// Test via validator behavior: synthetic > 20% triggers warning
	batch := validEUTextileBatch()
	batch.Specs.FiberComposition = &models.FiberComposition{
		NylonPct:  15,
		CottonPct: 85,
	}

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validEUTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	// 15% nylon should not trigger warning (threshold is >20%)
	for _, w := range result.Warnings {
		assert.NotContains(t, w, "microplastic")
	}
}
