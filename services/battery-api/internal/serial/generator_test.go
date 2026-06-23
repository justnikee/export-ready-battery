package serial_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/serial"
)

// ============================================================================
// GetFormat tests
// ============================================================================

func TestGetFormat_BatteryIndia(t *testing.T) {
	f := serial.GetFormat(models.ProductTypeBattery, models.MarketRegionIndia)
	assert.Equal(t, "BPAN-V2", f.Name)
	assert.Equal(t, "IN", f.RegionCode)
	assert.Equal(t, 5, f.SequencePadding)
	assert.Equal(t, 99999, f.MaxSequence)
}

func TestGetFormat_BatteryEU(t *testing.T) {
	f := serial.GetFormat(models.ProductTypeBattery, models.MarketRegionEU)
	assert.Equal(t, "EU", f.RegionCode)
}

func TestGetFormat_UnknownFallsBackToGlobalBattery(t *testing.T) {
	f := serial.GetFormat(models.ProductTypeElectronics, models.MarketRegion("UNKNOWN"))
	assert.Equal(t, "GL", f.RegionCode, "unknown product/market should fallback to Global battery format")
}

// ============================================================================
// BPANGenerator.Generate tests
// ============================================================================

func opts(mfr, chem string, seq int) serial.Options {
	return serial.Options{ManufacturerCode: mfr, Chemistry: chem, Year: 2026, Sequence: seq}
}

func TestGenerate_India_ProducesCorrectFormat(t *testing.T) {
	g := serial.NewBPANGenerator()
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, opts("TEN", "LFP", 1))
	require.NoError(t, err)
	assert.Equal(t, "IN-TEN-LFP-2026-00001", s)
}

func TestGenerate_EU_ProducesCorrectFormat(t *testing.T) {
	g := serial.NewBPANGenerator()
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionEU, opts("BAT", "NMC", 42))
	require.NoError(t, err)
	assert.Equal(t, "EU-BAT-NMC-2026-00042", s)
}

func TestGenerate_Global_ProducesCorrectFormat(t *testing.T) {
	g := serial.NewBPANGenerator()
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionGlobal, opts("MFG", "LFP", 500))
	require.NoError(t, err)
	assert.Equal(t, "GL-MFG-LFP-2026-00500", s)
}

func TestGenerate_DerivesManufacturerFromCompanyName(t *testing.T) {
	g := serial.NewBPANGenerator()
	o := serial.Options{CompanyName: "Tata Energy", Chemistry: "LFP", Year: 2026, Sequence: 1}
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, o)
	require.NoError(t, err)
	assert.True(t, strings.HasPrefix(s, "IN-TAT-"), "expected IN-TAT- prefix, got %s", s)
}

func TestGenerate_ZeroPadsSequence(t *testing.T) {
	g := serial.NewBPANGenerator()
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, opts("TEN", "LFP", 7))
	require.NoError(t, err)
	assert.True(t, strings.HasSuffix(s, "-00007"), "expected 5-digit padded sequence, got %s", s)
}

func TestGenerate_MaxSequence_Succeeds(t *testing.T) {
	g := serial.NewBPANGenerator()
	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, opts("TEN", "LFP", 99999))
	require.NoError(t, err)
	assert.True(t, strings.HasSuffix(s, "-99999"), s)
}

func TestGenerate_ExceedsMaxSequence_Errors(t *testing.T) {
	g := serial.NewBPANGenerator()
	_, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, opts("TEN", "LFP", 100000))
	assert.Error(t, err)
}

func TestGenerate_ZeroSequence_Errors(t *testing.T) {
	g := serial.NewBPANGenerator()
	_, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, opts("TEN", "LFP", 0))
	assert.Error(t, err)
}

func TestGenerate_InvalidManufacturerCode_Errors(t *testing.T) {
	g := serial.NewBPANGenerator()
	// "TOOLONG" is 7 chars, not 3.
	o := serial.Options{ManufacturerCode: "TOOLONG", Chemistry: "LFP", Year: 2026, Sequence: 1}
	_, err := g.Generate(models.ProductTypeBattery, models.MarketRegionIndia, o)
	assert.Error(t, err)
}

// ============================================================================
// BPANGenerator.Validate tests
// ============================================================================

func TestValidate_ValidIndiaSerial(t *testing.T) {
	g := serial.NewBPANGenerator()
	assert.True(t, g.Validate("IN-TEN-LFP-2026-00001", models.ProductTypeBattery, models.MarketRegionIndia))
}

func TestValidate_ValidEUSerial(t *testing.T) {
	g := serial.NewBPANGenerator()
	assert.True(t, g.Validate("EU-BAT-NMC-2025-00042", models.ProductTypeBattery, models.MarketRegionEU))
}

func TestValidate_WrongRegion_Fails(t *testing.T) {
	g := serial.NewBPANGenerator()
	// EU serial presented as India — should fail.
	assert.False(t, g.Validate("EU-BAT-NMC-2025-00042", models.ProductTypeBattery, models.MarketRegionIndia))
}

