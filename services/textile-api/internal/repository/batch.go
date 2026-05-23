package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/textile-api/internal/models"
)

// CreateBatchRequest contains all parameters for creating a batch.
// Battery-specific fields (CellSource, HSNCode, BISNumber, etc.) are stored
// inside Specs JSONB — do not set them as top-level fields.
type CreateBatchRequest struct {
	TenantID         uuid.UUID
	BatchName        string
	ModelName        string
	Specs            models.BatchSpec
	MarketRegion     models.MarketRegion
	ProductType      models.ProductType // v2: defaults to BATTERY if empty
	PLICompliant     bool
	DomesticValueAdd float64

	// Manufacturing window
	ManufacturingStartDate *time.Time
	ManufacturingEndDate   *time.Time
}

// CreateBatch creates a new batch with dual-mode support
func (r *Repository) CreateBatch(ctx context.Context, req CreateBatchRequest) (*models.Batch, error) {
	// Default to GLOBAL if not specified
	marketRegion := req.MarketRegion
	if marketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}

	// v2: Default product type to BATTERY
	productType := req.ProductType
	if !productType.IsValid() {
		productType = models.DefaultProductType()
	}

	batch := &models.Batch{
		ID:                     uuid.New(),
		TenantID:               req.TenantID,
		BatchName:              req.BatchName,
		ModelName:              req.ModelName,
		Specs:                  req.Specs,
		CreatedAt:              time.Now(),
		ProductType:            productType,
		SchemaVersion:          1,
		MarketRegion:           marketRegion,
		PLICompliant:           req.PLICompliant,
		DomesticValueAdd:       req.DomesticValueAdd,
		ManufacturingStartDate: req.ManufacturingStartDate,
		ManufacturingEndDate:   req.ManufacturingEndDate,
	}

	specsJSON, err := json.Marshal(req.Specs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal specs: %w", err)
	}

	query := `INSERT INTO public.batches
		(id, tenant_id, batch_name, model_name, specs, created_at, status, market_region, pli_compliant, domestic_value_add,
		 manufacturing_start_date, manufacturing_end_date,
		 carbon_footprint_result,
		 product_type, schema_version)
		VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)`

	_, err = r.db.Pool.Exec(ctx, query,
		batch.ID,
		batch.TenantID,
		batch.BatchName,
		batch.ModelName,
		string(specsJSON), // Pass as string, let PostgreSQL cast to jsonb
		batch.CreatedAt,
		models.BatchStatusDraft, // New batches start as DRAFT
		string(marketRegion),
		batch.PLICompliant,
		batch.DomesticValueAdd,
		req.ManufacturingStartDate,
		req.ManufacturingEndDate,
		nil, // carbon_footprint_result — populated later via POST /api/v1/carbon/calculate
		string(productType),
		batch.SchemaVersion,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create batch: %w", err)
	}

	return batch, nil
}

