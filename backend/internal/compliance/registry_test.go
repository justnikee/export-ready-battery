package compliance_test

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"exportready-battery/internal/compliance"
	"exportready-battery/internal/models"
)

// ============================================================================
// Stub Validator
// ============================================================================

// alwaysPassValidator is a minimal Validator that always returns a perfect score.
type alwaysPassValidator struct{}

func (alwaysPassValidator) Validate(_ json.RawMessage) (compliance.Result, error) {
	return compliance.Result{Valid: true, Score: 100.0}, nil
}

// alwaysFailValidator always returns a zero-score result with one missing field.
type alwaysFailValidator struct{ field string }

func (v alwaysFailValidator) Validate(_ json.RawMessage) (compliance.Result, error) {
	return compliance.Result{
		Valid:   false,
		Score:   0.0,
		Missing: []string{v.field},
		Gaps:    []compliance.Gap{{Field: v.field, Severity: "ERROR"}},
	}, nil
}

// ============================================================================
// Registry tests
// ============================================================================

func TestRegistry_Register_And_Get(t *testing.T) {
	r := compliance.NewRegistry()
	r.Register(models.ProductTypeBattery, models.MarketRegionIndia, alwaysPassValidator{})

	v, err := r.Get(models.ProductTypeBattery, models.MarketRegionIndia)
	require.NoError(t, err)
	require.NotNil(t, v)
}

func TestRegistry_Get_UnknownKey_ReturnsError(t *testing.T) {
	r := compliance.NewRegistry()
	_, err := r.Get(models.ProductTypeTextile, models.MarketRegionEU)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no validator registered")
}

func TestRegistry_Register_Duplicate_Panics(t *testing.T) {
	r := compliance.NewRegistry()
	r.Register(models.ProductTypeBattery, models.MarketRegionIndia, alwaysPassValidator{})
	assert.Panics(t, func() {
		r.Register(models.ProductTypeBattery, models.MarketRegionIndia, alwaysPassValidator{})
	})
}

func TestRegistry_Validate_RoutesToCorrectValidator(t *testing.T) {
	r := compliance.NewRegistry()
	r.Register(models.ProductTypeBattery, models.MarketRegionIndia, alwaysFailValidator{"india.field"})
	r.Register(models.ProductTypeBattery, models.MarketRegionEU, alwaysPassValidator{})

	resultIndia, err := r.Validate(models.ProductTypeBattery, models.MarketRegionIndia, json.RawMessage("{}"))
	require.NoError(t, err)
	assert.False(t, resultIndia.Valid)
	assert.Contains(t, resultIndia.Missing, "india.field")

	resultEU, err := r.Validate(models.ProductTypeBattery, models.MarketRegionEU, json.RawMessage("{}"))
	require.NoError(t, err)
	assert.True(t, resultEU.Valid)
}

// ============================================================================
// ScoreFromCheckpoints tests
// ============================================================================

func TestScoreFromCheckpoints(t *testing.T) {
	tests := []struct {
		total    int
		failures int
		expected float64
	}{
		{10, 0, 100.0},
		{10, 10, 0.0},
		{10, 5, 50.0},
		{10, 3, 70.0},
		{0, 0, 100.0},  // edge: no checkpoints → perfect score
		{10, 15, 0.0},  // edge: more failures than checkpoints → clamped to 0
	}

	for _, tt := range tests {
		got := compliance.ScoreFromCheckpoints(tt.total, tt.failures)
		assert.InDelta(t, tt.expected, got, 0.001,
			"ScoreFromCheckpoints(%d, %d)", tt.total, tt.failures)
	}
}

// ============================================================================
// Aggregate tests
// ============================================================================

func TestAggregate_EmptyInput(t *testing.T) {
	r := compliance.Aggregate()
	assert.True(t, r.Valid)
	assert.InDelta(t, 100.0, r.Score, 0.001)
}

func TestAggregate_AllValid(t *testing.T) {
	a := compliance.Result{Valid: true, Score: 80.0, Missing: nil}
	b := compliance.Result{Valid: true, Score: 60.0, Missing: nil}
	got := compliance.Aggregate(a, b)
	assert.True(t, got.Valid)
	assert.InDelta(t, 70.0, got.Score, 0.001)
}

func TestAggregate_OneFailing_MakesCompositeInvalid(t *testing.T) {
	a := compliance.Result{Valid: true, Score: 100.0}
	b := compliance.Result{Valid: false, Score: 50.0, Missing: []string{"field.x"}}
	got := compliance.Aggregate(a, b)
	assert.False(t, got.Valid)
	assert.Contains(t, got.Missing, "field.x")
	assert.InDelta(t, 75.0, got.Score, 0.001)
}

func TestAggregate_GapsAreMerged(t *testing.T) {
	a := compliance.Result{Gaps: []compliance.Gap{{Field: "a", Market: "INDIA"}}}
	b := compliance.Result{Gaps: []compliance.Gap{{Field: "b", Market: "EU"}}}
	got := compliance.Aggregate(a, b)
	assert.Len(t, got.Gaps, 2)
}

// ============================================================================
// GapsJSON tests
// ============================================================================

func TestResult_GapsJSON_EmptySlice(t *testing.T) {
	r := compliance.Result{}
	assert.Equal(t, json.RawMessage("[]"), r.GapsJSON())
}

func TestResult_GapsJSON_NonEmpty(t *testing.T) {
	r := compliance.Result{
		Gaps: []compliance.Gap{{Field: "f", Market: "EU", Severity: "ERROR", Message: "test"}},
	}
	raw := r.GapsJSON()
	var out []compliance.Gap
	require.NoError(t, json.Unmarshal(raw, &out))
	assert.Len(t, out, 1)
	assert.Equal(t, "f", out[0].Field)
}
