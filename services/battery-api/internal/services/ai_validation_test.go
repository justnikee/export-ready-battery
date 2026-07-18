package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseNumericWithUnit(t *testing.T) {
	tests := []struct {
		input     string
		expectedF float64
		expectedU string
		expectedO bool
	}{
		{"48V", 48, "V", true},
		{" 12.5  kg ", 12.5, "kg", true},
		{"5000mAh", 5000, "mAh", true},
		{"0.5", 0.5, "", true},
		{"", 0, "", false},
		{"invalid", 0, "", false},
	}

	for _, tc := range tests {
		f, u, ok := parseNumericWithUnit(tc.input)
		assert.Equal(t, tc.expectedO, ok, "input: %q", tc.input)
		if ok {
			assert.Equal(t, tc.expectedF, f)
			assert.Equal(t, tc.expectedU, u)
		}
	}
}

func TestNormalizeDatasheet(t *testing.T) {
	r := &DatasheetParseResult{
		Chemistry: "LiFePO4",
		Voltage:   "3700mV",
		Capacity:  "5000 mAh",
		Weight:    "500 g",
		UN38_3:    true,
	}

	normalizeDatasheet(r)

	assert.Equal(t, "LFP", r.Chemistry)
	assert.Equal(t, "3.700V", r.Voltage)
	assert.Equal(t, "5.000Ah", r.Capacity)
	assert.Equal(t, "0.500kg", r.Weight)
	// Sync certifications
	assert.Contains(t, r.Certifications, "UN38.3")
}

func TestValidateDatasheet_Rules(t *testing.T) {
	t.Run("valid input", func(t *testing.T) {
		r := &DatasheetParseResult{
			Chemistry:              "LFP",
			Voltage:                "48V",
			Capacity:               "150Ah",
			Weight:                 "12kg",
			CountryOfOrigin:        "IN",
			CarbonPerformanceClass: "A",
		}
		errs := validateDatasheet(r)
		assert.Empty(t, errs)
		assert.Equal(t, "LFP", r.Chemistry)
		assert.Equal(t, "48.00V", r.Voltage)
	})

	t.Run("invalid values get cleared", func(t *testing.T) {
		r := &DatasheetParseResult{
			Chemistry:              "Triple NMC", // normalizes to NMC (valid)
			Voltage:                "3000V",      // outside range
			Capacity:               "abc",    // invalid format
			Weight:                 "-5kg",   // negative
			CountryOfOrigin:        "IND",    // too long
			CarbonPerformanceClass: "Z",      // invalid letter
		}

		errs := validateDatasheet(r)
		require.Len(t, errs, 5)

		// Invalid fields must be zeroed out in-place
		assert.Equal(t, "NMC", r.Chemistry) // valid via normalization
		assert.Empty(t, r.Voltage)
		assert.Empty(t, r.Capacity)
		assert.Empty(t, r.Weight)
		assert.Empty(t, r.CountryOfOrigin)
		assert.Empty(t, r.CarbonPerformanceClass)
	})
}

func TestValidateNLCreate_Rules(t *testing.T) {
	t.Run("valid input", func(t *testing.T) {
		r := &NLCreateResult{
			Chemistry:              "LiFePO4",
			MarketRegion:           "India",
			BatteryCategory:        "ev",
			CellSource:             "domestic",
			CarbonPerformanceClass: "b",
			Quantity:               10,
		}

		errs := validateNLCreate(r)
		assert.Empty(t, errs)
		assert.Equal(t, "LFP", r.Chemistry)
		assert.Equal(t, "INDIA", r.MarketRegion)
		assert.Equal(t, "EV", r.BatteryCategory)
		assert.Equal(t, "DOMESTIC", r.CellSource)
		assert.Equal(t, "B", r.CarbonPerformanceClass)
	})

	t.Run("invalid inputs cleared", func(t *testing.T) {
		r := &NLCreateResult{
			Chemistry:              "invalid",
			MarketRegion:           "USA",
			BatteryCategory:        "invalid",
			CellSource:             "invalid",
			CarbonPerformanceClass: "X",
			Quantity:               -1,
		}

		errs := validateNLCreate(r)
		require.Len(t, errs, 6)

		assert.Empty(t, r.Chemistry)
		assert.Empty(t, r.MarketRegion)
		assert.Empty(t, r.BatteryCategory)
		assert.Empty(t, r.CellSource)
		assert.Empty(t, r.CarbonPerformanceClass)
		assert.Equal(t, 0, r.Quantity)
	})
}

func TestValidateJSON_ParserError(t *testing.T) {
	errs1 := validateDatasheetJSON([]byte(`{invalid`))
	require.Len(t, errs1, 1)
	assert.Equal(t, "json", errs1[0].Field)

	errs2 := validateNLCreateJSON([]byte(`{invalid`))
	require.Len(t, errs2, 1)
	assert.Equal(t, "json", errs2[0].Field)
}
