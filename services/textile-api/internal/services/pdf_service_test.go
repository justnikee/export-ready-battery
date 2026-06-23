package services

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/anvayalabs/textile-api/internal/models"
)

func TestLabelHelpers_TextileContent(t *testing.T) {
	batch := &models.Batch{
		ProductType: models.ProductTypeTextile,
		ModelName:   "Premium Tee",
		Specs: models.BatchSpec{
			MaterialProfile:     "Organic Cotton / Recycled Blend",
			ProductionStage:     "finished_goods",
			LotSize:             "240 units",
			ManufacturerAddress: "Anvaya Textile Mill",
		},
	}
	tenant := &models.Tenant{}
	tenant.EnsureTextileProfile()
	tenant.TextileProfile.FacilityType = "Cut and sew"
	tenant.TextileProfile.SupplyChainTier = "Tier 1"

	assert.Equal(t, "Organic Cotton / Rec..", labelPrimaryText(batch, GetLabelTranslations("en")))
	assert.Equal(t, "finished_goods | 240 units", labelDetailText(batch))
	assert.Equal(t, "Anvaya Tex..", labelSpecText(batch))
	assert.Equal(t, []string{
		"Cut and sew | Tier 1",
	}, labelTextileFooterLines(batch, tenant))
}