func TestValidate_YearTooOld_Fails(t *testing.T) {
	g := serial.NewBPANGenerator()
	assert.False(t, g.Validate("IN-TEN-LFP-2019-00001", models.ProductTypeBattery, models.MarketRegionIndia))
}

func TestValidate_ZeroSequence_Fails(t *testing.T) {
	g := serial.NewBPANGenerator()
	assert.False(t, g.Validate("IN-TEN-LFP-2026-00000", models.ProductTypeBattery, models.MarketRegionIndia))
}

func TestValidate_MissingSegments_Fails(t *testing.T) {
	g := serial.NewBPANGenerator()
	invalids := []string{
		"",
		"BAT-001",
		"IN-TEN-LFP-2026",         // missing sequence
		"IN-TEN-LFP-abc-00001",    // non-numeric year
		"IN-TEN-LFP-2026-00001-X", // extra segment
	}
	for _, s := range invalids {
		assert.False(t, g.Validate(s, models.ProductTypeBattery, models.MarketRegionIndia), "expected %q to fail validation", s)
	}
}

func TestValidate_WrongPaddingWidth_Fails(t *testing.T) {
	g := serial.NewBPANGenerator()
	// Sequence segment has only 3 digits — padding should be 5.
	assert.False(t, g.Validate("IN-TEN-LFP-2026-001", models.ProductTypeBattery, models.MarketRegionIndia))
}

// ============================================================================
// Round-trip test
// ============================================================================

func TestRoundTrip_BatteryGenerateThenValidate(t *testing.T) {
	g := serial.NewBPANGenerator()
	o := serial.Options{ManufacturerCode: "BAT", Chemistry: "NMC", Year: 2026, Sequence: 42}

	s, err := g.Generate(models.ProductTypeBattery, models.MarketRegionEU, o)
	require.NoError(t, err)
	assert.True(t, g.Validate(s, models.ProductTypeBattery, models.MarketRegionEU),
		"generated serial %q should pass its own validation", s)
}

// ============================================================================
// DeriveManufacturerCode tests
// ============================================================================

func TestDeriveManufacturerCode(t *testing.T) {
	tests := []struct{ name, company, expected string }{
		{"Normal", "Tata Energy", "TAT"},
		{"Two letters", "AB Corp", "ABC"}, // A, B, C from "AB Corp"
		{"One letter", "X Ltd", "XLT"},   // X, L, T from "X Ltd"
		{"Empty", "", "MFG"},
		{"Numbers first", "123 Corp", "COR"},
		{"Long name", "AnvayaLabs Battery Solutions", "ANV"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := serial.DeriveManufacturerCode(tt.company)
			assert.Equal(t, tt.expected, got)
		})
	}
}

// ============================================================================
// MapChemistryCode tests
// ============================================================================

func TestMapChemistryCode(t *testing.T) {
	tests := []struct{ input, expected string }{
		{"LFP", "LFP"}, {"lfp", "LFP"}, {"LiFePO4", "LFP"},
		{"NMC", "NMC"}, {"NMC811", "NMC"}, {"NMC622", "NMC"},
		{"NCA", "NCA"}, {"LCO", "LCO"}, {"LTO", "LTO"}, {"LMO", "LMO"},
		{"Sodium", "NAI"}, {"Na-Ion", "NAI"},
		{"CustomChem", "CUS"},
		{"AB", "AB"},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, serial.MapChemistryCode(tt.input))
		})
	}
}

// ============================================================================
// MapProductCode tests
// ============================================================================

func TestMapProductCode(t *testing.T) {
	tests := []struct {
		pt       models.ProductType
		input    string
		expected string
	}{
		{models.ProductTypeBattery, "LFP", "LFP"},
		{models.ProductTypeBattery, "NMC811", "NMC"},
		{models.ProductTypeElectronics, "Silicon", "SIL"},
		{models.ProductTypeElectronics, "AB", "AB"},
	}
	for _, tt := range tests {
		t.Run(string(tt.pt)+"_"+tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, serial.MapProductCode(tt.pt, tt.input))
		})
	}
}

// ============================================================================
// GenerateCollisionFreeID
// ============================================================================

func TestGenerateCollisionFreeID_IsUnique(t *testing.T) {
	ids := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id, err := serial.GenerateCollisionFreeID()
		require.NoError(t, err)
		assert.Len(t, id, 32, "expected 32-char hex string")
		assert.False(t, ids[id], "duplicate ID generated: %s", id)
		ids[id] = true
	}
}

// ============================================================================
// GenerateSecureSequence
// ============================================================================

func TestGenerateSecureSequence_InRange(t *testing.T) {
	for i := 0; i < 50; i++ {
		n, err := serial.GenerateSecureSequence(100)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, n, 1)
		assert.LessOrEqual(t, n, 100)
	}
}

func TestGenerateSecureSequence_InvalidMax_Errors(t *testing.T) {
	_, err := serial.GenerateSecureSequence(0)
	assert.Error(t, err)
}
