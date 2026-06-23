package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// GetAnalyticsOverview returns aggregated analytics for a tenant.
func (r *Repository) GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.AnalyticsOverview, error) {
	overview := &models.AnalyticsOverview{
		BatchStatusBreakdown:   make(map[string]int),
		SupplierDocStatus:      make(map[string]int),
		AlertSeverityBreakdown: make(map[string]int),
	}

	// 1. Compliance trend — average compliance_score by week for last 12 weeks
	trend, err := r.complianceTrend(ctx, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("compliance trend failed: %w", err)
	}
	overview.ComplianceTrend = trend

	// 2. Certificate expiry summary
	certs, err := r.certificateExpirySummary(ctx, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("certificate expiry failed: %w", err)
	}
	overview.CertificateExpiry = certs

	// 3. Carbon distribution
	carbon, err := r.carbonDistribution(ctx, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("carbon distribution failed: %w", err)
	}
	overview.CarbonDistribution = carbon

	// 4. Batch status breakdown
	if err := r.batchStatusBreakdown(ctx, tenantID, productType, overview.BatchStatusBreakdown); err != nil {
		return nil, fmt.Errorf("batch status breakdown failed: %w", err)
	}

	// 4b. Compliance-ready batch count (score >= 95 and no blocking gaps)
	readyCount, err := r.complianceReadyCount(ctx, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("compliance ready count failed: %w", err)
	}
	overview.ComplianceReadyCount = readyCount

	// 5. Market region split
	regions, err := r.marketRegionSplit(ctx, tenantID, productType)
	if err != nil {
		return nil, fmt.Errorf("market region split failed: %w", err)
	}
	overview.MarketRegionSplit = regions

	// 6. Supplier document status
	if err := r.supplierDocStatus(ctx, tenantID, overview.SupplierDocStatus); err != nil {
		return nil, fmt.Errorf("supplier doc status failed: %w", err)
	}

	// 7. DGFT claim funnel
	claims, err := r.dgftClaimFunnel(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("dgft claim funnel failed: %w", err)
	}
	overview.DGFTClaimFunnel = claims

	// 8. Alert severity breakdown
	if err := r.alertSeverityBreakdown(ctx, tenantID, overview.AlertSeverityBreakdown); err != nil {
		return nil, fmt.Errorf("alert severity breakdown failed: %w", err)
	}

	return overview, nil
}

func (r *Repository) complianceTrend(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]models.ComplianceTrendPoint, error) {
	query := `
		SELECT
			TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-IW') AS period,
			ROUND(AVG(compliance_score)::numeric, 1) AS avg_score,
			COUNT(*) AS batch_count
		FROM public.batches
		WHERE tenant_id = $1
			AND created_at >= NOW() - INTERVAL '12 weeks'
			AND ($2 = '' OR product_type = $2)
			AND compliance_score > 0
		GROUP BY period
		ORDER BY period
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]models.ComplianceTrendPoint, 0)
	for rows.Next() {
		var p models.ComplianceTrendPoint
		if err := rows.Scan(&p.Period, &p.AvgScore, &p.BatchCount); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}

func (r *Repository) certificateExpirySummary(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]models.CertExpirySummary, error) {
	now := time.Now()
	cutoff30 := now.AddDate(0, 0, 30)
	cutoff7 := now.AddDate(0, 0, 7)

	checks := []struct {
		dateField string
		certName  string
		validity  int // months
	}{
		{"specs->>'bis_certificate_issue_date'", "BIS IS 16046", 24},
		{"specs->>'un38_3_test_date'", "UN38.3", 24},
		{"specs->>'iec_62133_test_date'", "IEC 62133", 36},
		{"specs->>'msds_issue_date'", "MSDS", 36},
	}

	subqueries := make([]string, len(checks))
	for i, check := range checks {
		subqueries[i] = fmt.Sprintf(`
			SELECT %d AS ord, '%s' AS cert_type,
				COUNT(*) FILTER (WHERE (%s)::date + INTERVAL '%d months' <= $3 AND (%s)::date + INTERVAL '%d months' > $2) AS expiring_30d,
				COUNT(*) FILTER (WHERE (%s)::date + INTERVAL '%d months' <= $3 AND (%s)::date + INTERVAL '%d months' > $4) AS expiring_7d,
				COUNT(*) FILTER (WHERE (%s)::date + INTERVAL '%d months' <= $2) AS expired
			FROM public.batches
			WHERE tenant_id = $1
				AND status = 'ACTIVE'
				AND ($5 = '' OR product_type = $5)
				AND %s != ''`,
			i, check.certName,
			check.dateField, check.validity, check.dateField, check.validity,
			check.dateField, check.validity, check.dateField, check.validity,
			check.dateField, check.validity,
			check.dateField)
	}

	query := fmt.Sprintf(`
		SELECT cert_type, expiring_30d, expiring_7d, expired
		FROM (%s) combined
		ORDER BY ord
	`, strings.Join(subqueries, " UNION ALL "))

	rows, err := r.db.Pool.Query(ctx, query, tenantID, now, cutoff30, cutoff7, productType)
	if err != nil {
		return nil, fmt.Errorf("certificate expiry query failed: %w", err)
	}
	defer rows.Close()

	results := make([]models.CertExpirySummary, 0, len(checks))
	for rows.Next() {
		var s models.CertExpirySummary
		if err := rows.Scan(&s.CertType, &s.Expiring30d, &s.Expiring7d, &s.Expired); err != nil {
			return nil, fmt.Errorf("certificate expiry scan failed: %w", err)
		}
		results = append(results, s)
	}
	return results, rows.Err()
}

func (r *Repository) carbonDistribution(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]models.CarbonClassCount, error) {
	query := `
		SELECT COALESCE(specs->>'carbon_performance_class', 'Unknown') AS class, COUNT(*) AS cnt
		FROM public.batches
		WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2)
		GROUP BY class
		ORDER BY cnt DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]models.CarbonClassCount, 0)
	for rows.Next() {
		var c models.CarbonClassCount
		if err := rows.Scan(&c.Class, &c.Count); err != nil {
			return nil, err
		}
		results = append(results, c)
	}
	return results, rows.Err()
}

