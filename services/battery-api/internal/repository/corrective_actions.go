package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateCorrectiveAction inserts a new corrective action ticket.
func (r *Repository) CreateCorrectiveAction(ctx context.Context, ca *models.CorrectiveAction) error {
	query := `
		INSERT INTO corrective_actions (
			id, supplier_id, tenant_id, assessment_id, title, description,
			severity, status, due_date, remediated_at, verified_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		ca.ID, ca.SupplierID, ca.TenantID, ca.AssessmentID, ca.Title, ca.Description,
		ca.Severity, ca.Status, ca.DueDate, ca.RemediatedAt, ca.VerifiedBy, ca.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create corrective action: %w", err)
	}
	return nil
}

// GetCorrectiveActionByID returns a single CA.
func (r *Repository) GetCorrectiveActionByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) {
	query := `
		SELECT id, supplier_id, tenant_id, assessment_id, title, description,
			severity, status, due_date, remediated_at, verified_by, created_at
		FROM corrective_actions WHERE id = $1
	`
	row := r.db.Pool.QueryRow(ctx, query, id)
	return scanCorrectiveActionRow(row)
}

// ListCorrectiveActionsByTenant returns all CAs for a tenant with optional status filter.
func (r *Repository) ListCorrectiveActionsByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.CorrectiveAction, error) {
	var query string
	var args []interface{}
	if status != "" {
		query = `
			SELECT id, supplier_id, tenant_id, assessment_id, title, description,
				severity, status, due_date, remediated_at, verified_by, created_at
			FROM corrective_actions WHERE tenant_id = $1 AND status = $2
			ORDER BY due_date ASC
		`
		args = []interface{}{tenantID, status}
	} else {
		query = `
			SELECT id, supplier_id, tenant_id, assessment_id, title, description,
				severity, status, due_date, remediated_at, verified_by, created_at
			FROM corrective_actions WHERE tenant_id = $1
			ORDER BY due_date ASC
		`
		args = []interface{}{tenantID}
	}
	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list corrective actions: %w", err)
	}
	defer rows.Close()
	return scanCorrectiveActions(rows)
}

// ListCorrectiveActionsBySupplier returns all CAs for a supplier.
func (r *Repository) ListCorrectiveActionsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.CorrectiveAction, error) {
	query := `
		SELECT id, supplier_id, tenant_id, assessment_id, title, description,
			severity, status, due_date, remediated_at, verified_by, created_at
		FROM corrective_actions WHERE supplier_id = $1
		ORDER BY due_date ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, supplierID)
	if err != nil {
		return nil, fmt.Errorf("failed to list corrective actions by supplier: %w", err)
	}
	defer rows.Close()
	return scanCorrectiveActions(rows)
}

// UpdateCorrectiveActionStatus updates status and related timestamps.
func (r *Repository) UpdateCorrectiveActionStatus(ctx context.Context, id uuid.UUID, status string, remediatedAt interface{}, verifiedBy interface{}) error {
	query := `
		UPDATE corrective_actions SET
			status = $2,
			remediated_at = $3,
			verified_by = $4
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, id, status, remediatedAt, verifiedBy)
	if err != nil {
		return fmt.Errorf("failed to update corrective action status: %w", err)
	}
	return nil
}

func scanCorrectiveActions(rows pgx.Rows) ([]models.CorrectiveAction, error) {
	var out []models.CorrectiveAction
	for rows.Next() {
		ca, err := scanCorrectiveActionRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *ca)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

func scanCorrectiveActionRow(row pgx.Row) (*models.CorrectiveAction, error) {
	var ca models.CorrectiveAction
	err := row.Scan(
		&ca.ID, &ca.SupplierID, &ca.TenantID, &ca.AssessmentID, &ca.Title, &ca.Description,
		&ca.Severity, &ca.Status, &ca.DueDate, &ca.RemediatedAt, &ca.VerifiedBy, &ca.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan corrective action: %w", err)
	}
	return &ca, nil
}
