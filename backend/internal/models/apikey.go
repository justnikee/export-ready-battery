package models

import (
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// API KEY MODELS
// ============================================================================

// APIKey represents an API key for external integrations
type APIKey struct {
	ID            uuid.UUID  `json:"id"`
	TenantID      uuid.UUID  `json:"tenant_id"`
	Name          string     `json:"name"`
	KeyHash       string     `json:"-"` // Never expose hash
	KeyPrefix     string     `json:"key_prefix"`
	Scope         string     `json:"scope"`           // "read" or "write"
	RateLimitTier string     `json:"rate_limit_tier"` // "starter" or "production"
	LastUsedAt    *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	IsActive      bool       `json:"is_active"`
	CreatedAt     time.Time  `json:"created_at"`
}

// APIKeyWithSecret contains the full key (only returned on creation)
type APIKeyWithSecret struct {
	APIKey
	Key string `json:"key"` // Full key, only shown once
}

// CreateAPIKeyRequest is the request body for creating an API key
type CreateAPIKeyRequest struct {
	Name          string `json:"name"`
	Scope         string `json:"scope"`                     // "read" or "write"
	RateLimitTier string `json:"rate_limit_tier"`           // "starter" or "production"
	ExpiresInDays *int   `json:"expires_in_days,omitempty"` // nil = never expires
}

// UpdateAPIKeyRequest is the request body for updating an API key
type UpdateAPIKeyRequest struct {
	Name     *string `json:"name,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}

// APIKeyUsage tracks rate limiting for an API key
type APIKeyUsage struct {
	ID           uuid.UUID `json:"id"`
	APIKeyID     uuid.UUID `json:"api_key_id"`
	Endpoint     string    `json:"endpoint"`
	RequestCount int       `json:"request_count"`
	WindowStart  time.Time `json:"window_start"`
}

// RateLimitConfig defines rate limits per tier
type RateLimitConfig struct {
	ReadLimit  int // requests per hour for GET
	WriteLimit int // requests per hour for POST/PUT/DELETE
}

// GetRateLimits returns the rate limits for a tier
func GetRateLimits(tier string) RateLimitConfig {
	switch tier {
	case "production":
		return RateLimitConfig{
			ReadLimit:  1000,
			WriteLimit: 500,
		}
	default: // "starter"
		return RateLimitConfig{
			ReadLimit:  100,
			WriteLimit: 100,
		}
	}
}

// ValidScopes returns valid API key scopes
func ValidScopes() []string {
	return []string{"read", "write"}
}

// IsValidScope checks if a scope is valid
func IsValidScope(scope string) bool {
	for _, s := range ValidScopes() {
		if s == scope {
			return true
		}
	}
	return false
}
