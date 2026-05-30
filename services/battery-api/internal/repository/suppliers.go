package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// --- Suppliers ---

func (r *Repository) CreateSupplier(ctx context.Context, supplier *models.Supplier) error {
	query := `INSERT INTO suppliers (
		id, tenant_id, email, company_name, contact_phone, address, country,
		status, invitation_token, password_hash, invited_at, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.Pool.Exec(ctx, query,
		supplier.ID, supplier.TenantID, supplier.Email, supplier.CompanyName,
		supplier.ContactPhone, supplier.Address, supplier.Country,
		supplier.Status, supplier.InvitationToken, supplier.PasswordHash,
		supplier.InvitedAt, supplier.CreatedAt, supplier.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create supplier: %w", err)
	}
	return nil
}

func (r *Repository) GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	query := `SELECT id, tenant_id, email, company_name, contact_phone, address, country,
		status, invitation_token, password_hash, invited_at, accepted_at, last_login_at, created_at, updated_at
		FROM suppliers WHERE id = $1`

	s := &models.Supplier{}
	var acceptedAt, lastLoginAt *time.Time
	var invitationToken *string

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.TenantID, &s.Email, &s.CompanyName, &s.ContactPhone, &s.Address, &s.Country,
		&s.Status, &invitationToken, &s.PasswordHash, &s.InvitedAt, &acceptedAt, &lastLoginAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier: %w", err)
	}
	if invitationToken != nil {
		s.InvitationToken = *invitationToken
	}
	s.AcceptedAt = acceptedAt
	s.LastLoginAt = lastLoginAt
	return s, nil
}

func (r *Repository) GetSupplierByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.Supplier, error) {
	query := `SELECT id, tenant_id, email, company_name, contact_phone, address, country,
		status, invitation_token, password_hash, invited_at, accepted_at, last_login_at, created_at, updated_at
		FROM suppliers WHERE tenant_id = $1 AND email = $2`

	s := &models.Supplier{}
	var acceptedAt, lastLoginAt *time.Time
	var invitationToken *string

	err := r.db.Pool.QueryRow(ctx, query, tenantID, email).Scan(
		&s.ID, &s.TenantID, &s.Email, &s.CompanyName, &s.ContactPhone, &s.Address, &s.Country,
		&s.Status, &invitationToken, &s.PasswordHash, &s.InvitedAt, &acceptedAt, &lastLoginAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier by email: %w", err)
	}
	if invitationToken != nil {
		s.InvitationToken = *invitationToken
	}
	s.AcceptedAt = acceptedAt
	s.LastLoginAt = lastLoginAt
	return s, nil
}

func (r *Repository) GetSupplierByInvitationToken(ctx context.Context, token string) (*models.Supplier, error) {
	query := `SELECT id, tenant_id, email, company_name, contact_phone, address, country,
		status, invitation_token, password_hash, invited_at, accepted_at, last_login_at, created_at, updated_at
		FROM suppliers WHERE invitation_token = $1`

	s := &models.Supplier{}
	var acceptedAt, lastLoginAt *time.Time
	var invitationToken *string

	err := r.db.Pool.QueryRow(ctx, query, token).Scan(
		&s.ID, &s.TenantID, &s.Email, &s.CompanyName, &s.ContactPhone, &s.Address, &s.Country,
		&s.Status, &invitationToken, &s.PasswordHash, &s.InvitedAt, &acceptedAt, &lastLoginAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier by token: %w", err)
	}
	if invitationToken != nil {
		s.InvitationToken = *invitationToken
	}
	s.AcceptedAt = acceptedAt
	s.LastLoginAt = lastLoginAt
	return s, nil
}

func (r *Repository) ListSuppliersByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.Supplier, error) {
	where := "tenant_id = $1"
	args := []any{tenantID}
	if status != "" {
		where += " AND status = $2"
		args = append(args, status)
	}

	query := fmt.Sprintf(`SELECT id, tenant_id, email, company_name, contact_phone, address, country,
		status, invitation_token, password_hash, invited_at, accepted_at, last_login_at, created_at, updated_at
		FROM suppliers WHERE %s ORDER BY created_at DESC`, where)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list suppliers: %w", err)
	}
	defer rows.Close()

	return scanSuppliers(rows)
}

func (r *Repository) UpdateSupplierStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE suppliers SET status = $2, updated_at = $3 WHERE id = $1`,
		id, status, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to update supplier status: %w", err)
	}
	return nil
}

func (r *Repository) UpdateSupplierAcceptance(ctx context.Context, id uuid.UUID, passwordHash string) error {
	now := time.Now()
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE suppliers SET status = 'active', password_hash = $2, accepted_at = $3, invitation_token = NULL, updated_at = $3 WHERE id = $1`,
		id, passwordHash, now,
	)
	if err != nil {
		return fmt.Errorf("failed to accept supplier invitation: %w", err)
	}
	return nil
}

func (r *Repository) UpdateSupplierLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE suppliers SET last_login_at = $2 WHERE id = $1`,
		id, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to update supplier last login: %w", err)
	}
	return nil
}

