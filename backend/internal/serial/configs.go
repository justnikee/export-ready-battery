// Package serial provides product-type-aware serial number generation for
// Digital Product Passports. The BPAN V2 (Battery Passport Aadhaar Number)
// format is the canonical serial standard for battery products.
package serial

import "anvayalabs-battery/internal/models"

// Format defines the structure and constraints of a product serial number format.
type Format struct {
	// Name is the human-readable format identifier (e.g. "BPAN-V2").
	Name string

	// RegionCode is the 2-character prefix embedded in every serial number.
	RegionCode string

	// MaxSequence is the highest allowed sequence number (inclusive).
	// Exceeding this causes Generate to return an error.
	MaxSequence int

	// SequencePadding is the zero-padded width of the sequence segment.
	// A padding of 5 and sequence 42 produces "00042".
	SequencePadding int

	// Description is a human-readable description of the format and its
	// regulatory basis.
	Description string
}

type formatKey struct {
	ProductType  models.ProductType
	MarketRegion models.MarketRegion
}

// formatRegistry maps every supported (ProductType, MarketRegion) pair to its Format.
var formatRegistry = map[formatKey]Format{
	// ── Battery ──────────────────────────────────────────────────────────────
	{models.ProductTypeBattery, models.MarketRegionIndia}: {
		Name:            "BPAN-V2",
		RegionCode:      "IN",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "Battery Passport Aadhaar Number — India AIS-156 compliant. " +
			"21-character format: IN-{MFR3}-{CHEM3}-{YYYY}-{NNNNN}. " +
			"e.g. IN-TEN-LFP-2026-00001",
	},
	{models.ProductTypeBattery, models.MarketRegionEU}: {
		Name:            "BPAN-V2",
		RegionCode:      "EU",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "EU Battery Regulation 2023/1542 compliant serial. " +
			"Format: EU-{MFR3}-{CHEM3}-{YYYY}-{NNNNN}. " +
			"e.g. EU-BAT-NMC-2026-00042",
	},
	{models.ProductTypeBattery, models.MarketRegionGlobal}: {
		Name:            "BPAN-V2",
		RegionCode:      "GL",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "Global multi-region battery serial (no single market scope). " +
			"Format: GL-{MFR3}-{CHEM3}-{YYYY}-{NNNNN}. " +
			"e.g. GL-MFG-LFP-2026-00100",
	},

	// ── Textile ──────────────────────────────────────────────────────────────
	{models.ProductTypeTextile, models.MarketRegionIndia}: {
		Name:            "TPN-V1",
		RegionCode:      "IN",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "Textile Passport Number — India traceability compliant. " +
			"21-character format: IN-{MFR3}-{FBR3}-{YYYY}-{NNNNN}. " +
			"e.g. IN-TEN-COT-2026-00001",
	},
	{models.ProductTypeTextile, models.MarketRegionEU}: {
		Name:            "TPN-V1",
		RegionCode:      "EU",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "EU ESPR textile traceability serial. " +
			"Format: EU-{MFR3}-{FBR3}-{YYYY}-{NNNNN}. " +
			"e.g. EU-BAT-COT-2026-00042",
	},
	{models.ProductTypeTextile, models.MarketRegionGlobal}: {
		Name:            "TPN-V1",
		RegionCode:      "GL",
		MaxSequence:     99999,
		SequencePadding: 5,
		Description: "Global multi-region textile serial (no single market scope). " +
			"Format: GL-{MFR3}-{FBR3}-{YYYY}-{NNNNN}. " +
			"e.g. GL-MFG-POL-2026-00100",
	},
}

// GetFormat returns the serial Format for the given product/market combination.
// Falls back to the Global battery format when no exact match exists.
func GetFormat(pt models.ProductType, mr models.MarketRegion) Format {
	if f, ok := formatRegistry[formatKey{pt, mr}]; ok {
		return f
	}
	return formatRegistry[formatKey{models.ProductTypeBattery, models.MarketRegionGlobal}]
}
