package services

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"anvayalabs-battery/internal/models"
)

func TestLabelHelpers_TextileContent(t *testing.T) {
	batch := &models.Batch{
		ProductType: models.ProductTypeTextile,
		ModelName:   "Premium Tee",
		Specs: models.BatchSpec{
			MaterialProfile: "Organic Cotton / Recycled Blend",
			ProductionStage: "finished_goods",
			LotSize:         "240 units",
			Manufacturer:    "Anvaya Textile Mill",
			CountryOfOrigin: "India",
			Certifications:  []string{"GOTS", "OEKO-TEX"},
		},
	}
	tenant := &models.Tenant{
		TextileFacilityType:    "Cut and sew",
		TextileSupplyChainTier: "Tier 1",
	}

	assert.Equal(t, "Organic Cotton / Rec..", labelPrimaryText(batch, GetLabelTranslations("en")))
	assert.Equal(t, "finished_goods | 240 units", labelDetailText(batch, nil, nil))
	assert.Equal(t, "Anvaya Textil.. | India", labelSpecText(batch))
	assert.Equal(t, []string{
		"Cut and sew | Tier 1",
		"CERT: GOTS, OEKO-TEX",
		"Origin: India",
	}, labelTextileFooterLines(batch, tenant))
}

func TestLabelHelpers_BatteryFallbackContent(t *testing.T) {
	batch := &models.Batch{
		ProductType: models.ProductTypeBattery,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			NominalVoltage: "48V",
			Capacity:       "100Ah",
			Manufacturer:   "Anvaya Labs Battery Systems",
		},
	}

	assert.Equal(t, "LFP", labelPrimaryText(batch, GetLabelTranslations("en")))
	assert.Equal(t, "48V | 100Ah | Anvaya Labs B..", labelSpecText(batch))
}