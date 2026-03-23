package compliance

import (
	"encoding/json"

	"exportready-battery/internal/models"
)

// Validator is the core interface every compliance module must implement.
// specs is the product's raw JSONB specification (as stored in the database).
type Validator interface {
	Validate(specs json.RawMessage) (Result, error)
}

// BatchValidator extends Validator with access to structured batch and tenant context.
// Battery validators implement this interface so they can check both product specs
// and the tenant's regulatory credentials (EPR, BIS, IEC codes, etc.) in one pass.
type BatchValidator interface {
	Validator
	ValidateBatch(batch *models.Batch, tenant *models.Tenant) (Result, error)
}
