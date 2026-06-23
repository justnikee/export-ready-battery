package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// PassportDocument represents an uploaded file attached to a passport lifecycle event.
type PassportDocument struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	PassportID  uuid.UUID  `json:"passport_id"`
	EventID     *uuid.UUID `json:"event_id,omitempty"` // set after transition
	Filename    string     `json:"filename"`
	ContentType string     `json:"content_type"`
	SizeBytes   int64      `json:"size_bytes"`
	SHA256Hash  string     `json:"sha256_hash"`
	StoragePath string     `json:"storage_path"`
	Label       string     `json:"label,omitempty"`
	UploadedBy  string     `json:"uploaded_by"`
	UploadedAt  time.Time  `json:"uploaded_at"`
}

// InsertPassportDocument inserts a new passport_documents row.
func (r *Repository) InsertPassportDocument(ctx context.Context, doc *PassportDocument) error {
	_, err := r.db.Pool.Exec(ctx, `
		INSERT INTO passport_documents
			(id, tenant_id, passport_id, filename, content_type, size_bytes,
			 sha256_hash, storage_path, label, uploaded_by, uploaded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`,
		doc.ID, doc.TenantID, doc.PassportID, doc.Filename, doc.ContentType, doc.SizeBytes,
		doc.SHA256Hash, doc.StoragePath, doc.Label, doc.UploadedBy, doc.UploadedAt,
	)
	return err
}

// GetPassportDocument fetches a document row by id, scoped to the tenant.
// Returns nil, nil when not found.
func (r *Repository) GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*PassportDocument, error) {
	row := r.db.Pool.QueryRow(ctx, `
		SELECT id, tenant_id, passport_id, event_id,
		       filename, content_type, size_bytes, sha256_hash,
		       storage_path, label, uploaded_by, uploaded_at
		FROM   passport_documents
		WHERE  id = $1 AND tenant_id = $2
	`, id, tenantID)

	var doc PassportDocument
	err := row.Scan(
		&doc.ID, &doc.TenantID, &doc.PassportID, &doc.EventID,
		&doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.SHA256Hash,
		&doc.StoragePath, &doc.Label, &doc.UploadedBy, &doc.UploadedAt,
	)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// LinkDocumentToEvent sets event_id on the document row (idempotent).
func (r *Repository) LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE passport_documents SET event_id = $1 WHERE id = $2
	`, eventID, docID)
	return err
}

// ListPassportDocuments returns all documents for a passport scoped to the tenant.
func (r *Repository) ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*PassportDocument, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT id, tenant_id, passport_id, event_id,
		       filename, content_type, size_bytes, sha256_hash,
		       storage_path, label, uploaded_by, uploaded_at
		FROM   passport_documents
		WHERE  passport_id = $1 AND tenant_id = $2
		ORDER  BY uploaded_at ASC
	`, passportID, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []*PassportDocument
	for rows.Next() {
		var doc PassportDocument
		if err := rows.Scan(
			&doc.ID, &doc.TenantID, &doc.PassportID, &doc.EventID,
			&doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.SHA256Hash,
			&doc.StoragePath, &doc.Label, &doc.UploadedBy, &doc.UploadedAt,
		); err != nil {
			return nil, err
		}
		docs = append(docs, &doc)
	}
	return docs, rows.Err()
}
