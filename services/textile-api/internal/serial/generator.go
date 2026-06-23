package serial

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"
	"unicode"

	"github.com/anvayalabs/textile-api/internal/models"
)

// Generator is the interface for product-type-aware serial number generation.
type Generator interface {
	// Generate produces a compliant, collision-free serial number.
	// opts.Sequence must be a positive integer sourced from the
	// serial_sequences DB table to guarantee uniqueness per batch.
	Generate(pt models.ProductType, mr models.MarketRegion, opts Options) (string, error)

	// Validate returns true if serial is well-formed for the given product and market.
	Validate(serial string, pt models.ProductType, mr models.MarketRegion) bool
}

// Options carries the context required to build a serial number.
type Options struct {
	// ManufacturerCode is the 3-character company code (e.g. "TEN").
	// Auto-derived from CompanyName when empty.
	ManufacturerCode string

	// CompanyName is used to derive ManufacturerCode when ManufacturerCode is empty.
	CompanyName string

	// Chemistry is the battery chemistry string (e.g. "LFP", "NMC").
	// Normalised to a 3-char BPAN code internally.
	Chemistry string

	// Year is the manufacturing year. Defaults to the current year when 0.
	Year int

	// Sequence is the monotonic per-batch counter sourced from the
	// serial_sequences table. Must be ≥1.
	Sequence int
}

// BPANGenerator implements Generator for structured product serial formats.
//
// The generator is product-type-aware: battery products use chemistry codes
// in the 3rd segment, while textile products use fiber/material codes.
//
//	Format:  {REGION}-{MFR3}-{CODE3}-{YYYY}-{NNNNN}
//	Example: IN-TEN-LFP-2026-00042  (battery, 21 chars)
//	Example: IN-TEN-COT-2026-00001  (textile, 21 chars)
//
// BPANGenerator is safe for concurrent use.
type BPANGenerator struct{}

// NewBPANGenerator returns a ready-to-use BPANGenerator.
func NewBPANGenerator() *BPANGenerator {
	return &BPANGenerator{}
}

// Generate produces a structured serial number for the given product and market.
// Returns an error if no format is registered for the product/market combination,
// the manufacturer code is not exactly 3 characters, or the sequence is out of range.
func (g *BPANGenerator) Generate(pt models.ProductType, mr models.MarketRegion, opts Options) (string, error) {
	format := GetFormat(pt, mr)

	mfr := strings.ToUpper(opts.ManufacturerCode)
	if mfr == "" {
		mfr = DeriveManufacturerCode(opts.CompanyName)
	}
	if len(mfr) != 3 {
		return "", fmt.Errorf("serial: manufacturer code must be exactly 3 characters, got %q (len=%d)", mfr, len(mfr))
	}
	// Ensure only uppercase alphanumeric characters.
	for _, r := range mfr {
		if !unicode.IsUpper(r) && !unicode.IsDigit(r) {
			return "", fmt.Errorf("serial: manufacturer code %q contains invalid character %q", mfr, r)
		}
	}

	code := MapProductCode(pt, opts.Chemistry)

	year := opts.Year
	if year == 0 {
		year = time.Now().Year()
	}

	seq := opts.Sequence
	if seq <= 0 {
		return "", fmt.Errorf("serial: sequence must be a positive integer, got %d", seq)
	}
	if seq > format.MaxSequence {
		return "", fmt.Errorf("serial: sequence %d exceeds maximum %d for format %s", seq, format.MaxSequence, format.Name)
	}

	return fmt.Sprintf("%s-%s-%s-%d-%0*d", format.RegionCode, mfr, code, year, format.SequencePadding, seq), nil
}

