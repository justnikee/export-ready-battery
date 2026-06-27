package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateCertificateAnchor inserts a new certificate anchor record.
func (r *Repository) CreateCertificateAnchor(ctx context.Context, anchor *models.CertificateAnchor) error {
	query := `INSERT INTO public.certificate_anchors
		(id, batch_id, tenant_id, cert_type, file_url, file_hash, ots_proof, bitcoin_tx_id, status, anchored_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.Pool.Exec(ctx, query,
		anchor.ID, anchor.BatchID, anchor.TenantID, anchor.CertType,
		anchor.FileURL, anchor.FileHash, anchor.OTSProof,
		anchor.BitcoinTxID, anchor.Status, anchor.AnchoredAt, anchor.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create certificate anchor: %w", err)
	}
	return nil
}

// GetCertificateAnchorsByBatch returns all anchors for a batch.
func (r *Repository) GetCertificateAnchorsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.CertificateAnchor, error) {
	query := `SELECT id, batch_id, tenant_id, cert_type, file_url, file_hash,
			  ots_proof, bitcoin_tx_id, status, anchored_at, created_at
		  FROM public.certificate_anchors
		  WHERE batch_id = $1
		  ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to query certificate anchors: %w", err)
	}
	defer rows.Close()

	return scanCertificateAnchors(rows)
}

// CertificateAnchorWithBatch is a tenant-wide anchor row joined with its
// batch name, for the cross-batch Certificate Anchors browser.
type CertificateAnchorWithBatch struct {
	models.CertificateAnchor
	BatchName string `json:"batch_name"`
}

// GetCertificateAnchorsByTenant returns anchors across all of a tenant's
// batches, optionally filtered by cert_type and/or status, most recent first.
func (r *Repository) GetCertificateAnchorsByTenant(ctx context.Context, tenantID uuid.UUID, certType, status string, limit, offset int) ([]*CertificateAnchorWithBatch, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	query := `SELECT a.id, a.batch_id, a.tenant_id, a.cert_type, a.file_url, a.file_hash,
			  a.ots_proof, a.bitcoin_tx_id, a.status, a.anchored_at, a.created_at, b.batch_name
		  FROM public.certificate_anchors a
		  JOIN public.batches b ON b.id = a.batch_id
		  WHERE a.tenant_id = $1
		    AND ($2 = '' OR a.cert_type = $2)
		    AND ($3 = '' OR a.status = $3)
		  ORDER BY a.created_at DESC
		  LIMIT $4 OFFSET $5`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, certType, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query tenant certificate anchors: %w", err)
	}
	defer rows.Close()

	var results []*CertificateAnchorWithBatch
	for rows.Next() {
		var a CertificateAnchorWithBatch
		if err := rows.Scan(
			&a.ID, &a.BatchID, &a.TenantID, &a.CertType,
			&a.FileURL, &a.FileHash, &a.OTSProof,
			&a.BitcoinTxID, &a.Status, &a.AnchoredAt, &a.CreatedAt, &a.BatchName,
		); err != nil {
			return nil, fmt.Errorf("failed to scan tenant certificate anchor: %w", err)
		}
		results = append(results, &a)
	}
	return results, rows.Err()
}

// GetAnchorsNeedingUpgrade returns all anchors with status 'anchored' that need
// to be upgraded to full Bitcoin confirmation.
func (r *Repository) GetAnchorsNeedingUpgrade(ctx context.Context) ([]*models.CertificateAnchor, error) {
	query := `SELECT id, batch_id, tenant_id, cert_type, file_url, file_hash,
			  ots_proof, bitcoin_tx_id, status, anchored_at, created_at
		  FROM public.certificate_anchors
		  WHERE status = 'anchored'
		  ORDER BY created_at ASC`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query anchors needing upgrade: %w", err)
	}
	defer rows.Close()

	return scanCertificateAnchors(rows)
}

// UpdateCertificateAnchorStatus updates the status, OTS proof, and Bitcoin tx ID.
func (r *Repository) UpdateCertificateAnchorStatus(ctx context.Context, id string, status string, otsProof, bitcoinTxID *string, anchoredAt *time.Time) error {
	query := `UPDATE public.certificate_anchors
			  SET status = $2, ots_proof = $3, bitcoin_tx_id = $4, anchored_at = $5
			  WHERE id = $1`

	_, err := r.db.Pool.Exec(ctx, query, id, status, otsProof, bitcoinTxID, anchoredAt)
	if err != nil {
		return fmt.Errorf("failed to update certificate anchor: %w", err)
	}
	return nil
}

func scanCertificateAnchors(rows pgx.Rows) ([]*models.CertificateAnchor, error) {
	var anchors []*models.CertificateAnchor
	for rows.Next() {
		var a models.CertificateAnchor
		err := rows.Scan(
			&a.ID, &a.BatchID, &a.TenantID, &a.CertType,
			&a.FileURL, &a.FileHash, &a.OTSProof,
			&a.BitcoinTxID, &a.Status, &a.AnchoredAt, &a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan certificate anchor: %w", err)
		}
		anchors = append(anchors, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return anchors, nil
}
