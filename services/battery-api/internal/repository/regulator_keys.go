package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// RegulatorAPIKey is a platform-managed Art. 78 regulator credential.
// Token hash is never exposed in JSON responses.
type RegulatorAPIKey struct {
	ID           uuid.UUID   `json:"id"`
	Name         string      `json:"name"`
	Organization string      `json:"organization"`
	KeyHash      string      `json:"-"`
	KeyPrefix    string      `json:"key_prefix"`
	TenantIDs    []uuid.UUID `json:"tenant_ids"` // empty = all tenants
	Markets      []string    `json:"markets"`    // empty = all markets
	IsActive     bool        `json:"is_active"`
	ExpiresAt    *time.Time  `json:"expires_at,omitempty"`
	LastUsedAt   *time.Time  `json:"last_used_at,omitempty"`
	RevokedAt    *time.Time  `json:"revoked_at,omitempty"`
	Notes        string      `json:"notes,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

// CreateRegulatorAPIKeyRequest inserts a new hashed regulator key.
type CreateRegulatorAPIKeyRequest struct {
	Name         string
	Organization string
	KeyHash      string
	KeyPrefix    string
	TenantIDs    []uuid.UUID
	Markets      []string
	ExpiresAt    *time.Time
	Notes        string
}

// RegulatorAccessLogEntry records a regulator-tier passport read attempt.
type RegulatorAccessLogEntry struct {
	ID           uuid.UUID  `json:"id"`
	KeyID        *uuid.UUID `json:"key_id,omitempty"`
	KeySource    string     `json:"key_source"` // db | env | data_access
	KeyName      string     `json:"key_name"`
	PassportID   *uuid.UUID `json:"passport_id,omitempty"`
	TenantID     *uuid.UUID `json:"tenant_id,omitempty"`
	MarketRegion string     `json:"market_region"`
	ClientIP     string     `json:"client_ip"`
	UserAgent    string     `json:"user_agent"`
	Outcome      string     `json:"outcome"` // allowed | denied_scope | denied_invalid
	CreatedAt    time.Time  `json:"created_at"`
}

// InsertRegulatorAccessLogRequest is the write payload for access audit rows.
type InsertRegulatorAccessLogRequest struct {
	KeyID        *uuid.UUID
	KeySource    string
	KeyName      string
	PassportID   *uuid.UUID
	TenantID     *uuid.UUID
	MarketRegion string
	ClientIP     string
	UserAgent    string
	Outcome      string
}

// CreateRegulatorAPIKey stores a new regulator credential (hash only).
func (r *Repository) CreateRegulatorAPIKey(ctx context.Context, req CreateRegulatorAPIKeyRequest) (*RegulatorAPIKey, error) {
	if req.TenantIDs == nil {
		req.TenantIDs = []uuid.UUID{}
	}
	if req.Markets == nil {
		req.Markets = []string{}
	}

	query := `
		INSERT INTO regulator_api_keys
			(name, organization, key_hash, key_prefix, tenant_ids, markets, expires_at, notes, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
		RETURNING id, name, organization, key_prefix, tenant_ids, markets, is_active, expires_at, last_used_at, revoked_at, notes, created_at`

	key := &RegulatorAPIKey{}
	err := r.db.Pool.QueryRow(ctx, query,
		req.Name, req.Organization, req.KeyHash, req.KeyPrefix,
		req.TenantIDs, req.Markets, req.ExpiresAt, req.Notes,
	).Scan(
		&key.ID, &key.Name, &key.Organization, &key.KeyPrefix,
		&key.TenantIDs, &key.Markets, &key.IsActive, &key.ExpiresAt, &key.LastUsedAt, &key.RevokedAt, &key.Notes, &key.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create regulator api key: %w", err)
	}
	if key.TenantIDs == nil {
		key.TenantIDs = []uuid.UUID{}
	}
	if key.Markets == nil {
		key.Markets = []string{}
	}
	return key, nil
}

// GetRegulatorAPIKeyByHash returns an active, non-revoked key by SHA-256 hex hash.
func (r *Repository) GetRegulatorAPIKeyByHash(ctx context.Context, keyHash string) (*RegulatorAPIKey, error) {
	query := `
		SELECT id, name, organization, key_hash, key_prefix, tenant_ids, markets,
		       is_active, expires_at, last_used_at, revoked_at, notes, created_at
		FROM regulator_api_keys
		WHERE key_hash = $1 AND is_active = true AND revoked_at IS NULL`

	key := &RegulatorAPIKey{}
	err := r.db.Pool.QueryRow(ctx, query, keyHash).Scan(
		&key.ID, &key.Name, &key.Organization, &key.KeyHash, &key.KeyPrefix,
		&key.TenantIDs, &key.Markets, &key.IsActive, &key.ExpiresAt, &key.LastUsedAt, &key.RevokedAt, &key.Notes, &key.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get regulator api key by hash: %w", err)
	}
	if key.TenantIDs == nil {
		key.TenantIDs = []uuid.UUID{}
	}
	if key.Markets == nil {
		key.Markets = []string{}
	}
	return key, nil
}

// ListRegulatorAPIKeys returns all keys (including revoked) newest first.
func (r *Repository) ListRegulatorAPIKeys(ctx context.Context) ([]*RegulatorAPIKey, error) {
	query := `
		SELECT id, name, organization, key_prefix, tenant_ids, markets,
		       is_active, expires_at, last_used_at, revoked_at, notes, created_at
		FROM regulator_api_keys
		ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list regulator api keys: %w", err)
	}
	defer rows.Close()

	var out []*RegulatorAPIKey
	for rows.Next() {
		key := &RegulatorAPIKey{}
		if err := rows.Scan(
			&key.ID, &key.Name, &key.Organization, &key.KeyPrefix,
			&key.TenantIDs, &key.Markets, &key.IsActive, &key.ExpiresAt, &key.LastUsedAt, &key.RevokedAt, &key.Notes, &key.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan regulator api key: %w", err)
		}
		if key.TenantIDs == nil {
			key.TenantIDs = []uuid.UUID{}
		}
		if key.Markets == nil {
			key.Markets = []string{}
		}
		out = append(out, key)
	}
	return out, rows.Err()
}

