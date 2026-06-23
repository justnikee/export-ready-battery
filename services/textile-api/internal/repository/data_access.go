package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// DataAccessToken represents an external access token for regulators/OEMs.
type DataAccessToken struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	TokenHash   string     `json:"-"` // never exposed
	Label       string     `json:"label"`
	GranteeName string     `json:"grantee_name"`
	GranteeOrg  string     `json:"grantee_org,omitempty"`
	AccessTier  string     `json:"access_tier"` // PARTNER or REGULATOR
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsActive    bool       `json:"is_active"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// CreateDataAccessTokenRequest contains params for inserting a new data access token.
type CreateDataAccessTokenRequest struct {
	TenantID    uuid.UUID
	TokenHash   string
	Label       string
	GranteeName string
	GranteeOrg  string
	AccessTier  string // PARTNER or REGULATOR
	ExpiresAt   *time.Time
}

// CreateDataAccessToken inserts a new data access token
func (r *Repository) CreateDataAccessToken(ctx context.Context, req CreateDataAccessTokenRequest) (*DataAccessToken, error) {
	id := uuid.New()
	query := `INSERT INTO data_access_tokens
		(id, tenant_id, token_hash, label, grantee_name, grantee_org, access_tier, expires_at, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
		RETURNING id, tenant_id, label, grantee_name, grantee_org, access_tier, expires_at, is_active, created_at`

	token := &DataAccessToken{}
	err := r.db.Pool.QueryRow(ctx, query,
		id, req.TenantID, req.TokenHash, req.Label, req.GranteeName, req.GranteeOrg, req.AccessTier, req.ExpiresAt,
	).Scan(
		&token.ID, &token.TenantID, &token.Label, &token.GranteeName,
		&token.GranteeOrg, &token.AccessTier, &token.ExpiresAt, &token.IsActive, &token.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create data access token: %w", err)
	}
	return token, nil
}

// GetDataAccessTokenByHash retrieves a token record by its SHA-256 hash.
func (r *Repository) GetDataAccessTokenByHash(ctx context.Context, tokenHash string) (*DataAccessToken, error) {
	query := `SELECT id, tenant_id, token_hash, label, grantee_name, grantee_org, access_tier, expires_at, is_active, last_used_at, created_at
		FROM data_access_tokens
		WHERE token_hash = $1 AND is_active = true`

	token := &DataAccessToken{}
	err := r.db.Pool.QueryRow(ctx, query, tokenHash).Scan(
		&token.ID, &token.TenantID, &token.TokenHash, &token.Label,
		&token.GranteeName, &token.GranteeOrg, &token.AccessTier,
		&token.ExpiresAt, &token.IsActive, &token.LastUsedAt, &token.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get data access token by hash: %w", err)
	}
	return token, nil
}

// ListDataAccessTokens lists all data access tokens for a tenant.
func (r *Repository) ListDataAccessTokens(ctx context.Context, tenantID uuid.UUID) ([]*DataAccessToken, error) {
	query := `SELECT id, tenant_id, label, grantee_name, grantee_org, access_tier, expires_at, is_active, last_used_at, created_at
		FROM data_access_tokens
		WHERE tenant_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list data access tokens: %w", err)
	}
	defer rows.Close()

	var tokens []*DataAccessToken
	for rows.Next() {
		t := &DataAccessToken{}
		if err := rows.Scan(
			&t.ID, &t.TenantID, &t.Label, &t.GranteeName, &t.GranteeOrg,
			&t.AccessTier, &t.ExpiresAt, &t.IsActive, &t.LastUsedAt, &t.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan data access token: %w", err)
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

// RevokeDataAccessToken deactivates a token (soft delete).
func (r *Repository) RevokeDataAccessToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	query := `UPDATE data_access_tokens SET is_active = false WHERE id = $1 AND tenant_id = $2`
	result, err := r.db.Pool.Exec(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to revoke data access token: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("data access token not found or already revoked")
	}
	return nil
}

// UpdateDataAccessTokenLastUsed updates the last_used_at timestamp.
func (r *Repository) UpdateDataAccessTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `UPDATE data_access_tokens SET last_used_at = NOW() WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, tokenID)
	return err
}
