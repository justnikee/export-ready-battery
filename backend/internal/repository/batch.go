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

// CreateBatchRequest contains all parameters for creating a batch
type CreateBatchRequest struct {
	TenantID         uuid.UUID
	BatchName        string
	ModelName        string
	Specs            models.BatchSpec
	MarketRegion     models.MarketRegion
	ProductType      models.ProductType // v2: defaults to BATTERY if empty
	PLICompliant     bool
	DomesticValueAdd float64
	CellSource       string

	// Manufacturing window
	ManufacturingStartDate *time.Time
	ManufacturingEndDate   *time.Time

	// India Import/Customs Fields
	BillOfEntryNo   string
	CountryOfOrigin string
	CustomsDate     *time.Time
	HSNCode         string // India: Harmonized System Nomenclature code

	// DVA Audit Mode Fields
	DVASource         string // "ESTIMATED" or "AUDITED"
	PLICertificateURL string // URL to CA certificate (Supabase Storage)

	// India Compliance Certification Fields
	BISNumber string // BIS R-Number (e.g., "R-12345678")
	EPRNumber string // EPR Registration Number
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
		CellSource:             req.CellSource,
		ManufacturingStartDate: req.ManufacturingStartDate,
		ManufacturingEndDate:   req.ManufacturingEndDate,
		BillOfEntryNo:          req.BillOfEntryNo,
		CountryOfOrigin:        req.CountryOfOrigin,
		CustomsDate:            req.CustomsDate,
		HSNCode:                req.HSNCode,
		DVASource:              req.DVASource,
		PLICertificateURL:      req.PLICertificateURL,
		BISNumber:              req.BISNumber,
		EPRNumber:              req.EPRNumber,
	}

	specsJSON, err := json.Marshal(req.Specs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal specs: %w", err)
	}

	// Handle nullable cell_source
	var cellSource interface{}
	if req.CellSource != "" {
		cellSource = req.CellSource
	}

	// Updated query to include hsn_code, dva_source, pli_certificate_url, bis_number, epr_number, carbon_footprint_result
	query := `INSERT INTO public.batches 
		(id, tenant_id, batch_name, model_name, specs, created_at, status, market_region, pli_compliant, domestic_value_add, cell_source,
		 manufacturing_start_date, manufacturing_end_date,
		 bill_of_entry_no, country_of_origin, customs_date, hsn_code, dva_source, pli_certificate_url, bis_number, epr_number, carbon_footprint_result,
		 product_type, schema_version) 
		VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24)`

	// Handle nullable import fields
	var billOfEntry, countryOrigin, hsnCode interface{}
	if req.BillOfEntryNo != "" {
		billOfEntry = req.BillOfEntryNo
	}
	if req.CountryOfOrigin != "" {
		countryOrigin = req.CountryOfOrigin
	}
	if req.HSNCode != "" {
		hsnCode = req.HSNCode
	}

	// Handle nullable DVA audit fields
	var dvaSource, pliCertURL interface{}
	if req.DVASource != "" {
		dvaSource = req.DVASource
	}
	if req.PLICertificateURL != "" {
		pliCertURL = req.PLICertificateURL
	}

	// Handle nullable India compliance fields
	var bisNumber, eprNumber interface{}
	if req.BISNumber != "" {
		bisNumber = req.BISNumber
	}
	if req.EPRNumber != "" {
		eprNumber = req.EPRNumber
	}

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
		cellSource,
		req.ManufacturingStartDate,
		req.ManufacturingEndDate,
		billOfEntry,
		countryOrigin,
		req.CustomsDate,
		hsnCode,
		dvaSource,
		pliCertURL,
		bisNumber,
		eprNumber,
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
	var cellSource *string
	var billOfEntry, countryOrigin, hsnCode *string
	var customsDate *time.Time
	var manufacturingStart, manufacturingEnd *time.Time
	var dvaSource, pliCertURL *string
	var bisNumber, eprNumber *string

	query := `SELECT id, tenant_id, batch_name, model_name, specs, created_at, 
	          COALESCE(status, 'DRAFT') as status,
	          COALESCE(market_region, 'GLOBAL') as market_region, 
	          COALESCE(pli_compliant, false), 
	          COALESCE(domestic_value_add, 0), 
	          cell_source, 
	          manufacturing_start_date,
	          manufacturing_end_date,
	          bill_of_entry_no,
	          country_of_origin,
	          customs_date,
	          hsn_code,
	          dva_source,
	          pli_certificate_url,
	          bis_number,
	          epr_number,
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
		&cellSource,
		&manufacturingStart,
		&manufacturingEnd,
		&billOfEntry,
		&countryOrigin,
		&customsDate,
		&hsnCode,
		&dvaSource,
		&pliCertURL,
		&bisNumber,
		&eprNumber,
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

	if cellSource != nil {
		batch.CellSource = *cellSource
	}

	// Import fields
	if billOfEntry != nil {
		batch.BillOfEntryNo = *billOfEntry
	}
	if countryOrigin != nil {
		batch.CountryOfOrigin = *countryOrigin
	}
	if hsnCode != nil {
		batch.HSNCode = *hsnCode
	}
	batch.CustomsDate = customsDate
	batch.ManufacturingStartDate = manufacturingStart
	batch.ManufacturingEndDate = manufacturingEnd

	// DVA audit fields
	if dvaSource != nil {
		batch.DVASource = *dvaSource
	}
	if pliCertURL != nil {
		batch.PLICertificateURL = *pliCertURL
	}
	if bisNumber != nil {
		batch.BISNumber = *bisNumber
	}
	if eprNumber != nil {
		batch.EPRNumber = *eprNumber
	}

	return batch, nil
}

// ListBatches retrieves batches for a tenant with dual-mode fields and pagination
func (r *Repository) ListBatches(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Batch, int, error) {
	// Default limit if not specified
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200 // Cap at 200
	}

	// Get total count first
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM public.batches WHERE tenant_id = $1 AND deleted_at IS NULL`
	if err := r.db.Pool.QueryRow(ctx, countQuery, tenantID).Scan(&totalCount); err != nil {
		return nil, 0, fmt.Errorf("failed to count batches: %w", err)
	}

	query := `SELECT b.id, b.tenant_id, b.batch_name, b.model_name, b.specs, b.created_at, 
	          COALESCE(b.status, 'DRAFT') as status,
	          COALESCE(b.market_region::text, 'GLOBAL') as market_region, 
	          COALESCE(b.pli_compliant, false), 
	          COALESCE(b.domestic_value_add, 0), 
	          b.cell_source, 
	          b.manufacturing_start_date,
	          b.manufacturing_end_date,
	          b.bill_of_entry_no,
	          b.country_of_origin,
	          b.customs_date,
	          b.hsn_code,
	          b.dva_source,
	          b.pli_certificate_url,
	          b.bis_number,
	          b.epr_number,
	          b.carbon_footprint_result,
	          COALESCE(b.product_type, 'BATTERY') as product_type,
	          COALESCE(b.schema_version, 1) as schema_version,
	          COALESCE(b.compliance_score, 0) as compliance_score,
	          b.compliance_gaps,
	          COUNT(p.uuid)::int as total_passports
	          FROM public.batches b
	          LEFT JOIN public.passports p ON b.id = p.batch_id
	          WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
	          GROUP BY b.id, b.tenant_id, b.batch_name, b.model_name, b.specs, b.created_at, b.status, 
	                   b.market_region, b.pli_compliant, b.domestic_value_add, b.cell_source,
	                   b.manufacturing_start_date, b.manufacturing_end_date,
	                   b.bill_of_entry_no, b.country_of_origin, b.customs_date, b.hsn_code,
	                   b.dva_source, b.pli_certificate_url, b.bis_number, b.epr_number,
	                   b.carbon_footprint_result, b.product_type, b.schema_version, b.compliance_score, b.compliance_gaps
	          ORDER BY b.created_at DESC
	          LIMIT $2 OFFSET $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		var specsJSON []byte
		var marketRegion string
		var cellSource *string
		var billOfEntry, countryOrigin, hsnCode *string
		var customsDate *time.Time
		var manufacturingStart, manufacturingEnd *time.Time
		var dvaSource, pliCertURL *string
		var bisNumber, eprNumber *string
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
			&cellSource,
			&manufacturingStart,
			&manufacturingEnd,
			&billOfEntry,
			&countryOrigin,
			&customsDate,
			&hsnCode,
			&dvaSource,
			&pliCertURL,
			&bisNumber,
			&eprNumber,
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

		if cellSource != nil {
			batch.CellSource = *cellSource
		}

		// Import fields
		if billOfEntry != nil {
			batch.BillOfEntryNo = *billOfEntry
		}
		if countryOrigin != nil {
			batch.CountryOfOrigin = *countryOrigin
		}
		if hsnCode != nil {
			batch.HSNCode = *hsnCode
		}
		batch.CustomsDate = customsDate
		batch.ManufacturingStartDate = manufacturingStart
		batch.ManufacturingEndDate = manufacturingEnd

		// DVA audit fields
		if dvaSource != nil {
			batch.DVASource = *dvaSource
		}
		if pliCertURL != nil {
			batch.PLICertificateURL = *pliCertURL
		}
		if bisNumber != nil {
			batch.BISNumber = *bisNumber
		}
		if eprNumber != nil {
			batch.EPRNumber = *eprNumber
		}

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

// UpdateBatchMetadata updates the import/domestic fields of a batch
// Used when CSV upload contains these details
func (r *Repository) UpdateBatchMetadata(ctx context.Context, id uuid.UUID, cellSource, billOfEntry, countryOrigin *string, domesticValue *float64) error {
	query := `UPDATE public.batches SET 
		cell_source = COALESCE($2, cell_source),
		bill_of_entry_no = COALESCE($3, bill_of_entry_no),
		country_of_origin = COALESCE($4, country_of_origin),
		domestic_value_add = COALESCE($5, domestic_value_add)
		WHERE id = $1`

	_, err := r.db.Pool.Exec(ctx, query, id, cellSource, billOfEntry, countryOrigin, domesticValue)
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
		cell_source             = COALESCE($6,  cell_source),
		bill_of_entry_no        = COALESCE($7,  bill_of_entry_no),
		country_of_origin       = COALESCE($8,  country_of_origin),
		customs_date            = COALESCE($9,  customs_date),
		domestic_value_add      = COALESCE($10, domestic_value_add),
		specs = CASE WHEN $11::text IS NULL THEN specs ELSE specs || $11::jsonb END
	WHERE id = $1 AND tenant_id = $2 AND COALESCE(status, 'DRAFT') = 'DRAFT'`

	result, err := r.db.Pool.Exec(ctx, query,
		id, tenantID,
		req.ModelName,
		req.ManufacturingStartDate,
		req.ManufacturingEndDate,
		req.CellSource,
		req.BillOfEntryNo,
		req.CountryOfOrigin,
		req.CustomsDate,
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
