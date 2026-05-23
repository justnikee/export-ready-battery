package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// TextileTenantProfile holds textile-specific tenant data stored in textile_tenant_profiles.
type TextileTenantProfile struct {
	TenantID           uuid.UUID       `json:"tenant_id"`
	FacilityType       string          `json:"facility_type,omitempty"`
	SupplyChainTier    string          `json:"supply_chain_tier,omitempty"`
	PrimaryMarkets     json.RawMessage `json:"primary_markets,omitempty"`
	DefaultFiberTypes  json.RawMessage `json:"default_fiber_types,omitempty"`
	Certifications     json.RawMessage `json:"certifications,omitempty"`
	ComplianceDefaults json.RawMessage `json:"compliance_defaults,omitempty"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}
