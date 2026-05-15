package battery_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/compliance/battery"
	"anvayalabs-battery/internal/models"
)

// ============================================================================
// Helpers
// ============================================================================

func validEUBatch() *models.Batch {
	now := time.Now()
	cycles := 1000
	months := 24
	recycled := 15.0
	return &models.Batch{
		ModelName:              "EV-EU-Pack",
		MarketRegion:           models.MarketRegionEU,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		CarbonFootprintResult:  json.RawMessage(`{"total_kg_co2e_per_kwh":42.5}`),
		Specs: models.BatchSpec{
			Chemistry:       "NMC",
			Capacity:        "75kWh",
			BatteryCategory: models.BatteryCategoryEV,
			Certifications: []string{"CE", "IEC 62133-2"},
			MaterialComposition: &models.MaterialComposition{
				CobaltPct:          12.5,
				LithiumPct:         8.0,
				NickelPct:          15.0,
				RecycledCobaltPct:  18.0,
				RecycledLithiumPct: 7.0,
				RecycledNickelPct:  8.0,
			},
			HazardousSubstances: &models.HazardousSubstances{
				LeadPresent:    false,
				MercuryPresent: false,
				CadmiumPresent: false,
				Declaration:    "This product complies with RoHS Directive 2011/65/EU and REACH Regulation (EC) No 1907/2006.",
			},
			ExpectedLifetimeCycles: &cycles,
			WarrantyMonths:         &months,
			RecycledContentPct:     &recycled,
		},
	}
}

func validEUTenant() *models.Tenant {
	return &models.Tenant{
		CompanyName:                       "TataEnergy GmbH",
		Address:                           "123 Batterieplatz, Berlin, Germany",
		EUAuthorizedRepresentativeName:    "EU Rep GmbH",
		EUAuthorizedRepresentativeAddress: "456 Vertreter Str, Frankfurt, Germany",
		EUContactEmail:                    "eu-dpp@tataenergy.de",
	}
}

// ============================================================================
// EUValidator — ValidateBatch tests
// ============================================================================

func TestEUValidator_ValidBatch_Passes(t *testing.T) {
	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(validEUBatch(), validEUTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "expected valid EU batch to pass, missing=%v errors=%v", result.Missing, result.Errors)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestEUValidator_MissingCarbonFootprint(t *testing.T) {
	batch := validEUBatch()
	batch.CarbonFootprintResult = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.carbon_footprint_result")
}

func TestEUValidator_MissingMaterialComposition(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.MaterialComposition = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.material_composition")
}

func TestEUValidator_AllZeroMaterialComposition_Fails(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.MaterialComposition = &models.MaterialComposition{} // all zeros

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.material_composition")
}

func TestEUValidator_MissingHazardousDeclaration(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.HazardousSubstances = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.hazardous_substances.declaration")
}

func TestEUValidator_MissingLifetimeCycles(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.ExpectedLifetimeCycles = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.expected_lifetime_cycles")
}

func TestEUValidator_MissingWarrantyMonths(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.WarrantyMonths = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.warranty_months")
}

func TestEUValidator_MissingTenantEUFields(t *testing.T) {
	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(validEUBatch(), &models.Tenant{})
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "tenant.company_name")
	assert.Contains(t, result.Missing, "tenant.eu_authorized_representative_name")
	assert.Contains(t, result.Missing, "tenant.eu_contact_email")
}

func TestEUValidator_RecycledContent_MissingPerMaterial_ProducesWarnings(t *testing.T) {
	batch := validEUBatch()
	// Remove per-material recycled content but keep raw material percentages.
	batch.Specs.MaterialComposition.RecycledCobaltPct = 0
	batch.Specs.MaterialComposition.RecycledLithiumPct = 0
	batch.Specs.MaterialComposition.RecycledNickelPct = 0

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	// Warnings should not block activation.
	assert.True(t, result.Valid, "recycled content warnings should not block activation, missing=%v errors=%v", result.Missing, result.Errors)
	assert.NotEmpty(t, result.Warnings)
}

func TestEUValidator_OverallRecycledPct_Missing_ProducesWarning(t *testing.T) {
	batch := validEUBatch()
	batch.Specs.RecycledContentPct = nil

	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(batch, validEUTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid, "missing overall recycled_content_pct should only be a warning")
	assert.NotEmpty(t, result.Warnings)
}

func TestEUValidator_Score_DecreasesWithGaps(t *testing.T) {
	v := &battery.EUValidator{}
	perfect, _ := v.ValidateBatch(validEUBatch(), validEUTenant())
	broken, _ := v.ValidateBatch(validEUBatch(), &models.Tenant{})
	assert.Greater(t, perfect.Score, broken.Score)
}

func TestEUValidator_Gaps_HaveCorrectMarket(t *testing.T) {
	v := &battery.EUValidator{}
	result, err := v.ValidateBatch(validEUBatch(), &models.Tenant{})
	require.NoError(t, err)
	for _, g := range result.Gaps {
		assert.Equal(t, "EU", g.Market, "gap %q should be tagged as EU market", g.Field)
	}
}

func TestEUValidator_Gaps_HaveRegulationReferences(t *testing.T) {
	v := &battery.EUValidator{}
	result, _ := v.ValidateBatch(validEUBatch(), &models.Tenant{})
	for _, g := range result.Gaps {
		assert.NotEmpty(t, g.Regulation, "gap %q should have a regulation reference", g.Field)
	}
}

// ============================================================================
// EUValidator — Validate (raw JSON interface)
// ============================================================================

func TestEUValidator_ValidateJSON_ReturnsResult(t *testing.T) {
	v := &battery.EUValidator{}
	result, err := v.Validate([]byte(`{"chemistry":"NMC","capacity":"75kWh"}`))
	require.NoError(t, err)
	assert.NotNil(t, result)
}