// RevokeRegulatorAPIKey soft-revokes a key.
func (r *Repository) RevokeRegulatorAPIKey(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE regulator_api_keys
		SET is_active = false, revoked_at = NOW()
		WHERE id = $1 AND is_active = true`
	result, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("revoke regulator api key: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("regulator api key not found or already revoked")
	}
	return nil
}

// TouchRegulatorAPIKeyLastUsed updates last_used_at.
func (r *Repository) TouchRegulatorAPIKeyLastUsed(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx, `UPDATE regulator_api_keys SET last_used_at = NOW() WHERE id = $1`, id)
	return err
}

// InsertRegulatorAccessLog appends an audit row for a regulator access attempt.
func (r *Repository) InsertRegulatorAccessLog(ctx context.Context, req InsertRegulatorAccessLogRequest) error {
	query := `
		INSERT INTO regulator_access_log
			(key_id, key_source, key_name, passport_id, tenant_id, market_region, client_ip, user_agent, outcome, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`
	_, err := r.db.Pool.Exec(ctx, query,
		req.KeyID, req.KeySource, req.KeyName, req.PassportID, req.TenantID,
		req.MarketRegion, req.ClientIP, req.UserAgent, req.Outcome,
	)
	if err != nil {
		return fmt.Errorf("insert regulator access log: %w", err)
	}
	return nil
}

// ListRegulatorAccessLogs returns recent audit rows (newest first).
func (r *Repository) ListRegulatorAccessLogs(ctx context.Context, limit int) ([]*RegulatorAccessLogEntry, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	query := `
		SELECT id, key_id, key_source, key_name, passport_id, tenant_id, market_region,
		       client_ip, user_agent, outcome, created_at
		FROM regulator_access_log
		ORDER BY created_at DESC
		LIMIT $1`

	rows, err := r.db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list regulator access logs: %w", err)
	}
	defer rows.Close()

	var out []*RegulatorAccessLogEntry
	for rows.Next() {
		e := &RegulatorAccessLogEntry{}
		if err := rows.Scan(
			&e.ID, &e.KeyID, &e.KeySource, &e.KeyName, &e.PassportID, &e.TenantID,
			&e.MarketRegion, &e.ClientIP, &e.UserAgent, &e.Outcome, &e.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan regulator access log: %w", err)
		}
		out = append(out, e)
	}
	return out, rows.Err()
}
