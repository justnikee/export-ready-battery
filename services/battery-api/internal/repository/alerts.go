package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateAlert inserts a new tenant alert.
func (r *Repository) CreateAlert(ctx context.Context, alert *models.TenantAlert) error {
	query := `INSERT INTO public.tenant_alerts
		(id, tenant_id, alert_type, severity, title, message, resource_type, resource_id, read_at, emailed_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.Pool.Exec(ctx, query,
		alert.ID, alert.TenantID, alert.AlertType, alert.Severity, alert.Title, alert.Message,
		alert.ResourceType, alert.ResourceID, alert.ReadAt, alert.EmailedAt, alert.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create alert: %w", err)
	}
	return nil
}

// GetAlertsByTenant returns paginated alerts for a tenant, newest first.
func (r *Repository) GetAlertsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantAlert, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	query := `SELECT id, tenant_id, alert_type, severity, title, message,
			  resource_type, resource_id, read_at, emailed_at, created_at
			  FROM public.tenant_alerts
			  WHERE tenant_id = $1
			  ORDER BY created_at DESC
			  LIMIT $2 OFFSET $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	return scanAlerts(rows)
}

// GetUnreadAlerts returns unread alerts for a tenant.
func (r *Repository) GetUnreadAlerts(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.TenantAlert, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	query := `SELECT id, tenant_id, alert_type, severity, title, message,
			  resource_type, resource_id, read_at, emailed_at, created_at
			  FROM public.tenant_alerts
			  WHERE tenant_id = $1 AND read_at IS NULL
			  ORDER BY created_at DESC
			  LIMIT $2`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query unread alerts: %w", err)
	}
	defer rows.Close()

	return scanAlerts(rows)
}

// GetUnreadAlertCount returns the number of unread alerts for a tenant.
func (r *Repository) GetUnreadAlertCount(ctx context.Context, tenantID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM public.tenant_alerts WHERE tenant_id = $1 AND read_at IS NULL`
	if err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count unread alerts: %w", err)
	}
	return count, nil
}

// MarkAlertRead marks a single alert as read.
func (r *Repository) MarkAlertRead(ctx context.Context, alertID uuid.UUID) error {
	query := `UPDATE public.tenant_alerts SET read_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, time.Now(), alertID)
	if err != nil {
		return fmt.Errorf("failed to mark alert read: %w", err)
	}
	return nil
}

// MarkAlertEmailed marks an alert as having been emailed.
func (r *Repository) MarkAlertEmailed(ctx context.Context, alertID uuid.UUID) error {
	query := `UPDATE public.tenant_alerts SET emailed_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, time.Now(), alertID)
	if err != nil {
		return fmt.Errorf("failed to mark alert emailed: %w", err)
	}
	return nil
}

// HasRecentAlert checks if a similar alert was already created recently
// to avoid duplicate notifications.
func (r *Repository) HasRecentAlert(ctx context.Context, tenantID uuid.UUID, alertType string, resourceID *string, within time.Duration) (bool, error) {
	query := `SELECT EXISTS(
			  SELECT 1 FROM public.tenant_alerts
			  WHERE tenant_id = $1 AND alert_type = $2
			  AND ($3::text IS NULL OR resource_id = $3::text)
			  AND created_at > $4
			)`

	cutoff := time.Now().Add(-within)
	var exists bool
	if err := r.db.Pool.QueryRow(ctx, query, tenantID, alertType, resourceID, cutoff).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check recent alert: %w", err)
	}
	return exists, nil
}

func scanAlerts(rows pgx.Rows) ([]*models.TenantAlert, error) {
	var alerts []*models.TenantAlert
	for rows.Next() {
		var a models.TenantAlert
		err := rows.Scan(
			&a.ID, &a.TenantID, &a.AlertType, &a.Severity, &a.Title, &a.Message,
			&a.ResourceType, &a.ResourceID, &a.ReadAt, &a.EmailedAt, &a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
		alerts = append(alerts, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return alerts, nil
}
