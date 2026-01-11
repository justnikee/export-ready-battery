package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

// CreateBatchRequest contains all parameters for creating a batch
type CreateBatchRequest struct {
	TenantID         uuid.UUID
	BatchName        string
	Specs            models.BatchSpec
	MarketRegion     models.MarketRegion
	PLICompliant     bool
	DomesticValueAdd float64
	CellSource       string
	Materials        *models.Materials
}

// CreateBatch creates a new batch with dual-mode support
func (r *Repository) CreateBatch(ctx context.Context, req CreateBatchRequest) (*models.Batch, error) {
	// Default to GLOBAL if not specified
	marketRegion := req.MarketRegion
	if marketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}

	batch := &models.Batch{
		ID:               uuid.New(),
		TenantID:         req.TenantID,
		BatchName:        req.BatchName,
		Specs:            req.Specs,
		CreatedAt:        time.Now(),
		MarketRegion:     marketRegion,
		PLICompliant:     req.PLICompliant,
		DomesticValueAdd: req.DomesticValueAdd,
		CellSource:       req.CellSource,
		Materials:        req.Materials,
	}

	specsJSON, err := json.Marshal(req.Specs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal specs: %w", err)
	}

	// Marshal materials if provided - use interface{} for proper nil handling
	var materialsParam interface{}
	if req.Materials != nil {
		materialsJSON, err := json.Marshal(req.Materials)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal materials: %w", err)
		}
		materialsParam = materialsJSON
	}

	// Handle nullable cell_source
	var cellSource interface{}
	if req.CellSource != "" {
		cellSource = req.CellSource
	}

	// Debug logging
	log.Printf("DEBUG CreateBatch: specsJSON=%s, marketRegion=%s, materials=%v", string(specsJSON), marketRegion, materialsParam)

	// Use explicit ::jsonb cast and pass as string to avoid pgx []byte encoding issues
	query := `INSERT INTO public.batches 
		(id, tenant_id, batch_name, specs, created_at, market_region, pli_compliant, domestic_value_add, cell_source, materials) 
		VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10::jsonb)`

	// Convert materials to string if not nil
	var materialsStr interface{}
	if materialsParam != nil {
		materialsStr = string(materialsParam.([]byte))
	}

	_, err = r.db.Pool.Exec(ctx, query,
		batch.ID,
		batch.TenantID,
		batch.BatchName,
		string(specsJSON), // Pass as string, let PostgreSQL cast to jsonb
		batch.CreatedAt,
		string(marketRegion),
		batch.PLICompliant,
		batch.DomesticValueAdd,
		cellSource,
		materialsStr,
	)
	if err != nil {
		log.Printf("DEBUG CreateBatch ERROR: %v", err)
		return nil, fmt.Errorf("failed to create batch: %w", err)
	}

	return batch, nil
}

// GetBatch retrieves a batch by ID with all dual-mode fields
func (r *Repository) GetBatch(ctx context.Context, id uuid.UUID) (*models.Batch, error) {
	batch := &models.Batch{}
	var specsJSON []byte
	var materialsJSON []byte
	var marketRegion string
	var cellSource *string

	query := `SELECT id, tenant_id, batch_name, specs, created_at, 
	          COALESCE(market_region, 'GLOBAL') as market_region, 
	          COALESCE(pli_compliant, false), 
	          COALESCE(domestic_value_add, 0), 
	          cell_source, 
	          materials 
	          FROM public.batches WHERE id = $1 AND deleted_at IS NULL`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&batch.ID,
		&batch.TenantID,
		&batch.BatchName,
		&specsJSON,
		&batch.CreatedAt,
		&marketRegion,
		&batch.PLICompliant,
		&batch.DomesticValueAdd,
		&cellSource,
		&materialsJSON,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("batch not found")
		}
		return nil, fmt.Errorf("failed to get batch: %w", err)
	}

	if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
	}

	batch.MarketRegion = models.MarketRegion(marketRegion)

	if cellSource != nil {
		batch.CellSource = *cellSource
	}

	if materialsJSON != nil && len(materialsJSON) > 0 {
		batch.Materials = &models.Materials{}
		if err := json.Unmarshal(materialsJSON, batch.Materials); err != nil {
			return nil, fmt.Errorf("failed to unmarshal materials: %w", err)
		}
	}

	return batch, nil
}

// ListBatches retrieves all batches for a tenant with dual-mode fields
func (r *Repository) ListBatches(ctx context.Context, tenantID uuid.UUID) ([]*models.Batch, error) {
	query := `SELECT b.id, b.tenant_id, b.batch_name, b.specs, b.created_at, 
	          COALESCE(b.market_region::text, 'GLOBAL') as market_region, 
	          COALESCE(b.pli_compliant, false), 
	          COALESCE(b.domestic_value_add, 0), 
	          b.cell_source, 
	          b.materials,
	          COUNT(p.uuid)::int as total_passports
	          FROM public.batches b
	          LEFT JOIN public.passports p ON b.id = p.batch_id
	          WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
	          GROUP BY b.id
	          ORDER BY b.created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		log.Printf("ListBatches Query Error: %v", err)
		return nil, fmt.Errorf("failed to list batches: %w\n", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		var specsJSON []byte
		var materialsJSON []byte
		var marketRegion string
		var cellSource *string

		if err := rows.Scan(
			&batch.ID,
			&batch.TenantID,
			&batch.BatchName,
			&specsJSON,
			&batch.CreatedAt,
			&marketRegion,
			&batch.PLICompliant,
			&batch.DomesticValueAdd,
			&cellSource,
			&materialsJSON,
			&batch.TotalPassports,
		); err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		if len(specsJSON) > 0 {
			if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
				return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
			}
		}

		batch.MarketRegion = models.MarketRegion(marketRegion)

		if cellSource != nil {
			batch.CellSource = *cellSource
		}

		if materialsJSON != nil && len(materialsJSON) > 0 {
			batch.Materials = &models.Materials{}
			if err := json.Unmarshal(materialsJSON, batch.Materials); err != nil {
				return nil, fmt.Errorf("failed to unmarshal materials: %w", err)
			}
		}

		batches = append(batches, batch)
	}

	return batches, nil
}

// DeleteBatch soft-deletes a batch
func (r *Repository) DeleteBatch(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE public.batches SET deleted_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete batch: %w", err)
	}
	return nil
}
