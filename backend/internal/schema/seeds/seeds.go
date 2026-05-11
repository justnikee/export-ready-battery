// Package seeds provides pre-built ProductSchema seeds that are embedded at
// compile time. Callers should register these seeds in the schema.Registry at
// application startup so schema validation works even before the database is
// populated.
package seeds

import (
	_ "embed"
	"encoding/json"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
)

//go:embed battery_v1.json
var batteryV1JSON []byte

// batteryV1DisplayConfig defines field-level access rules for battery specs.
// Fields not listed here default to PUBLIC visibility.
var batteryV1DisplayConfig = models.DisplayConfig{
	FieldVisibility: map[string]models.FieldAccess{
		// Sensitive supply-chain data — only for partners and regulators
		"sale_price_inr": {
			MinTier:     models.AccessTierPartner,
			Description: "Commercial pricing is restricted to supply-chain partners",
		},
		"import_cost_inr": {
			MinTier:     models.AccessTierPartner,
			Description: "Import cost data is restricted to supply-chain partners",
		},
		// Exact composition percentages — regulators only
		"material_composition": {
			MinTier:     models.AccessTierPublic,
			Description: "Material composition is public per EU Art 8",
		},
		// DVA audit details — partner tier
		"domestic_value_add": {
			MinTier:     models.AccessTierPartner,
			Redacted:    true,
			Description: "PLI DVA percentage visible to partners and regulators",
		},
		// Full manufacturer address — partner tier
		"manufacturer_address": {
			MinTier:     models.AccessTierPartner,
			Redacted:    true,
			Description: "Factory address restricted for supply-chain security",
		},
	},
}

// LoadBatteryV1 parses the embedded battery_v1.json and returns a ProductSchema
// ready to register as a seed. An error is returned only if the embedded JSON is
// malformed (which would be a compile-time bug, not a runtime error).
func LoadBatteryV1() (*models.ProductSchema, error) {
	// Validate the JSON is well-formed (schema.json must always be an object).
	var schemaObj map[string]any
	if err := json.Unmarshal(batteryV1JSON, &schemaObj); err != nil {
		return nil, err
	}

	dcJSON, _ := json.Marshal(batteryV1DisplayConfig)

	return &models.ProductSchema{
		ID:            uuid.New(),
		ProductType:   models.ProductTypeBattery,
		Version:       1,
		SchemaJSON:    json.RawMessage(batteryV1JSON),
		DisplayConfig: json.RawMessage(dcJSON),
		IsActive:      true,
		CreatedAt:     time.Now(),
	}, nil
}
