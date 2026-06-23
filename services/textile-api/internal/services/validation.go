package services

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

// ============================================================================
// INDIA REGULATORY VALIDATION (STRICT REGEX)
// ============================================================================

// IEC Code (Import-Exporter Code) - PAN-based format
// Format: 5 uppercase letters + 4 digits + 1 uppercase letter = 10 chars
// Example: AAAPL1234C
var IECCodeRegex = regexp.MustCompile(`^[A-Z]{5}[0-9]{4}[A-Z]$`)

// Generic HSN Code (8 digits for export compliance)
// Format: 8 digits covering all textile HS chapters (50–63)
// Example: 52081110 (cotton fabric), 55151190 (polyester blend)
var HSNGenericRegex = regexp.MustCompile(`^\d{8}$`)

// BIS R-Number (Registration number for BIS certification)
// Format: R-XXXXXXXX (R- prefix + 8 digits)
// Example: R-41001234
var BISRNumberRegex = regexp.MustCompile(`^R-[0-9]{8}$`)

// ISO Alpha-2 Country Code
// Format: 2 uppercase letters
// Example: IN, US, CN, JP
var CountryCodeRegex = regexp.MustCompile(`^[A-Z]{2}$`)

// Carbon Footprint (kg CO2e/kWh)
// Format: Numeric value (integer or decimal)
// Example: 50, 42.5, 100.75
var CarbonFootprintRegex = regexp.MustCompile(`^\d+(\.\d+)?$`)

// ValidationService provides strict validation for India regulatory fields
type ValidationService struct{}

// NewValidationService creates a new validation service
func NewValidationService() *ValidationService {
	return &ValidationService{}
}

// ValidationResult contains the result of a validation check
type ValidationResult struct {
	Valid   bool   `json:"valid"`
	Field   string `json:"field"`
	Value   string `json:"value"`
	Message string `json:"message,omitempty"`
}

// ValidateIECCode validates an Import-Exporter Code
func (v *ValidationService) ValidateIECCode(iec string) ValidationResult {
	if iec == "" {
		return ValidationResult{Valid: true, Field: "iec_code", Value: iec} // Optional field
	}

	iec = strings.ToUpper(strings.TrimSpace(iec))

	if len(iec) != 10 {
		return ValidationResult{
			Valid:   false,
			Field:   "iec_code",
			Value:   iec,
			Message: "IEC Code must be exactly 10 characters (e.g., AAAPL1234C)",
		}
	}

	if !IECCodeRegex.MatchString(iec) {
		return ValidationResult{
			Valid:   false,
			Field:   "iec_code",
			Value:   iec,
			Message: "IEC Code must be in PAN format: 5 letters + 4 digits + 1 letter (e.g., AAAPL1234C)",
		}
	}

	return ValidationResult{Valid: true, Field: "iec_code", Value: iec}
}

// ValidateHSNCode validates an HSN Code for textile export compliance
func (v *ValidationService) ValidateHSNCode(hsn string) ValidationResult {
	if hsn == "" {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code is required for India market products",
		}
	}

	hsn = strings.TrimSpace(hsn)

	// Remove any dots or spaces (some people write 5208.11.10)
	hsn = strings.ReplaceAll(hsn, ".", "")
	hsn = strings.ReplaceAll(hsn, " ", "")

	if len(hsn) != 8 {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code must be exactly 8 digits (e.g., 52081110)",
		}
	}

	if !HSNGenericRegex.MatchString(hsn) {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code must be 8 numeric digits (e.g., 52081110 for cotton fabric)",
		}
	}

	return ValidationResult{Valid: true, Field: "hsn_code", Value: hsn}
}

// ValidateEPRNumber validates an EPR Registration Number (optional, soft validation)
func (v *ValidationService) ValidateEPRNumber(epr string) ValidationResult {
	if epr == "" {
		return ValidationResult{Valid: true, Field: "epr_registration_number", Value: epr}
	}

	epr = strings.ToUpper(strings.TrimSpace(epr))

	// Soft validation - just check it starts with B- and has reasonable length
	if !strings.HasPrefix(epr, "B-") {
		return ValidationResult{
			Valid:   false,
			Field:   "epr_registration_number",
			Value:   epr,
			Message: "EPR Number should start with 'B-' (e.g., B-29016/2024-25/CPCB)",
		}
	}

	if len(epr) < 10 || len(epr) > 30 {
		return ValidationResult{
			Valid:   false,
			Field:   "epr_registration_number",
			Value:   epr,
			Message: "EPR Number length should be between 10-30 characters",
		}
	}

	return ValidationResult{Valid: true, Field: "epr_registration_number", Value: epr}
}

