package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolvePassportTemplateVariant(t *testing.T) {
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionEU))
	assert.Equal(t, PassportTemplateVariantTextileIndia, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionIndia))
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariant(ProductTypeTextile, MarketRegionGlobal))
}

func TestResolvePassportTemplateVariantForBatch(t *testing.T) {
	// nil batch → textile standard fallback
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariantForBatch(nil))

	// Textile + India (regulatory priority over certifications)
	assert.Equal(t, PassportTemplateVariantTextileIndia, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionIndia,
		Specs: BatchSpec{},
	}))

	// Textile + EU + no certs → standard (certification checks disabled in v1)
	assert.Equal(t, PassportTemplateVariantTextileStandard, ResolvePassportTemplateVariantForBatch(&Batch{
		ProductType: ProductTypeTextile, MarketRegion: MarketRegionEU,
		Specs: BatchSpec{},
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
