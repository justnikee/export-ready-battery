package services

import (
	"fmt"
	"strconv"
	"strings"
	"unicode"

	"github.com/anvayalabs/textile-api/internal/models"
)

// ============================================================================
// BPAN V2 SERVICE — Region-aware serial number generation
// Format: {REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}
// ============================================================================

// BPANService provides BPAN V2 serial number generation, parsing, and validation.
type BPANService struct{}

// NewBPANService creates a new BPANService.
func NewBPANService() *BPANService {
	return &BPANService{}
}

// GenerateBPANv2 formats a BPAN V2 serial number from a prefix and sequence.
// prefix is e.g. "IN-TEN-LFP-2026", sequence is the counter (1, 2, ...).
func GenerateBPANv2(prefix string, sequence int) string {
	return fmt.Sprintf("%s-%05d", prefix, sequence)
}

// BuildBPANPrefix constructs the prefix portion: {REGION}-{MFR}-{CHEM}-{YYYY}.
func BuildBPANPrefix(region, manufacturerCode, chemistryCode string, year int) string {
	return fmt.Sprintf("%s-%s-%s-%d",
		strings.ToUpper(region),
		strings.ToUpper(manufacturerCode),
		strings.ToUpper(chemistryCode),
		year,
	)
}

// ParseBPAN parses a BPAN serial (V1 or V2) into its components.
// Returns nil if the serial doesn't match BPAN format.
func ParseBPAN(serial string) *models.BPANComponents {
	parts := strings.Split(serial, "-")
	if len(parts) != 5 {
		return nil
	}

	region := parts[0]
	manufacturer := parts[1]
	chemistry := parts[2]

	year, err := strconv.Atoi(parts[3])
	if err != nil {
		return nil
	}

	seq, err := strconv.Atoi(parts[4])
	if err != nil {
		return nil
	}

	// Default to BPANv2 for all regions
	version := models.BPANv2

	return &models.BPANComponents{
		Region:       region,
		Manufacturer: manufacturer,
		Chemistry:    chemistry,
		Year:         year,
		Sequence:     seq,
		Version:      version,
	}
}

// ValidateBPANv2 validates a serial number follows BPAN V2 format for the given market region.
// If expectedRegion is empty, any valid BPAN is accepted.
func ValidateBPANv2(serial string, expectedRegion string) bool {
	comp := ParseBPAN(serial)
	if comp == nil {
		return false
	}

	// Validate region segment length (2 chars)
	if len(comp.Region) != 2 {
		return false
	}

	// Validate manufacturer code (3 chars, uppercase alpha)
	if len(comp.Manufacturer) != 3 {
		return false
	}
	for _, r := range comp.Manufacturer {
		if !unicode.IsUpper(r) && !unicode.IsDigit(r) {
			return false
		}
	}

	// Validate chemistry code (2-3 chars)
	if len(comp.Chemistry) < 2 || len(comp.Chemistry) > 3 {
		return false
	}

	// Validate year (reasonable range)
	if comp.Year < 2020 || comp.Year > 2099 {
		return false
	}

	// Validate sequence (positive)
	if comp.Sequence <= 0 {
		return false
	}

	// If an expected region is provided, enforce it
	if expectedRegion != "" {
		expectedPrefix := MapRegionPrefix(models.MarketRegion(expectedRegion))
		if comp.Region != expectedPrefix {
			return false
		}
	}

	return true
}

// DeriveManufacturerCode generates a 3-char uppercase code from a company name.
// Uses first 3 uppercase letters from the name. Falls back to "MFG" if insufficient.
func DeriveManufacturerCode(companyName string) string {
	var code []rune
	for _, r := range companyName {
		if unicode.IsLetter(r) {
			code = append(code, unicode.ToUpper(r))
			if len(code) == 3 {
				break
			}
		}
	}

	switch len(code) {
	case 0:
		return "MFG"
	case 1:
		return string(code) + "XX"
	case 2:
		return string(code) + "X"
	default:
		return string(code)
	}
}

// MapRegionPrefix maps a MarketRegion enum to its 2-char BPAN prefix.
func MapRegionPrefix(region models.MarketRegion) string {
	switch region {
	case models.MarketRegionIndia:
		return "IN"
	case models.MarketRegionEU:
		return "EU"
	default:
		return "GL"
	}
}

// MapChemistryCode normalizes a chemistry string to a 3-char BPAN code.
func MapChemistryCode(chemistry string) string {
	upper := strings.ToUpper(strings.TrimSpace(chemistry))
	switch upper {
	case "LFP", "LIFEPO4":
		return "LFP"
	case "NMC", "NMC811", "NMC622", "NMC532":
		return "NMC"
	case "NCA":
		return "NCA"
	case "LCO":
		return "LCO"
	case "LTO":
		return "LTO"
	case "LMO":
		return "LMO"
	case "SODIUM", "NA-ION", "NAION":
		return "NAI"
	// Li-ion and common freetext variants — map to LIO (alphanumeric-safe)
	case "LI-ION", "LIION", "LI_ION", "LION", "LITHIUM-ION", "LITHIUMION", "LI":
		return "LIO"
	default:
		// Strip non-alphanumeric chars first to avoid hyphens/spaces in the code.
		var alnum []rune
		for _, r := range upper {
			if unicode.IsLetter(r) || unicode.IsDigit(r) {
				alnum = append(alnum, r)
			}
		}
		cleaned := string(alnum)
		if len(cleaned) >= 3 {
			return cleaned[:3]
		}
		if len(cleaned) >= 2 {
			return cleaned
		}
		return "UNK"
	}
}