// GetBatch retrieves a batch by ID with all dual-mode fields
// SECURITY: Requires tenantID to prevent IDOR attacks
func (r *Repository) GetBatch(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.Batch, error) {
	batch := &models.Batch{}
	var specsJSON []byte
	var marketRegion string
	var manufacturingStart, manufacturingEnd *time.Time

	query := `SELECT id, tenant_id, batch_name, model_name, specs, created_at,
	          COALESCE(status, 'DRAFT') as status,
	          COALESCE(market_region, 'GLOBAL') as market_region,
	          COALESCE(pli_compliant, false),
	          COALESCE(domestic_value_add, 0),
	          manufacturing_start_date,
	          manufacturing_end_date,
	          carbon_footprint_result,
	          COALESCE(product_type, 'BATTERY') as product_type,
	          COALESCE(schema_version, 1) as schema_version,
	          COALESCE(compliance_score, 0) as compliance_score,
	          compliance_gaps
	          FROM public.batches WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var productType string
	err := r.db.Pool.QueryRow(ctx, query, id, tenantID).Scan(
		&batch.ID,
		&batch.TenantID,
		&batch.BatchName,
		&batch.ModelName,
		&specsJSON,
		&batch.CreatedAt,
		&batch.Status,
		&marketRegion,
		&batch.PLICompliant,
		&batch.DomesticValueAdd,
		&manufacturingStart,
		&manufacturingEnd,
		&batch.CarbonFootprintResult,
		&productType,
		&batch.SchemaVersion,
		&batch.ComplianceScore,
		&batch.ComplianceGaps,
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
	batch.ProductType = models.ProductType(productType)
	batch.ManufacturingStartDate = manufacturingStart
	batch.ManufacturingEndDate = manufacturingEnd

	return batch, nil
}

// ListBatches retrieves batches for a tenant with dual-mode fields and pagination
func (r *Repository) ListBatches(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int) ([]*models.Batch, int, error) {
	// Default limit if not specified
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200 // Cap at 200
	}

	// Get total count first
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM public.batches WHERE tenant_id = $1 AND deleted_at IS NULL AND ($2 = '' OR product_type = $2)`
	if err := r.db.Pool.QueryRow(ctx, countQuery, tenantID, productType).Scan(&totalCount); err != nil {
		return nil, 0, fmt.Errorf("failed to count batches: %w", err)
	}

	query := `SELECT b.id, b.tenant_id, b.batch_name, b.model_name, b.specs, b.created_at,
	          COALESCE(b.status, 'DRAFT') as status,
	          COALESCE(b.market_region::text, 'GLOBAL') as market_region,
	          COALESCE(b.pli_compliant, false),
	          COALESCE(b.domestic_value_add, 0),
	          b.manufacturing_start_date,
	          b.manufacturing_end_date,
	          b.carbon_footprint_result,
	          COALESCE(b.product_type, 'BATTERY') as product_type,
	          COALESCE(b.schema_version, 1) as schema_version,
	          COALESCE(b.compliance_score, 0) as compliance_score,
	          b.compliance_gaps,
	          COUNT(p.uuid)::int as total_passports
	          FROM public.batches b
	          LEFT JOIN public.passports p ON b.id = p.batch_id
	          WHERE b.tenant_id = $1 AND b.deleted_at IS NULL AND ($4 = '' OR b.product_type = $4)
	          GROUP BY b.id, b.tenant_id, b.batch_name, b.model_name, b.specs, b.created_at, b.status,
	                   b.market_region, b.pli_compliant, b.domestic_value_add,
	                   b.manufacturing_start_date, b.manufacturing_end_date,
	                   b.carbon_footprint_result, b.product_type, b.schema_version, b.compliance_score, b.compliance_gaps
	          ORDER BY b.created_at DESC
	          LIMIT $2 OFFSET $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, offset, productType)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		var specsJSON []byte
		var marketRegion string
		var manufacturingStart, manufacturingEnd *time.Time
		var productType string

		if err := rows.Scan(
			&batch.ID,
			&batch.TenantID,
			&batch.BatchName,
			&batch.ModelName,
			&specsJSON,
			&batch.CreatedAt,
			&batch.Status,
			&marketRegion,
			&batch.PLICompliant,
			&batch.DomesticValueAdd,
			&manufacturingStart,
			&manufacturingEnd,
			&batch.CarbonFootprintResult,
			&productType,
			&batch.SchemaVersion,
			&batch.ComplianceScore,
			&batch.ComplianceGaps,
			&batch.TotalPassports,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan batch: %w", err)
		}

		if len(specsJSON) > 0 {
			if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal specs: %w", err)
			}
		}

		batch.MarketRegion = models.MarketRegion(marketRegion)
		batch.ProductType = models.ProductType(productType)
		batch.ManufacturingStartDate = manufacturingStart
		batch.ManufacturingEndDate = manufacturingEnd

		batches = append(batches, batch)
	}

	return batches, totalCount, nil
}

func (r *Repository) DeleteBatch(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE public.batches SET deleted_at = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete batch: %w", err)
	}
	return nil
}

// UpdateBatchMetadata updates the domestic_value_add of a batch.
// Battery-specific fields (cell_source, bill_of_entry, country_of_origin) are
// now stored in specs JSONB and updated via PatchBatchDraft.
func (r *Repository) UpdateBatchMetadata(ctx context.Context, id uuid.UUID, domesticValue *float64) error {
	query := `UPDATE public.batches SET
		domestic_value_add = COALESCE($2, domestic_value_add)
		WHERE id = $1`

	_, err := r.db.Pool.Exec(ctx, query, id, domesticValue)
	if err != nil {
		return fmt.Errorf("failed to update batch metadata: %w", err)
	}
	return nil
}

// PatchBatchDraft applies a partial update to a DRAFT batch (batch + specs JSONB).
// Returns an error if the batch is not found, not owned by tenantID, or not in DRAFT status.
func (r *Repository) PatchBatchDraft(ctx context.Context, id uuid.UUID, tenantID uuid.UUID, req models.PatchBatchRequest) error {
	// Merge specs patch into existing JSONB using PostgreSQL || operator (top-level merge).
	var specsFragment interface{}
	if len(req.Specs) > 0 {
		raw, err := json.Marshal(req.Specs)
		if err != nil {
			return fmt.Errorf("failed to marshal specs patch: %w", err)
		}
		specsFragment = string(raw)
	}

	query := `UPDATE public.batches SET
		model_name              = COALESCE($3,  model_name),
		manufacturing_start_date= COALESCE($4,  manufacturing_start_date),
		manufacturing_end_date  = COALESCE($5,  manufacturing_end_date),
		domestic_value_add      = COALESCE($6,  domestic_value_add),
		specs = CASE WHEN $7::text IS NULL THEN specs ELSE specs || $7::jsonb END
	WHERE id = $1 AND tenant_id = $2 AND COALESCE(status, 'DRAFT') = 'DRAFT'`

	result, err := r.db.Pool.Exec(ctx, query,
		id, tenantID,
		req.ModelName,
		req.ManufacturingStartDate,
		req.ManufacturingEndDate,
		req.DomesticValueAdd,
		specsFragment,
	)
	if err != nil {
		return fmt.Errorf("failed to patch batch: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("batch not found or not a DRAFT")
	}
	return nil
}

// SetBatchStatus updates batch status (for activation)
func (r *Repository) SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error {
	query := `UPDATE public.batches SET status = $2 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, batchID, status)
	if err != nil {
		return fmt.Errorf("failed to set batch status: %w", err)
	}
	return nil
}

