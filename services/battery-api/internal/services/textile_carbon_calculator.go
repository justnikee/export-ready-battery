package services

import (
	"fmt"
	"strings"
	"time"
)

// TextileCarbonInput represents BOM-based inputs for textile carbon footprint calculation.
type TextileCarbonInput struct {
	// Fiber composition
	PrimaryFiber      string  `json:"primary_fiber"`       // cotton, polyester, wool, silk, linen, viscose, nylon, acrylic, hemp, tencel
	PrimaryFiberPct   float64 `json:"primary_fiber_pct"`   // 0-100
	SecondaryFiber    string  `json:"secondary_fiber,omitempty"`
	SecondaryFiberPct float64 `json:"secondary_fiber_pct,omitempty"`
	RecycledContentPct float64 `json:"recycled_content_pct"` // 0-100

	// Product weight
	WeightKg float64 `json:"weight_kg"` // garment weight in kg

	// Manufacturing process
	DyeProcess   string   `json:"dye_process"`    // reactive, vat, pigment, natural, none
	FinishType   []string `json:"finish_type,omitempty"`
	FactoryCountry string `json:"factory_country"` // ISO Alpha-2

	// Transport
	TransportMode       string  `json:"transport_mode"`        // SHIP, RAIL, TRUCK, AIR
	TransportDistanceKm float64 `json:"transport_distance_km"`

	// End-of-life
	EndOfLifeMethod string `json:"end_of_life_method"` // landfill, incineration, recycling (default: landfill)

	// Market context
	Market string `json:"market"` // EU, INDIA, GLOBAL
}

// TextileCarbonResult contains the calculated carbon footprint with full breakdown.
type TextileCarbonResult struct {
	TotalKgCO2e     float64                 `json:"total_kg_co2e"`
	PerKgKgCO2e     float64                 `json:"per_kg_kg_co2e"`
	Breakdown       TextileCarbonBreakdown  `json:"breakdown"`
	Methodology     string                  `json:"methodology"`
	CalculationDate string                  `json:"calculation_date"`
	DeclarationText string                  `json:"declaration_text"`
	FactorsUsed     []FactorUsed            `json:"factors_used"`
}

// TextileCarbonBreakdown provides detailed breakdown of carbon footprint components.
type TextileCarbonBreakdown struct {
	FiberProduction float64 `json:"fiber_production_kg_co2e"`
	DyeingFinishing float64 `json:"dyeing_finishing_kg_co2e"`
	Transport       float64 `json:"transport_kg_co2e"`
	EndOfLife       float64 `json:"end_of_life_kg_co2e"`
}

// Hardcoded emission factors (kgCO2e per kg of fiber or process).
// Sources: Higg Index MSI 2024, Quantis International LCA studies, Textile Exchange.
var fiberFactors = map[string]float64{
	"cotton":            8.30,  // conventional cotton
	"organic_cotton":    2.10,  // organic cotton
	"polyester":         9.50,  // virgin polyester
	"recycled_polyester": 3.20, // recycled polyester (rPET)
	"wool":             25.00,  // virgin wool
	"silk":             23.00,  // silk
	"linen":             4.50,  // flax/linen
	"viscose":           7.80,  // generic viscose/rayon
	"tencel":            3.80,  // lyocell (Tencel)
	"nylon":            12.70,  // virgin nylon
	"recycled_nylon":    4.50,  // recycled nylon
	"acrylic":          17.50,  // acrylic
	"hemp":              2.50,  // hemp
	"jute":              2.00,  // jute
	"cashmere":         40.00,  // cashmere
	"alpaca":           35.00,  // alpaca
	"bamboo":            5.50,  // bamboo viscose
	"recycled_cotton":   1.50,  // recycled cotton
}

// Dyeing process emission factors (kgCO2e per kg of textile).
var dyeFactors = map[string]float64{
	"reactive": 8.0,
	"vat":      6.5,
	"pigment":  4.0,
	"natural":  2.0,
	"none":     0.0,
	"":         0.0,
}

// End-of-life emission factors (kgCO2e per kg of textile).
var eolFactors = map[string]float64{
	"landfill":      3.5,
	"incineration":  2.0,
	"recycling":     0.5,
	"":             3.5, // default to landfill
}

// Transport emission factors (kgCO2e per tonne-km).
var textileTransportFactors = map[string]float64{
	"SHIP":  0.012,
	"RAIL":  0.022,
	"TRUCK": 0.062,
	"AIR":   0.602,
}

