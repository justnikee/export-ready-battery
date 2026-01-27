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

	// India Import/Customs Fields
	BillOfEntryNo   string
	CountryOfOrigin string
	CustomsDate     *time.Time
	HSNCode         string // India: Harmonized System Nomenclature code

	// DVA Audit Mode Fields
	DVASource         string // "ESTIMATED" or "AUDITED"
	PLICertificateURL string // URL to CA certificate (Supabase Storage)
}

// CreateBatch creates a new batch with dual-mode support
func (r *Repository) CreateBatch(ctx context.Context, req CreateBatchRequest) (*models.Batch, error) {
	// Default to GLOBAL if not specified
	marketRegion := req.MarketRegion
	if marketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}

	batch := &models.Batch{
		ID:                uuid.New(),
		TenantID:          req.TenantID,
		BatchName:         req.BatchName,
		Specs:             req.Specs,
		CreatedAt:         time.Now(),
		MarketRegion:      marketRegion,
		PLICompliant:      req.PLICompliant,
		DomesticValueAdd:  req.DomesticValueAdd,
		CellSource:        req.CellSource,
		BillOfEntryNo:     req.BillOfEntryNo,
		CountryOfOrigin:   req.CountryOfOrigin,
		CustomsDate:       req.CustomsDate,
		HSNCode:           req.HSNCode,
		DVASource:         req.DVASource,
		PLICertificateURL: req.PLICertificateURL,
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

	// Debug logging
	log.Printf("DEBUG CreateBatch: specsJSON=%s, marketRegion=%s", string(specsJSON), marketRegion)

	// Updated query to include hsn_code, dva_source, and pli_certificate_url
	query := `INSERT INTO public.batches 
		(id, tenant_id, batch_name, specs, created_at, status, market_region, pli_compliant, domestic_value_add, cell_source,
		 bill_of_entry_no, country_of_origin, customs_date, hsn_code, dva_source, pli_certificate_url) 
		VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

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

	_, err = r.db.Pool.Exec(ctx, query,
		batch.ID,
		batch.TenantID,
		batch.BatchName,
		string(specsJSON), // Pass as string, let PostgreSQL cast to jsonb
		batch.CreatedAt,
		models.BatchStatusDraft, // New batches start as DRAFT
		string(marketRegion),
		batch.PLICompliant,
		batch.DomesticValueAdd,
		cellSource,
		billOfEntry,
		countryOrigin,
		req.CustomsDate,
		hsnCode,
		dvaSource,
		pliCertURL,
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
	var marketRegion string
	var cellSource *string
	var billOfEntry, countryOrigin, hsnCode *string
	var customsDate *time.Time
	var dvaSource, pliCertURL *string

	query := `SELECT id, tenant_id, batch_name, specs, created_at, 
	          COALESCE(status, 'DRAFT') as status,
	          COALESCE(market_region, 'GLOBAL') as market_region, 
	          COALESCE(pli_compliant, false), 
	          COALESCE(domestic_value_add, 0), 
	          cell_source, 
	          bill_of_entry_no,
	          country_of_origin,
	          customs_date,
	          hsn_code,
	          dva_source,
	          pli_certificate_url
	          FROM public.batches WHERE id = $1 AND deleted_at IS NULL`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&batch.ID,
		&batch.TenantID,
		&batch.BatchName,
		&specsJSON,
		&batch.CreatedAt,
		&batch.Status,
		&marketRegion,
		&batch.PLICompliant,
		&batch.DomesticValueAdd,
		&cellSource,
		&billOfEntry,
		&countryOrigin,
		&customsDate,
		&hsnCode,
		&dvaSource,
		&pliCertURL,
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

	// DVA audit fields
	if dvaSource != nil {
		batch.DVASource = *dvaSource
	}
	if pliCertURL != nil {
		batch.PLICertificateURL = *pliCertURL
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

	query := `SELECT b.id, b.tenant_id, b.batch_name, b.specs, b.created_at, 
	          COALESCE(b.status, 'DRAFT') as status,
	          COALESCE(b.market_region::text, 'GLOBAL') as market_region, 
	          COALESCE(b.pli_compliant, false), 
	          COALESCE(b.domestic_value_add, 0), 
	          b.cell_source, 
	          b.bill_of_entry_no,
	          b.country_of_origin,
	          b.customs_date,
	          b.hsn_code,
	          b.dva_source,
	          b.pli_certificate_url,
	          COUNT(p.uuid)::int as total_passports
	          FROM public.batches b
	          LEFT JOIN public.passports p ON b.id = p.batch_id
	          WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
	          GROUP BY b.id, b.tenant_id, b.batch_name, b.specs, b.created_at, b.status, 
	                   b.market_region, b.pli_compliant, b.domestic_value_add, b.cell_source,
	                   b.bill_of_entry_no, b.country_of_origin, b.customs_date, b.hsn_code,
	                   b.dva_source, b.pli_certificate_url
	          ORDER BY b.created_at DESC
	          LIMIT $2 OFFSET $3`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, offset)
	if err != nil {
		log.Printf("ListBatches Query Error: %v", err)
		return nil, 0, fmt.Errorf("failed to list batches: %w\n", err)
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
		var dvaSource, pliCertURL *string

		if err := rows.Scan(
			&batch.ID,
			&batch.TenantID,
			&batch.BatchName,
			&specsJSON,
			&batch.CreatedAt,
			&batch.Status,
			&marketRegion,
			&batch.PLICompliant,
			&batch.DomesticValueAdd,
			&cellSource,
			&billOfEntry,
			&countryOrigin,
			&customsDate,
			&hsnCode,
			&dvaSource,
			&pliCertURL,
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

		// DVA audit fields
		if dvaSource != nil {
			batch.DVASource = *dvaSource
		}
		if pliCertURL != nil {
			batch.PLICertificateURL = *pliCertURL
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

// SetBatchStatus updates batch status (for activation)
func (r *Repository) SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error {
	query := `UPDATE public.batches SET status = $2 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, batchID, status)
	if err != nil {
		return fmt.Errorf("failed to set batch status: %w", err)
	}
	return nil
}
