package services

import (
	"testing"
)

// ============================================================================
// VALIDATION SERVICE UNIT TESTS
// Comprehensive tests for India + EU regulatory validation
// ============================================================================

func TestValidateIECCode(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid IEC (PAN format)", "AAAPL1234C", true},
		{"Valid IEC lowercase normalized", "aaapl1234c", true},
		{"Empty (optional)", "", true},
		{"Too short", "AAAA1234", false},
		{"Too long", "AAAPL1234CC", false},
		{"Wrong format: all digits", "1234567890", false},
		{"Wrong format: all letters", "ABCDEFGHIJ", false},
		{"Wrong format: starts with digits", "12345ABCDE", false},
		{"Has special chars", "AAAP@1234C", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateIECCode(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateIECCode(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateHSNCode(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid textile HSN (cotton fabric)", "52081110", true},
		{"Valid battery HSN (still valid 8-digit)", "85076000", true},
		{"Valid with dots (normalized)", "5208.11.10", true},
		{"Valid with spaces (normalized)", "5208 1110", true},
		{"Empty (required)", "", false},
		{"Too short", "5208", false},
		{"Too long", "520811101", false},
		{"Non-numeric", "5208abcd", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateHSNCode(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateHSNCode(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateHSNCodeGeneric(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid 8-digit HSN", "85076000", true},
		{"Valid non-battery HSN", "84159000", true},
		{"With dots (normalized)", "8507.60.00", true},
		{"Empty (required)", "", false},
		{"Too short", "8507", false},
		{"Non-numeric", "8507abcd", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateHSNCodeGeneric(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateHSNCodeGeneric(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateEPRNumber(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid EPR", "B-29016/2024-25/CPCB", true},
		{"Empty (optional)", "", true},
		{"Missing B- prefix", "29016/2024-25/CPCB", false},
		{"Too short", "B-12345", false},
		{"Too long (>30 chars)", "B-29016/2024-25/CPCB/EXTRA/LONG/STRING", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateEPRNumber(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateEPRNumber(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateBISRNumber(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid R-Number", "R-41001234", true},
		{"Empty (optional)", "", true},
		{"Missing R- prefix", "41001234", false},
		{"Wrong digit count (7)", "R-4100123", false},
		{"Lowercase normalized", "r-41001234", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateBISRNumber(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateBISRNumber(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateCountryCode(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid IN", "IN", true},
		{"Valid US", "US", true},
		{"Valid CN", "CN", true},
		{"Empty (optional)", "", true},
		{"Lowercase (normalized)", "in", true},
		{"Three letters", "IND", false},
		{"Single letter", "I", false},
		{"Digits", "12", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateCountryCode(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateCountryCode(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateCarbonFootprint(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid integer", "50", true},
		{"Valid decimal", "42.5", true},
		{"Empty (optional)", "", true},
		{"Negative", "-10", false},
		{"Letters", "abc", false},
		{"Mixed", "50kg", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateCarbonFootprint(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateCarbonFootprint(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

func TestValidateFiberType(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Cotton", "COTTON", true},
		{"Polyester", "POLYESTER", true},
		{"Nylon", "NYLON", true},
		{"Wool", "WOOL", true},
		{"Empty (required)", "", false},
		{"Non-standard (still valid, just informational)", "HEMP_BLEND", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateFiberType(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateFiberType(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

// ============================================================================
// EU CARBON FOOTPRINT FORMAT VALIDATION
// ============================================================================

func TestValidateCarbonFootprintFormat(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		input     string
		wantValid bool
	}{
		{"Valid: integer kg CO2e", "45 kg CO2e", true},
		{"Valid: decimal kg CO2e", "45.2 kg CO2e", true},
		{"Valid: with /kWh", "123.5 kg CO2e/kWh", true},
		{"Valid: no space before kg", "45kg CO2e", true},
		{"Empty (required for EU)", "", false},
		{"Just a number", "45", false},
		{"Wrong unit", "45 lb CO2", false},
		{"Missing CO2e", "45 kg", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateCarbonFootprintFormat(tt.input)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateCarbonFootprintFormat(%q) valid=%v, want %v (msg: %s)",
					tt.input, result.Valid, tt.wantValid, result.Message)
			}
		})
	}
}

// ============================================================================
// EU COMPLIANCE (COMPOSITE)
// ============================================================================

func TestValidateEUCompliance(t *testing.T) {
	v := NewValidationService()

	recycled20 := 20.0
	recycled120 := 120.0
	recycled5 := 5.0

	tests := []struct {
		name             string
		carbonFootprint  string
		recycledContent  *float64
		hasSupplyChainDD bool
		hasCarbonDecl    bool
		wantValid        bool
		wantWarningCount int
		wantErrorCount   int
	}{
		{
			"Fully compliant",
			"45 kg CO2e", &recycled20, true, true,
			true, 0, 0,
		},
		{
			"Missing carbon footprint",
			"", &recycled20, true, true,
			false, 0, 1,
		},
		{
			"Missing carbon declaration",
			"45 kg CO2e", &recycled20, true, false,
			false, 0, 1,
		},
		{
			"Recycled content out of range",
			"45 kg CO2e", &recycled120, true, true,
			false, 0, 1,
		},
		{
			"Low recycled content (warning)",
			"45 kg CO2e", &recycled5, true, true,
			true, 1, 0,
		},
		{
			"No recycled content (warning)",
			"45 kg CO2e", nil, true, true,
			true, 1, 0,
		},
		{
			"No supply chain DD (warning)",
			"45 kg CO2e", &recycled20, false, true,
			true, 1, 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateEUCompliance(tt.carbonFootprint, tt.recycledContent, tt.hasSupplyChainDD, tt.hasCarbonDecl)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateEUCompliance() valid=%v, want %v (errors: %v)", result.Valid, tt.wantValid, result.Errors)
			}
			if len(result.Warnings) != tt.wantWarningCount {
				t.Errorf("ValidateEUCompliance() warnings=%d, want %d (%v)", len(result.Warnings), tt.wantWarningCount, result.Warnings)
			}
			if len(result.Errors) != tt.wantErrorCount {
				t.Errorf("ValidateEUCompliance() errors=%d, want %d (%v)", len(result.Errors), tt.wantErrorCount, result.Errors)
			}
		})
	}
}

// ============================================================================
// INDIA COMPLIANCE (COMPOSITE)
// ============================================================================

func TestValidateIndiaCompliance(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name      string
		bisNumber string
		eprNumber string
		hsnCode   string
		iecCode   string
		wantValid bool
	}{
		{
			"Fully compliant domestic",
			"R-41001234", "B-29016/2024-25/CPCB", "52081110", "",
			true,
		},
		{
			"Missing BIS (mandatory)",
			"", "B-29016/2024-25/CPCB", "52081110", "",
			false,
		},
		{
			"Missing IEC (warning)",
			"R-41001234", "", "52081110", "",
			true,
		},
		{
			"Imported with valid IEC",
			"R-41001234", "", "52081110", "AAAPL1234C",
			true,
		},
		{
			"Invalid HSN code",
			"R-41001234", "", "1234", "",
			false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := v.ValidateIndiaCompliance(
				tt.bisNumber, tt.eprNumber, tt.hsnCode, tt.iecCode,
			)
			if result.Valid != tt.wantValid {
				t.Errorf("ValidateIndiaCompliance() valid=%v, want %v (errors: %v, warnings: %v)",
					result.Valid, tt.wantValid, result.Errors, result.Warnings)
			}
		})
	}
}

// ============================================================================
// BATCH COMPLIANCE (HSN + IEC COMPOSITE)
// ============================================================================

func TestValidateBatchCompliance(t *testing.T) {
	v := NewValidationService()

	tests := []struct {
		name       string
		hsn        string
		iec        string
		isImported bool
		wantErr    bool
	}{
		{"Valid HSN + not imported", "52081110", "", false, false},
		{"Valid HSN + valid IEC imported", "52081110", "AAAPL1234C", true, false},
		{"Missing HSN", "", "", false, true},
		{"Imported without IEC", "52081110", "", true, true},
		{"Imported with invalid IEC", "52081110", "INVALID", true, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := v.ValidateBatchCompliance(tt.hsn, tt.iec, tt.isImported)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateBatchCompliance() error=%v, wantErr=%v", err, tt.wantErr)
			}
		})
	}
}
