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

// ============================================================================
// DISPLAY CONFIG — Field-level access control per access tier
// ============================================================================

// DisplayConfig defines which spec fields are visible at each access tier.
// Fields NOT listed default to PUBLIC visibility.
type DisplayConfig struct {
	FieldVisibility map[string]FieldAccess `json:"field_visibility"`
}

// FieldAccess defines the minimum access tier required to see a field.
type FieldAccess struct {
	MinTier     AccessTier `json:"min_tier"`              // PUBLIC, PARTNER, or REGULATOR
	Redacted    bool       `json:"redacted,omitempty"`    // If true, show "[Restricted]" instead of hiding entirely
	Description string     `json:"description,omitempty"` // Why this field is restricted
}

// ParseDisplayConfig parses a JSON display_config into a DisplayConfig struct.
// Returns an empty config (all fields visible) if raw is nil or unparseable.
func ParseDisplayConfig(raw json.RawMessage) DisplayConfig {
	if len(raw) == 0 {
		return DisplayConfig{}
	}
	var dc DisplayConfig
	if err := json.Unmarshal(raw, &dc); err != nil {
		return DisplayConfig{}
	}
	return dc
}

// IsFieldVisible returns true if the given field is visible at the specified tier.
// If the field has no explicit rule, it defaults to PUBLIC (visible to all).
func (dc DisplayConfig) IsFieldVisible(field string, tier AccessTier) bool {
	if dc.FieldVisibility == nil {
		return true
	}
	fa, ok := dc.FieldVisibility[field]
	if !ok {
		return true // no restriction = public
	}
	return tierLevel(tier) >= tierLevel(fa.MinTier)
}

// tierLevel returns a numeric level for comparison. Higher = more access.
func tierLevel(t AccessTier) int {
	switch t {
	case AccessTierRegulator:
		return 3
	case AccessTierPartner:
		return 2
	case AccessTierPublic:
		return 1
	default:
		return 0
	}
}
