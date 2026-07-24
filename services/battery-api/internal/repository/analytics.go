package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
)

// GetAnalyticsOverview returns aggregated analytics for a tenant.
func (r *Repository) GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.AnalyticsOverview, error) {
	overview := &models.AnalyticsOverview{
		BatchStatusBreakdown:   make(map[string]int),
		SupplierDocStatus:      make(map[string]int),
		AlertSeverityBreakdown: make(map[string]int),
	}

	g, gctx := errgroup.WithContext(ctx)

	// 1. Compliance trend — average compliance_score by week for last 12 weeks
	g.Go(func() error {
		trend, err := r.complianceTrend(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("compliance trend failed: %w", err)
		}
		overview.ComplianceTrend = trend
		return nil
	})

	// 2. Certificate expiry summary
	g.Go(func() error {
		certs, err := r.certificateExpirySummary(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("certificate expiry failed: %w", err)
		}
		overview.CertificateExpiry = certs
		return nil
	})

	// 2b. Certificate expiry details (per-batch drill-down)
	g.Go(func() error {
		certDetails, err := r.expiringCertificatesDetails(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("certificate expiry details failed: %w", err)
		}
		overview.ExpiringCertificates = certDetails
		return nil
	})

	// 3. Carbon distribution
	g.Go(func() error {
		carbon, err := r.carbonDistribution(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("carbon distribution failed: %w", err)
		}
		overview.CarbonDistribution = carbon
		return nil
	})

	// 4. Batch status breakdown
	g.Go(func() error {
		if err := r.batchStatusBreakdown(gctx, tenantID, productType, overview.BatchStatusBreakdown); err != nil {
			return fmt.Errorf("batch status breakdown failed: %w", err)
		}
		return nil
	})

	// 4b. Compliance-ready batch count (score >= 95 and no blocking gaps)
	g.Go(func() error {
		readyCount, err := r.complianceReadyCount(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("compliance ready count failed: %w", err)
		}
		overview.ComplianceReadyCount = readyCount
		return nil
	})

	// 5. Market region split
	g.Go(func() error {
		regions, err := r.marketRegionSplit(gctx, tenantID, productType)
		if err != nil {
			return fmt.Errorf("market region split failed: %w", err)
		}
		overview.MarketRegionSplit = regions
		return nil
	})

	// 6. Supplier document status
	g.Go(func() error {
		if err := r.supplierDocStatus(gctx, tenantID, overview.SupplierDocStatus); err != nil {
			return fmt.Errorf("supplier doc status failed: %w", err)
		}
		return nil
	})

	// 7. DGFT claim funnel
	g.Go(func() error {
		claims, err := r.dgftClaimFunnel(gctx, tenantID)
		if err != nil {
			return fmt.Errorf("dgft claim funnel failed: %w", err)
		}
		overview.DGFTClaimFunnel = claims
		return nil
	})

	// 8. Alert severity breakdown
	g.Go(func() error {
		if err := r.alertSeverityBreakdown(gctx, tenantID, overview.AlertSeverityBreakdown); err != nil {
			return fmt.Errorf("alert severity breakdown failed: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
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

// GetGapsByRegulation aggregates open compliance gaps by regulation reference and severity.
func (r *Repository) GetGapsByRegulation(ctx context.Context, tenantID uuid.UUID) ([]models.RegulationGapCount, error) {
	query := `
		SELECT 
			COALESCE(g.gap->>'regulation', 'Unknown Regulation') AS regulation,
			COALESCE(g.gap->>'severity', 'WARNING') AS severity,
			COUNT(*) AS count
		FROM public.batches b,
		LATERAL jsonb_array_elements(COALESCE(b.compliance_gaps, '[]'::jsonb)) AS g(gap)
		WHERE b.tenant_id = $1
		GROUP BY regulation, severity
		ORDER BY count DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query gaps by regulation: %w", err)
	}
	defer rows.Close()

	var results []models.RegulationGapCount
	for rows.Next() {
		var c models.RegulationGapCount
		if err := rows.Scan(&c.Regulation, &c.Severity, &c.Count); err != nil {
			return nil, fmt.Errorf("failed to scan regulation gap count: %w", err)
		}
		results = append(results, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

// GetActionFeed returns critical and warning actions requiring tenant attention.
func (r *Repository) GetActionFeed(ctx context.Context, tenantID uuid.UUID) ([]models.ActionFeedItem, error) {
	query := `
		SELECT type, title, batch_id, severity, due_date
		FROM (
			-- 1. Cert Expiry
			SELECT 
				'CERT_EXPIRY' AS type,
				'Certificate ' || cert_type || ' for Batch ' || batch_name || ' is expiring soon' AS title,
				id AS batch_id,
				CASE WHEN expiry_date <= NOW() THEN 'ERROR' ELSE 'WARNING' END AS severity,
				expiry_date AS due_date
			FROM (
				SELECT id, batch_name, 'BIS IS 16046' AS cert_type, (specs->>'bis_certificate_issue_date')::date + INTERVAL '24 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND specs->>'bis_certificate_issue_date' != ''
				UNION ALL
				SELECT id, batch_name, 'UN38.3' AS cert_type, (specs->>'un38_3_test_date')::date + INTERVAL '24 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND specs->>'un38_3_test_date' != ''
				UNION ALL
				SELECT id, batch_name, 'IEC 62133' AS cert_type, (specs->>'iec_62133_test_date')::date + INTERVAL '36 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND specs->>'iec_62133_test_date' != ''
				UNION ALL
				SELECT id, batch_name, 'MSDS' AS cert_type, (specs->>'msds_issue_date')::date + INTERVAL '36 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND specs->>'msds_issue_date' != ''
			) certs
			WHERE expiry_date <= NOW() + INTERVAL '30 days'

			UNION ALL

			-- 2. Supplier Audit
			SELECT 
				'SUPPLIER_AUDIT' AS type,
				'Supplier Due Diligence ' || step || ' assessment for ' || s.name || ' is pending' AS title,
				batch_id,
				'WARNING' AS severity,
				dda.created_at + INTERVAL '30 days' AS due_date
			FROM public.due_diligence_assessments dda
			JOIN public.suppliers s ON dda.supplier_id = s.id
			WHERE dda.tenant_id = $1 AND dda.status IN ('not_started', 'in_progress')

			UNION ALL

			-- 3. EPR Shortfall
			SELECT 
				'EPR_SHORTFALL' AS type,
				'EPR shortfall of ' || shortfall_kg || ' kg identified for category ' || battery_category || ' in FY ' || financial_year AS title,
				NULL::uuid AS batch_id,
				'ERROR' AS severity,
				created_at + INTERVAL '90 days' AS due_date
			FROM public.epr_obligations
			WHERE tenant_id = $1 AND shortfall_kg > 0 AND status != 'CLOSED'

			UNION ALL

			-- 4. Unsigned DoC
			SELECT 
				'UNSIGNED_DOC' AS type,
				'Declaration of Conformity missing for Batch ' || batch_name AS title,
				id AS batch_id,
				'ERROR' AS severity,
				created_at + INTERVAL '14 days' AS due_date
			FROM public.batches
			WHERE tenant_id = $1 AND (market_region = 'EU' OR market_region = 'GLOBAL') AND status = 'ACTIVE'
			  AND (declaration_of_conformity_path IS NULL OR declaration_of_conformity_path = '')

			UNION ALL

			-- 5. Verification Failure
			SELECT 
				'VERIFICATION_FAILURE' AS type,
				'External registry verification failed for ' || registry_type || ' (Cert: ' || COALESCE(certificate_no, 'N/A') || ') on Batch ' || b.batch_name AS title,
				batch_id,
				'ERROR' AS severity,
				rv.created_at + INTERVAL '7 days' AS due_date
			FROM public.registry_verifications rv
			JOIN public.batches b ON rv.batch_id = b.id
			WHERE rv.tenant_id = $1 AND rv.status IN ('failed', 'error', 'not_found')
		) actions
		ORDER BY severity DESC, due_date ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query action feed: %w", err)
	}
	defer rows.Close()

	var results []models.ActionFeedItem
	for rows.Next() {
		var item models.ActionFeedItem
		if err := rows.Scan(&item.Type, &item.Title, &item.BatchID, &item.Severity, &item.DueDate); err != nil {
			return nil, fmt.Errorf("failed to scan action feed item: %w", err)
		}
		results = append(results, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

// GetDGFTValue aggregates claimed and eligible export incentive values for a tenant.
func (r *Repository) GetDGFTValue(ctx context.Context, tenantID uuid.UUID) (*models.DGFTValueSummary, error) {
	summaryQuery := `
		SELECT 
			COALESCE(SUM(CASE WHEN status IN ('SUBMITTED', 'APPROVED') THEN estimated_claim_amount ELSE 0 END), 0)::double precision AS total_claimed,
			COALESCE(SUM(estimated_claim_amount), 0)::double precision AS total_eligible,
			CASE 
				WHEN COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'APPROVED', 'REJECTED')) = 0 THEN 0.0
				ELSE (COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'APPROVED', 'REJECTED'))::numeric) * 100.0
			END::double precision AS approval_rate,
			COALESCE(AVG(EXTRACT(epoch FROM (updated_at - created_at)) / 86400) FILTER (WHERE status = 'APPROVED'), 0.0)::double precision AS avg_approval_days
		FROM public.dgft_claims
		WHERE tenant_id = $1
	`
	summary := &models.DGFTValueSummary{
		SchemeBreakdown: []models.SchemeValue{},
	}
	err := r.db.Pool.QueryRow(ctx, summaryQuery, tenantID).Scan(
		&summary.TotalClaimedValue,
		&summary.TotalEligibleValue,
		&summary.ApprovalRate,
		&summary.AvgApprovalDays,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate dgft summary values: %w", err)
	}

	breakdownQuery := `
		SELECT 
			scheme_type,
			COALESCE(SUM(CASE WHEN status IN ('SUBMITTED', 'APPROVED') THEN estimated_claim_amount ELSE 0 END), 0)::double precision AS claimed_val,
			COALESCE(SUM(estimated_claim_amount), 0)::double precision AS eligible_val,
			COUNT(*) AS cnt
		FROM public.dgft_claims
		WHERE tenant_id = $1
		GROUP BY scheme_type
	`
	rows, err := r.db.Pool.Query(ctx, breakdownQuery, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query dgft scheme breakdown: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var s models.SchemeValue
		if err := rows.Scan(&s.Scheme, &s.ClaimedValue, &s.EligibleValue, &s.Count); err != nil {
			return nil, fmt.Errorf("failed to scan scheme value breakdown: %w", err)
		}
		summary.SchemeBreakdown = append(summary.SchemeBreakdown, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return summary, nil
}

func (r *Repository) expiringCertificatesDetails(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) ([]models.ExpiringCertDetail, error) {
	query := `
		SELECT 
			id AS batch_id,
			batch_name,
			cert_type,
			expiry_date,
			EXTRACT(day from (expiry_date - NOW()))::int AS days_left
		FROM (
			SELECT id, batch_name, 'BIS IS 16046' AS cert_type, (specs->>'bis_certificate_issue_date')::date + INTERVAL '24 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND ($2 = '' OR product_type = $2) AND specs->>'bis_certificate_issue_date' != ''
			UNION ALL
			SELECT id, batch_name, 'UN38.3' AS cert_type, (specs->>'un38_3_test_date')::date + INTERVAL '24 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND ($2 = '' OR product_type = $2) AND specs->>'un38_3_test_date' != ''
			UNION ALL
			SELECT id, batch_name, 'IEC 62133' AS cert_type, (specs->>'iec_62133_test_date')::date + INTERVAL '36 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND ($2 = '' OR product_type = $2) AND specs->>'iec_62133_test_date' != ''
			UNION ALL
			SELECT id, batch_name, 'MSDS' AS cert_type, (specs->>'msds_issue_date')::date + INTERVAL '36 months' AS expiry_date FROM public.batches WHERE tenant_id = $1 AND status = 'ACTIVE' AND ($2 = '' OR product_type = $2) AND specs->>'msds_issue_date' != ''
		) certs
		WHERE expiry_date <= NOW() + INTERVAL '30 days'
		ORDER BY days_left ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, productType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.ExpiringCertDetail
	for rows.Next() {
		var d models.ExpiringCertDetail
		if err := rows.Scan(&d.BatchID, &d.BatchName, &d.CertType, &d.ExpiryDate, &d.DaysLeft); err != nil {
			return nil, err
		}
		results = append(results, d)
	}
	return results, rows.Err()
}
