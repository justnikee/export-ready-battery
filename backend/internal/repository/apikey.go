package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

// ============================================================================
// API KEY REPOSITORY
// ============================================================================

// CreateAPIKey creates a new API key
func (r *Repository) CreateAPIKey(ctx context.Context, key *models.APIKey) error {
	query := `
		INSERT INTO api_keys (id, tenant_id, name, key_hash, key_prefix, scope, rate_limit_tier, expires_at, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.Pool.Exec(ctx, query,
		key.ID,
		key.TenantID,
		key.Name,
		key.KeyHash,
		key.KeyPrefix,
		key.Scope,
		key.RateLimitTier,
		key.ExpiresAt,
		key.IsActive,
		key.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create API key: %w", err)
	}

	return nil
}

// ListAPIKeys returns all API keys for a tenant
func (r *Repository) ListAPIKeys(ctx context.Context, tenantID uuid.UUID) ([]*models.APIKey, error) {
	query := `
		SELECT id, tenant_id, name, key_prefix, scope, rate_limit_tier, last_used_at, expires_at, is_active, created_at
		FROM api_keys
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list API keys: %w", err)
	}
	defer rows.Close()

	var keys []*models.APIKey
	for rows.Next() {
		key := &models.APIKey{}
		if err := rows.Scan(
			&key.ID,
			&key.TenantID,
			&key.Name,
			&key.KeyPrefix,
			&key.Scope,
			&key.RateLimitTier,
			&key.LastUsedAt,
			&key.ExpiresAt,
			&key.IsActive,
			&key.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan API key: %w", err)
		}
		keys = append(keys, key)
	}

	return keys, nil
}

// GetAPIKeyByID retrieves an API key by ID
func (r *Repository) GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	query := `
		SELECT id, tenant_id, name, key_hash, key_prefix, scope, rate_limit_tier, last_used_at, expires_at, is_active, created_at
		FROM api_keys
		WHERE id = $1
	`

	key := &models.APIKey{}
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&key.ID,
		&key.TenantID,
		&key.Name,
		&key.KeyHash,
		&key.KeyPrefix,
		&key.Scope,
		&key.RateLimitTier,
		&key.LastUsedAt,
		&key.ExpiresAt,
		&key.IsActive,
		&key.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	return key, nil
}

// GetAPIKeyByPrefix retrieves an API key by its prefix (for validation lookup)
func (r *Repository) GetAPIKeyByPrefix(ctx context.Context, prefix string) (*models.APIKey, error) {
	query := `
		SELECT id, tenant_id, name, key_hash, key_prefix, scope, rate_limit_tier, last_used_at, expires_at, is_active, created_at
		FROM api_keys
		WHERE key_prefix = $1 AND is_active = true
	`

	key := &models.APIKey{}
	err := r.db.Pool.QueryRow(ctx, query, prefix).Scan(
		&key.ID,
		&key.TenantID,
		&key.Name,
		&key.KeyHash,
		&key.KeyPrefix,
		&key.Scope,
		&key.RateLimitTier,
		&key.LastUsedAt,
		&key.ExpiresAt,
		&key.IsActive,
		&key.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	return key, nil
}

// GetAllActiveAPIKeys returns all active keys (for validation - we'll check hash on each)
func (r *Repository) GetAllActiveAPIKeys(ctx context.Context) ([]*models.APIKey, error) {
	query := `
		SELECT id, tenant_id, name, key_hash, key_prefix, scope, rate_limit_tier, last_used_at, expires_at, is_active, created_at
		FROM api_keys
		WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
	`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list active API keys: %w", err)
	}
	defer rows.Close()

	var keys []*models.APIKey
	for rows.Next() {
		key := &models.APIKey{}
		if err := rows.Scan(
			&key.ID,
			&key.TenantID,
			&key.Name,
			&key.KeyHash,
			&key.KeyPrefix,
			&key.Scope,
			&key.RateLimitTier,
			&key.LastUsedAt,
			&key.ExpiresAt,
			&key.IsActive,
			&key.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan API key: %w", err)
		}
		keys = append(keys, key)
	}

	return keys, nil
}

