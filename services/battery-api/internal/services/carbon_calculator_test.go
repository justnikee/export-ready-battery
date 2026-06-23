package services

import (
	"context"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"

	"github.com/stretchr/testify/assert"
)

// ── helpers ─────────────────────────────────────────────────────────────

// mockCarbonFactorRepo implements CarbonFactorRepository for unit tests.
type mockCarbonFactorRepo struct {
	factors map[string]map[string]*models.CarbonFactor
}

func newMockCarbonFactorRepo() *mockCarbonFactorRepo {
	return &mockCarbonFactorRepo{
		factors: map[string]map[string]*models.CarbonFactor{
			"CELL_CHEMISTRY": {
				"NMC": {
					Category:    "CELL_CHEMISTRY",
					Subcategory: "NMC",
					FactorValue: 65.0,
					Unit:        "kgCO2e/kWh",
					Source:      "JRC 2024",
				},
				"LFP": {
					Category:    "CELL_CHEMISTRY",
					Subcategory: "LFP",
					FactorValue: 45.0,
					Unit:        "kgCO2e/kWh",
					Source:      "JRC 2024",
				},
			},
			"ENERGY_MIX": {
				"CN": {
					Category:    "ENERGY_MIX",
					Subcategory: "CN",
					FactorValue: 0.56,
					Unit:        "kgCO2e/kWh",
					Source:      "IEA 2024",
				},
				"IN": {
					Category:    "ENERGY_MIX",
					Subcategory: "IN",
					FactorValue: 0.71,
					Unit:        "kgCO2e/kWh",
					Source:      "IEA 2024",
				},
			},
			"TRANSPORT": {
				"SHIP": {
					Category:    "TRANSPORT",
					Subcategory: "SHIP",
					FactorValue: 0.016,
					Unit:        "kgCO2e/tonne-km",
					Source:      "JRC 2024",
				},
				"TRUCK": {
					Category:    "TRANSPORT",
					Subcategory: "TRUCK",
					FactorValue: 0.062,
					Unit:        "kgCO2e/tonne-km",
					Source:      "JRC 2024",
				},
			},
			"ASSEMBLY": {
				"DEFAULT": {
					Category:    "ASSEMBLY",
					Subcategory: "DEFAULT",
					FactorValue: 8.0,
					Unit:        "kgCO2e/kWh",
					Source:      "JRC 2024",
				},
			},
		},
	}
}

func (m *mockCarbonFactorRepo) GetFactorByCategoryAndSubcategory(ctx context.Context, category, subCategory string) (*models.CarbonFactor, error) {
	if cat, ok := m.factors[category]; ok {
		if factor, ok := cat[subCategory]; ok {
			return factor, nil
		}
	}
	return nil, nil
}

// ── tests ───────────────────────────────────────────────────────────────

func TestCalculateCarbon_NMC_Ship(t *testing.T) {
	svc := NewCarbonCalculatorService(newMockCarbonFactorRepo())

	result, err := svc.CalculateCarbon(context.Background(), CarbonInput{
		Chemistry:           "NMC",
		CapacityKWh:         50.0,
		CellSourceCountry:   "CN",
		FactoryCountry:      "IN",
		TransportMode:       "SHIP",
		TransportDistanceKm: 5000.0,
		BatteryWeightKg:     400.0,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)

	// Cell production = 65.0 * 50 = 3250
	assert.InDelta(t, 3250.0, result.Breakdown.CellProduction, 0.01, "cell production: 65 * 50")

	// Cell energy = gridFactor(CN=0.56) * (50 * 0.15) = 0.56 * 7.5 = 4.2
	assert.InDelta(t, 4.2, result.Breakdown.CellEnergy, 0.01, "cell energy: 0.56 * 7.5")

	// Assembly: no AssemblyEnergyKWh provided → default factor: 8.0 * 50 = 400
	assert.InDelta(t, 400.0, result.Breakdown.Assembly, 0.01, "assembly: default 8 * 50")

	// Transport = 0.016 * (400/1000) * 5000 = 0.016 * 0.4 * 5000 = 32.0
	assert.InDelta(t, 32.0, result.Breakdown.Transport, 0.01, "transport: 0.016 * 0.4 * 5000")

	// Total = 3250 + 4.2 + 400 + 32 + EOLRecycling(default 10*50=500) = 4186.2
	expectedTotal := result.Breakdown.CellProduction +
		result.Breakdown.CellEnergy +
		result.Breakdown.Assembly +
		result.Breakdown.Transport +
		result.Breakdown.EOLRecycling
	assert.InDelta(t, expectedTotal, result.TotalKgCO2e, 0.01, "total must equal sum of breakdown")

	// Per-kWh = total / capacity
	assert.InDelta(t, result.TotalKgCO2e/50.0, result.PerKWhKgCO2e, 0.01, "per-kWh must be total/capacity")

	// Verify audit trail
	assert.NotEmpty(t, result.FactorsUsed)
	assert.Equal(t, "JRC_2024_DECLARED", result.Methodology)
	assert.Contains(t, result.DeclarationText, "EU Regulation 2023/1542")
}

func TestCalculateCarbon_LFP_Truck(t *testing.T) {
	svc := NewCarbonCalculatorService(newMockCarbonFactorRepo())

	result, err := svc.CalculateCarbon(context.Background(), CarbonInput{
		Chemistry:           "LFP",
		CapacityKWh:         20.0,
		CellSourceCountry:   "IN",
		FactoryCountry:      "IN",
		TransportMode:       "TRUCK",
		TransportDistanceKm: 1000.0,
		BatteryWeightKg:     150.0,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)

	// Cell production = 45 * 20 = 900
	assert.InDelta(t, 900.0, result.Breakdown.CellProduction, 0.01)
	assert.Greater(t, result.TotalKgCO2e, 0.0, "total must be positive")
}

func TestCalculateCarbon_WithAssemblyEnergy(t *testing.T) {
	svc := NewCarbonCalculatorService(newMockCarbonFactorRepo())

	result, err := svc.CalculateCarbon(context.Background(), CarbonInput{
		Chemistry:           "NMC",
		CapacityKWh:         100.0,
		CellSourceCountry:   "CN",
		FactoryCountry:      "IN",
		AssemblyEnergyKWh:   500.0,
		TransportMode:       "SHIP",
		TransportDistanceKm: 8000.0,
		BatteryWeightKg:     800.0,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)

	// Assembly = gridFactor(IN=0.71) * 500 = 355
	assert.InDelta(t, 355.0, result.Breakdown.Assembly, 0.01, "assembly with explicit energy")
	assert.InDelta(t, result.TotalKgCO2e/100.0, result.PerKWhKgCO2e, 0.001)
}

func TestCalculateCarbon_PerKWh_Calculation(t *testing.T) {
	svc := NewCarbonCalculatorService(newMockCarbonFactorRepo())

	result, err := svc.CalculateCarbon(context.Background(), CarbonInput{
		Chemistry:           "NMC",
		CapacityKWh:         100.0,
		CellSourceCountry:   "CN",
		FactoryCountry:      "CN",
		TransportMode:       "TRUCK",
		TransportDistanceKm: 500.0,
		BatteryWeightKg:     800.0,
	})

	assert.NoError(t, err)
	assert.InDelta(t, result.TotalKgCO2e/100.0, result.PerKWhKgCO2e, 0.001)
}
