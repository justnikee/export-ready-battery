package services

import (
	"fmt"
	"math"
)

// DGFTCalculator computes estimated claim amounts for Indian export incentive schemes.
type DGFTCalculator struct{}

// NewDGFTCalculator creates a new calculator instance.
func NewDGFTCalculator() *DGFTCalculator {
	return &DGFTCalculator{}
}

// CalculateClaimAmount returns the estimated claim amount for a given scheme.
//
// Supported schemes:
//   - RODTEP: percentage of FOB value (rate looked up by HSN, fallback to default)
//   - INTEREST_EQUALIZATION: 2.75% or 3% of interest on export credit (simplified to % of FOB)
//   - DUTY_DRAWBACK: All Industry Rate (AIR) looked up by HSN
func (c *DGFTCalculator) CalculateClaimAmount(schemeType string, exportValueINR, quantity float64, hsnCode string, defaultRate float64) (float64, error) {
	switch schemeType {
	case "RODTEP":
		return c.calcRodtep(exportValueINR, hsnCode, defaultRate)
	case "INTEREST_EQUALIZATION":
		return c.calcInterestEqualization(exportValueINR, defaultRate)
	case "DUTY_DRAWBACK":
		return c.calcDutyDrawback(exportValueINR, hsnCode, defaultRate)
	default:
		return 0, fmt.Errorf("unsupported scheme type: %s", schemeType)
	}
}

// RODTEP: Remission of Duties and Taxes on Exported Products
// Rates are HSN-dependent. For MVP we use a static map of common battery HSNs.
func (c *DGFTCalculator) calcRodtep(exportValueINR float64, hsnCode string, defaultRate float64) (float64, error) {
	rate := c.lookupRodtepRate(hsnCode)
	if rate <= 0 {
		rate = defaultRate
	}
	amount := exportValueINR * (rate / 100.0)
	return round2(amount), nil
}

// Interest Equalization: subsidized interest on export credit
// Simplified to a percentage of FOB value for claim estimation.
func (c *DGFTCalculator) calcInterestEqualization(exportValueINR float64, defaultRate float64) (float64, error) {
	// IES is capped at Rs 50 lakh per financial year per exporter.
	// For per-claim estimation, we use the rate on the export value.
	rate := defaultRate
	if rate <= 0 {
		rate = 2.75 // MSME manufacturer rate as per Trade Notice 20/2025-26
	}
	// Simplified: assume 6-month credit at the subvention rate
	amount := exportValueINR * (rate / 100.0) * 0.5
	return round2(amount), nil
}

// Duty Drawback: refund of customs/excise duties on inputs
// AIR rates are HSN-dependent.
func (c *DGFTCalculator) calcDutyDrawback(exportValueINR float64, hsnCode string, defaultRate float64) (float64, error) {
	rate := c.lookupDrawbackRate(hsnCode)
	if rate <= 0 {
		rate = defaultRate
	}
	amount := exportValueINR * (rate / 100.0)
	return round2(amount), nil
}

// lookupRodtepRate returns the RoDTEP rate for a given HSN code.
// Static map of common battery/export HSNs. In production this should be DB-driven.
func (c *DGFTCalculator) lookupRodtepRate(hsnCode string) float64 {
	// Common battery/export HSN codes and approximate RoDTEP rates
	rates := map[string]float64{
		"8507":   1.5, // Electric accumulators (batteries)
		"8507.1": 1.5,
		"8507.2": 1.5,
		"8507.6": 1.5, // Lithium-ion
		"8507.8": 1.5,
		"8507.9": 1.5,
		"8541":   2.0, // Diodes, transistors
		"8703":   1.0, // Motor cars
		"8704":   1.0, // Motor vehicles for goods
		"3004":   3.0, // Medicaments
		"6109":   2.5, // T-shirts (textile)
		"6203":   2.5, // Men's suits (textile)
	}

	// Try exact match first
	if r, ok := rates[hsnCode]; ok {
		return r
	}
	// Try 4-digit prefix
	if len(hsnCode) >= 4 {
		if r, ok := rates[hsnCode[:4]]; ok {
			return r
		}
	}
	return 0
}

// lookupDrawbackRate returns the Duty Drawback AIR rate for a given HSN code.
func (c *DGFTCalculator) lookupDrawbackRate(hsnCode string) float64 {
	rates := map[string]float64{
		"8507":   1.2,
		"8507.1": 1.2,
		"8507.6": 1.2,
		"8541":   1.8,
		"6109":   3.5,
		"6203":   3.0,
	}
	if r, ok := rates[hsnCode]; ok {
		return r
	}
	if len(hsnCode) >= 4 {
		if r, ok := rates[hsnCode[:4]]; ok {
			return r
		}
	}
	return 0
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
