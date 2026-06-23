package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolvePassportTemplateVariant(t *testing.T) {
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeBattery, MarketRegionGlobal))
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariant(ProductTypeElectronics, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeElectronics, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariant(ProductTypeElectronics, MarketRegionGlobal))
}

func TestResolvePassportTemplateVariantForBatch(t *testing.T) {
	// nil batch → battery standard fallback
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariantForBatch(nil))

	// Battery + India
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeBattery, MarketRegion: MarketRegionIndia,
	}))

	// Battery + EU
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeBattery, MarketRegion: MarketRegionEU,
	}))

	// Electronics + India
	assert.Equal(t, PassportTemplateVariantBatteryIndia, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeElectronics, MarketRegion: MarketRegionIndia,
	}))

	// Electronics + EU
	assert.Equal(t, PassportTemplateVariantBatteryStandard, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeElectronics, MarketRegion: MarketRegionEU,
	}))
}

func TestHasCertification(t *testing.T) {
	assert.True(t, hasCertification([]string{"GOTS", "GRS"}, "GOTS"))
	assert.True(t, hasCertification([]string{"OEKO-TEX Standard 100"}, "OEKO-TEX"))
	assert.True(t, hasCertification([]string{"gots"}, "GOTS")) // case-insensitive
	assert.False(t, hasCertification([]string{"GRS"}, "GOTS"))
	assert.False(t, hasCertification([]string{}, "GOTS"))
	assert.False(t, hasCertification(nil, "GOTS"))
}
