package models

// ProductType represents a category of product for Digital Product Passports.
type ProductType string

const (
	ProductTypeBattery     ProductType = "BATTERY"
	ProductTypeTextile     ProductType = "TEXTILE"
	ProductTypeElectronics ProductType = "ELECTRONICS"
)

const (
	PassportTemplateVariantBatteryIndia    = "BATTERY_INDIA"
	PassportTemplateVariantBatteryStandard = "BATTERY_STANDARD"
	PassportTemplateVariantTextileStandard = "TEXTILE_STANDARD"
	PassportTemplateVariantTextileIndia    = "TEXTILE_INDIA"
	PassportTemplateVariantTextileOrganic  = "TEXTILE_ORGANIC"  // GOTS / OEKO-TEX certified
	PassportTemplateVariantTextileRecycled = "TEXTILE_RECYCLED" // GRS certified or high recycled content
)

// IsValid checks if the product type is a recognized value.
func (p ProductType) IsValid() bool {
	switch p {
	case ProductTypeBattery, ProductTypeTextile, ProductTypeElectronics:
		return true
	}
	return false
}

// DefaultProductType returns the default product type for backwards compatibility.
func DefaultProductType() ProductType {
	return ProductTypeBattery
}

// DefaultPassportTemplateVariant returns the default public passport presentation
// variant for a given product type.
func DefaultPassportTemplateVariant(productType ProductType) string {
	return ResolvePassportTemplateVariant(productType, "")
}

// ResolvePassportTemplateVariant returns the public passport presentation
// variant for a given product/market combination.
func ResolvePassportTemplateVariant(productType ProductType, marketRegion MarketRegion) string {
	if productType == ProductTypeTextile {
		if marketRegion == MarketRegionIndia {
			return PassportTemplateVariantTextileIndia
		}
		return PassportTemplateVariantTextileStandard
	}
	if marketRegion == MarketRegionIndia {
		return PassportTemplateVariantBatteryIndia
	}
	return PassportTemplateVariantBatteryStandard
}

// ResolvePassportTemplateVariantForBatch returns the public passport presentation
// variant for a given batch, considering batch-specific data such as
// certifications, recycled content, and market region.
//
// Resolution order for textiles:
//   1. India market → TEXTILE_INDIA (regulatory priority)
//   2. GOTS / OEKO-TEX certified → TEXTILE_ORGANIC
//   3. GRS certified or recycled content > 50% → TEXTILE_RECYCLED
//   4. Default → TEXTILE_STANDARD
//
// For batteries, the existing product/market logic is preserved.
func ResolvePassportTemplateVariantForBatch(batch *Batch) string {
	if batch == nil {
		return PassportTemplateVariantBatteryStandard
	}
	if batch.ProductType == ProductTypeTextile {
		if batch.MarketRegion == MarketRegionIndia {
			return PassportTemplateVariantTextileIndia
		}
		s := batch.Specs
		if hasCertification(s.Certifications, "GOTS") || hasCertification(s.Certifications, "OEKO-TEX") {
			return PassportTemplateVariantTextileOrganic
		}
		if hasCertification(s.Certifications, "GRS") || (s.RecycledContentPct != nil && *s.RecycledContentPct > 50) {
			return PassportTemplateVariantTextileRecycled
		}
		return PassportTemplateVariantTextileStandard
	}
	if batch.MarketRegion == MarketRegionIndia {
		return PassportTemplateVariantBatteryIndia
	}
	return PassportTemplateVariantBatteryStandard
}

// hasCertification checks if a certification list contains the given cert
// (case-insensitive substring match).
func hasCertification(certs []string, target string) bool {
	for _, c := range certs {
		if containsIgnoreCase(c, target) {
			return true
		}
	}
	return false
}

func containsIgnoreCase(s, substr string) bool {
	if len(s) < len(substr) {
		return false
	}
	// Simple case-insensitive check for ASCII strings.
	// sufficient for certification acronyms like GOTS, GRS, OEKO-TEX.
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if toLower(s[i+j]) != toLower(substr[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func toLower(b byte) byte {
	if b >= 'A' && b <= 'Z' {
		return b + ('a' - 'A')
	}
	return b
}
