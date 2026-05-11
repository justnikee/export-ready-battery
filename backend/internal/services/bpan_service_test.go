package services

import (
	"testing"

	"anvayalabs-battery/internal/models"
)

// ============================================================================
// TestGenerateBPANv2 — serial number formatting
// ============================================================================

func TestGenerateBPANv2(t *testing.T) {
	tests := []struct {
		name     string
		prefix   string
		sequence int
		expected string
	}{
		{"India LFP", "IN-TEN-LFP-2026", 1, "IN-TEN-LFP-2026-00001"},
		{"India NMC large seq", "IN-TEN-NMC-2026", 99999, "IN-TEN-NMC-2026-99999"},
		{"EU NMC", "EU-BAT-NMC-2026", 42, "EU-BAT-NMC-2026-00042"},
		{"Global LFP", "GL-MFG-LFP-2025", 500, "GL-MFG-LFP-2025-00500"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateBPANv2(tt.prefix, tt.sequence)
			if got != tt.expected {
				t.Errorf("GenerateBPANv2(%q, %d) = %q, want %q", tt.prefix, tt.sequence, got, tt.expected)
			}
		})
	}
}

// ============================================================================
// TestBuildBPANPrefix — prefix construction
// ============================================================================

func TestBuildBPANPrefix(t *testing.T) {
	tests := []struct {
		name     string
		region   string
		mfr      string
		chem     string
		year     int
		expected string
	}{
		{"India LFP", "IN", "TEN", "LFP", 2026, "IN-TEN-LFP-2026"},
		{"EU NMC", "EU", "BAT", "NMC", 2025, "EU-BAT-NMC-2025"},
		{"lowercase inputs", "in", "ten", "lfp", 2026, "IN-TEN-LFP-2026"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildBPANPrefix(tt.region, tt.mfr, tt.chem, tt.year)
			if got != tt.expected {
				t.Errorf("BuildBPANPrefix(%q, %q, %q, %d) = %q, want %q",
					tt.region, tt.mfr, tt.chem, tt.year, got, tt.expected)
			}
		})
	}
}

// ============================================================================
// TestParseBPAN — backward compatibility + multi-region
// ============================================================================

func TestParseBPAN_V1BackwardCompat(t *testing.T) {
	comp := ParseBPAN("IN-NKY-LFP-2026-00001")
	if comp == nil {
		t.Fatal("ParseBPAN returned nil for valid V1 serial")
	}
	if comp.Region != "IN" {
		t.Errorf("Region = %q, want \"IN\"", comp.Region)
	}
	if comp.Manufacturer != "NKY" {
		t.Errorf("Manufacturer = %q, want \"NKY\"", comp.Manufacturer)
	}
	if comp.Chemistry != "LFP" {
		t.Errorf("Chemistry = %q, want \"LFP\"", comp.Chemistry)
	}
	if comp.Year != 2026 {
		t.Errorf("Year = %d, want 2026", comp.Year)
	}
	if comp.Sequence != 1 {
		t.Errorf("Sequence = %d, want 1", comp.Sequence)
	}
}

func TestParseBPAN_AllRegions(t *testing.T) {
	tests := []struct {
		serial string
		region string
	}{
		{"IN-TEN-LFP-2026-00042", "IN"},
		{"EU-BAT-NMC-2025-00001", "EU"},
		{"GL-MFG-LFP-2026-10000", "GL"},
	}

	for _, tt := range tests {
		t.Run(tt.region, func(t *testing.T) {
			comp := ParseBPAN(tt.serial)
			if comp == nil {
				t.Fatalf("ParseBPAN(%q) returned nil", tt.serial)
			}
			if comp.Region != tt.region {
				t.Errorf("Region = %q, want %q", comp.Region, tt.region)
			}
		})
	}
}

func TestParseBPAN_Invalid(t *testing.T) {
	invalids := []string{
		"",
		"BAT-001",
		"IN-TEN-LFP-2026",       // Missing sequence
		"IN-TEN-LFP-abc-00001",  // Non-numeric year
		"IN-TEN-LFP-2026-abcde", // Non-numeric sequence
		"X-Y-Z-1-2-3",           // Too many parts
	}

	for _, s := range invalids {
		if comp := ParseBPAN(s); comp != nil {
			t.Errorf("ParseBPAN(%q) should return nil, got %+v", s, comp)
		}
	}
}

