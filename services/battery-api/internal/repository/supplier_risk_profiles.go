package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateSupplierRiskProfile inserts a new risk profile.
func (r *Repository) CreateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error {
	query := `
		INSERT INTO supplier_risk_profiles (
			id, supplier_id, tenant_id, overall_score, country_risk_tier,
			mineral_risk_flags, rmap_valid, last_audit_date, next_audit_due,
			computed_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		p.ID, p.SupplierID, p.TenantID, p.OverallScore, p.CountryRiskTier,
		p.MineralRiskFlags, p.RMAPValid, p.LastAuditDate, p.NextAuditDue,
		p.ComputedAt, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create supplier risk profile: %w", err)
	}
	return nil
}

// GetSupplierRiskProfileBySupplier returns the risk profile for a supplier.
func (r *Repository) GetSupplierRiskProfileBySupplier(ctx context.Context, supplierID uuid.UUID) (*models.SupplierRiskProfile, error) {
	query := `
		SELECT id, supplier_id, tenant_id, overall_score, country_risk_tier,
			mineral_risk_flags, rmap_valid, last_audit_date, next_audit_due,
			computed_at, created_at, updated_at
		FROM supplier_risk_profiles WHERE supplier_id = $1
	`
	row := r.db.Pool.QueryRow(ctx, query, supplierID)
	return scanSupplierRiskProfileRow(row)
}

// UpdateSupplierRiskProfile updates the computed risk fields.
func (r *Repository) UpdateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error {
	query := `
		UPDATE supplier_risk_profiles SET
			overall_score = $2,
			country_risk_tier = $3,
			mineral_risk_flags = $4,
			rmap_valid = $5,
			last_audit_date = $6,
			next_audit_due = $7,
			computed_at = $8,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query,
		p.ID, p.OverallScore, p.CountryRiskTier, p.MineralRiskFlags,
		p.RMAPValid, p.LastAuditDate, p.NextAuditDue, p.ComputedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update supplier risk profile: %w", err)
	}
	return nil
}

// ListSupplierRiskProfilesByTenant returns all risk profiles for a tenant.
func (r *Repository) ListSupplierRiskProfilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.SupplierRiskProfile, error) {
	query := `
		SELECT id, supplier_id, tenant_id, overall_score, country_risk_tier,
			mineral_risk_flags, rmap_valid, last_audit_date, next_audit_due,
			computed_at, created_at, updated_at
		FROM supplier_risk_profiles WHERE tenant_id = $1
		ORDER BY overall_score DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list supplier risk profiles: %w", err)
	}
	defer rows.Close()
	return scanSupplierRiskProfiles(rows)
}

func scanSupplierRiskProfiles(rows pgx.Rows) ([]models.SupplierRiskProfile, error) {
	var out []models.SupplierRiskProfile
	for rows.Next() {
		p, err := scanSupplierRiskProfileRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

// GetSupplierRiskProfilesBySuppliers returns risk profiles for multiple suppliers.
func (r *Repository) GetSupplierRiskProfilesBySuppliers(ctx context.Context, tenantID uuid.UUID, supplierIDs []uuid.UUID) ([]models.SupplierRiskProfile, error) {
	if len(supplierIDs) == 0 {
		return nil, nil
	}
	query := `
		SELECT id, supplier_id, tenant_id, overall_score, country_risk_tier,
			mineral_risk_flags, rmap_valid, last_audit_date, next_audit_due,
			computed_at, created_at, updated_at
		FROM supplier_risk_profiles
		WHERE tenant_id = $1 AND supplier_id = ANY($2)
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, supplierIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to query supplier risk profiles: %w", err)
	}
	defer rows.Close()
	return scanSupplierRiskProfiles(rows)
}

func scanSupplierRiskProfileRow(row pgx.Row) (*models.SupplierRiskProfile, error) {
	var p models.SupplierRiskProfile
	err := row.Scan(
		&p.ID, &p.SupplierID, &p.TenantID, &p.OverallScore, &p.CountryRiskTier,
		&p.MineralRiskFlags, &p.RMAPValid, &p.LastAuditDate, &p.NextAuditDue,
		&p.ComputedAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan supplier risk profile: %w", err)
	}
	return &p, nil
}
