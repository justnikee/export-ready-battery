package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// DeviceToken represents a BMS/IoT device authentication token
type DeviceToken struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	TokenHash   string     `json:"-"` // SHA-256 hex, never serialized
	Name        string     `json:"name"`
	BatchID     *uuid.UUID `json:"batch_id,omitempty"`
	Permissions string     `json:"permissions"`
	IsActive    bool       `json:"is_active"`
	RateLimit   int        `json:"rate_limit"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// CreateDeviceToken inserts a new device token
func (r *Repository) CreateDeviceToken(ctx context.Context, token *DeviceToken) error {
	query := `
		INSERT INTO device_tokens (id, tenant_id, token_hash, name, batch_id, permissions, is_active, rate_limit, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.Pool.Exec(ctx, query,
		token.ID, token.TenantID, token.TokenHash, token.Name,
		token.BatchID, token.Permissions, token.IsActive,
		token.RateLimit, token.ExpiresAt, token.CreatedAt, token.UpdatedAt,
	)
	return err
}

// GetDeviceTokenByHash retrieves an active device token by its SHA-256 hash
func (r *Repository) GetDeviceTokenByHash(ctx context.Context, hash string) (*DeviceToken, error) {
	query := `
		SELECT id, tenant_id, token_hash, name, batch_id, permissions, is_active, rate_limit, expires_at, last_used_at, created_at, updated_at
		FROM device_tokens
		WHERE token_hash = $1 AND is_active = true`

	token := &DeviceToken{}
	err := r.db.Pool.QueryRow(ctx, query, hash).Scan(
		&token.ID, &token.TenantID, &token.TokenHash, &token.Name,
		&token.BatchID, &token.Permissions, &token.IsActive,
		&token.RateLimit, &token.ExpiresAt, &token.LastUsedAt,
		&token.CreatedAt, &token.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return token, err
}

// ListDeviceTokens retrieves all device tokens for a tenant
func (r *Repository) ListDeviceTokens(ctx context.Context, tenantID uuid.UUID) ([]*DeviceToken, error) {
	query := `
		SELECT id, tenant_id, token_hash, name, batch_id, permissions, is_active, rate_limit, expires_at, last_used_at, created_at, updated_at
		FROM device_tokens
		WHERE tenant_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []*DeviceToken
	for rows.Next() {
		t := &DeviceToken{}
		if err := rows.Scan(
			&t.ID, &t.TenantID, &t.TokenHash, &t.Name,
			&t.BatchID, &t.Permissions, &t.IsActive,
			&t.RateLimit, &t.ExpiresAt, &t.LastUsedAt,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

// RevokeDeviceToken deactivates a device token
func (r *Repository) RevokeDeviceToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	query := `UPDATE device_tokens SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`
	tag, err := r.db.Pool.Exec(ctx, query, id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// UpdateDeviceTokenLastUsed updates the last_used_at timestamp
func (r *Repository) UpdateDeviceTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `UPDATE device_tokens SET last_used_at = NOW() WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, tokenID)
	return err
}
