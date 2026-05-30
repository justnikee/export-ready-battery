package services

import (
	"testing"
)

func TestDGFTCalculator_RoDTEP(t *testing.T) {
	calc := NewDGFTCalculator()

	tests := []struct {
		name       string
		value      float64
		hsn        string
		defaultRate float64
		want       float64
	}{
		{"battery HSN 8507.60", 1000000, "8507.60", 1.5, 15000},
		{"battery HSN prefix 8507", 2000000, "8507", 1.5, 30000},
		{"textile HSN 6109", 500000, "6109", 2.5, 12500},
		{"unknown HSN uses default", 1000000, "9999", 2.0, 20000},
		{"zero value", 0, "8507", 1.5, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := calc.CalculateClaimAmount("RODTEP", tt.value, 0, tt.hsn, tt.defaultRate)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestDGFTCalculator_InterestEqualization(t *testing.T) {
	calc := NewDGFTCalculator()

	got, err := calc.CalculateClaimAmount("INTEREST_EQUALIZATION", 1000000, 0, "", 2.75)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 1M * 2.75% * 0.5 = 13,750
	want := 13750.0
	if got != want {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestDGFTCalculator_DutyDrawback(t *testing.T) {
	calc := NewDGFTCalculator()

	got, err := calc.CalculateClaimAmount("DUTY_DRAWBACK", 1000000, 0, "8507.60", 1.2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := 12000.0
	if got != want {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestDGFTCalculator_UnsupportedScheme(t *testing.T) {
	calc := NewDGFTCalculator()
	_, err := calc.CalculateClaimAmount("UNKNOWN_SCHEME", 1000000, 0, "", 0)
	if err == nil {
		t.Error("expected error for unsupported scheme")
	}
}

func TestRound2(t *testing.T) {
	tests := []struct {
		input float64
		want  float64
	}{
		{123.456, 123.46},
		{123.454, 123.45},
		{0, 0},
		{99.999, 100},
	}
	for _, tt := range tests {
		got := round2(tt.input)
		if got != tt.want {
			t.Errorf("round2(%v) = %v, want %v", tt.input, got, tt.want)
		}
	}
}
