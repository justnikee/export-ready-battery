package services

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/models"
)

func TestBuildBatchSnapshot_TextileIncludesProductAndTenantFields(t *testing.T) {
	batch := &models.Batch{
		ID:          uuid.New(),
		BatchName:   "Organic Cotton Lot",
		ModelName:   "Crew Tee",
		ProductType: models.ProductTypeTextile,
		MarketRegion: models.MarketRegionEU,
		Specs: models.BatchSpec{
			MaterialProfile: "100% organic cotton",
			ProductionStage: "finished_goods",
		},
	}
	tenant := &models.Tenant{
		ID:          uuid.New(),
		CompanyName: "Anvaya Labs Textile",
	}
	tenant.EnsureTextileProfile()
	tenant.TextileProfile.FacilityType = "Cut and sew"
	tenant.TextileProfile.SupplyChainTier = "Tier 1"

	raw, err := BuildBatchSnapshot(batch, tenant)
	require.NoError(t, err)

	var snapshot BatchSnapshot
	require.NoError(t, json.Unmarshal(raw, &snapshot))
	assert.Equal(t, models.ProductTypeTextile, snapshot.ProductType)
	assert.Equal(t, models.PassportTemplateVariantTextileStandard, snapshot.TemplateVariant)
	assert.Equal(t, "100% organic cotton", snapshot.Specs.MaterialProfile)
	assert.Equal(t, "Cut and sew", snapshot.Tenant.TextileFacilityType)
	assert.Equal(t, "Tier 1", snapshot.Tenant.TextileSupplyChainTier)
}