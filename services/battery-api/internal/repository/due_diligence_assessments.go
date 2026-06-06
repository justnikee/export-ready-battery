package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateDueDiligenceAssessment inserts a new OECD step assessment.
func (r *Repository) CreateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error {
	query := `
		INSERT INTO due_diligence_assessments (
			id, supplier_id, tenant_id, batch_id, step, status,
			evidence_docs, completed_by, completed_at, notes,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		a.ID, a.SupplierID, a.TenantID, a.BatchID, a.Step, a.Status,
		a.EvidenceDocs, a.CompletedBy, a.CompletedAt, a.Notes,
		a.CreatedAt, a.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create due diligence assessment: %w", err)
	}
	return nil
}

// GetDueDiligenceAssessmentsBySupplier returns all assessments for a supplier.
func (r *Repository) GetDueDiligenceAssessmentsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.DueDiligenceAssessment, error) {
	query := `
		SELECT id, supplier_id, tenant_id, batch_id, step, status,
			evidence_docs, completed_by, completed_at, notes,
			created_at, updated_at
		FROM due_diligence_assessments WHERE supplier_id = $1
		ORDER BY created_at
	`
	rows, err := r.db.Pool.Query(ctx, query, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to list dd assessments: %w", err)
	}
	defer rows.Close()
	return scanDueDiligenceAssessments(rows)
}

// GetDueDiligenceAssessmentByID returns a single assessment.
func (r *Repository) GetDueDiligenceAssessmentByID(ctx context.Context, id uuid.UUID) (*models.DueDiligenceAssessment, error) {
	query := `
		SELECT id, supplier_id, tenant_id, batch_id, step, status,
			evidence_docs, completed_by, completed_at, notes,
			created_at, updated_at
		FROM due_diligence_assessments WHERE id = $1
	`
	row := r.db.Pool.QueryRow(ctx, query, id)
	return scanDueDiligenceAssessmentRow(row)
}

// UpdateDueDiligenceAssessment updates status, evidence, notes, completion.
func (r *Repository) UpdateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error {
	query := `
		UPDATE due_diligence_assessments SET
			status = $2,
			evidence_docs = $3,
			completed_by = $4,
			completed_at = $5,
			notes = $6,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query,
		a.ID, a.Status, a.EvidenceDocs, a.CompletedBy, a.CompletedAt, a.Notes,
	)
	if err != nil {
		return fmt.Errorf("failed to update dd assessment: %w", err)
	}
	return nil
}

func scanDueDiligenceAssessments(rows pgx.Rows) ([]models.DueDiligenceAssessment, error) {
	var out []models.DueDiligenceAssessment
	for rows.Next() {
		a, err := scanDueDiligenceAssessmentRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

func scanDueDiligenceAssessmentRow(row pgx.Row) (*models.DueDiligenceAssessment, error) {
	var a models.DueDiligenceAssessment
	err := row.Scan(
		&a.ID, &a.SupplierID, &a.TenantID, &a.BatchID, &a.Step, &a.Status,
		&a.EvidenceDocs, &a.CompletedBy, &a.CompletedAt, &a.Notes,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan dd assessment: %w", err)
	}
	return &a, nil
}