// ValidateHSNCodeGeneric validates a generic HSN Code (exactly 8 digits for exports)
// Alias for ValidateHSNCode — both accept any 8-digit HSN for export compliance
func (v *ValidationService) ValidateHSNCodeGeneric(hsn string) ValidationResult {
	if hsn == "" {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code is required for exports",
		}
	}

	hsn = strings.TrimSpace(hsn)

	// Remove any dots or spaces (some people write 8507.60.00)
	hsn = strings.ReplaceAll(hsn, ".", "")
	hsn = strings.ReplaceAll(hsn, " ", "")

	if !HSNGenericRegex.MatchString(hsn) {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code must be exactly 8 digits (e.g., 85076000)",
		}
	}

	return ValidationResult{Valid: true, Field: "hsn_code", Value: hsn}
}

// ValidateCountryCode validates an ISO Alpha-2 country code
func (v *ValidationService) ValidateCountryCode(code string) ValidationResult {
	if code == "" {
		return ValidationResult{Valid: true, Field: "country_code", Value: code} // Optional field
	}

	code = strings.ToUpper(strings.TrimSpace(code))

	if !CountryCodeRegex.MatchString(code) {
		return ValidationResult{
			Valid:   false,
			Field:   "country_code",
			Value:   code,
			Message: "Country code must be 2 uppercase letters (ISO Alpha-2 format, e.g., IN, US, CN)",
		}
	}

	return ValidationResult{Valid: true, Field: "country_code", Value: code}
}

// ValidateCarbonFootprint validates a carbon footprint value (kg CO2e/kWh)
func (v *ValidationService) ValidateCarbonFootprint(value string) ValidationResult {
	if value == "" {
		return ValidationResult{Valid: true, Field: "carbon_footprint", Value: value} // Optional field
	}

	value = strings.TrimSpace(value)

	if !CarbonFootprintRegex.MatchString(value) {
		return ValidationResult{
			Valid:   false,
			Field:   "carbon_footprint",
			Value:   value,
			Message: "Carbon footprint must be a numeric value (kg CO2e/kWh, e.g., 50 or 42.5)",
		}
	}

	return ValidationResult{Valid: true, Field: "carbon_footprint", Value: value}
}

// ValidateBISRNumber validates a BIS R-Number (optional, soft validation)
func (v *ValidationService) ValidateBISRNumber(bis string) ValidationResult {
	if bis == "" {
		return ValidationResult{Valid: true, Field: "bis_r_number", Value: bis}
	}

	bis = strings.ToUpper(strings.TrimSpace(bis))

	if !strings.HasPrefix(bis, "R-") {
		return ValidationResult{
			Valid:   false,
			Field:   "bis_r_number",
			Value:   bis,
			Message: "BIS R-Number should start with 'R-' (e.g., R-41001234)",
		}
	}

	// Full strict validation if it looks like standard format
	// Strict validation: must match R- followed by exactly 8 digits
	if !BISRNumberRegex.MatchString(bis) {
		return ValidationResult{
			Valid:   false,
			Field:   "bis_r_number",
			Value:   bis,
			Message: "BIS R-Number should be R- followed by 8 digits (e.g., R-41001234)",
		}
	}

	return ValidationResult{Valid: true, Field: "bis_r_number", Value: bis}
}

// ValidateBatchCompliance validates all India compliance fields for a batch
func (v *ValidationService) ValidateBatchCompliance(hsn, iec string, isImported bool) ([]ValidationResult, error) {
	var results []ValidationResult
	var hasErrors bool

	// HSN is always required for India market
	hsnResult := v.ValidateHSNCode(hsn)
	results = append(results, hsnResult)
	if !hsnResult.Valid {
		hasErrors = true
	}

	// IEC is required only for imported cells
	if isImported {
		if iec == "" {
			results = append(results, ValidationResult{
				Valid:   false,
				Field:   "iec_code",
				Value:   iec,
				Message: "IEC Code is required for imported goods",
			})
			hasErrors = true
		} else {
			iecResult := v.ValidateIECCode(iec)
			results = append(results, iecResult)
			if !iecResult.Valid {
				hasErrors = true
			}
		}
	}

	if hasErrors {
		return results, errors.New("validation failed: check results for details")
	}

	return results, nil
}

