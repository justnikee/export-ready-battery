package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateSupplierCMRTReport inserts a parsed CMRT report.
func (r *Repository) CreateSupplierCMRTReport(ctx context.Context, rep *models.SupplierCMRTReport) error {
	query := `
		INSERT INTO supplier_cmrt_reports (
			id, supplier_id, tenant_id, reporting_year, file_url,
			smelters, unknown_smelters, rmi_conformant_pct, parsed_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		rep.ID, rep.SupplierID, rep.TenantID, rep.ReportingYear, rep.FileURL,
		rep.Smelters, rep.UnknownSmelters, rep.RMIConformantPct, rep.ParsedAt, rep.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create cmrt report: %w", err)
	}
	return nil
}

// GetSupplierCMRTReports returns all CMRT reports for a supplier.
func (r *Repository) GetSupplierCMRTReports(ctx context.Context, supplierID uuid.UUID) ([]models.SupplierCMRTReport, error) {
	query := `
		SELECT id, supplier_id, tenant_id, reporting_year, file_url,
			smelters, unknown_smelters, rmi_conformant_pct, parsed_at, created_at
		FROM supplier_cmrt_reports WHERE supplier_id = $1
		ORDER BY reporting_year DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to list cmrt reports: %w", err)
	}
	defer rows.Close()
	return scanSupplierCMRTReports(rows)
}

// GetLatestSupplierCMRTReport returns the most recent CMRT report for a supplier.
func (r *Repository) GetLatestSupplierCMRTReport(ctx context.Context, supplierID uuid.UUID) (*models.SupplierCMRTReport, error) {
	query := `
		SELECT id, supplier_id, tenant_id, reporting_year, file_url,
			smelters, unknown_smelters, rmi_conformant_pct, parsed_at, created_at
		FROM supplier_cmrt_reports WHERE supplier_id = $1
		ORDER BY reporting_year DESC, created_at DESC
		LIMIT 1
	`
	row := r.db.Pool.QueryRow(ctx, query, supplierID)
	return scanSupplierCMRTReportRow(row)
}

func scanSupplierCMRTReports(rows pgx.Rows) ([]models.SupplierCMRTReport, error) {
	var out []models.SupplierCMRTReport
	for rows.Next() {
		rep, err := scanSupplierCMRTReportRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *rep)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

func scanSupplierCMRTReportRow(row pgx.Row) (*models.SupplierCMRTReport, error) {
	var rep models.SupplierCMRTReport
	err := row.Scan(
		&rep.ID, &rep.SupplierID, &rep.TenantID, &rep.ReportingYear, &rep.FileURL,
		&rep.Smelters, &rep.UnknownSmelters, &rep.RMIConformantPct, &rep.ParsedAt, &rep.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan cmrt report: %w", err)
	}
	return &rep, nil
}
