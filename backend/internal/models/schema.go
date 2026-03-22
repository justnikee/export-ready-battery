package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ProductSchema stores the JSON Schema definition for a product type.
// Used by the schema registry to validate specs JSONB and drive dynamic form rendering.
type ProductSchema struct {
	ID               uuid.UUID       `json:"id"`
	ProductType      ProductType     `json:"product_type"`
	Version          int             `json:"version"`
	SchemaJSON       json.RawMessage `json:"schema_json"`        // JSON Schema for specs validation
	DisplayConfig    json.RawMessage `json:"display_config"`     // UI rendering hints (field order, sections, labels)
	ComplianceFields json.RawMessage `json:"compliance_fields"`  // Per-market required fields with effective dates
	IsActive         bool            `json:"is_active"`
	CreatedAt        time.Time       `json:"created_at"`
}

// ComplianceFieldRequirement defines when a field becomes mandatory for a market.
type ComplianceFieldRequirement struct {
	FieldPath     string     `json:"field_path"`      // JSON path: "material_composition.cobalt_pct"
	Market        string     `json:"market"`           // "EU", "INDIA", "GLOBAL"
	Required      bool       `json:"required"`
	EffectiveFrom *time.Time `json:"effective_from,omitempty"` // Regulation effective date
	EffectiveTo   *time.Time `json:"effective_to,omitempty"`   // Sunset date (nil = no expiry)
	RegReference  string     `json:"reg_reference,omitempty"`  // "EU 2023/1542 Art 7(1)"
}
