package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/models"
)

// CreateScanEvent records a new scan event
func (r *Repository) CreateScanEvent(ctx context.Context, event *models.ScanEvent) error {
	query := `INSERT INTO public.scan_events (id, passport_id, ip_address, city, country, device_type, user_agent, scanned_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.Pool.Exec(ctx, query,
		event.ID,
		event.PassportID,
		event.IPAddress,
		event.City,
		event.Country,
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
			s.city, 
			s.country, 
			s.device_type, 
			s.scanned_at,
			p.serial_number,
			b.batch_name
		FROM public.scan_events s
		JOIN public.passports p ON s.passport_id = p.uuid
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
func (r *Repository) GetDashboardStats(ctx context.Context, tenantID uuid.UUID) (*models.DashboardStats, error) {
	stats := &models.DashboardStats{
		QuotaLimit: 5000, // Hardcoded for MVP
	}

	// Total passports for this tenant
	err := r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		WHERE b.tenant_id = $1
	`, tenantID).Scan(&stats.TotalPassports)
	if err != nil {
		return nil, fmt.Errorf("failed to count passports: %w", err)
	}

	stats.QuotaUsed = stats.TotalPassports

	// Total batches
	err = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.batches WHERE tenant_id = $1
	`, tenantID).Scan(&stats.TotalBatches)
	if err != nil {
		return nil, fmt.Errorf("failed to count batches: %w", err)
	}

	// Carbon compliance (% of batches with carbon_footprint data)
	var withCarbon int
	err = r.db.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM public.batches 
		WHERE tenant_id = $1 AND specs->>'carbon_footprint' IS NOT NULL AND specs->>'carbon_footprint' != ''
	`, tenantID).Scan(&withCarbon)
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
		WHERE b.tenant_id = $1 AND b.created_at >= NOW() - INTERVAL '7 days'
	`, tenantID).Scan(&stats.PassportsThisWeek)
	if err != nil {
		// Non-critical, default to 0
		stats.PassportsThisWeek = 0
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
			COALESCE((SELECT COUNT(*) FROM public.passports WHERE batch_id = b.id), 0) as total_units
		FROM public.batches b
		WHERE b.tenant_id = $1
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
			id        uuid.UUID
			name      string
			createdAt time.Time
			units     int
		)
		if err := rows.Scan(&id, &name, &createdAt, &units); err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// Determine status based on passport count
		status := "READY"
		if units == 0 {
			status = "PENDING"
		}

		// Format relative time
		relativeTime := formatRelativeTime(createdAt)

		batches = append(batches, &models.BatchSummary{
			ID:          id.String(),
			Name:        name,
			CreatedAt:   relativeTime,
			TotalUnits:  units,
			Status:      status,
			DownloadURL: fmt.Sprintf("/api/v1/batches/%s/download", id.String()),
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
