package models

// ProductType represents a category of product for Digital Product Passports.
type ProductType string

const (
	ProductTypeBattery     ProductType = "BATTERY"
	ProductTypeTextile     ProductType = "TEXTILE"
	ProductTypeElectronics ProductType = "ELECTRONICS"
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

// MarketRegion represents the target market for a batch
type MarketRegion string

const (
	MarketRegionIndia  MarketRegion = "INDIA"  // Battery Aadhaar (domestic)
	MarketRegionEU     MarketRegion = "EU"     // Battery Passport (export)
	MarketRegionGlobal MarketRegion = "GLOBAL" // Both markets (default)
)

// IsValid checks if the market region is valid
func (m MarketRegion) IsValid() bool {
	switch m {
	case MarketRegionIndia, MarketRegionEU, MarketRegionGlobal:
		return true
	}
	return false
}
