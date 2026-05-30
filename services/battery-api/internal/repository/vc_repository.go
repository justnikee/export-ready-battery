package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// CreatePassportVC inserts a signed Verifiable Credential into the passport_vcs table.
func (r *Repository) CreatePassportVC(ctx context.Context, vc *models.PassportVC) error {
	query := `INSERT INTO passport_vcs (passport_id, vc_type, issuer_did, credential_subject, proof, status, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`

	_, err := r.db.Pool.Exec(ctx, query,
		vc.PassportID,
		vc.VCType,
		vc.IssuerDID,
		jsonStringArg(vc.CredentialSubject),
		jsonStringArg(vc.Proof),
		vc.Status,
	)
	if err != nil {
		return fmt.Errorf("failed to create passport vc: %w", err)
	}
	return nil
}

// GetPassportVCByPassportID retrieves the most recent VC for a given passport.
func (r *Repository) GetPassportVCByPassportID(ctx context.Context, passportID uuid.UUID) (*models.PassportVC, error) {
	query := `SELECT id, passport_id, vc_type, issuer_did, credential_subject, proof, status, created_at, updated_at
	          FROM passport_vcs
	          WHERE passport_id = $1
	          ORDER BY created_at DESC
	          LIMIT 1`

	row := r.db.Pool.QueryRow(ctx, query, passportID)

	var vc models.PassportVC
	err := row.Scan(
		&vc.ID,
		&vc.PassportID,
		&vc.VCType,
		&vc.IssuerDID,
		&vc.CredentialSubject,
		&vc.Proof,
		&vc.Status,
		&vc.CreatedAt,
		&vc.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get passport vc: %w", err)
	}
	return &vc, nil
}