// CalculateTextileCarbon computes the carbon footprint of a textile product.
// Uses simplified Higg Index / Quantis-inspired methodology with hardcoded factors.
func CalculateTextileCarbon(input TextileCarbonInput) (*TextileCarbonResult, error) {
	if input.WeightKg <= 0 {
		return nil, fmt.Errorf("weight_kg must be positive, got %.2f", input.WeightKg)
	}
	if input.PrimaryFiberPct < 0 || input.PrimaryFiberPct > 100 {
		return nil, fmt.Errorf("primary_fiber_pct must be between 0 and 100, got %.1f", input.PrimaryFiberPct)
	}

	var factorsUsed []FactorUsed
	var breakdown TextileCarbonBreakdown

	// 1. Fiber production emissions
	fiberCO2 := calculateFiberEmissions(input, &factorsUsed)
	breakdown.FiberProduction = fiberCO2

	// 2. Dyeing and finishing emissions
	dyeFactor := dyeFactors[strings.ToLower(input.DyeProcess)]
	breakdown.DyeingFinishing = dyeFactor * input.WeightKg
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    "DYEING_PROCESS",
		Subcategory: input.DyeProcess,
		Value:       dyeFactor,
		Unit:        "kgCO2e/kg",
		Source:      "HIGG_INDEX_2024",
	})

	// 3. Transport emissions
	transportMode := strings.ToUpper(strings.TrimSpace(input.TransportMode))
	if transportMode == "" {
		transportMode = "TRUCK"
	}
	transportFactor := textileTransportFactors[transportMode]
	if transportFactor == 0 {
		transportFactor = textileTransportFactors["TRUCK"] // fallback
	}
	breakdown.Transport = transportFactor * input.WeightKg * input.TransportDistanceKm
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    "TRANSPORT",
		Subcategory: transportMode,
		Value:       transportFactor,
		Unit:        "kgCO2e/tonne-km",
		Source:      "DEFRA_2024",
	})

	// 4. End-of-life emissions
	eolMethod := strings.ToLower(strings.TrimSpace(input.EndOfLifeMethod))
	if eolMethod == "" {
		eolMethod = "landfill"
	}
	eolFactor := eolFactors[eolMethod]
	if eolFactor == 0 {
		eolFactor = eolFactors["landfill"]
	}
	breakdown.EndOfLife = eolFactor * input.WeightKg
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    "END_OF_LIFE",
		Subcategory: eolMethod,
		Value:       eolFactor,
		Unit:        "kgCO2e/kg",
		Source:      "HIGG_INDEX_2024",
	})

	// 5. Total and per-kg
	totalKgCO2e := breakdown.FiberProduction + breakdown.DyeingFinishing +
		breakdown.Transport + breakdown.EndOfLife
	perKgKgCO2e := totalKgCO2e / input.WeightKg

	// 6. Market-aware declaration text
	market := strings.ToUpper(strings.TrimSpace(input.Market))
	var methodology, declarationText string
	switch market {
	case "INDIA":
		methodology = "HIGG_INDEX_2024_INDIA_ADAPTED"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated using simplified Higg Index MSI 2024 methodology adapted for Indian textile manufacturing. "+
				"Declared value: %.2f kgCO2e/kg of textile. Total: %.2f kgCO2e for %.2f kg garment.",
			perKgKgCO2e, totalKgCO2e, input.WeightKg,
		)
	case "GLOBAL":
		methodology = "HIGG_INDEX_2024_GLOBAL"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated using simplified Higg Index MSI 2024 methodology. "+
				"Declared value: %.2f kgCO2e/kg of textile. Total: %.2f kgCO2e for %.2f kg garment.",
			perKgKgCO2e, totalKgCO2e, input.WeightKg,
		)
	default: // "EU" and empty
		methodology = "HIGG_INDEX_2024_ESPR_ALIGNED"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated in accordance with EU ESPR Art. 9 using simplified Higg Index MSI 2024 methodology. "+
				"Declared value: %.2f kgCO2e/kg of textile. Total: %.2f kgCO2e for %.2f kg garment.",
			perKgKgCO2e, totalKgCO2e, input.WeightKg,
		)
	}

	return &TextileCarbonResult{
		TotalKgCO2e:     totalKgCO2e,
		PerKgKgCO2e:     perKgKgCO2e,
		Breakdown:       breakdown,
		Methodology:     methodology,
		CalculationDate: time.Now().UTC().Format(time.RFC3339),
		DeclarationText: declarationText,
		FactorsUsed:     factorsUsed,
	}, nil
}

// calculateFiberEmissions computes the weighted fiber production emissions.
func calculateFiberEmissions(input TextileCarbonInput, factorsUsed *[]FactorUsed) float64 {
	var total float64
	weight := input.WeightKg

	// Helper to look up factor and record it
	lookup := func(fiberName string, pct float64) float64 {
		if pct <= 0 || fiberName == "" {
			return 0
		}
		key := strings.ToLower(strings.TrimSpace(fiberName))
		factor := fiberFactors[key]
		if factor == 0 {
			factor = fiberFactors["cotton"] // fallback
		}
		// Apply recycled content discount if applicable
		if input.RecycledContentPct > 0 {
			// If this fiber is recycled, use its recycled factor
			recycledKey := "recycled_" + key
			if recycledFactor, ok := fiberFactors[recycledKey]; ok {
				factor = recycledFactor
			}
		}
		*factorsUsed = append(*factorsUsed, FactorUsed{
			Category:    "FIBER_PRODUCTION",
			Subcategory: fiberName,
			Value:       factor,
			Unit:        "kgCO2e/kg",
			Source:      "HIGG_INDEX_MSI_2024",
		})
		return factor * weight * (pct / 100.0)
	}

	total += lookup(input.PrimaryFiber, input.PrimaryFiberPct)
	total += lookup(input.SecondaryFiber, input.SecondaryFiberPct)

	// If percentages don't sum to 100, assume remainder is generic cotton
	sumPct := input.PrimaryFiberPct + input.SecondaryFiberPct
	if sumPct < 100.0 {
		remainder := 100.0 - sumPct
		factor := fiberFactors["cotton"]
		*factorsUsed = append(*factorsUsed, FactorUsed{
			Category:    "FIBER_PRODUCTION",
			Subcategory: "cotton (assumed remainder)",
			Value:       factor,
			Unit:        "kgCO2e/kg",
			Source:      "HIGG_INDEX_MSI_2024",
		})
		total += factor * weight * (remainder / 100.0)
	}

	return total
}
