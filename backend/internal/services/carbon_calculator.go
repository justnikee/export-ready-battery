package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"anvayalabs-battery/internal/models"
)

// CarbonFactorRepository defines the interface for fetching carbon factors.
type CarbonFactorRepository interface {
	GetFactorByCategoryAndSubcategory(ctx context.Context, category, subcategory string) (*models.CarbonFactor, error)
}

// CarbonFactor is an alias for models.CarbonFactor for backward compatibility in this package.
type CarbonFactor = models.CarbonFactor

// CarbonInput represents BOM-based inputs for carbon footprint calculation.
type CarbonInput struct {
	// Cell production
	Chemistry         string  `json:"chemistry"`           // LFP, NMC_622, NMC_811, NCA, LCO, SODIUM
	CapacityKWh       float64 `json:"capacity_kwh"`        // Battery pack capacity in kWh
	CellSourceCountry string  `json:"cell_source_country"` // ISO Alpha-2 (CN, IN, KR, etc.)

	// Manufacturing
	FactoryCountry    string  `json:"factory_country"`     // ISO Alpha-2 for assembly location
	AssemblyEnergyKWh float64 `json:"assembly_energy_kwh"` // Energy consumed in assembly per pack

	// Transport (cell factory → assembly plant)
	TransportMode       string  `json:"transport_mode"`        // SHIP, RAIL, TRUCK, AIR
	TransportDistanceKm float64 `json:"transport_distance_km"` // Distance in km
	BatteryWeightKg     float64 `json:"battery_weight_kg"`     // Pack weight in kg

	// Market context — drives declaration text and methodology label.
	// Accepted values: "EU", "INDIA", "GLOBAL" (case-insensitive).
	// Defaults to "EU" when empty for backward compatibility.
	Market string `json:"market"`
}

// CarbonResult contains the calculated carbon footprint with full breakdown.
type CarbonResult struct {
	TotalKgCO2e     float64         `json:"total_kg_co2e"`
	PerKWhKgCO2e    float64         `json:"per_kwh_kg_co2e"`
	CarbonClass     string          `json:"carbon_class"`     // EU performance class A-G
	Breakdown       CarbonBreakdown `json:"breakdown"`
	Methodology     string          `json:"methodology"`      // "JRC_2024_DECLARED"
	CalculationDate string          `json:"calculation_date"` // ISO 8601
	DeclarationText string          `json:"declaration_text"` // Legal declaration
	FactorsUsed     []FactorUsed    `json:"factors_used"`     // Audit trail of factors
}

// ClassifyCarbonClass assigns EU carbon performance class A (best) to G (worst)
// based on kgCO2e/kWh thresholds aligned with EU delegated act proposals.
func ClassifyCarbonClass(perKWhKgCO2e float64) string {
	switch {
	case perKWhKgCO2e <= 40:
		return "A"
	case perKWhKgCO2e <= 60:
		return "B"
	case perKWhKgCO2e <= 80:
		return "C"
	case perKWhKgCO2e <= 100:
		return "D"
	case perKWhKgCO2e <= 120:
		return "E"
	case perKWhKgCO2e <= 150:
		return "F"
	default:
		return "G"
	}
}

// CarbonBreakdown provides detailed breakdown of carbon footprint components.
type CarbonBreakdown struct {
	CellProduction float64 `json:"cell_production_kg_co2e"`
	CellEnergy     float64 `json:"cell_energy_kg_co2e"` // Grid energy for cell manufacturing
	Assembly       float64 `json:"assembly_kg_co2e"`
	Transport      float64 `json:"transport_kg_co2e"`
	EOLRecycling   float64 `json:"eol_recycling_kg_co2e"` // End-of-life collection, transport to recycler, recycling process
}

// FactorUsed records a factor used in the calculation for audit purposes.
type FactorUsed struct {
	Category    string  `json:"category"`
	Subcategory string  `json:"subcategory"`
	Value       float64 `json:"value"`
	Unit        string  `json:"unit"`
	Source      string  `json:"source"`
}

// CarbonCalculatorService calculates carbon footprint using JRC-aligned factors.
type CarbonCalculatorService struct {
	repo CarbonFactorRepository
}

// NewCarbonCalculatorService creates a new carbon calculator service.
func NewCarbonCalculatorService(repo CarbonFactorRepository) *CarbonCalculatorService {
	return &CarbonCalculatorService{repo: repo}
}