// UpdateAPIKeyLastUsed updates the last_used_at timestamp
func (r *Repository) UpdateAPIKeyLastUsed(ctx context.Context, keyID uuid.UUID) error {
	query := `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, time.Now(), keyID)
	return err
}

// UpdateAPIKey updates an API key's name or active status
func (r *Repository) UpdateAPIKey(ctx context.Context, id uuid.UUID, name *string, isActive *bool) error {
	if name == nil && isActive == nil {
		return nil
	}

	query := `UPDATE api_keys SET `
	args := []interface{}{}
	argNum := 1

	if name != nil {
		query += fmt.Sprintf("name = $%d", argNum)
		args = append(args, *name)
		argNum++
	}

	if isActive != nil {
		if argNum > 1 {
			query += ", "
		}
		query += fmt.Sprintf("is_active = $%d", argNum)
		args = append(args, *isActive)
		argNum++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argNum)
	args = append(args, id)

	_, err := r.db.Pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update API key: %w", err)
	}

	return nil
}

// DeleteAPIKey deletes an API key
func (r *Repository) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM api_keys WHERE id = $1`
	result, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete API key: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("API key not found")
	}

	return nil
}

// ============================================================================
// RATE LIMITING
// ============================================================================

// GetOrCreateUsageWindow gets or creates a rate limit usage window for the current hour
func (r *Repository) GetOrCreateUsageWindow(ctx context.Context, keyID uuid.UUID, endpoint string) (*models.APIKeyUsage, error) {
	// Get current hour window
	now := time.Now().UTC()
	windowStart := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 0, 0, 0, time.UTC)

	// Try to get existing window
	query := `
		SELECT id, api_key_id, endpoint, request_count, window_start
		FROM api_key_usage
		WHERE api_key_id = $1 AND endpoint = $2 AND window_start = $3
	`

	usage := &models.APIKeyUsage{}
	err := r.db.Pool.QueryRow(ctx, query, keyID, endpoint, windowStart).Scan(
		&usage.ID,
		&usage.APIKeyID,
		&usage.Endpoint,
		&usage.RequestCount,
		&usage.WindowStart,
	)

	if err == pgx.ErrNoRows {
		// Create new window
		usage = &models.APIKeyUsage{
			ID:           uuid.New(),
			APIKeyID:     keyID,
			Endpoint:     endpoint,
			RequestCount: 0,
			WindowStart:  windowStart,
		}

		insertQuery := `
			INSERT INTO api_key_usage (id, api_key_id, endpoint, request_count, window_start)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (api_key_id, endpoint, window_start) DO NOTHING
		`
		_, err = r.db.Pool.Exec(ctx, insertQuery, usage.ID, usage.APIKeyID, usage.Endpoint, usage.RequestCount, usage.WindowStart)
		if err != nil {
			return nil, fmt.Errorf("failed to create usage window: %w", err)
		}

		return usage, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get usage window: %w", err)
	}

	return usage, nil
}

// IncrementUsage increments the request count for a usage window
func (r *Repository) IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error) {
	now := time.Now().UTC()
	windowStart := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), 0, 0, 0, time.UTC)

	query := `
		INSERT INTO api_key_usage (id, api_key_id, endpoint, request_count, window_start)
		VALUES ($1, $2, $3, 1, $4)
		ON CONFLICT (api_key_id, endpoint, window_start)
		DO UPDATE SET request_count = api_key_usage.request_count + 1
		RETURNING request_count
	`

	var count int
	err := r.db.Pool.QueryRow(ctx, query, uuid.New(), keyID, endpoint, windowStart).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to increment usage: %w", err)
	}

	return count, nil
}

// CleanupOldUsage removes usage records older than 24 hours
func (r *Repository) CleanupOldUsage(ctx context.Context) error {
	query := `DELETE FROM api_key_usage WHERE window_start < NOW() - INTERVAL '24 hours'`
	_, err := r.db.Pool.Exec(ctx, query)
	return err
}