// Validate checks whether serial conforms to the registered format for the given
// product and market. Returns false for any structural violation.
func (g *BPANGenerator) Validate(serial string, pt models.ProductType, mr models.MarketRegion) bool {
	parts := strings.Split(serial, "-")
	if len(parts) != 5 {
		return false
	}

	format := GetFormat(pt, mr)
	// Region prefix must match exactly (except Global which accepts any prefix).
	if mr != models.MarketRegionGlobal && parts[0] != format.RegionCode {
		return false
	}

	// Manufacturer code: exactly 3 uppercase alphanumeric characters.
	if len(parts[1]) != 3 {
		return false
	}
	for _, r := range parts[1] {
		if !unicode.IsUpper(r) && !unicode.IsDigit(r) {
			return false
		}
	}

	// Chemistry code: 2–3 uppercase characters.
	if len(parts[2]) < 2 || len(parts[2]) > 3 {
		return false
	}

	// Year: 4-digit numeric, 2020–2099.
	var year int
	if _, err := fmt.Sscanf(parts[3], "%d", &year); err != nil || year < 2020 || year > 2099 {
		return false
	}

	// Sequence: positive integer, zero-padded to SequencePadding digits.
	if len(parts[4]) != format.SequencePadding {
		return false
	}
	var seq int
	if _, err := fmt.Sscanf(parts[4], "%d", &seq); err != nil || seq <= 0 {
		return false
	}

	return true
}

// ============================================================================
// Crypto helpers
// ============================================================================

// GenerateCollisionFreeID produces a cryptographically random 128-bit hex identifier.
// Use this as a fallback for product types that do not yet have a structured
// serial format defined in the format registry.
func GenerateCollisionFreeID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("serial: failed to read random bytes: %w", err)
	}
	return fmt.Sprintf("%x", b), nil
}

// GenerateSecureSequence generates a cryptographically random integer in [1, max].
// Intended for seeding sequence numbers when a monotonic DB counter is unavailable
// (e.g. integration tests or single-use passports).
func GenerateSecureSequence(max int) (int, error) {
	if max <= 0 {
		return 0, fmt.Errorf("serial: max must be positive, got %d", max)
	}
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0, fmt.Errorf("serial: failed to generate random sequence: %w", err)
	}
	return int(n.Int64()) + 1, nil
}

// ============================================================================
// Utility helpers — exported so bpan_service.go can delegate to this package
// in a future refactor without breaking the existing API surface.
// ============================================================================

// DeriveManufacturerCode extracts a 3-char uppercase code from a company name.
// Uses the first 3 Unicode letters. Falls back to "MFG" on an empty input.
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

// MapChemistryCode normalises a chemistry string to a 2–3 char segment.
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
	default:
		if len(upper) >= 3 {
			return upper[:3]
		}
		return upper
	}
}

// MapFiberCode normalises a textile fiber string to a 2–3 char segment.
func MapFiberCode(fiber string) string {
	upper := strings.ToUpper(strings.TrimSpace(fiber))
	switch upper {
	case "COTTON", "COT", "ORGANIC COTTON", "ORGANICCOTTON":
		return "COT"
	case "POLYESTER", "POL", "PET", "RECYCLED POLYESTER":
		return "POL"
	case "WOOL", "WOL", "MERINO", "LAMBSWOOL":
		return "WOL"
	case "SILK", "SIL":
		return "SIL"
	case "LINEN", "LIN", "FLAX":
		return "LIN"
	case "VISCOSE", "VIS", "RAYON", "MODAL", "LYOCELL":
		return "VIS"
	case "NYLON", "NYL", "POLYAMIDE":
		return "NYL"
	case "ACRYLIC", "ACR":
		return "ACR"
	case "HEMP", "HEM":
		return "HEM"
	case "JUTE", "JUT":
		return "JUT"
	case "CASHMERE", "CAS":
		return "CAS"
	case "ALPACA", "ALP":
		return "ALP"
	case "MOHAIR", "MOH":
		return "MOH"
	case "BAMBOO", "BAM":
		return "BAM"
	case "TENCEL", "TEN":
		return "TEN"
	case "RECYCLED COTTON", "RECYCLED-COTTON", "RCOT":
		return "RCO"
	case "RECYCLED WOOL", "RECYCLED-WOOL", "RWOL":
		return "RWO"
	default:
		if len(upper) >= 3 {
			return upper[:3]
		}
		return upper
	}
}

// MapProductCode dispatches to the appropriate normaliser based on product type.
// Battery products use chemistry codes; textile products use fiber codes.
// Unknown product types fall back to the first 3 characters of the input.
func MapProductCode(pt models.ProductType, code string) string {
	switch pt {
	case models.ProductTypeTextile:
		return MapFiberCode(code)
	default:
		upper := strings.ToUpper(strings.TrimSpace(code))
		if len(upper) >= 3 {
			return upper[:3]
		}
		return upper
	}
}