func scanSuppliers(rows pgx.Rows) ([]models.Supplier, error) {
	var suppliers []models.Supplier
	for rows.Next() {
		var s models.Supplier
		var acceptedAt, lastLoginAt *time.Time
		var invitationToken *string

		err := rows.Scan(
			&s.ID, &s.TenantID, &s.Email, &s.CompanyName, &s.ContactPhone, &s.Address, &s.Country,
			&s.Status, &invitationToken, &s.PasswordHash, &s.InvitedAt, &acceptedAt, &lastLoginAt, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan supplier: %w", err)
		}
		if invitationToken != nil {
			s.InvitationToken = *invitationToken
		}
		s.AcceptedAt = acceptedAt
		s.LastLoginAt = lastLoginAt
		suppliers = append(suppliers, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return suppliers, nil
}

// --- Supplier Documents ---

func (r *Repository) CreateSupplierDocument(ctx context.Context, doc *models.SupplierDocument) error {
	query := `INSERT INTO supplier_documents (
		id, supplier_id, tenant_id, batch_id, component_id, doc_type,
		file_url, file_name, file_size, status, uploaded_at, created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := r.db.Pool.Exec(ctx, query,
		doc.ID, doc.SupplierID, doc.TenantID, doc.BatchID, doc.ComponentID, doc.DocType,
		doc.FileURL, doc.FileName, doc.FileSize, doc.Status, doc.UploadedAt, doc.CreatedAt, doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create supplier document: %w", err)
	}
	return nil
}

func (r *Repository) GetSupplierDocumentByID(ctx context.Context, id uuid.UUID) (*models.SupplierDocument, error) {
	query := `SELECT id, supplier_id, tenant_id, batch_id, component_id, doc_type,
		file_url, file_name, file_size, status, reviewer_notes, reviewed_by, reviewed_at, uploaded_at, created_at, updated_at
		FROM supplier_documents WHERE id = $1`

	d := &models.SupplierDocument{}
	var batchID, componentID, reviewedBy *string
	var reviewedAt *time.Time

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&d.ID, &d.SupplierID, &d.TenantID, &batchID, &componentID, &d.DocType,
		&d.FileURL, &d.FileName, &d.FileSize, &d.Status, &d.ReviewerNotes, &reviewedBy, &reviewedAt,
		&d.UploadedAt, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier document: %w", err)
	}
	if batchID != nil {
		d.BatchID = batchID
	}
	if componentID != nil {
		d.ComponentID = componentID
	}
	if reviewedBy != nil {
		d.ReviewedBy = reviewedBy
	}
	d.ReviewedAt = reviewedAt
	return d, nil
}

func (r *Repository) ListSupplierDocuments(ctx context.Context, supplierID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	where := "supplier_id = $1"
	args := []any{supplierID}
	if status != "" {
		where += " AND status = $2"
		args = append(args, status)
	}

	query := fmt.Sprintf(`SELECT id, supplier_id, tenant_id, batch_id, component_id, doc_type,
		file_url, file_name, file_size, status, reviewer_notes, reviewed_by, reviewed_at, uploaded_at, created_at, updated_at
		FROM supplier_documents WHERE %s ORDER BY uploaded_at DESC`, where)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list supplier documents: %w", err)
	}
	defer rows.Close()

	return scanSupplierDocuments(rows)
}

func (r *Repository) ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	where := "tenant_id = $1"
	args := []any{tenantID}
	if status != "" {
		where += " AND status = $2"
		args = append(args, status)
	}

	query := fmt.Sprintf(`SELECT id, supplier_id, tenant_id, batch_id, component_id, doc_type,
		file_url, file_name, file_size, status, reviewer_notes, reviewed_by, reviewed_at, uploaded_at, created_at, updated_at
		FROM supplier_documents WHERE %s ORDER BY uploaded_at DESC`, where)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list tenant supplier documents: %w", err)
	}
	defer rows.Close()

	return scanSupplierDocuments(rows)
}

func (r *Repository) UpdateSupplierDocumentStatus(ctx context.Context, id uuid.UUID, status, reviewerNotes string, reviewedBy uuid.UUID) error {
	now := time.Now()
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE supplier_documents SET status = $2, reviewer_notes = $3, reviewed_by = $4, reviewed_at = $5, updated_at = $5 WHERE id = $1`,
		id, status, reviewerNotes, reviewedBy, now,
	)
	if err != nil {
		return fmt.Errorf("failed to update document status: %w", err)
	}
	return nil
}

func scanSupplierDocuments(rows pgx.Rows) ([]models.SupplierDocument, error) {
	var docs []models.SupplierDocument
	for rows.Next() {
		var d models.SupplierDocument
		var batchID, componentID, reviewedBy *string
		var reviewedAt *time.Time

		err := rows.Scan(
			&d.ID, &d.SupplierID, &d.TenantID, &batchID, &componentID, &d.DocType,
			&d.FileURL, &d.FileName, &d.FileSize, &d.Status, &d.ReviewerNotes, &reviewedBy, &reviewedAt,
			&d.UploadedAt, &d.CreatedAt, &d.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan supplier document: %w", err)
		}
		if batchID != nil {
			d.BatchID = batchID
		}
		if componentID != nil {
			d.ComponentID = componentID
		}
		if reviewedBy != nil {
			d.ReviewedBy = reviewedBy
		}
		d.ReviewedAt = reviewedAt
		docs = append(docs, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return docs, nil
}
