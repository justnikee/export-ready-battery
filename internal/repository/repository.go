package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/db"
	"exportready-battery/internal/models"
)

// Repository handles all database operations
type Repository struct {
	db *db.DB
}

// New creates a new Repository
func New(database *db.DB) *Repository {
	return &Repository{db: database}
}

// ============================================
// TENANT OPERATIONS
// ============================================

// CreateTenant creates a new tenant
func (r *Repository) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) {
	tenant := &models.Tenant{
		ID:          uuid.New(),
		CompanyName: companyName,
		CreatedAt:   time.Now(),
	}

	query := `INSERT INTO public.tenants (id, company_name, created_at) VALUES ($1, $2, $3)`
	_, err := r.db.Pool.Exec(ctx, query, tenant.ID, tenant.CompanyName, tenant.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	return tenant, nil
}

// GetTenant retrieves a tenant by ID
func (r *Repository) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	tenant := &models.Tenant{}
	query := `SELECT id, company_name, created_at FROM public.tenants WHERE id = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(&tenant.ID, &tenant.CompanyName, &tenant.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return tenant, nil
}

// ============================================
// BATCH OPERATIONS
// ============================================

// CreateBatch creates a new batch
func (r *Repository) CreateBatch(ctx context.Context, tenantID uuid.UUID, batchName string, specs models.BatchSpec) (*models.Batch, error) {
	batch := &models.Batch{
		ID:        uuid.New(),
		TenantID:  tenantID,
		BatchName: batchName,
		Specs:     specs,
		CreatedAt: time.Now(),
	}

	specsJSON, err := json.Marshal(specs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal specs: %w", err)
	}

	query := `INSERT INTO public.batches (id, tenant_id, batch_name, specs, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err = r.db.Pool.Exec(ctx, query, batch.ID, batch.TenantID, batch.BatchName, specsJSON, batch.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create batch: %w", err)
	}

	return batch, nil
}

// GetBatch retrieves a batch by ID
func (r *Repository) GetBatch(ctx context.Context, id uuid.UUID) (*models.Batch, error) {
	batch := &models.Batch{}
	var specsJSON []byte

	query := `SELECT id, tenant_id, batch_name, specs, created_at FROM public.batches WHERE id = $1`
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(&batch.ID, &batch.TenantID, &batch.BatchName, &specsJSON, &batch.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("batch not found")
		}
		return nil, fmt.Errorf("failed to get batch: %w", err)
	}

	if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
	}

	return batch, nil
}

// ListBatches retrieves all batches for a tenant
func (r *Repository) ListBatches(ctx context.Context, tenantID uuid.UUID) ([]*models.Batch, error) {
	query := `SELECT id, tenant_id, batch_name, specs, created_at FROM public.batches WHERE tenant_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		var specsJSON []byte

		if err := rows.Scan(&batch.ID, &batch.TenantID, &batch.BatchName, &specsJSON, &batch.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
			return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
		}

		batches = append(batches, batch)
	}

	return batches, nil
}

// ============================================
// PASSPORT OPERATIONS
// ============================================

// CreatePassport creates a single passport
func (r *Repository) CreatePassport(ctx context.Context, passport *models.Passport) error {
	query := `INSERT INTO public.passports (uuid, batch_id, serial_number, manufacture_date, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.db.Pool.Exec(ctx, query,
		passport.UUID,
		passport.BatchID,
		passport.SerialNumber,
		passport.ManufactureDate,
		passport.Status,
		passport.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create passport: %w", err)
	}

	return nil
}

// CreatePassportsBatch inserts multiple passports efficiently using COPY
func (r *Repository) CreatePassportsBatch(ctx context.Context, passports []*models.Passport) (int, error) {
	if len(passports) == 0 {
		return 0, nil
	}

	// Use CopyFrom for bulk insert (much faster than individual inserts)
	columns := []string{"uuid", "batch_id", "serial_number", "manufacture_date", "status", "created_at"}

	rows := make([][]interface{}, len(passports))
	for i, p := range passports {
		rows[i] = []interface{}{p.UUID, p.BatchID, p.SerialNumber, p.ManufactureDate, p.Status, p.CreatedAt}
	}

	copyCount, err := r.db.Pool.CopyFrom(
		ctx,
		pgx.Identifier{"public", "passports"},
		columns,
		pgx.CopyFromRows(rows),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk insert passports: %w", err)
	}

	return int(copyCount), nil
}

// GetPassport retrieves a passport by UUID
func (r *Repository) GetPassport(ctx context.Context, id uuid.UUID) (*models.Passport, error) {
	passport := &models.Passport{}

	query := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at 
	          FROM public.passports WHERE uuid = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("passport not found")
		}
		return nil, fmt.Errorf("failed to get passport: %w", err)
	}

	return passport, nil
}

// GetPassportWithSpecs retrieves a passport with its batch specs (for public page)
func (r *Repository) GetPassportWithSpecs(ctx context.Context, id uuid.UUID) (*models.PassportWithSpecs, error) {
	query := `
		SELECT p.uuid, p.batch_id, p.serial_number, p.manufacture_date, p.status, p.created_at,
		       b.batch_name, b.specs
		FROM public.passports p
		JOIN public.batches b ON p.batch_id = b.id
		WHERE p.uuid = $1
	`

	passport := &models.Passport{}
	var batchName string
	var specsJSON []byte

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&passport.UUID,
		&passport.BatchID,
		&passport.SerialNumber,
		&passport.ManufactureDate,
		&passport.Status,
		&passport.CreatedAt,
		&batchName,
		&specsJSON,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("passport not found")
		}
		return nil, fmt.Errorf("failed to get passport with specs: %w", err)
	}

	specs := &models.BatchSpec{}
	if err := json.Unmarshal(specsJSON, specs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
	}

	return &models.PassportWithSpecs{
		Passport:  passport,
		BatchName: batchName,
		Specs:     specs,
	}, nil
}

// GetPassportsByBatch retrieves all passports for a batch
func (r *Repository) GetPassportsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.Passport, error) {
	query := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at 
	          FROM public.passports WHERE batch_id = $1 ORDER BY serial_number`

	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to get passports: %w", err)
	}
	defer rows.Close()

	var passports []*models.Passport
	for rows.Next() {
		passport := &models.Passport{}
		if err := rows.Scan(
			&passport.UUID,
			&passport.BatchID,
			&passport.SerialNumber,
			&passport.ManufactureDate,
			&passport.Status,
			&passport.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan passport: %w", err)
		}
		passports = append(passports, passport)
	}

	return passports, nil
}

// CountPassportsByBatch returns the number of passports in a batch
func (r *Repository) CountPassportsByBatch(ctx context.Context, batchID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM public.passports WHERE batch_id = $1`
	err := r.db.Pool.QueryRow(ctx, query, batchID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count passports: %w", err)
	}
	return count, nil
}