// ============================================================================
// EU ESPR REGULATION VALIDATION
// ============================================================================

// EU Carbon Footprint format: "[VALUE] kg CO2e" or "[VALUE] kg CO2e/kWh"
// Examples: "45.2 kg CO2e", "123.5 kg CO2e/kWh"
var EUCarbonFootprintRegex = regexp.MustCompile(`^\d+(\.\d+)?\s*kg\s*CO2e(/kWh)?$`)

// EUExportRegularComplianceResult contains EU-specific validation results
type EUComplianceResult struct {
	Valid       bool     `json:"valid"`
	Field       string   `json:"field,omitempty"`
	Value       string   `json:"value,omitempty"`
	Message     string   `json:"message,omitempty"`
	Errors      []string `json:"errors,omitempty"`
	Warnings    []string `json:"warnings,omitempty"`
	IsCompliant bool     `json:"is_compliant"`
}

// ValidateCarbonFootprintFormat validates EU Carbon Footprint format
// Format must be: "[VALUE] kg CO2e" or "[VALUE] kg CO2e/kWh"
func (v *ValidationService) ValidateCarbonFootprintFormat(value string) ValidationResult {
	if value == "" {
		return ValidationResult{
			Valid:   false,
			Field:   "carbon_footprint",
			Value:   value,
			Message: "Carbon footprint is required for EU compliance",
		}
	}

	cleanValue := strings.TrimSpace(value)
	if !EUCarbonFootprintRegex.MatchString(cleanValue) {
		return ValidationResult{
			Valid:   false,
			Field:   "carbon_footprint",
			Value:   value,
			Message: "Carbon footprint must be in format '[VALUE] kg CO2e' or '[VALUE] kg CO2e/kWh'",
		}
	}

	return ValidationResult{
		Valid:   true,
		Field:   "carbon_footprint",
		Value:   value,
		Message: "Valid EU carbon footprint format",
	}
}

// ValidateEUCompliance performs comprehensive EU ESPR validation
// Checks: carbon_footprint (required), recycled_content, supply_chain_due_diligence, carbon_declaration
func (v *ValidationService) ValidateEUCompliance(carbonFootprint string, recycledContent *float64, hasSupplyChainDD bool, hasCarbonDeclaration bool) EUComplianceResult {
	var errs []string
	var warnings []string

	// 1. Carbon Footprint - MANDATORY since July 2024
	cfResult := v.ValidateCarbonFootprintFormat(carbonFootprint)
	if !cfResult.Valid {
		errs = append(errs, cfResult.Message)
	}

	// 2. Recycled Content (overall) - Required since August 2028 but encouraged now
	if recycledContent == nil {
		warnings = append(warnings, "Recycled content percentage not provided. Required by Aug 2028 for EU markets.")
	} else if *recycledContent < 0 || *recycledContent > 100 {
		errs = append(errs, "Recycled content must be between 0% and 100%")
	} else if *recycledContent < 16 {
		// EU targets: 16% cobalt, 6% lithium, 6% nickel by 2030
		warnings = append(warnings, fmt.Sprintf("Recycled content (%.1f%%) is below EU 2030 target (16%% minimum for cobalt)", *recycledContent))
	}

	// 3. Supply Chain Due Diligence - MANDATORY since August 2025
	if !hasSupplyChainDD {
		warnings = append(warnings, "Supply chain due diligence documentation recommended for EU export. Required from Aug 2025.")
	}

	// 4. Carbon Declaration - MANDATORY
	if !hasCarbonDeclaration {
		errs = append(errs, "Carbon footprint declaration is mandatory for EU product passports")
	}

	result := EUComplianceResult{
		Valid:       len(errs) == 0,
		Errors:      errs,
		Warnings:    warnings,
		IsCompliant: len(errs) == 0,
	}

	if len(errs) > 0 {
		result.Message = fmt.Sprintf("EU compliance check failed: %d error(s)", len(errs))
	} else if len(warnings) > 0 {
		result.Message = fmt.Sprintf("EU compliant with %d warning(s)", len(warnings))
	} else {
		result.Message = "Fully EU ESPR compliant"
	}

	return result
}

