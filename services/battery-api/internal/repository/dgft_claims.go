package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// --- DGFT Scheme Configs ---

func (r *Repository) ListDGFTSchemeConfigs(ctx context.Context) ([]models.DGFTSchemeConfig, error) {
	query := `SELECT scheme_type, name, description, required_documents, calculation_method, default_rate, is_active, help_url, created_at, updated_at
		FROM dgft_scheme_configs WHERE is_active = true ORDER BY scheme_type`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list scheme configs: %w", err)
	}
	defer rows.Close()

	var configs []models.DGFTSchemeConfig
	for rows.Next() {
		var c models.DGFTSchemeConfig
		if err := rows.Scan(&c.SchemeType, &c.Name, &c.Description, &c.RequiredDocuments, &c.CalculationMethod, &c.DefaultRate, &c.IsActive, &c.HelpURL, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan scheme config: %w", err)
		}
		configs = append(configs, c)
	}
	return configs, rows.Err()
}

// --- DGFT Claims ---

func (r *Repository) CreateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error {
	docs, err := json.Marshal(claim.Documents)
	if err != nil {
		return fmt.Errorf("failed to marshal documents: %w", err)
	}

	query := `INSERT INTO dgft_claims (
		id, tenant_id, batch_id, scheme_type, status, claim_period_start, claim_period_end,
		hsn_code, destination_country, export_value_inr, export_quantity,
		estimated_claim_amount, approved_claim_amount, documents, generated_files,
		dgft_reference_no, notes, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`

	_, err = r.db.Pool.Exec(ctx, query,
		claim.ID, claim.TenantID, claim.BatchID, claim.SchemeType, claim.Status,
		claim.ClaimPeriodStart, claim.ClaimPeriodEnd,
		claim.HSNCode, claim.DestinationCountry, claim.ExportValueINR, claim.ExportQuantity,
		claim.EstimatedClaimAmount, claim.ApprovedClaimAmount, docs, claim.GeneratedFiles,
		claim.DGFTReferenceNo, claim.Notes, claim.CreatedAt, claim.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create dgft claim: %w", err)
	}
	return nil
}

func (r *Repository) GetDGFTClaimByID(ctx context.Context, id, tenantID uuid.UUID) (*models.DGFTClaim, error) {
	query := `SELECT id, tenant_id, batch_id, scheme_type, status, claim_period_start, claim_period_end,
		hsn_code, destination_country, export_value_inr, export_quantity,
		estimated_claim_amount, approved_claim_amount, documents, generated_files,
		dgft_reference_no, notes, created_at, updated_at
		FROM dgft_claims WHERE id = $1 AND tenant_id = $2`

	claim := &models.DGFTClaim{}
	var docsRaw []byte
	var approvedAmt *float64
	var batchID *uuid.UUID

	err := r.db.Pool.QueryRow(ctx, query, id, tenantID).Scan(
		&claim.ID, &claim.TenantID, &batchID, &claim.SchemeType, &claim.Status,
		&claim.ClaimPeriodStart, &claim.ClaimPeriodEnd,
		&claim.HSNCode, &claim.DestinationCountry, &claim.ExportValueINR, &claim.ExportQuantity,
		&claim.EstimatedClaimAmount, &approvedAmt, &docsRaw, &claim.GeneratedFiles,
		&claim.DGFTReferenceNo, &claim.Notes, &claim.CreatedAt, &claim.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get dgft claim: %w", err)
	}

	if batchID != nil {
		s := batchID.String()
		claim.BatchID = &s
	}
	claim.ApprovedClaimAmount = approvedAmt
	if len(docsRaw) > 0 {
		_ = json.Unmarshal(docsRaw, &claim.Documents)
	}
	return claim, nil
}

