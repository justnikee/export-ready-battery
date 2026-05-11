package repository

import (
	"context"
	"fmt"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
)

// CreateEPRCertificate inserts a new EPR certificate into the ledger
func (r *Repository) CreateEPRCertificate(ctx context.Context, cert *models.EPRCertificate) error {
	cert.ID = uuid.New()
	cert.CreatedAt = time.Now()
	cert.UpdatedAt = time.Now()
	if cert.Status == "" {
		cert.Status = models.EPRCertStatusActive
	}

	query := `INSERT INTO epr_certificates
		(id, tenant_id, certificate_number, recycler_name, recycler_epr_id,
		 weight_kg, battery_type, financial_year, issued_date, expiry_date,
		 status, document_path, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	_, err := r.db.Pool.Exec(ctx, query,
		cert.ID,
		cert.TenantID,
		cert.CertificateNumber,
		cert.RecyclerName,
		nilIfEmpty(cert.RecyclerEprID),
		cert.WeightKg,
		nilIfEmpty(cert.BatteryType),
		cert.FinancialYear,
		cert.IssuedDate,
		cert.ExpiryDate,
		cert.Status,
		nilIfEmpty(cert.DocumentPath),
		nilIfEmpty(cert.Notes),
		cert.CreatedAt,
		cert.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create EPR certificate: %w", err)
	}
	return nil
}

// ListEPRCertificates returns all certificates for a tenant, optionally filtered by financial year
func (r *Repository) ListEPRCertificates(ctx context.Context, tenantID uuid.UUID, financialYear string) ([]*models.EPRCertificate, error) {
	var query string
	var args []interface{}

	if financialYear != "" {
		query = `SELECT id, tenant_id, certificate_number, recycler_name,
				 COALESCE(recycler_epr_id, ''), weight_kg, COALESCE(battery_type, ''),
				 financial_year, issued_date, expiry_date, status, retired_at,
				 COALESCE(document_path, ''), COALESCE(notes, ''), created_at, updated_at
				 FROM epr_certificates WHERE tenant_id = $1 AND financial_year = $2
				 ORDER BY created_at DESC`
		args = []interface{}{tenantID, financialYear}
	} else {
		query = `SELECT id, tenant_id, certificate_number, recycler_name,
				 COALESCE(recycler_epr_id, ''), weight_kg, COALESCE(battery_type, ''),
				 financial_year, issued_date, expiry_date, status, retired_at,
				 COALESCE(document_path, ''), COALESCE(notes, ''), created_at, updated_at
				 FROM epr_certificates WHERE tenant_id = $1
				 ORDER BY created_at DESC`
		args = []interface{}{tenantID}
	}

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list EPR certificates: %w", err)
	}
	defer rows.Close()

	var certs []*models.EPRCertificate
	for rows.Next() {
		cert := &models.EPRCertificate{}
		if err := rows.Scan(
			&cert.ID, &cert.TenantID, &cert.CertificateNumber, &cert.RecyclerName,
			&cert.RecyclerEprID, &cert.WeightKg, &cert.BatteryType,
			&cert.FinancialYear, &cert.IssuedDate, &cert.ExpiryDate, &cert.Status, &cert.RetiredAt,
			&cert.DocumentPath, &cert.Notes, &cert.CreatedAt, &cert.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan EPR certificate: %w", err)
		}
		certs = append(certs, cert)
	}

	return certs, nil
}

// GetEPRCertificateSummary returns the total certified weight and certificate count for a financial year
func (r *Repository) GetEPRCertificateSummary(ctx context.Context, tenantID uuid.UUID, financialYear string) (float64, int, error) {
	query := `SELECT COALESCE(SUM(weight_kg), 0), COUNT(*)
			  FROM epr_certificates
			  WHERE tenant_id = $1 AND financial_year = $2 AND status = $3`

	var totalKg float64
	var count int
	err := r.db.Pool.QueryRow(ctx, query, tenantID, financialYear, models.EPRCertStatusActive).Scan(&totalKg, &count)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get EPR certificate summary: %w", err)
	}
	return totalKg, count, nil
}

// RetireEPRCertificate marks a certificate as retired (used/applied against obligation)
func (r *Repository) RetireEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	now := time.Now()
	query := `UPDATE epr_certificates SET status = $3, retired_at = $4, updated_at = $5
			  WHERE id = $1 AND tenant_id = $2 AND status = $6`

	tag, err := r.db.Pool.Exec(ctx, query, id, tenantID, models.EPRCertStatusRetired, now, now, models.EPRCertStatusActive)
	if err != nil {
		return fmt.Errorf("failed to retire EPR certificate: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("certificate not found or already retired")
	}
	return nil
}

// DeleteEPRCertificate removes a certificate (only if still ACTIVE)
func (r *Repository) DeleteEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	query := `DELETE FROM epr_certificates WHERE id = $1 AND tenant_id = $2`
	tag, err := r.db.Pool.Exec(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete EPR certificate: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("certificate not found")
	}
	return nil
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
