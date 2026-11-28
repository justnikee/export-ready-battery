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

const supplierFields = `id, tenant_id, email, company_name,
	COALESCE(contact_phone, ''), COALESCE(address, ''), COALESCE(country, ''),
	status, invitation_token, COALESCE(password_hash, ''), invited_at, accepted_at, last_login_at, created_at, updated_at`

func (r *Repository) GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	query := `SELECT ` + supplierFields + `
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
	query := `SELECT ` + supplierFields + `
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
	query := `SELECT ` + supplierFields + `
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

	query := fmt.Sprintf(`SELECT `+supplierFields+`
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
	// There is no per-supplier assignment to a batch or component in this flow.
	if doc.BatchID != nil || doc.ComponentID != nil {
		return pgx.ErrNoRows
	}
	query := `INSERT INTO supplier_documents (
		id, supplier_id, tenant_id, doc_type,
		file_url, file_name, file_size, status, uploaded_at, created_at, updated_at
	)
	SELECT $1, s.id, s.tenant_id, $4, $5, $6, $7, $8, $9, $10, $11
	FROM suppliers AS s
	WHERE s.id = $2 AND s.tenant_id = $3 AND s.status = 'active'
	FOR SHARE OF s`

	tag, err := r.db.Pool.Exec(ctx, query,
		doc.ID, doc.SupplierID, doc.TenantID, doc.DocType,
		doc.FileURL, doc.FileName, doc.FileSize, doc.Status, doc.UploadedAt, doc.CreatedAt, doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create supplier document: %w", err)
	}
	if tag.RowsAffected() != 1 {
		return pgx.ErrNoRows
	}
	return nil
}

const supplierDocumentList = `SELECT d.id, d.supplier_id, d.tenant_id, d.batch_id, d.component_id, d.doc_type,
		d.file_url, COALESCE(d.file_name, ''), COALESCE(d.file_size, 0), d.status,
		COALESCE(d.reviewer_notes, ''), d.reviewed_by, d.reviewed_at, d.uploaded_at, d.created_at, d.updated_at
		FROM supplier_documents AS d JOIN suppliers AS s ON s.id = d.supplier_id AND s.tenant_id = d.tenant_id`

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

func (r *Repository) ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string, supplierID *uuid.UUID) ([]models.SupplierDocument, error) {
	rows, err := r.db.Pool.Query(ctx, supplierDocumentList+`
		WHERE d.tenant_id = $1 AND ($2 = '' OR d.status = $2)
		AND ($3::uuid IS NULL OR d.supplier_id = $3)
		ORDER BY d.uploaded_at DESC`, tenantID, status, supplierID)
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
	docs := []models.SupplierDocument{}
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

func (r *Repository) GetActiveSupplierCompanyName(ctx context.Context, tenantID, supplierID uuid.UUID) (string, error) {
	var name string
	err := r.db.Pool.QueryRow(ctx, `SELECT company_name FROM suppliers
		WHERE id = $1 AND tenant_id = $2 AND status = 'active'`, supplierID, tenantID).Scan(&name)
	return name, err
}

// GetSupplierDocumentForDownload requires the supplier's live status when called from the supplier portal.
func (r *Repository) GetSupplierDocumentForDownload(ctx context.Context, tenantID, documentID uuid.UUID, supplierID *uuid.UUID) (*models.SupplierDocument, error) {
	doc := &models.SupplierDocument{}
	err := r.db.Pool.QueryRow(ctx, `
		SELECT d.supplier_id, d.doc_type, d.file_url, COALESCE(d.file_name, '')
		FROM supplier_documents AS d
		JOIN suppliers AS s ON s.id = d.supplier_id AND s.tenant_id = d.tenant_id
		WHERE d.tenant_id = $1 AND d.id = $2
		AND ($3::uuid IS NULL OR (d.supplier_id = $3 AND s.status = 'active'))
		AND (d.batch_id IS NULL OR EXISTS (
			SELECT 1 FROM batches AS b WHERE b.id = d.batch_id AND b.tenant_id = d.tenant_id AND b.deleted_at IS NULL
		))
		AND (d.component_id IS NULL OR EXISTS (
			SELECT 1 FROM components AS c
			LEFT JOIN batches AS b ON b.id = c.batch_id AND b.tenant_id = d.tenant_id AND b.deleted_at IS NULL
			WHERE c.id = d.component_id AND c.tenant_id = d.tenant_id
			AND (d.batch_id IS NULL OR c.batch_id = d.batch_id)
			AND (c.batch_id IS NULL OR b.id IS NOT NULL)
		))`, tenantID, documentID, supplierID).Scan(&doc.SupplierID, &doc.DocType, &doc.FileURL, &doc.FileName)
	if err != nil {
		return nil, fmt.Errorf("failed to look up supplier document download: %w", err)
	}
	return doc, nil
}
