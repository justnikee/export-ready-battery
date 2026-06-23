package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateScanEvent records a new scan event
func (r *Repository) CreateScanEvent(ctx context.Context, event *models.ScanEvent) error {
	query := `INSERT INTO public.scan_events (id, passport_id, ip_address, city, country, latitude, longitude, device_type, user_agent, scanned_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.db.Pool.Exec(ctx, query,
		event.ID,
		event.PassportID,
		event.IPAddress,
		event.City,
		event.Country,
		event.Latitude,
		event.Longitude,
		event.DeviceType,
		event.UserAgent,
		event.ScannedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create scan event: %w", err)
	}

	return nil
}

// GetLastScanTime returns the last scan time for a passport (for spam protection)
func (r *Repository) GetLastScanTime(ctx context.Context, passportID uuid.UUID) (*time.Time, error) {
	var scannedAt time.Time
	query := `SELECT scanned_at FROM public.scan_events WHERE passport_id = $1 ORDER BY scanned_at DESC LIMIT 1`

	err := r.db.Pool.QueryRow(ctx, query, passportID).Scan(&scannedAt)
	if err != nil {
		return nil, nil // No previous scan
	}

	return &scannedAt, nil
}

// GetScanFeed retrieves recent scans for the live feed
func (r *Repository) GetScanFeed(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.ScanFeedItem, error) {
	query := `
		SELECT
			COALESCE(s.city, '') as city,
			COALESCE(s.country, '') as country,
			COALESCE(s.latitude, 0) as latitude,
			COALESCE(s.longitude, 0) as longitude,
			COALESCE(s.device_type, '') as device_type,
			s.scanned_at,
			p.serial_number,
			b.batch_name
		FROM public.scan_events s
		JOIN public.passports p ON s.passport_id = p.uuid AND p.deleted_at IS NULL
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1
		ORDER BY s.scanned_at DESC
		LIMIT $2
	`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get scan feed: %w", err)
	}
	defer rows.Close()

	var items []*models.ScanFeedItem
	for rows.Next() {
		item := &models.ScanFeedItem{}
		if err := rows.Scan(
			&item.City,
			&item.Country,
			&item.Latitude,
			&item.Longitude,
			&item.DeviceType,
			&item.ScannedAt,
			&item.SerialNumber,
			&item.BatchName,
		); err != nil {
			return nil, fmt.Errorf("failed to scan feed item: %w", err)
		}
		items = append(items, item)
	}

	return items, nil
}

// GetDashboardStats retrieves statistics for the dashboard
func (r *Repository) GetDashboardStats(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.DashboardStats, error) {
	stats := &models.DashboardStats{}

	// Total passports for this tenant
	err := r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND ($2 = '' OR b.product_type = $2)
	`, tenantID, productType).Scan(&stats.TotalPassports)
	if err != nil {
		return nil, fmt.Errorf("failed to count passports: %w", err)
	}

	stats.QuotaUsed = stats.TotalPassports

	// Quota balance is the tenant's real remaining activation credits (topped up
	// via billing). The dashboard's "limit" is used + remaining, not a fixed
	// plan ceiling — there is no separate plan-tier cap tracked today.
	balance, err := r.GetQuotaBalance(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quota balance: %w", err)
	}
	stats.QuotaBalance = balance
	stats.QuotaLimit = stats.TotalPassports + balance

	// Total batches
	err = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.batches WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2)
	`, tenantID, productType).Scan(&stats.TotalBatches)
	if err != nil {
		return nil, fmt.Errorf("failed to count batches: %w", err)
	}

	// Battery: carbon compliance (% of batches with carbon_footprint data)
	var withCarbon int
	err = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.batches
		WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2) AND specs->>'carbon_footprint' IS NOT NULL AND specs->>'carbon_footprint' != ''
	`, tenantID, productType).Scan(&withCarbon)
	if err != nil {
		return nil, fmt.Errorf("failed to count carbon compliant batches: %w", err)
	}
	if stats.TotalBatches > 0 {
		stats.CarbonCompliancePct = float64(withCarbon) / float64(stats.TotalBatches) * 100
	}

	// Passports created this week (based on batch creation time)
	err = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1 AND p.deleted_at IS NULL AND ($2 = '' OR b.product_type = $2) AND b.created_at >= NOW() - INTERVAL '7 days'
	`, tenantID, productType).Scan(&stats.PassportsThisWeek)
	if err != nil {
		// Non-critical, default to 0
		stats.PassportsThisWeek = 0
	}

	// Batch status breakdown
	rows, err := r.db.Pool.Query(ctx, `
		SELECT COALESCE(status, 'DRAFT'), COUNT(*) FROM public.batches
		WHERE tenant_id = $1 AND deleted_at IS NULL AND ($2 = '' OR product_type = $2)
		GROUP BY status
	`, tenantID, productType)
	if err != nil {
		// Non-critical
		stats.BatchesByStatus = map[string]int{}
	} else {
		defer rows.Close()
		stats.BatchesByStatus = make(map[string]int)
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				stats.BatchesByStatus[status] = count
			}
		}
	}

	return stats, nil
}

// GetRecentBatches retrieves the most recent batches with passport counts
func (r *Repository) GetRecentBatches(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchSummary, error) {
	query := `
		SELECT 
			b.id,
			b.batch_name,
			b.created_at,
			COALESCE(b.status, 'DRAFT') as status,
			COALESCE(b.market_region::text, 'GLOBAL') as market_region,
			COALESCE((SELECT COUNT(*) FROM public.passports WHERE batch_id = b.id AND deleted_at IS NULL), 0) as total_units
		FROM public.batches b
		WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
		ORDER BY b.created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.BatchSummary
	for rows.Next() {
		var (
			id           uuid.UUID
			name         string
			createdAt    time.Time
			status       string
			marketRegion string
			units        int
		)
		if err := rows.Scan(&id, &name, &createdAt, &status, &marketRegion, &units); err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		batches = append(batches, &models.BatchSummary{
			ID:           id.String(),
			Name:         name,
			CreatedAt:    createdAt.Format(time.RFC3339),
			TotalUnits:   units,
			Status:       status,
			MarketRegion: models.MarketRegion(marketRegion),
			DownloadURL:  fmt.Sprintf("/api/v1/batches/%s/download", id.String()),
		})
	}

	return batches, nil
}

// formatRelativeTime converts a timestamp to a relative time string
func formatRelativeTime(t time.Time) string {
	diff := time.Since(t)

	if diff < time.Minute {
		return "Just now"
	} else if diff < time.Hour {
		mins := int(diff.Minutes())
		if mins == 1 {
			return "1 minute ago"
		}
		return fmt.Sprintf("%d minutes ago", mins)
	} else if diff < 24*time.Hour {
		hours := int(diff.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", hours)
	} else if diff < 7*24*time.Hour {
		days := int(diff.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return fmt.Sprintf("%d days ago", days)
	}
	return t.Format("Jan 2, 2006")
}
