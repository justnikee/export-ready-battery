package models

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/google/uuid"
)

func TestBuildPublicView_TextileCarriesProductSpecificFields(t *testing.T) {
	full := &PassportWithSpecs{
		Passport: &Passport{
			UUID:         uuid.New(),
			SerialNumber: "TX-LOT-001",
			Status:       "ACTIVE",
		},
		BatchName:    "Organic Cotton Lot",
		ModelName:    "Crew Tee",
		ProductType:  ProductTypeTextile,
		MarketRegion: MarketRegionEU,
		Specs: &BatchSpec{
			Manufacturer:    "Anvaya Textile Works",
			CountryOfOrigin: "India",
			MaterialProfile: "100% organic cotton",
			LotSize:         "500 units",
			ProductionStage: "finished_goods",
		},
		Tenant: &Tenant{
			ID:                     uuid.New(),
			CompanyName:            "Anvaya Labs Textile",
			TextileFacilityType:    "Cut and sew",
			TextileSupplyChainTier: "Tier 1",
		},
	}

	view := BuildPublicView(full)
	require.NotNil(t, view)
	require.NotNil(t, view.Specs)
	require.NotNil(t, view.Tenant)
	assert.Equal(t, ProductTypeTextile, view.ProductType)
	assert.Equal(t, "100% organic cotton", view.Specs.MaterialProfile)
	assert.Equal(t, "500 units", view.Specs.LotSize)
	assert.Equal(t, "finished_goods", view.Specs.ProductionStage)
	assert.Equal(t, "Cut and sew", view.Tenant.TextileFacilityType)
	assert.Equal(t, "Tier 1", view.Tenant.TextileSupplyChainTier)
}

func TestBuildPublicView_PrefersImmutableSnapshotPresentation(t *testing.T) {
	snapshot, err := json.Marshal(map[string]any{
		"batch_name": "Snapshot Textile Lot",
		"model_name": "Snapshot Garment",
		"product_type": ProductTypeTextile,
		"template_variant": PassportTemplateVariantTextileStandard,
		"market_region": MarketRegionEU,
		"specs": map[string]any{
			"material_profile": "Snapshot wool blend",
			"lot_size": "120 units",
			"production_stage": "garment_finishing",
			"country_of_origin": "Italy",
		},
		"tenant": map[string]any{
			"tenant_id": uuid.NewString(),
			"company_name": "Snapshot Textile Co",
			"textile_facility_type": "Dye house",
			"textile_supply_chain_tier": "Tier 2",
		},
	})
	require.NoError(t, err)

	full := &PassportWithSpecs{
		Passport: &Passport{
			UUID:          uuid.New(),
			SerialNumber:  "BAT-001",
			Status:        "ACTIVE",
			BatchSnapshot: snapshot,
		},
		BatchName:    "Live Battery Batch",
		ModelName:    "Battery Pack",
		ProductType:  ProductTypeBattery,
		MarketRegion: MarketRegionIndia,
		Specs: &BatchSpec{
			Chemistry: "LFP",
		},
		Tenant: &Tenant{
			ID:          uuid.New(),
			CompanyName: "Live Battery Co",
		},
	}

	view := BuildPublicView(full)
	require.NotNil(t, view)
	require.NotNil(t, view.Specs)
	require.NotNil(t, view.Tenant)
	assert.Equal(t, ProductTypeTextile, view.ProductType)
	assert.Equal(t, PassportTemplateVariantTextileStandard, view.TemplateVariant)
	assert.Equal(t, "Snapshot Textile Lot", view.BatchName)
	assert.Equal(t, "Snapshot wool blend", view.Specs.MaterialProfile)
	assert.Equal(t, "garment_finishing", view.Specs.ProductionStage)
	assert.Equal(t, "Snapshot Textile Co", view.Tenant.CompanyName)
	assert.Equal(t, "Dye house", view.Tenant.TextileFacilityType)
}