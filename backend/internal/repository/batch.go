package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

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
