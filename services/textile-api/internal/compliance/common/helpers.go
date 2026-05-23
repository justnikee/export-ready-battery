// Package common provides shared utilities used across all compliance validators.
// Centralising regex patterns and helpers here prevents duplication and ensures
// a single authoritative source for India/EU regulatory string formats.
package common

import (
	"regexp"
	"strings"
)

// ============================================================================
// INDIA REGULATORY REGEX PATTERNS
// ============================================================================

// EPRNumberRegex matches CPCB EPR registration numbers.
// Format: B-XXXXX/YYYY-YY/CPCB  e.g. B-29016/2024-25/CPCB
var EPRNumberRegex = regexp.MustCompile(`^B-[0-9]{5}/[0-9]{4}-[0-9]{2}/CPCB$`)

// BISRNumberRegex matches BIS R-Numbers (CRS IS 16046 certification).
// Format: R-XXXXXXXX  e.g. R-41001234
var BISRNumberRegex = regexp.MustCompile(`^R-[0-9]{8}$`)

// IECCodeRegex matches Import-Exporter Codes (PAN-based format).
// Format: 5 uppercase letters + 4 digits + 1 uppercase letter  e.g. AAAPL1234C
var IECCodeRegex = regexp.MustCompile(`^[A-Z]{5}[0-9]{4}[A-Z]$`)

// HSNBatteryRegex matches battery-specific HSN codes (Chapter 8507).
// e.g. 85076000 (lithium-ion), 85077000 (lithium-metal)
var HSNBatteryRegex = regexp.MustCompile(`^8507[0-9]{4}$`)

// CountryCodeRegex matches ISO 3166-1 alpha-2 country codes.
// e.g. IN, US, CN, DE
var CountryCodeRegex = regexp.MustCompile(`^[A-Z]{2}$`)

// MoRTHCodeRegex matches MoRTH manufacturer codes (alphanumeric, 4–10 chars).
var MoRTHCodeRegex = regexp.MustCompile(`^[A-Z0-9]{4,10}$`)

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

// IsValidEPRNumber returns true if s matches the CPCB EPR registration format.
func IsValidEPRNumber(s string) bool {
	return EPRNumberRegex.MatchString(strings.ToUpper(strings.TrimSpace(s)))
}

// IsValidBISRNumber returns true if s matches the BIS R-Number format.
func IsValidBISRNumber(s string) bool {
	return BISRNumberRegex.MatchString(strings.ToUpper(strings.TrimSpace(s)))
}

// IsValidIECCode returns true if s matches the PAN-based IEC code format.
func IsValidIECCode(s string) bool {
	return IECCodeRegex.MatchString(strings.ToUpper(strings.TrimSpace(s)))
}

// IsValidHSNBattery returns true if s is a valid battery HSN code (8507XXXX).
// Tolerates dots and spaces as separators (e.g. "8507.60.00").
func IsValidHSNBattery(hsn string) bool {
	hsn = strings.ReplaceAll(strings.TrimSpace(hsn), ".", "")
	hsn = strings.ReplaceAll(hsn, " ", "")
	return HSNBatteryRegex.MatchString(hsn)
}

// IsValidCountryCode returns true if s is a valid ISO alpha-2 country code.
func IsValidCountryCode(s string) bool {
	return CountryCodeRegex.MatchString(strings.ToUpper(strings.TrimSpace(s)))
}

// NormaliseCountryCode uppercases and trims a country code string.
func NormaliseCountryCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

// ============================================================================
// JSON PATH TRAVERSAL
// ============================================================================

// JSONPath traverses a JSON-decoded map using a dot-separated path string.
// Returns the value and true if the path resolves to a value, nil and false otherwise.
//
// Example:
//
//	JSONPath(m, "material_composition.cobalt_pct") → (12.5, true)
func JSONPath(data map[string]any, path string) (any, bool) {
	parts := strings.SplitN(path, ".", 2)
	val, ok := data[parts[0]]
	if !ok {
		return nil, false
	}
	if len(parts) == 1 {
		return val, true
	}
	nested, ok := val.(map[string]any)
	if !ok {
		return nil, false
	}
	return JSONPath(nested, parts[1])
}