// CalculateCarbon computes carbon footprint using JRC-aligned factors.
// Algorithm:
// 1. Fetch cell chemistry factor → cellCO2 = factor × capacityKWh
// 2. Fetch cell source country energy mix → cellEnergyCO2 = gridFactor × assemblyEnergy
// 3. Fetch assembly energy mix → assemblyCO2 = gridFactor × assemblyEnergy
// 4. Fetch transport factor → transportCO2 = factor × (weightKg/1000) × distanceKm
// 5. Total = cellCO2 + cellEnergyCO2 + assemblyCO2 + transportCO2
// 6. PerKWh = Total / capacityKWh
// 7. Generate declaration text: "Calculated per EU Reg 2023/1542 Art 7, JRC methodology"
func (s *CarbonCalculatorService) CalculateCarbon(ctx context.Context, input CarbonInput) (*CarbonResult, error) {
	var factorsUsed []FactorUsed
	var breakdown CarbonBreakdown

	// 1. Fetch cell chemistry factor and calculate cell production CO2
	cellChemistryFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "CELL_CHEMISTRY", input.Chemistry)
	if err != nil {
		return nil, fmt.Errorf("failed to get cell chemistry factor for %s: %w", input.Chemistry, err)
	}
	breakdown.CellProduction = cellChemistryFactor.FactorValue * input.CapacityKWh
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    cellChemistryFactor.Category,
		Subcategory: cellChemistryFactor.Subcategory,
		Value:       cellChemistryFactor.FactorValue,
		Unit:        cellChemistryFactor.Unit,
		Source:      cellChemistryFactor.Source,
	})

	// 2. Fetch cell source country energy mix for cell manufacturing energy
	// Note: We use a default cell manufacturing energy if not provided
	// The cell energy is calculated based on the cell source country's grid
	cellEnergyFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "ENERGY_MIX", input.CellSourceCountry)
	if err != nil {
		return nil, fmt.Errorf("failed to get energy mix factor for cell source country %s: %w", input.CellSourceCountry, err)
	}
	// Cell manufacturing energy is estimated as a portion of assembly energy
	// Using a standard factor for cell manufacturing energy consumption per kWh capacity
	cellManufacturingEnergyKWh := input.CapacityKWh * 0.15 // 0.15 kWh of energy per kWh of battery capacity for cell manufacturing
	breakdown.CellEnergy = cellEnergyFactor.FactorValue * cellManufacturingEnergyKWh
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    cellEnergyFactor.Category,
		Subcategory: cellEnergyFactor.Subcategory,
		Value:       cellEnergyFactor.FactorValue,
		Unit:        cellEnergyFactor.Unit,
		Source:      cellEnergyFactor.Source,
	})

	// 3. Fetch assembly energy mix and calculate assembly CO2
	if input.AssemblyEnergyKWh > 0 {
		assemblyEnergyFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "ENERGY_MIX", input.FactoryCountry)
		if err != nil {
			return nil, fmt.Errorf("failed to get energy mix factor for factory country %s: %w", input.FactoryCountry, err)
		}
		breakdown.Assembly = assemblyEnergyFactor.FactorValue * input.AssemblyEnergyKWh
		factorsUsed = append(factorsUsed, FactorUsed{
			Category:    assemblyEnergyFactor.Category,
			Subcategory: assemblyEnergyFactor.Subcategory,
			Value:       assemblyEnergyFactor.FactorValue,
			Unit:        assemblyEnergyFactor.Unit,
			Source:      assemblyEnergyFactor.Source,
		})
	} else {
		// No explicit energy data: look up a country-specific assembly factor
		// first (added in migration 000042), then fall back to DEFAULT.
		// This ensures India-assembled batteries use the BEE-sourced factor
		// rather than the generic EU-based DEFAULT.
		assemblySubcategory := "DEFAULT"
		if input.FactoryCountry != "" {
			if factor, lookupErr := s.repo.GetFactorByCategoryAndSubcategory(ctx, "ASSEMBLY", input.FactoryCountry); lookupErr == nil && factor != nil {
				assemblySubcategory = input.FactoryCountry
			}
		}
		assemblyFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "ASSEMBLY", assemblySubcategory)
		if err != nil {
			return nil, fmt.Errorf("failed to get assembly factor (%s): %w", assemblySubcategory, err)
		}
		if assemblyFactor == nil {
			return nil, fmt.Errorf("assembly factor %q not found in database", assemblySubcategory)
		}
		breakdown.Assembly = assemblyFactor.FactorValue * input.CapacityKWh
		factorsUsed = append(factorsUsed, FactorUsed{
			Category:    assemblyFactor.Category,
			Subcategory: assemblyFactor.Subcategory,
			Value:       assemblyFactor.FactorValue,
			Unit:        assemblyFactor.Unit,
			Source:      assemblyFactor.Source,
		})
	}

	// 4. Fetch transport factor and calculate transport CO2
	// Transport CO2 = factor × (weightKg/1000) × distanceKm
	// Factor is in kgCO2e per tonne-km
	transportFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "TRANSPORT", input.TransportMode)
	if err != nil {
		return nil, fmt.Errorf("failed to get transport factor for mode %s: %w", input.TransportMode, err)
	}
	weightTonnes := input.BatteryWeightKg / 1000.0
	breakdown.Transport = transportFactor.FactorValue * weightTonnes * input.TransportDistanceKm
	factorsUsed = append(factorsUsed, FactorUsed{
		Category:    transportFactor.Category,
		Subcategory: transportFactor.Subcategory,
		Value:       transportFactor.FactorValue,
		Unit:        transportFactor.Unit,
		Source:      transportFactor.Source,
	})

	// 5. End-of-life recycling phase (EU Art 7 lifecycle carbon)
	// Uses EOL factor from DB if available, otherwise uses default per-kWh factor
	eolFactor, err := s.repo.GetFactorByCategoryAndSubcategory(ctx, "EOL_RECYCLING", input.Chemistry)
	if err == nil && eolFactor != nil {
		breakdown.EOLRecycling = eolFactor.FactorValue * input.CapacityKWh
		factorsUsed = append(factorsUsed, FactorUsed{
			Category:    eolFactor.Category,
			Subcategory: eolFactor.Subcategory,
			Value:       eolFactor.FactorValue,
			Unit:        eolFactor.Unit,
			Source:      eolFactor.Source,
		})
	} else {
		// Default: ~10 kgCO2e/kWh for collection + hydrometallurgical recycling (JRC 2024 estimate)
		breakdown.EOLRecycling = 10.0 * input.CapacityKWh
		factorsUsed = append(factorsUsed, FactorUsed{
			Category:    "EOL_RECYCLING",
			Subcategory: input.Chemistry,
			Value:       10.0,
			Unit:        "kgCO2e/kWh",
			Source:      "JRC_2024_DEFAULT",
		})
	}

	// 6. Calculate total CO2
	totalKgCO2e := breakdown.CellProduction + breakdown.CellEnergy + breakdown.Assembly + breakdown.Transport + breakdown.EOLRecycling

	// 7. Calculate per kWh CO2
	var perKWhKgCO2e float64
	if input.CapacityKWh > 0 {
		perKWhKgCO2e = totalKgCO2e / input.CapacityKWh
	}

	// 8. Build market-aware methodology label and declaration text.
	market := strings.ToUpper(strings.TrimSpace(input.Market))
	var methodology, declarationText string
	switch market {
	case "INDIA":
		methodology = "IEA_2025_BEE_DECLARED"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated using IEA 2025 country emission factors and Bureau of Energy Efficiency (BEE) India assembly standards. "+
				"Reference: Battery Waste Management Rules 2022, MoRTH AIS-038. "+
				"Declared value: %.2f kgCO2e/kWh.",
			perKWhKgCO2e,
		)
	case "GLOBAL":
		methodology = "IEA_2025_DECLARED"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated using IEA 2025 country-specific grid emission factors and JRC 2024 cell chemistry factors. "+
				"Declared value: %.2f kgCO2e/kWh.",
			perKWhKgCO2e,
		)
	default: // "EU" and empty string
		methodology = "JRC_2024_DECLARED"
		declarationText = fmt.Sprintf(
			"Carbon footprint calculated in accordance with EU Regulation 2023/1542 Article 7 using JRC 2024 methodology. "+
				"Declared value: %.2f kgCO2e/kWh.",
			perKWhKgCO2e,
		)
	}
	calculationDate := time.Now().UTC().Format(time.RFC3339)

	return &CarbonResult{
		TotalKgCO2e:     totalKgCO2e,
		PerKWhKgCO2e:    perKWhKgCO2e,
		CarbonClass:     ClassifyCarbonClass(perKWhKgCO2e),
		Breakdown:       breakdown,
		Methodology:     methodology,
		CalculationDate: calculationDate,
		DeclarationText: declarationText,
		FactorsUsed:     factorsUsed,
	}, nil
}
