package repository

import (
	"context"
	"fmt"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateOutboundWebhook persists a new outbound webhook configuration.
func (r *Repository) CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO outbound_webhooks (id, tenant_id, url, secret, event_types, is_active, failure_count, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, wh.ID, wh.TenantID, wh.URL, wh.Secret, wh.EventTypes, wh.IsActive, wh.FailureCount, wh.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create outbound webhook: %w", err)
	}
	return nil
}

// ListOutboundWebhooks returns all webhooks for a tenant.
func (r *Repository) ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, tenant_id, url, secret, event_types, is_active, failure_count, last_triggered_at, created_at
		FROM outbound_webhooks
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list outbound webhooks: %w", err)
	}
	defer rows.Close()

	var result []*models.OutboundWebhook
	for rows.Next() {
		wh := &models.OutboundWebhook{}
		if err := rows.Scan(&wh.ID, &wh.TenantID, &wh.URL, &wh.Secret, &wh.EventTypes,
			&wh.IsActive, &wh.FailureCount, &wh.LastTriggeredAt, &wh.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan outbound webhook: %w", err)
		}
		result = append(result, wh)
	}
	return result, nil
}

// DeleteOutboundWebhook removes a webhook by ID, scoped to the tenant.
func (r *Repository) DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error {
	tag, err := r.db.Pool.Exec(ctx, `
		DELETE FROM outbound_webhooks WHERE id = $1 AND tenant_id = $2
	`, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete outbound webhook: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("webhook not found")
	}
	return nil
}

// GetWebhooksByEvent returns all active webhooks for a tenant that are subscribed to an event type.
func (r *Repository) GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, tenant_id, url, secret, event_types, is_active, failure_count, last_triggered_at, created_at
		FROM outbound_webhooks
		WHERE tenant_id = $1
		  AND is_active = true
		  AND (event_types @> ARRAY[$2] OR event_types @> ARRAY['*'])
	`, tenantID, eventType)
	if err != nil {
		return nil, fmt.Errorf("failed to query webhooks by event: %w", err)
	}
	defer rows.Close()

	var result []*models.OutboundWebhook
	for rows.Next() {
		wh := &models.OutboundWebhook{}
		if err := rows.Scan(&wh.ID, &wh.TenantID, &wh.URL, &wh.Secret, &wh.EventTypes,
			&wh.IsActive, &wh.FailureCount, &wh.LastTriggeredAt, &wh.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan webhook: %w", err)
		}
		result = append(result, wh)
	}
	return result, nil
}

// IncrementWebhookFailure increments the failure counter and deactivates at threshold.
func (r *Repository) IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE outbound_webhooks
		SET failure_count = failure_count + 1,
		    is_active = CASE WHEN failure_count + 1 >= 10 THEN false ELSE is_active END
		WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("failed to increment webhook failure: %w", err)
	}
	return nil
}

// UpdateWebhookLastTriggered updates the last_triggered_at timestamp.
func (r *Repository) UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE outbound_webhooks SET last_triggered_at = $2 WHERE id = $1
	`, id, at)
	if err != nil {
		return fmt.Errorf("failed to update webhook last triggered: %w", err)
	}
	return nil
}

// GetOutboundWebhookByID fetches a single webhook by ID (used by handler for validation).
func (r *Repository) GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) {
	wh := &models.OutboundWebhook{}
	err := r.db.Pool.QueryRow(ctx, `
		SELECT id, tenant_id, url, secret, event_types, is_active, failure_count, last_triggered_at, created_at
		FROM outbound_webhooks
		WHERE id = $1 AND tenant_id = $2
	`, id, tenantID).Scan(&wh.ID, &wh.TenantID, &wh.URL, &wh.Secret, &wh.EventTypes,
		&wh.IsActive, &wh.FailureCount, &wh.LastTriggeredAt, &wh.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("webhook not found")
		}
		return nil, fmt.Errorf("failed to get outbound webhook: %w", err)
	}
	return wh, nil
}
