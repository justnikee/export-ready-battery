package services

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/serial"
)

// MapRegionPrefix maps a MarketRegion to the 2-letter serial prefix.
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

// BuildBPANPrefix assembles the fixed prefix portion of a V2 serial:
// {REGION}-{MFR3}-{CODE3}-{YEAR}
// Example: IN-TEN-CTN-2026
func BuildBPANPrefix(regionPrefix, mfrCode, productCode string, year int) string {
	return fmt.Sprintf("%s-%s-%s-%d", regionPrefix, mfrCode, productCode, year)
}

// GenerateBPANv2 formats a complete serial from a pre-built prefix and sequence.
// The sequence is zero-padded to 5 digits:
//
//	prefix = "IN-TEN-CTN-2026", seq = 42  →  "IN-TEN-CTN-2026-00042"
func GenerateBPANv2(prefix string, seq int) string {
	return fmt.Sprintf("%s-%05d", prefix, seq)
}

// BPANComponents holds the decoded parts of a V2 serial number.
type BPANComponents struct {
	Region       string
	Manufacturer string
	Chemistry    string // also used as fiber code for textile
	Year         int
	Sequence     int
}

// ParseBPAN parses a V2 serial number of the form:
// {REGION}-{MFR3}-{CODE3}-{YYYY}-{NNNNN}
// Returns nil if the serial does not match the expected format.
func ParseBPAN(serialNumber string) *BPANComponents {
	parts := strings.Split(serialNumber, "-")
	if len(parts) != 5 {
		return nil
	}
	year, err := strconv.Atoi(parts[3])
	if err != nil {
		return nil
	}
	seq, err := strconv.Atoi(parts[4])
	if err != nil {
		return nil
	}
	return &BPANComponents{
		Region:       parts[0],
		Manufacturer: parts[1],
		Chemistry:    parts[2],
		Year:         year,
		Sequence:     seq,
	}
}

// DeriveManufacturerCode is a convenience re-export from the serial package
// so callers that import services do not need to import serial directly.
func DeriveManufacturerCode(companyName string) string {
	return serial.DeriveManufacturerCode(companyName)
}
