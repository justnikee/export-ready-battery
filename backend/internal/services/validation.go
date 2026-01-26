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

// HSN Code for Batteries (Chapter 85: Electrical machinery)
// Format: 8507 + 4 digits = 8 digits total
// 8507 = Electric accumulators (batteries)
// Example: 85076000 (lithium-ion)
var HSNBatteryRegex = regexp.MustCompile(`^8507[0-9]{4}$`)

// EPR Registration Number (CPCB format)
// Format varies but typically: B-XXXXX/YYYY-YY/CPCB
// Example: B-29016/2024-25/CPCB
var EPRNumberRegex = regexp.MustCompile(`^B-[0-9]{5}/[0-9]{4}-[0-9]{2}/CPCB$`)

// BIS R-Number (Registration number)
// Format: R-XXXXXXXX (R- prefix + 8 digits)
// Example: R-41001234
var BISRNumberRegex = regexp.MustCompile(`^R-[0-9]{8}$`)

// Generic HSN Code (8 digits for export compliance)
// Format: 8 digits (not limited to battery-specific codes)
// Example: 85076000, 84159000, etc.
var HSNGenericRegex = regexp.MustCompile(`^\d{8}$`)

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

// ValidateHSNCode validates an HSN Code for batteries
func (v *ValidationService) ValidateHSNCode(hsn string) ValidationResult {
	if hsn == "" {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code is required for battery products",
		}
	}

	hsn = strings.TrimSpace(hsn)

	// Remove any dots or spaces (some people write 8507.60.00)
	hsn = strings.ReplaceAll(hsn, ".", "")
	hsn = strings.ReplaceAll(hsn, " ", "")

	if len(hsn) != 8 {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code must be exactly 8 digits (e.g., 85076000)",
		}
	}

	if !HSNBatteryRegex.MatchString(hsn) {
		return ValidationResult{
			Valid:   false,
			Field:   "hsn_code",
			Value:   hsn,
			Message: "HSN Code for batteries must start with 8507 (e.g., 85076000 for lithium-ion)",
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
// Unlike ValidateHSNCode which enforces battery-specific codes (8507XXXX),
// this allows any 8-digit HSN code for general export compliance
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
	cleaned := strings.TrimPrefix(bis, "R-")
	if len(cleaned) == 8 && !BISRNumberRegex.MatchString(bis) {
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
				Message: "IEC Code is required for imported battery cells",
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

// DVA Source constants
const (
	DVASourceEstimated = "ESTIMATED"
	DVASourceAudited   = "AUDITED"
)

// ValidateDVASource validates the dva_source field
func (v *ValidationService) ValidateDVASource(source string) ValidationResult {
	if source == "" || source == DVASourceEstimated {
		return ValidationResult{Valid: true, Field: "dva_source", Value: source}
	}
	if source == DVASourceAudited {
		return ValidationResult{Valid: true, Field: "dva_source", Value: source}
	}
	return ValidationResult{
		Valid:   false,
		Field:   "dva_source",
		Value:   source,
		Message: "DVA Source must be 'ESTIMATED' or 'AUDITED'",
	}
}

// ValidatePLICompliance validates PLI eligibility based on DVA source
// For AUDITED source, requires auditedDVA >= 50%
// For ESTIMATED source, logs warning but allows submission
func (v *ValidationService) ValidatePLICompliance(dvaSource string, auditedDVA *float64, estimatedDVA float64, pliCompliant bool) error {
	if !pliCompliant {
		return nil // No validation needed if not claiming PLI
	}

	if dvaSource == DVASourceAudited {
		if auditedDVA == nil {
			return errors.New("PLI eligibility with AUDITED source requires an audited DVA value")
		}
		if *auditedDVA < 50 {
			return errors.New("PLI eligibility requires Audited DVA >= 50%. Provided: " + formatFloat(*auditedDVA) + "%")
		}
		// Audited DVA is valid for PLI
		return nil
	}

	// ESTIMATED source - warn if below threshold but allow (pending CA certification)
	if estimatedDVA < 50 {
		return errors.New("Estimated DVA is below 50%. PLI subsidy claims require CA certification with DVA >= 50%")
	}

	return nil
}

// formatFloat formats a float64 to a string with 1 decimal place
func formatFloat(f float64) string {
	return fmt.Sprintf("%.1f", f)
}
