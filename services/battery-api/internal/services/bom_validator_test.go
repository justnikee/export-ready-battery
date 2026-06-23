package services

import (
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestValidateBOM_EmptyValid(t *testing.T) {
	result := ValidateBOM(nil)
	assert.True(t, result.Valid)
	assert.Empty(t, result.Errors)
}

func TestValidateBOM_ValidTree(t *testing.T) {
	components := []models.Component{
		{ID: "pack-1", Name: "Pack A", ComponentType: "pack"},
		{ID: "mod-1", Name: "Module 1", ComponentType: "module", ParentID: strPtr("pack-1")},
		{ID: "cell-1", Name: "Cell 1", ComponentType: "cell", ParentID: strPtr("mod-1"), Chemistry: "NMC811"},
	}
	result := ValidateBOM(components)
	assert.True(t, result.Valid, "errors: %v", result.Errors)
}

func TestValidateBOM_MissingCellChemistry(t *testing.T) {
	components := []models.Component{
		{ID: "cell-1", Name: "Cell 1", ComponentType: "cell"},
	}
	result := ValidateBOM(components)
	assert.False(t, result.Valid)
	assert.Len(t, result.Errors, 1)
}

func TestValidateBOM_CycleDetected(t *testing.T) {
	components := []models.Component{
		{ID: "a", Name: "A", ComponentType: "pack", ParentID: strPtr("b")},
		{ID: "b", Name: "B", ComponentType: "module", ParentID: strPtr("a")},
	}
	result := ValidateBOM(components)
	assert.False(t, result.Valid)
	assert.NotEmpty(t, result.Errors)
}

func TestValidateBOM_UnknownParent(t *testing.T) {
	components := []models.Component{
		{ID: "mod-1", Name: "Module 1", ComponentType: "module", ParentID: strPtr("missing")},
	}
	result := ValidateBOM(components)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors[0], "unknown parent_id")
}

func TestValidateBOM_InvalidType(t *testing.T) {
	components := []models.Component{
		{ID: "x", Name: "X", ComponentType: "widget"},
	}
	result := ValidateBOM(components)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors[0], "invalid type")
}

func TestValidateBOM_DuplicateID(t *testing.T) {
	components := []models.Component{
		{ID: "dup", Name: "A", ComponentType: "cell", Chemistry: "LFP"},
		{ID: "dup", Name: "B", ComponentType: "cell", Chemistry: "LFP"},
	}
	result := ValidateBOM(components)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Errors[0], "duplicate")
}

func strPtr(s string) *string { return &s }
