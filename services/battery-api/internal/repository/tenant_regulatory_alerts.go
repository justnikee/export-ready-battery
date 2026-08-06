package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateTenantRegulatoryAlert inserts a tenant alert, ignoring conflicts.
func (r *Repository) CreateTenantRegulatoryAlert(ctx context.Context, alert *models.TenantRegulatoryAlert) error {
	query := `INSERT INTO tenant_regulatory_alerts
		(id, tenant_id, regulatory_item_id, is_read, is_dismissed, read_at, dismissed_at, emailed_at, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT (tenant_id, regulatory_item_id) DO NOTHING`
	_, err := r.db.Pool.Exec(ctx, query,
		alert.ID, alert.TenantID, alert.RegulatoryItemID, alert.IsRead, alert.IsDismissed,
		alert.ReadAt, alert.DismissedAt, alert.EmailedAt, alert.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create tenant regulatory alert: %w", err)
	}
	return nil
}

// GetTenantRegulatoryAlerts returns alerts for a tenant with optional filters.
func (r *Repository) GetTenantRegulatoryAlerts(ctx context.Context, tenantID uuid.UUID, unreadOnly bool, limit, offset int) ([]*models.TenantRegulatoryAlert, int, error) {
	where := "WHERE a.tenant_id = $1"
	args := []interface{}{tenantID}
	argIdx := 2

	if unreadOnly {
		where += " AND a.is_read = false AND a.is_dismissed = false"
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_regulatory_alerts a %s", where)
	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count alerts: %w", err)
	}

	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	selectQuery := fmt.Sprintf(
		`SELECT a.id, a.tenant_id, a.regulatory_item_id, a.is_read, a.is_dismissed, a.read_at, a.dismissed_at, a.emailed_at, a.created_at,
			i.title, i.summary, i.urgency, i.deadline, i.market_region, i.product_type
		FROM tenant_regulatory_alerts a
		JOIN regulatory_items i ON i.id = a.regulatory_item_id
		%s
		ORDER BY i.urgency = 'critical' DESC, i.urgency = 'high' DESC, i.published_at DESC NULLS LAST, a.created_at DESC
		LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)
	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	alerts, err := scanTenantRegulatoryAlerts(rows)
	if err != nil {
		return nil, 0, err
	}
	return alerts, total, nil
}

// GetTenantRegulatoryAlertUnreadCount returns the unread alert count.
func (r *Repository) GetTenantRegulatoryAlertUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM tenant_regulatory_alerts
		WHERE tenant_id = $1 AND is_read = false AND is_dismissed = false`
	var count int
	err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count unread alerts: %w", err)
	}
	return count, nil
}

// MarkTenantRegulatoryAlertRead marks an alert as read for the given tenant (S-07).
func (r *Repository) MarkTenantRegulatoryAlertRead(ctx context.Context, alertID, tenantID uuid.UUID) error {
	now := time.Now()
	tag, err := r.db.Pool.Exec(ctx,
		`UPDATE tenant_regulatory_alerts SET is_read=true, read_at=$3 WHERE id=$1 AND tenant_id=$2`,
		alertID, tenantID, now,
	)
	if err != nil {
		return fmt.Errorf("failed to mark alert read: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("alert not found")
	}
	return nil
}

// MarkTenantRegulatoryAlertDismissed marks an alert as dismissed for the given tenant (S-07).
func (r *Repository) MarkTenantRegulatoryAlertDismissed(ctx context.Context, alertID, tenantID uuid.UUID) error {
	now := time.Now()
	tag, err := r.db.Pool.Exec(ctx,
		`UPDATE tenant_regulatory_alerts SET is_dismissed=true, dismissed_at=$3 WHERE id=$1 AND tenant_id=$2`,
		alertID, tenantID, now,
	)
	if err != nil {
		return fmt.Errorf("failed to dismiss alert: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("alert not found")
	}
	return nil
}

// ListTenantsForRegulatoryItem returns all tenant IDs that should receive an alert for this item.
// For now: all tenants that have batches in the matching product_type and market_region.
func (r *Repository) ListTenantsForRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) ([]uuid.UUID, error) {
	// Simple heuristic: match tenants whose batches align with item product_type / market_region.
	// If item is GENERAL, alert all tenants with any batch.
	query := `SELECT DISTINCT tenant_id FROM batches`
	where := ""
	args := []interface{}{}
	argIdx := 1

	if item.ProductType != "" && item.ProductType != "GENERAL" {
		where += fmt.Sprintf(" AND product_type = $%d", argIdx)
		args = append(args, item.ProductType)
		argIdx++
	}
	if item.MarketRegion != "" && item.MarketRegion != "GLOBAL" {
		where += fmt.Sprintf(" AND market_region = $%d", argIdx)
		args = append(args, item.MarketRegion)
		argIdx++
	}

	if where != "" {
		query += " WHERE 1=1" + where
	}

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list matching tenants: %w", err)
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func scanTenantRegulatoryAlerts(rows pgx.Rows) ([]*models.TenantRegulatoryAlert, error) {
	var out []*models.TenantRegulatoryAlert
	for rows.Next() {
		a, err := scanTenantRegulatoryAlert(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func scanTenantRegulatoryAlert(rows pgx.Row) (*models.TenantRegulatoryAlert, error) {
	var a models.TenantRegulatoryAlert
	err := rows.Scan(
		&a.ID, &a.TenantID, &a.RegulatoryItemID, &a.IsRead, &a.IsDismissed,
		&a.ReadAt, &a.DismissedAt, &a.EmailedAt, &a.CreatedAt,
		&a.Title, &a.Summary, &a.Urgency, &a.Deadline, &a.MarketRegion, &a.ProductType,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}
