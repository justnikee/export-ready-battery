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
		return PassportTemplateVariantTextileStandard
	}
	if marketRegion == MarketRegionIndia {
		return PassportTemplateVariantBatteryIndia
	}
	return PassportTemplateVariantBatteryStandard
	}
