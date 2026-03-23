// Package seeds provides pre-built ProductSchema seeds that are embedded at
// compile time. Callers should register these seeds in the schema.Registry at
// application startup so schema validation works even before the database is
// populated.
package seeds

import (
	_ "embed"
	"encoding/json"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

//go:embed battery_v1.json
var batteryV1JSON []byte

// LoadBatteryV1 parses the embedded battery_v1.json and returns a ProductSchema
// ready to register as a seed. An error is returned only if the embedded JSON is
// malformed (which would be a compile-time bug, not a runtime error).
func LoadBatteryV1() (*models.ProductSchema, error) {
	// Validate the JSON is well-formed (schema.json must always be an object).
	var schemaObj map[string]any
	if err := json.Unmarshal(batteryV1JSON, &schemaObj); err != nil {
		return nil, err
	}

	return &models.ProductSchema{
		ID:          uuid.New(),
		ProductType: models.ProductTypeBattery,
		Version:     1,
		SchemaJSON:  json.RawMessage(batteryV1JSON),
		IsActive:    true,
		CreatedAt:   time.Now(),
	}, nil
}
