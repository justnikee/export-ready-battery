package services

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/anvayalabs/battery-api/internal/models"
)

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
