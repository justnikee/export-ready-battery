package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolvePassportTemplateVariant(t *testing.T) {
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantTextileIndia, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionGlobal))
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionGlobal))
}