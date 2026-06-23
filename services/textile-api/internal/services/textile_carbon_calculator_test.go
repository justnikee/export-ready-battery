package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCalculateTextileCarbon_CottonTShirt(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "cotton",
		PrimaryFiberPct:     100,
		WeightKg:            0.2,
		DyeProcess:          "reactive",
		FactoryCountry:      "IN",
		TransportMode:       "TRUCK",
		TransportDistanceKm: 500,
		EndOfLifeMethod:     "landfill",
		Market:              "EU",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)
	assert.Greater(t, result.TotalKgCO2e, 0.0)
	assert.Greater(t, result.PerKgKgCO2e, 0.0)
	assert.Equal(t, "HIGG_INDEX_2024_ESPR_ALIGNED", result.Methodology)
	assert.NotEmpty(t, result.DeclarationText)
	assert.NotEmpty(t, result.CalculationDate)
	assert.GreaterOrEqual(t, len(result.FactorsUsed), 4) // fiber, dye, transport, eol (+ possible remainder)

	// Breakdown should sum to total
	sum := result.Breakdown.FiberProduction + result.Breakdown.DyeingFinishing +
		result.Breakdown.Transport + result.Breakdown.EndOfLife
	assert.InDelta(t, result.TotalKgCO2e, sum, 0.001)

	// Per-kg should be total / weight
	assert.InDelta(t, result.PerKgKgCO2e, result.TotalKgCO2e/input.WeightKg, 0.001)
}

func TestCalculateTextileCarbon_PolyesterBlend(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "polyester",
		PrimaryFiberPct:     60,
		SecondaryFiber:      "cotton",
		SecondaryFiberPct:   40,
		WeightKg:            0.3,
		DyeProcess:          "vat",
		FactoryCountry:      "CN",
		TransportMode:       "SHIP",
		TransportDistanceKm: 8000,
		EndOfLifeMethod:     "recycling",
		Market:              "GLOBAL",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)
	assert.Greater(t, result.TotalKgCO2e, 0.0)
	assert.Equal(t, "HIGG_INDEX_2024_GLOBAL", result.Methodology)

	// Recycling EOL should be lower than landfill
	assert.Less(t, result.Breakdown.EndOfLife, 3.5*input.WeightKg)
}

func TestCalculateTextileCarbon_RecycledContent(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "polyester",
		PrimaryFiberPct:     100,
		RecycledContentPct:  100,
		WeightKg:            0.25,
		DyeProcess:          "pigment",
		FactoryCountry:      "IN",
		TransportMode:       "TRUCK",
		TransportDistanceKm: 200,
		EndOfLifeMethod:     "recycling",
		Market:              "INDIA",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)
	assert.Greater(t, result.TotalKgCO2e, 0.0)
	assert.Equal(t, "HIGG_INDEX_2024_INDIA_ADAPTED", result.Methodology)

	// Recycled polyester factor is ~3.2 vs virgin ~9.5, so should be lower
	// Check that fiber production is reasonable
	assert.Less(t, result.Breakdown.FiberProduction, 9.5*input.WeightKg)
}

func TestCalculateTextileCarbon_NoDye(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "wool",
		PrimaryFiberPct:     100,
		WeightKg:            0.5,
		DyeProcess:          "none",
		FactoryCountry:      "AU",
		TransportMode:       "AIR",
		TransportDistanceKm: 12000,
		EndOfLifeMethod:     "landfill",
		Market:              "EU",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)
	// No dyeing should mean 0 dyeing emissions
	assert.Equal(t, 0.0, result.Breakdown.DyeingFinishing)
	// Air transport should be significant
	assert.Greater(t, result.Breakdown.Transport, 0.0)
}

func TestCalculateTextileCarbon_InvalidWeight(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber: "cotton",
		WeightKg:     0,
	}
	_, err := CalculateTextileCarbon(input)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "weight_kg must be positive")
}

func TestCalculateTextileCarbon_InvalidFiberPct(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:      "cotton",
		PrimaryFiberPct:   110,
		WeightKg:          0.2,
	}
	_, err := CalculateTextileCarbon(input)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "primary_fiber_pct must be between 0 and 100")
}

func TestCalculateTextileCarbon_DefaultTransport(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "linen",
		PrimaryFiberPct:     100,
		WeightKg:            0.3,
		DyeProcess:          "natural",
		FactoryCountry:      "IN",
		TransportMode:       "", // empty — should default to TRUCK
		TransportDistanceKm: 100,
		EndOfLifeMethod:     "",
		Market:              "EU",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)
	assert.Greater(t, result.TotalKgCO2e, 0.0)
	// Default EOL is landfill
	assert.InDelta(t, result.Breakdown.EndOfLife, 3.5*input.WeightKg, 0.001)
}

func TestCalculateTextileCarbon_FactorsAuditTrail(t *testing.T) {
	input := TextileCarbonInput{
		PrimaryFiber:        "cotton",
		PrimaryFiberPct:     100,
		WeightKg:            0.2,
		DyeProcess:          "reactive",
		FactoryCountry:      "IN",
		TransportMode:       "TRUCK",
		TransportDistanceKm: 500,
		EndOfLifeMethod:     "landfill",
		Market:              "EU",
	}

	result, err := CalculateTextileCarbon(input)
	require.NoError(t, err)

	// Verify each factor has required fields
	for _, f := range result.FactorsUsed {
		assert.NotEmpty(t, f.Category)
		assert.NotEmpty(t, f.Subcategory)
		assert.Greater(t, f.FactorValue, 0.0)
		assert.NotEmpty(t, f.Unit)
		assert.NotEmpty(t, f.Source)
	}
}
