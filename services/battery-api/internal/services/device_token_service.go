package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/repository"
)

var (
	ErrDeviceTokenNotFound = errors.New("device token not found or inactive")
	ErrDeviceTokenExpired  = errors.New("device token has expired")
	ErrBatchMismatch       = errors.New("passport does not belong to token's batch")
)

// DeviceTokenRepository defines the data access required for device token operations
type DeviceTokenRepository interface {
	CreateDeviceToken(ctx context.Context, token *repository.DeviceToken) error
	GetDeviceTokenByHash(ctx context.Context, hash string) (*repository.DeviceToken, error)
	ListDeviceTokens(ctx context.Context, tenantID uuid.UUID) ([]*repository.DeviceToken, error)
	RevokeDeviceToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	UpdateDeviceTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error
}

// DeviceTokenService handles BMS/IoT device token management
type DeviceTokenService struct {
	repo DeviceTokenRepository
}

// NewDeviceTokenService creates a new device token service
func NewDeviceTokenService(repo DeviceTokenRepository) *DeviceTokenService {
	return &DeviceTokenService{repo: repo}
}

// CreateTokenRequest contains the parameters for creating a device token
type CreateTokenRequest struct {
	TenantID    uuid.UUID  `json:"tenant_id"`
	Name        string     `json:"name"`
	BatchID     *uuid.UUID `json:"batch_id,omitempty"`
	Permissions string     `json:"permissions"`
	RateLimit   int        `json:"rate_limit"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// CreateTokenResult contains the result of creating a device token
type CreateTokenResult struct {
	Token    *repository.DeviceToken `json:"token"`
	RawToken string                  `json:"raw_token"` // Plaintext token, shown only once
}

// CreateToken generates a new device token and returns the plaintext token (shown once)
func (s *DeviceTokenService) CreateToken(ctx context.Context, req CreateTokenRequest) (*CreateTokenResult, error) {
	// Generate 32 bytes of randomness → 64 hex chars
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}
	rawToken := " erb_dt_" + hex.EncodeToString(rawBytes) // prefix for easy identification

	// Hash with SHA-256
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	// Defaults
	if req.Permissions == "" {
		req.Permissions = "write"
	}
	if req.RateLimit <= 0 {
		req.RateLimit = 60
	}

	now := time.Now().UTC()
	token := &repository.DeviceToken{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		TokenHash:   tokenHash,
		Name:        req.Name,
		BatchID:     req.BatchID,
		Permissions: req.Permissions,
		IsActive:    true,
		RateLimit:   req.RateLimit,
		ExpiresAt:   req.ExpiresAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.repo.CreateDeviceToken(ctx, token); err != nil {
		return nil, fmt.Errorf("failed to persist device token: %w", err)
	}

	return &CreateTokenResult{
		Token:    token,
		RawToken: rawToken,
	}, nil
}

// ValidateToken looks up a device token by raw token string and validates it
func (s *DeviceTokenService) ValidateToken(ctx context.Context, rawToken string) (*repository.DeviceToken, error) {
	// Hash the raw token
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	token, err := s.repo.GetDeviceTokenByHash(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("failed to look up device token: %w", err)
	}
	if token == nil {
		return nil, ErrDeviceTokenNotFound
	}

	// Check expiry
	if token.ExpiresAt != nil && token.ExpiresAt.Before(time.Now().UTC()) {
		return nil, ErrDeviceTokenExpired
	}

	// Update last used (fire-and-forget, don't block on it)
	go func() {
		_ = s.repo.UpdateDeviceTokenLastUsed(context.Background(), token.ID)
	}()

	return token, nil
}

// ListTokens returns all tokens for a tenant (hashes are masked in serialization)
func (s *DeviceTokenService) ListTokens(ctx context.Context, tenantID uuid.UUID) ([]*repository.DeviceToken, error) {
	return s.repo.ListDeviceTokens(ctx, tenantID)
}

// RevokeToken deactivates a device token
func (s *DeviceTokenService) RevokeToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	return s.repo.RevokeDeviceToken(ctx, id, tenantID)
}