// ValidateFiberType validates that a textile fiber type is correctly formatted
func (v *ValidationService) ValidateFiberType(fiberType string) ValidationResult {
	if fiberType == "" {
		return ValidationResult{
			Valid:   false,
			Field:   "fiber_type",
			Value:   fiberType,
			Message: "Fiber type is required",
		}
	}

	// Common accepted fiber types (ESPR / ZDHC standard labels)
	validFibers := map[string]bool{
		"COTTON":    true,
		"POLYESTER": true,
		"NYLON":     true,
		"WOOL":      true,
		"SILK":      true,
		"LINEN":     true,
		"VISCOSE":   true,
		"MODAL":     true,
		"LYOCELL":   true,
		"ACRYLIC":   true,
		"HEMP":      true,
		"BAMBOO":    true,
	}

	upper := strings.ToUpper(strings.TrimSpace(fiberType))
	if !validFibers[upper] {
		return ValidationResult{
			Valid:   true, // Still valid, just informational
			Field:   "fiber_type",
			Value:   fiberType,
			Message: fmt.Sprintf("Non-standard fiber type '%s'. Common values: COTTON, POLYESTER, NYLON, WOOL, SILK, LINEN, VISCOSE, LYOCELL", fiberType),
		}
	}

	return ValidationResult{
		Valid:   true,
		Field:   "fiber_type",
		Value:   fiberType,
		Message: "Valid fiber type",
	}
}

// ============================================================================
// INDIA REGULATORY COMPLIANCE (BIS, EPR, PLI)
// ============================================================================

// IndiaComplianceResult contains India-specific validation results
type IndiaComplianceResult struct {
	Valid       bool     `json:"valid"`
	Errors      []string `json:"errors,omitempty"`
	Warnings    []string `json:"warnings,omitempty"`
	Message     string   `json:"message"`
	IsCompliant bool     `json:"is_compliant"`
}

// ValidateIndiaCompliance performs comprehensive India regulatory validation
// Requirements:
// - BIS R-Number: MANDATORY for textile products with BIS certification (IS 17243)
// - EPR Number: Required for extended producer responsibility compliance
// - HSN Code: Required for exports (e.g. 52081110 for cotton fabric)
// - IEC Code: Required for importers
func (v *ValidationService) ValidateIndiaCompliance(
	bisNumber string,
	eprNumber string,
	hsnCode string,
	iecCode string,
) IndiaComplianceResult {
	var errs []string
	var warnings []string

	// 1. BIS R-Number - MANDATORY for India-market textile products
	if bisNumber == "" {
		errs = append(errs, "BIS R-Number is mandatory for India-market textile products (IS 17243)")
	} else {
		bisResult := v.ValidateBISRNumber(bisNumber)
		if !bisResult.Valid {
			errs = append(errs, bisResult.Message)
		}
	}

	// 2. EPR Registration - Required for extended producer responsibility
	if eprNumber == "" {
		warnings = append(warnings, "EPR Registration Number not provided. Required for extended producer responsibility compliance in India.")
	} else {
		eprResult := v.ValidateEPRNumber(eprNumber)
		if !eprResult.Valid {
			warnings = append(warnings, eprResult.Message)
		}
	}

	// 3. HSN Code - Required for exports
	if hsnCode == "" {
		warnings = append(warnings, "HSN Code not provided. Required for GST compliance and exports.")
	} else {
		hsnResult := v.ValidateHSNCode(hsnCode)
		if !hsnResult.Valid {
			errs = append(errs, hsnResult.Message)
		}
	}

	// 4. IEC Code - Required for importers
	if iecCode == "" {
		warnings = append(warnings, "IEC Code not provided. Required for imports into India.")
	} else {
		iecResult := v.ValidateIECCode(iecCode)
		if !iecResult.Valid {
			errs = append(errs, iecResult.Message)
		}
	}

	result := IndiaComplianceResult{
		Valid:       len(errs) == 0,
		Errors:      errs,
		Warnings:    warnings,
		IsCompliant: len(errs) == 0,
	}

	if len(errs) > 0 {
		result.Message = fmt.Sprintf("India compliance check failed: %d error(s)", len(errs))
	} else if len(warnings) > 0 {
		result.Message = fmt.Sprintf("India compliant with %d warning(s)", len(warnings))
	} else {
		result.Message = "Fully India regulatory compliant"
	}

	return result
}
