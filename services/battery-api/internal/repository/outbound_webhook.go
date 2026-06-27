package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"

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

// CreateWebhookDelivery logs one delivery attempt (success or failure).
func (r *Repository) CreateWebhookDelivery(ctx context.Context, d *models.WebhookDelivery) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body, delivered_at, retry_count, error_message, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, d.ID, d.WebhookID, d.EventType, d.Payload, d.ResponseStatus, d.ResponseBody, d.DeliveredAt, d.RetryCount, d.ErrorMessage, d.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create webhook delivery: %w", err)
	}
	return nil
}

// UpdateWebhookDeliveryResult records the outcome of a (re)try against an existing delivery row.
func (r *Repository) UpdateWebhookDeliveryResult(ctx context.Context, id uuid.UUID, responseStatus *int, responseBody string, deliveredAt *time.Time, retryCount int, errorMessage string) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE webhook_deliveries
		SET response_status = $2, response_body = $3, delivered_at = $4, retry_count = $5, error_message = $6
		WHERE id = $1
	`, id, responseStatus, responseBody, deliveredAt, retryCount, errorMessage)
	if err != nil {
		return fmt.Errorf("failed to update webhook delivery result: %w", err)
	}
	return nil
}

// GetWebhookDeliveriesByWebhook returns the delivery log for one webhook, most recent first.
func (r *Repository) GetWebhookDeliveriesByWebhook(ctx context.Context, webhookID uuid.UUID, limit int) ([]*models.WebhookDelivery, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, webhook_id, event_type, payload, response_status, response_body, delivered_at, retry_count, error_message, created_at
		FROM webhook_deliveries
		WHERE webhook_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, webhookID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list webhook deliveries: %w", err)
	}
	defer rows.Close()
	return scanWebhookDeliveries(rows)
}

// GetWebhookDeliveryByID fetches a single delivery row, for the retry endpoint.
func (r *Repository) GetWebhookDeliveryByID(ctx context.Context, id uuid.UUID) (*models.WebhookDelivery, error) {
	d := &models.WebhookDelivery{}
	err := r.db.Pool.QueryRow(ctx, `
		SELECT id, webhook_id, event_type, payload, response_status, response_body, delivered_at, retry_count, error_message, created_at
		FROM webhook_deliveries
		WHERE id = $1
	`, id).Scan(&d.ID, &d.WebhookID, &d.EventType, &d.Payload, &d.ResponseStatus, &d.ResponseBody, &d.DeliveredAt, &d.RetryCount, &d.ErrorMessage, &d.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("delivery not found")
		}
		return nil, fmt.Errorf("failed to get webhook delivery: %w", err)
	}
	return d, nil
}

// GetFailedDeliveriesForRetry returns failed deliveries (non-2xx or never attempted)
// with fewer than maxRetries attempts so far, for the background retry worker.
func (r *Repository) GetFailedDeliveriesForRetry(ctx context.Context, maxRetries, limit int) ([]*models.WebhookDelivery, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, webhook_id, event_type, payload, response_status, response_body, delivered_at, retry_count, error_message, created_at
		FROM webhook_deliveries
		WHERE (response_status IS NULL OR response_status < 200 OR response_status >= 300)
		  AND retry_count < $1
		ORDER BY created_at ASC
		LIMIT $2
	`, maxRetries, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list deliveries needing retry: %w", err)
	}
	defer rows.Close()
	return scanWebhookDeliveries(rows)
}

func scanWebhookDeliveries(rows pgx.Rows) ([]*models.WebhookDelivery, error) {
	var result []*models.WebhookDelivery
	for rows.Next() {
		d := &models.WebhookDelivery{}
		if err := rows.Scan(&d.ID, &d.WebhookID, &d.EventType, &d.Payload, &d.ResponseStatus, &d.ResponseBody, &d.DeliveredAt, &d.RetryCount, &d.ErrorMessage, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan webhook delivery: %w", err)
		}
		result = append(result, d)
	}
	return result, rows.Err()
}

// GetOutboundWebhookByIDAny fetches a webhook by ID with no tenant filter —
// for the background retry worker, which sweeps pending deliveries across
// every tenant and isn't acting on behalf of any single tenant's request.
func (r *Repository) GetOutboundWebhookByIDAny(ctx context.Context, id uuid.UUID) (*models.OutboundWebhook, error) {
	wh := &models.OutboundWebhook{}
	err := r.db.Pool.QueryRow(ctx, `
		SELECT id, tenant_id, url, secret, event_types, is_active, failure_count, last_triggered_at, created_at
		FROM outbound_webhooks
		WHERE id = $1
	`, id).Scan(&wh.ID, &wh.TenantID, &wh.URL, &wh.Secret, &wh.EventTypes,
		&wh.IsActive, &wh.FailureCount, &wh.LastTriggeredAt, &wh.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("webhook not found")
		}
		return nil, fmt.Errorf("failed to get outbound webhook: %w", err)
	}
	return wh, nil
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
