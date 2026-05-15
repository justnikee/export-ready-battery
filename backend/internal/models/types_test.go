package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolvePassportTemplateVariant(t *testing.T) {
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionEU))
}