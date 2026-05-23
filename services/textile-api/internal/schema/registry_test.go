package schema_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/schema"
)

// ============================================================================
// Registry tests — seed-only mode (nil Store)
// ============================================================================

func makeSeedSchema(pt models.ProductType, version int) *models.ProductSchema {
	raw := json.RawMessage(`{
		"type": "object",
		"required": ["chemistry"],
		"properties": {
			"chemistry": { "type": "string", "minLength": 1 },
			"capacity":  { "type": "string" },
			"warranty_months": { "type": "integer", "minimum": 0 }
		}
	}`)
	return &models.ProductSchema{
		ProductType: pt,
		Version:     version,
		SchemaJSON:  raw,
		IsActive:    true,
	}
}

func TestRegistry_GetActive_ReturnsSeed_WhenNoStore(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))

	s, err := r.GetActive(context.Background(), models.ProductTypeTextile)
	require.NoError(t, err)
	assert.Equal(t, models.ProductTypeTextile, s.ProductType)
	assert.Equal(t, 1, s.Version)
}

func TestRegistry_GetByVersion_ReturnsSeed(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 2))

	s, err := r.GetByVersion(context.Background(), models.ProductTypeTextile, 2)
	require.NoError(t, err)
	assert.Equal(t, 2, s.Version)
}

func TestRegistry_GetActive_ReturnsHighestVersionSeed(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 3))
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 2))

	s, err := r.GetActive(context.Background(), models.ProductTypeTextile)
	require.NoError(t, err)
	assert.Equal(t, 3, s.Version, "expected highest-version seed to be returned as active")
}

func TestRegistry_GetActive_NoSeed_ReturnsError(t *testing.T) {
	r := schema.NewRegistry(nil)
	_, err := r.GetActive(context.Background(), models.ProductTypeElectronics)
	assert.Error(t, err)
}

func TestRegistry_Invalidate_ClearsCacheEntry(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))

	// Populate cache.
	_, err := r.GetActive(context.Background(), models.ProductTypeTextile)
	require.NoError(t, err)

	// Invalidate and re-fetch — should still resolve via seed fallback.
	r.Invalidate(models.ProductTypeTextile, 1)
	s, err := r.GetActive(context.Background(), models.ProductTypeTextile)
	require.NoError(t, err)
	assert.Equal(t, 1, s.Version)
}

// ============================================================================
// SchemaValidator tests
// ============================================================================

func TestSchemaValidator_ValidSpecs_Passes(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	v := schema.NewSchemaValidator(r)

	specs := json.RawMessage(`{"chemistry":"LFP","capacity":"100Ah","warranty_months":24}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 0, specs)
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.Empty(t, result.Errors)
}

func TestSchemaValidator_MissingRequired_Fails(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	v := schema.NewSchemaValidator(r)

	// chemistry is required but absent.
	specs := json.RawMessage(`{"capacity":"100Ah"}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 0, specs)
	require.NoError(t, err)
	assert.False(t, result.Valid)
	require.NotEmpty(t, result.Errors)
	assert.Equal(t, "chemistry", result.Errors[0].Field)
}

func TestSchemaValidator_WrongType_Fails(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	v := schema.NewSchemaValidator(r)

	// warranty_months must be an integer but we pass a string.
	specs := json.RawMessage(`{"chemistry":"LFP","warranty_months":"not-a-number"}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 0, specs)
	require.NoError(t, err)
	assert.False(t, result.Valid)

	found := false
	for _, e := range result.Errors {
		if e.Field == "warranty_months" {
			found = true
		}
	}
	assert.True(t, found, "expected type error for warranty_months")
}

func TestSchemaValidator_MinLength_Violation(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	v := schema.NewSchemaValidator(r)

	// chemistry has minLength:1 — empty string should fail.
	specs := json.RawMessage(`{"chemistry":"","capacity":"100Ah"}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 0, specs)
	require.NoError(t, err)
	// Empty string is treated as zero value by isZeroValue → caught by required check.
	assert.False(t, result.Valid)
}

func TestSchemaValidator_NumberMinimum_Violation(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	v := schema.NewSchemaValidator(r)

	// warranty_months has minimum:0 — negative should fail.
	specs := json.RawMessage(`{"chemistry":"LFP","warranty_months":-1}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 0, specs)
	require.NoError(t, err)
	assert.False(t, result.Valid)
}

func TestSchemaValidator_UnknownSchema_ReturnsError(t *testing.T) {
	r := schema.NewRegistry(nil)
	v := schema.NewSchemaValidator(r)

	_, err := v.Validate(context.Background(), models.ProductTypeElectronics, 0, json.RawMessage(`{}`))
	assert.Error(t, err)
}

func TestSchemaValidator_SpecificVersion(t *testing.T) {
	r := schema.NewRegistry(nil)
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 1))
	r.Seed(makeSeedSchema(models.ProductTypeTextile, 2))
	v := schema.NewSchemaValidator(r)

	specs := json.RawMessage(`{"chemistry":"LFP"}`)
	result, err := v.Validate(context.Background(), models.ProductTypeTextile, 1, specs)
	require.NoError(t, err)
	assert.True(t, result.Valid)
}
