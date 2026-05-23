package schema

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anvayalabs/textile-api/internal/models"
)

// FieldError represents a single spec validation error.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationResult is the output of a schema validation check.
type ValidationResult struct {
	Valid  bool         `json:"valid"`
	Errors []FieldError `json:"errors,omitempty"`
}

// SchemaValidator validates product specs JSON against a schema stored in the Registry.
type SchemaValidator struct {
	registry *Registry
}

// NewSchemaValidator creates a SchemaValidator backed by the given Registry.
func NewSchemaValidator(r *Registry) *SchemaValidator {
	return &SchemaValidator{registry: r}
}

// Validate checks that specs conforms to the schema for the given product type.
// If version is 0 the active (latest) schema is used.
func (v *SchemaValidator) Validate(ctx context.Context, pt models.ProductType, version int, specs json.RawMessage) (ValidationResult, error) {
	var s *models.ProductSchema
	var err error
	if version > 0 {
		s, err = v.registry.GetByVersion(ctx, pt, version)
	} else {
		s, err = v.registry.GetActive(ctx, pt)
	}
	if err != nil {
		return ValidationResult{}, err
	}
	return validateAgainstSchema(s.SchemaJSON, specs)
}

// validateAgainstSchema runs a lightweight structural check of data against schemaJSON.
//
// Supported JSON Schema keywords: required, type, minLength, maxLength,
// minimum, maximum, enum, items (array type only).
// Object nesting beyond the top level is not recursively validated here;
// validators in the compliance engine handle deep field checks.
func validateAgainstSchema(schemaJSON, dataJSON json.RawMessage) (ValidationResult, error) {
	var schema map[string]any
	if err := json.Unmarshal(schemaJSON, &schema); err != nil {
		return ValidationResult{}, fmt.Errorf("schema: malformed schema JSON: %w", err)
	}

	var data map[string]any
	if err := json.Unmarshal(dataJSON, &data); err != nil {
		return ValidationResult{}, fmt.Errorf("schema: malformed data JSON: %w", err)
	}

	var errs []FieldError

	// Check required fields.
	if required, ok := schema["required"].([]any); ok {
		for _, req := range required {
			fieldName, _ := req.(string)
			if fieldName == "" {
				continue
			}
			val, present := data[fieldName]
			if !present || isZeroValue(val) {
				errs = append(errs, FieldError{
					Field:   fieldName,
					Message: fmt.Sprintf("field %q is required", fieldName),
				})
			}
		}
	}

	// Check per-property type and constraint violations.
	if props, ok := schema["properties"].(map[string]any); ok {
		for fieldName, propDef := range props {
			propMap, ok := propDef.(map[string]any)
			if !ok {
				continue
			}
			val, present := data[fieldName]
			if !present {
				continue // missing required fields already caught above
			}
			errs = append(errs, validateProperty(fieldName, val, propMap)...)
		}
	}

	return ValidationResult{Valid: len(errs) == 0, Errors: errs}, nil
}

// validateProperty checks a single field value against its property definition.
func validateProperty(name string, val any, propDef map[string]any) []FieldError {
	var errs []FieldError

	expectedType, _ := propDef["type"].(string)
	switch expectedType {
	case "string":
		s, ok := val.(string)
		if !ok {
			return append(errs, FieldError{name, fmt.Sprintf("field %q must be a string", name)})
		}
		if minLen, ok := asFloat64(propDef["minLength"]); ok && float64(len(s)) < minLen {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be at least %.0f characters long", name, minLen)})
		}
		if maxLen, ok := asFloat64(propDef["maxLength"]); ok && float64(len(s)) > maxLen {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must not exceed %.0f characters", name, maxLen)})
		}
		if enum, ok := propDef["enum"].([]any); ok {
			if !inEnum(val, enum) {
				errs = append(errs, FieldError{name, fmt.Sprintf("field %q has an invalid value", name)})
			}
		}

	case "number", "integer":
		n, ok := toFloat64(val)
		if !ok {
			return append(errs, FieldError{name, fmt.Sprintf("field %q must be a number", name)})
		}
		if min, ok := asFloat64(propDef["minimum"]); ok && n < min {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be ≥ %.4g", name, min)})
		}
		if max, ok := asFloat64(propDef["maximum"]); ok && n > max {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be ≤ %.4g", name, max)})
		}

	case "boolean":
		if _, ok := val.(bool); !ok {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be a boolean", name)})
		}

	case "array":
		if _, ok := val.([]any); !ok {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be an array", name)})
		}

	case "object":
		if _, ok := val.(map[string]any); !ok {
			errs = append(errs, FieldError{name, fmt.Sprintf("field %q must be an object", name)})
		}
	}

	return errs
}

// ---- internal helpers --------------------------------------------------------

func isZeroValue(v any) bool {
	if v == nil {
		return true
	}
	switch t := v.(type) {
	case string:
		return t == ""
	case float64:
		return t == 0
	}
	return false
}

func asFloat64(v any) (float64, bool) {
	if v == nil {
		return 0, false
	}
	f, ok := v.(float64)
	return f, ok
}

func toFloat64(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	}
	return 0, false
}

func inEnum(val any, enum []any) bool {
	for _, e := range enum {
		if e == val {
			return true
		}
	}
	return false
}
