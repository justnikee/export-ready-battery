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