func (r *Repository) batchStatusBreakdown(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, out map[string]int) error {
	query := `
		SELECT status, COUNT(*) FROM public.batches
		WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2)
		GROUP BY status
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return err
		}
		out[status] = count
	}
	return rows.Err()
}

// complianceReadyCount returns how many batches are export-ready: compliance
// score >= 95 with no blocking (ERROR-severity) gaps. Mirrors the per-batch
// "READY" status shown in the batches list so the stat card is tenant-wide and
// filter-independent.
func (r *Repository) complianceReadyCount(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (int, error) {
	query := `
		SELECT COUNT(*) FROM public.batches
		WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2)
		  AND compliance_score >= 95
		  AND NOT COALESCE(compliance_gaps @> '[{"severity":"ERROR"}]'::jsonb, false)
	`
	var count int
	if err := r.db.Pool.QueryRow(ctx, query, tenantID, productType).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (r *Repository) marketRegionSplit(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]models.RegionCount, error) {
	query := `
		SELECT market_region::text, COUNT(*) FROM public.batches
		WHERE tenant_id = $1 AND ($2 = '' OR product_type = $2)
		GROUP BY market_region
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]models.RegionCount, 0)
	for rows.Next() {
		var rc models.RegionCount
		if err := rows.Scan(&rc.Region, &rc.Count); err != nil {
			return nil, err
		}
		results = append(results, rc)
	}
	return results, rows.Err()
}

func (r *Repository) supplierDocStatus(ctx context.Context, tenantID uuid.UUID, out map[string]int) error {
	query := `
		SELECT status, COUNT(*) FROM public.supplier_documents
		WHERE tenant_id = $1
		GROUP BY status
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return err
		}
		out[status] = count
	}
	return rows.Err()
}

func (r *Repository) dgftClaimFunnel(ctx context.Context, tenantID uuid.UUID) ([]models.StatusCount, error) {
	query := `
		SELECT status, COUNT(*) FROM public.dgft_claims
		WHERE tenant_id = $1
		GROUP BY status
		ORDER BY COUNT(*) DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]models.StatusCount, 0)
	for rows.Next() {
		var sc models.StatusCount
		if err := rows.Scan(&sc.Status, &sc.Count); err != nil {
			return nil, err
		}
		results = append(results, sc)
	}
	return results, rows.Err()
}

func (r *Repository) alertSeverityBreakdown(ctx context.Context, tenantID uuid.UUID, out map[string]int) error {
	query := `
		SELECT severity, COUNT(*) FROM public.tenant_alerts
		WHERE tenant_id = $1
		GROUP BY severity
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var severity string
		var count int
		if err := rows.Scan(&severity, &count); err != nil {
			return err
		}
		out[severity] = count
	}
	return rows.Err()
}