func (r *Repository) UpdateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error {
	docs, err := json.Marshal(claim.Documents)
	if err != nil {
		return fmt.Errorf("failed to marshal documents: %w", err)
	}

	query := `UPDATE dgft_claims SET
		batch_id = $3, scheme_type = $4, status = $5, claim_period_start = $6, claim_period_end = $7,
		hsn_code = $8, destination_country = $9, export_value_inr = $10, export_quantity = $11,
		estimated_claim_amount = $12, approved_claim_amount = $13, documents = $14, generated_files = $15,
		dgft_reference_no = $16, notes = $17, updated_at = $18
		WHERE id = $1 AND tenant_id = $2 AND status = 'DRAFT'`

	_, err = r.db.Pool.Exec(ctx, query,
		claim.ID, claim.TenantID, claim.BatchID, claim.SchemeType, claim.Status,
		claim.ClaimPeriodStart, claim.ClaimPeriodEnd,
		claim.HSNCode, claim.DestinationCountry, claim.ExportValueINR, claim.ExportQuantity,
		claim.EstimatedClaimAmount, claim.ApprovedClaimAmount, docs, claim.GeneratedFiles,
		claim.DGFTReferenceNo, claim.Notes, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to update dgft claim: %w", err)
	}
	return nil
}

func (r *Repository) DeleteDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`DELETE FROM dgft_claims WHERE id = $1 AND tenant_id = $2 AND status = 'DRAFT'`,
		id, tenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete dgft claim: %w", err)
	}
	return nil
}

func (r *Repository) ListDGFTClaimsByTenant(ctx context.Context, tenantID uuid.UUID, schemeType, status, search string, page, pageSize int) ([]models.DGFTClaim, int, error) {
	where := "tenant_id = $1"
	args := []any{tenantID}
	argIdx := 2

	if schemeType != "" {
		where += fmt.Sprintf(" AND scheme_type = $%d", argIdx)
		args = append(args, schemeType)
		argIdx++
	}
	if status != "" {
		where += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	if search != "" {
		where += fmt.Sprintf(" AND (hsn_code ILIKE $%d OR destination_country ILIKE $%d OR dgft_reference_no ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM dgft_claims WHERE %s", where)
	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count claims: %w", err)
	}

	if pageSize <= 0 {
		pageSize = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageSize

	selectQuery := fmt.Sprintf(`SELECT id, tenant_id, batch_id, scheme_type, status, claim_period_start, claim_period_end,
		hsn_code, destination_country, export_value_inr, export_quantity,
		estimated_claim_amount, approved_claim_amount, documents, generated_files,
		dgft_reference_no, notes, created_at, updated_at
		FROM dgft_claims WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list claims: %w", err)
	}
	defer rows.Close()

	return scanDGFTClaims(rows, total)
}

func (r *Repository) AddDGFTClaimDocument(ctx context.Context, id, tenantID uuid.UUID, doc models.DGFTClaimDocument) error {
	query := `UPDATE dgft_claims SET documents = documents || $3::jsonb, updated_at = $4 WHERE id = $1 AND tenant_id = $2`
	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("failed to marshal document: %w", err)
	}
	_, err = r.db.Pool.Exec(ctx, query, id, tenantID, docJSON, time.Now())
	if err != nil {
		return fmt.Errorf("failed to add document: %w", err)
	}
	return nil
}

func (r *Repository) SubmitDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE dgft_claims SET status = 'SUBMITTED', updated_at = $3 WHERE id = $1 AND tenant_id = $2 AND status = 'DRAFT'`,
		id, tenantID, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to submit claim: %w", err)
	}
	return nil
}

// --- Helpers ---

func scanDGFTClaims(rows pgx.Rows, total int) ([]models.DGFTClaim, int, error) {
	var claims []models.DGFTClaim
	for rows.Next() {
		var claim models.DGFTClaim
		var docsRaw []byte
		var approvedAmt *float64
		var batchID *uuid.UUID

		err := rows.Scan(
			&claim.ID, &claim.TenantID, &batchID, &claim.SchemeType, &claim.Status,
			&claim.ClaimPeriodStart, &claim.ClaimPeriodEnd,
			&claim.HSNCode, &claim.DestinationCountry, &claim.ExportValueINR, &claim.ExportQuantity,
			&claim.EstimatedClaimAmount, &approvedAmt, &docsRaw, &claim.GeneratedFiles,
			&claim.DGFTReferenceNo, &claim.Notes, &claim.CreatedAt, &claim.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan claim: %w", err)
		}

		if batchID != nil {
			s := batchID.String()
			claim.BatchID = &s
		}
		claim.ApprovedClaimAmount = approvedAmt
		if len(docsRaw) > 0 {
			_ = json.Unmarshal(docsRaw, &claim.Documents)
		}
		claims = append(claims, claim)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows error: %w", err)
	}
	return claims, total, nil
}
