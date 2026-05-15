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

	// Textile + India (regulatory priority over certifications)
	assert.Equal(t, PassportTemplateVariantTextileIndia, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionIndia,
		Specs: BatchSpec{Certifications: []string{"GOTS"}},
	}))

	// Textile + EU + GOTS → organic
	assert.Equal(t, PassportTemplateVariantTextileOrganic, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{Certifications: []string{"GOTS", "GRS"}},
	}))

	// Textile + EU + OEKO-TEX → organic
	assert.Equal(t, PassportTemplateVariantTextileOrganic, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionGlobal,
		Specs: BatchSpec{Certifications: []string{"OEKO-TEX Standard 100"}},
	}))

	// Textile + EU + GRS → recycled
	rc := 60.0
	assert.Equal(t, PassportTemplateVariantTextileRecycled, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{Certifications: []string{"GRS"}},
	}))

	// Textile + EU + high recycled content → recycled
	assert.Equal(t, PassportTemplateVariantTextileRecycled, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{RecycledContentPct: &rc},
	}))

	// Textile + EU + low recycled content → standard
	rcLow := 10.0
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{RecycledContentPct: &rcLow},
	}))

	// Textile + EU + no certs → standard
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{},
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