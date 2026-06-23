package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/anvayalabs/textile-api/internal/repository"

	"github.com/google/uuid"
)

// DataAccessService manages external data access tokens.
type DataAccessService struct {
	repo *repository.Repository
}

// NewDataAccessService creates a new DataAccessService.
func NewDataAccessService(repo *repository.Repository) *DataAccessService {
	return &DataAccessService{repo: repo}
}

// CreateDataAccessTokenRequest is the input for creating a data access token.
type CreateDataAccessTokenRequest struct {
	TenantID    uuid.UUID
	Label       string
	GranteeName string
	GranteeOrg  string
	AccessTier  string // PARTNER or REGULATOR
	ExpiresIn   *time.Duration
}

// CreateDataAccessTokenResponse is returned after creating a token — includes the raw token only once.
type CreateDataAccessTokenResponse struct {
	Token    string                      `json:"token"` // raw token, shown once
	Metadata *repository.DataAccessToken `json:"metadata"`
}

// GenerateToken creates a new data access token, stores its hash, and returns the raw token.
func (s *DataAccessService) GenerateToken(ctx context.Context, req CreateDataAccessTokenRequest) (*CreateDataAccessTokenResponse, error) {
	// Validate access tier
	if req.AccessTier != "PARTNER" && req.AccessTier != "REGULATOR" {
		return nil, fmt.Errorf("invalid access_tier: must be PARTNER or REGULATOR")
	}

	// Generate 32-byte cryptographic random token
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, fmt.Errorf("failed to generate random token: %w", err)
	}
	rawToken := "dat_" + hex.EncodeToString(rawBytes) // dat_ prefix for "data access token"

	// SHA-256 hash for storage
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	// Calculate expiry
	var expiresAt *time.Time
	if req.ExpiresIn != nil {
		t := time.Now().Add(*req.ExpiresIn)
		expiresAt = &t
	}

	// Store in DB
	dbReq := repository.CreateDataAccessTokenRequest{
		TenantID:    req.TenantID,
		TokenHash:   tokenHash,
		Label:       req.Label,
		GranteeName: req.GranteeName,
		GranteeOrg:  req.GranteeOrg,
		AccessTier:  req.AccessTier,
		ExpiresAt:   expiresAt,
	}

	metadata, err := s.repo.CreateDataAccessToken(ctx, dbReq)
	if err != nil {
		return nil, err
	}

	return &CreateDataAccessTokenResponse{
		Token:    rawToken,
		Metadata: metadata,
	}, nil
}

// ValidateToken hashes the raw token, looks it up, checks expiry, and returns the record.
func (s *DataAccessService) ValidateToken(ctx context.Context, rawToken string) (*repository.DataAccessToken, error) {
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	record, err := s.repo.GetDataAccessTokenByHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, nil // not found
	}

	// Check expiry
	if record.ExpiresAt != nil && time.Now().After(*record.ExpiresAt) {
		return nil, nil // expired
	}

	// Update last used (fire-and-forget)
	go func() {
		_ = s.repo.UpdateDataAccessTokenLastUsed(context.Background(), record.ID)
	}()

	return record, nil
}

// ListTokens returns all tokens for a tenant.
func (s *DataAccessService) ListTokens(ctx context.Context, tenantID uuid.UUID) ([]*repository.DataAccessToken, error) {
	return s.repo.ListDataAccessTokens(ctx, tenantID)
}

// RevokeToken deactivates a token.
func (s *DataAccessService) RevokeToken(ctx context.Context, tokenID uuid.UUID, tenantID uuid.UUID) error {
	return s.repo.RevokeDataAccessToken(ctx, tokenID, tenantID)
}