// GetBatchMarketRegion retrieves the market region for a batch (no tenant filter)
func (r *Repository) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) {
	var region string
	query := `SELECT COALESCE(market_region::text, 'GLOBAL') FROM public.batches WHERE id = $1`
	if err := r.db.Pool.QueryRow(ctx, query, batchID).Scan(&region); err != nil {
		return "", fmt.Errorf("failed to get batch market region: %w", err)
	}
	return models.MarketRegion(region), nil
}

// GetBatchTenantID returns the tenant_id for a batch. Used for ownership verification.
func (r *Repository) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) {
	var tenantID uuid.UUID
	query := `SELECT tenant_id FROM public.batches WHERE id = $1 AND deleted_at IS NULL`
	if err := r.db.Pool.QueryRow(ctx, query, batchID).Scan(&tenantID); err != nil {
		return uuid.Nil, fmt.Errorf("failed to get batch tenant: %w", err)
	}
	return tenantID, nil
}

// UpdateBatchComplianceResult saves the compliance engine score and gap list for a batch.
// Called after ActivateBatch runs the compliance validators.
// gapsJSON must be valid JSON (e.g. `[]` or `[{"field":"...","regulation":"..."}]`).
func (r *Repository) UpdateBatchComplianceResult(ctx context.Context, batchID uuid.UUID, score float64, gapsJSON []byte) error {
	if len(gapsJSON) == 0 {
		gapsJSON = []byte("[]")
	}
	query := `UPDATE public.batches
	          SET compliance_score = $2, compliance_gaps = $3::jsonb
	          WHERE id = $1`
	tag, err := r.db.Pool.Exec(ctx, query, batchID, score, string(gapsJSON))
	if err != nil {
		return fmt.Errorf("failed to update compliance result: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("batch not found")
	}
	return nil
}

// SaveCarbonFootprintResult stores the carbon calculator result on a batch
func (r *Repository) SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte) error {
	query := `UPDATE public.batches SET carbon_footprint_result = $3::jsonb WHERE id = $1 AND tenant_id = $2`
	tag, err := r.db.Pool.Exec(ctx, query, batchID, tenantID, string(resultJSON))
	if err != nil {
		return fmt.Errorf("failed to save carbon footprint result: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("batch not found")
	}
	return nil
}
