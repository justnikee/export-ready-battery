package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateMassBalanceLedger inserts a new mass balance ledger entry for a tenant.
func (r *Repository) CreateMassBalanceLedger(ctx context.Context, ledger *models.MassBalanceLedger) error {
	query := `INSERT INTO mass_balance_ledgers
		(id, tenant_id, material_type, incoming_kg, incoming_source, allocated_kg, balance_kg, certificate_url, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.Pool.Exec(ctx, query,
		ledger.ID, ledger.TenantID, ledger.MaterialType, ledger.IncomingKg, ledger.IncomingSource,
		ledger.AllocatedKg, ledger.BalanceKg, ledger.CertificateURL, ledger.Notes, ledger.CreatedAt, ledger.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create mass balance ledger: %w", err)
	}
	return nil
}

// GetMassBalanceLedgersByTenant returns all mass balance ledgers for a tenant,
// optionally filtered by material type.
func (r *Repository) GetMassBalanceLedgersByTenant(ctx context.Context, tenantID uuid.UUID, materialType string) ([]*models.MassBalanceLedger, error) {
	query := `SELECT id, tenant_id, material_type, incoming_kg, incoming_source, allocated_kg, balance_kg, certificate_url, notes, created_at, updated_at
			  FROM mass_balance_ledgers
			  WHERE tenant_id = $1`
	args := []interface{}{tenantID}

	if materialType != "" {
		query += " AND material_type = $2"
		args = append(args, materialType)
	}
	query += " ORDER BY material_type, created_at DESC"

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query mass balance ledgers: %w", err)
	}
	defer rows.Close()

	return scanMassBalanceLedgers(rows)
}

// GetMassBalanceLedgerByID returns a single mass balance ledger by ID.
func (r *Repository) GetMassBalanceLedgerByID(ctx context.Context, id uuid.UUID) (*models.MassBalanceLedger, error) {
	query := `SELECT id, tenant_id, material_type, incoming_kg, incoming_source, allocated_kg, balance_kg, certificate_url, notes, created_at, updated_at
			  FROM mass_balance_ledgers
			  WHERE id = $1`

	ledger := &models.MassBalanceLedger{}
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&ledger.ID, &ledger.TenantID, &ledger.MaterialType, &ledger.IncomingKg, &ledger.IncomingSource,
		&ledger.AllocatedKg, &ledger.BalanceKg, &ledger.CertificateURL, &ledger.Notes, &ledger.CreatedAt, &ledger.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get mass balance ledger: %w", err)
	}
	return ledger, nil
}

// UpdateMassBalanceLedger atomically adjusts incoming and allocated quantities,
// recalculating the balance. Positive deltas increase, negative decrease.
// Returns an error if the resulting balance would be negative.
func (r *Repository) UpdateMassBalanceLedger(ctx context.Context, id uuid.UUID, incomingDelta, allocatedDelta float64) error {
	query := `UPDATE mass_balance_ledgers
			  SET incoming_kg = incoming_kg + $2,
			      allocated_kg = allocated_kg + $3,
			      balance_kg = incoming_kg + $2 - allocated_kg - $3,
			      updated_at = $4
			  WHERE id = $1
			    AND incoming_kg + $2 - allocated_kg - $3 >= 0`

	res, err := r.db.Pool.Exec(ctx, query, id, incomingDelta, allocatedDelta, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update mass balance ledger: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient balance: allocation would exceed available mass balance")
	}
	return nil
}

// CreateMassBalanceAllocation records a book-and-claim allocation from a ledger
// to a specific batch (and optionally passport).
func (r *Repository) CreateMassBalanceAllocation(ctx context.Context, allocation *models.MassBalanceAllocation) error {
	query := `INSERT INTO mass_balance_allocations
		(id, ledger_id, batch_id, passport_id, material_type, allocated_kg, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.db.Pool.Exec(ctx, query,
		allocation.ID, allocation.LedgerID, allocation.BatchID, allocation.PassportID,
		allocation.MaterialType, allocation.AllocatedKg, allocation.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create mass balance allocation: %w", err)
	}
	return nil
}

// GetMassBalanceAllocationsByBatch returns all allocations linked to a batch.
func (r *Repository) GetMassBalanceAllocationsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.MassBalanceAllocation, error) {
	query := `SELECT id, ledger_id, batch_id, passport_id, material_type, allocated_kg, created_at
			  FROM mass_balance_allocations
			  WHERE batch_id = $1
			  ORDER BY material_type, created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to query mass balance allocations: %w", err)
	}
	defer rows.Close()

	return scanMassBalanceAllocations(rows)
}

func scanMassBalanceLedgers(rows pgx.Rows) ([]*models.MassBalanceLedger, error) {
	var ledgers []*models.MassBalanceLedger
	for rows.Next() {
		l := &models.MassBalanceLedger{}
		err := rows.Scan(
			&l.ID, &l.TenantID, &l.MaterialType, &l.IncomingKg, &l.IncomingSource,
			&l.AllocatedKg, &l.BalanceKg, &l.CertificateURL, &l.Notes, &l.CreatedAt, &l.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan mass balance ledger: %w", err)
		}
		ledgers = append(ledgers, l)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return ledgers, nil
}

func scanMassBalanceAllocations(rows pgx.Rows) ([]*models.MassBalanceAllocation, error) {
	var allocations []*models.MassBalanceAllocation
	for rows.Next() {
		a := &models.MassBalanceAllocation{}
		err := rows.Scan(
			&a.ID, &a.LedgerID, &a.BatchID, &a.PassportID, &a.MaterialType, &a.AllocatedKg, &a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan mass balance allocation: %w", err)
		}
		allocations = append(allocations, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return allocations, nil
}
