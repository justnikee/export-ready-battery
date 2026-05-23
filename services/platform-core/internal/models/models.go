package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// TENANT
// ============================================================================

// Tenant represents a company using the platform
type Tenant struct {
	ID           uuid.UUID   `json:"id"`
	CompanyName  string      `json:"company_name"`
	Address      string      `json:"address,omitempty"`
	LogoURL      string      `json:"logo_url,omitempty"`
	SupportEmail string      `json:"support_email,omitempty"`
	Website      string      `json:"website,omitempty"`
	ProductType  ProductType `json:"product_type"`
	CreatedAt    time.Time   `json:"created_at"`

	// Quota System (Monetization)
	QuotaBalance int    `json:"quota_balance"` // Batch activation slots available
	PlanType     string `json:"plan_type"`     // STARTER, GROWTH, ENTERPRISE

	// Onboarding Status
	OnboardingCompleted bool `json:"onboarding_completed"` // Whether user completed profile setup

	// Field Visibility Config stored as JSONB.
	DataVisibility json.RawMessage `json:"data_visibility,omitempty"`
}

// BaseProfileRequest holds shared profile fields for all product types.
type BaseProfileRequest struct {
	CompanyName    string          `json:"company_name"`
	Address        string          `json:"address"`
	LogoURL        string          `json:"logo_url"`
	SupportEmail   string          `json:"support_email"`
	Website        string          `json:"website"`
	DataVisibility json.RawMessage `json:"data_visibility"`
}

// UpdateProfileRequest represents the payload for updating tenant profile.
type UpdateProfileRequest struct {
	BaseProfileRequest
}

// ============================================================================
// TRANSACTIONS (QUOTA LEDGER)
// ============================================================================

// Transaction represents a quota usage event
type Transaction struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	Description string     `json:"description"`
	QuotaChange int        `json:"quota_change"` // Negative for usage, positive for top-up
	BatchID     *uuid.UUID `json:"batch_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
