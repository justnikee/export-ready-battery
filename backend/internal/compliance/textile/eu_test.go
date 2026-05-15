package textile_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/compliance/textile"
	"anvayalabs-battery/internal/models"
)

func validTextileBatch() *models.Batch {
	return &models.Batch{
		ProductType:   models.ProductTypeTextile,
		MarketRegion:  models.MarketRegionEU,
		BatchName:     "Cotton Jersey Lot",
		ModelName:     "Jersey Tee",
		Specs: models.BatchSpec{
			Manufacturer:    "Anvaya Textile Works",
			MaterialProfile: "100% organic cotton",
			CountryOfOrigin: "India",
			ProductionStage: "finished_goods",
			Certifications:  []string{"GOTS"},
			HazardousSubstances: &models.HazardousSubstances{
				Declaration: "No SVHC substances above reporting threshold.",
			},
			SupplyChainProvenance: &models.SupplyChainProvenance{
				DueDiligencePolicy: "https://example.com/policies/textile-dd",
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

func TestEUValidator_ValidBatch_Passes(t *testing.T) {
	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(validTextileBatch(), validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestEUValidator_MissingHazardousDeclaration_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.Specs.HazardousSubstances = nil

	v := textile.NewEUValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.hazardous_substances.declaration")
}