// ============================================================================
// TestValidateBPANv2 — region-aware validation
// ============================================================================

func TestValidateBPANv2(t *testing.T) {
	tests := []struct {
		name           string
		serial         string
		expectedRegion string
		valid          bool
	}{
		{"Valid India", "IN-TEN-LFP-2026-00001", "INDIA", true},
		{"Valid EU", "EU-BAT-NMC-2025-00042", "EU", true},
		{"Valid Global", "GL-MFG-LFP-2026-00100", "", true},
		{"Wrong region", "EU-BAT-NMC-2025-00042", "INDIA", false},
		{"Invalid format", "BAT-001", "", false},
		{"Year too old", "IN-TEN-LFP-2019-00001", "", false},
		{"Zero sequence", "IN-TEN-LFP-2026-00000", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateBPANv2(tt.serial, tt.expectedRegion)
			if got != tt.valid {
				t.Errorf("ValidateBPANv2(%q, %q) = %v, want %v", tt.serial, tt.expectedRegion, got, tt.valid)
			}
		})
	}
}

// ============================================================================
// TestDeriveManufacturerCode — edge cases
// ============================================================================

func TestDeriveManufacturerCode(t *testing.T) {
	tests := []struct {
		name     string
		company  string
		expected string
	}{
		{"Normal", "Tata Energy", "TAT"},
		{"Short name", "AB", "ABX"},
		{"Single char", "X", "XXX"},
		{"Empty", "", "MFG"},
		{"With numbers", "123 Corp", "COR"},
		{"Unicode", "München GmbH", "MÜN"},
		{"Spaces and special", "  A-B_C  ", "ABC"},
		{"Long name", "AnvayaLabs Battery Solutions", "EXP"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DeriveManufacturerCode(tt.company)
			if got != tt.expected {
				t.Errorf("DeriveManufacturerCode(%q) = %q, want %q", tt.company, got, tt.expected)
			}
		})
	}
}

// ============================================================================
// TestMapRegionPrefix
// ============================================================================

func TestMapRegionPrefix(t *testing.T) {
	tests := []struct {
		region   models.MarketRegion
		expected string
	}{
		{models.MarketRegionIndia, "IN"},
		{models.MarketRegionEU, "EU"},
		{models.MarketRegionGlobal, "GL"},
		{models.MarketRegion("UNKNOWN"), "GL"},
	}

	for _, tt := range tests {
		t.Run(string(tt.region), func(t *testing.T) {
			got := MapRegionPrefix(tt.region)
			if got != tt.expected {
				t.Errorf("MapRegionPrefix(%q) = %q, want %q", tt.region, got, tt.expected)
			}
		})
	}
}

// ============================================================================
// TestMapChemistryCode — normalization
// ============================================================================

func TestMapChemistryCode(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"LFP", "LFP"},
		{"lfp", "LFP"},
		{"LiFePO4", "LFP"},
		{"NMC", "NMC"},
		{"NMC811", "NMC"},
		{"NCA", "NCA"},
		{"LCO", "LCO"},
		{"LTO", "LTO"},
		{"LMO", "LMO"},
		{"Sodium", "NAI"},
		{"Na-Ion", "NAI"},
		{"CustomChem", "CUS"},
		{"AB", "AB"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := MapChemistryCode(tt.input)
			if got != tt.expected {
				t.Errorf("MapChemistryCode(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

// ============================================================================
// TestBPANRoundTrip — generate then parse
// ============================================================================

func TestBPANRoundTrip(t *testing.T) {
	prefix := BuildBPANPrefix("EU", "BAT", "NMC", 2026)
	serial := GenerateBPANv2(prefix, 42)

	comp := ParseBPAN(serial)
	if comp == nil {
		t.Fatal("ParseBPAN returned nil for generated serial")
	}

	if comp.Region != "EU" || comp.Manufacturer != "BAT" || comp.Chemistry != "NMC" ||
		comp.Year != 2026 || comp.Sequence != 42 {
		t.Errorf("Round-trip mismatch: serial=%q parsed=%+v", serial, comp)
	}
}
