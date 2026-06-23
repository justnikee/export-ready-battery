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

// CreateRegistryVerification inserts a new verification result.
func (r *Repository) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error {
	var verifiedData interface{}
	if v.VerifiedData != nil {
		verifiedData = *v.VerifiedData
	}

	query := `
		INSERT INTO registry_verifications (
			id, tenant_id, batch_id, registry_type, certificate_no,
			status, trust_tier, verified_data, error_message,
			verified_at, expires_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (batch_id, registry_type, certificate_no)
		DO UPDATE SET
			status = EXCLUDED.status,
			trust_tier = EXCLUDED.trust_tier,
			verified_data = EXCLUDED.verified_data,
			error_message = EXCLUDED.error_message,
			verified_at = EXCLUDED.verified_at,
			expires_at = EXCLUDED.expires_at,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.Pool.Exec(ctx, query,
		v.ID, v.TenantID, v.BatchID, v.RegistryType, v.CertificateNo,
		v.Status, v.TrustTier, verifiedData, v.ErrorMessage,
		v.VerifiedAt, v.ExpiresAt, v.CreatedAt, v.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create registry verification: %w", err)
	}
	return nil
}

// GetRegistryVerificationsByBatch returns all verifications for a batch.
func (r *Repository) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) {
	query := `
		SELECT id, tenant_id, batch_id, registry_type, certificate_no,
			status, trust_tier, verified_data, error_message,
			verified_at, expires_at, created_at, updated_at
		FROM registry_verifications
		WHERE batch_id = $1
		ORDER BY registry_type
	`
	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to list registry verifications: %w", err)
	}
	defer rows.Close()

	return scanRegistryVerifications(rows)
}

// GetRegistryVerificationByBatchAndType returns a specific verification.
func (r *Repository) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) {
	query := `
		SELECT id, tenant_id, batch_id, registry_type, certificate_no,
			status, trust_tier, verified_data, error_message,
			verified_at, expires_at, created_at, updated_at
		FROM registry_verifications
		WHERE batch_id = $1 AND registry_type = $2 AND certificate_no = $3
	`
	v := &models.RegistryVerification{}
	var verifiedData interface{}
	var verifiedAt, expiresAt *time.Time

	err := r.db.Pool.QueryRow(ctx, query, batchID, registryType, certificateNo).Scan(
		&v.ID, &v.TenantID, &v.BatchID, &v.RegistryType, &v.CertificateNo,
		&v.Status, &v.TrustTier, &verifiedData, &v.ErrorMessage,
		&verifiedAt, &expiresAt, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get registry verification: %w", err)
	}

	v.VerifiedAt = verifiedAt
	v.ExpiresAt = expiresAt
	if verifiedData != nil {
		if m, ok := verifiedData.(map[string]interface{}); ok {
			v.VerifiedData = &m
		} else if b, ok := verifiedData.([]byte); ok {
			var parsed map[string]interface{}
			if json.Unmarshal(b, &parsed) == nil {
				v.VerifiedData = &parsed
			}
		}
	}
	return v, nil
}

// DeleteExpiredRegistryVerifications removes stale cache entries.
func (r *Repository) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) {
	result, err := r.db.Pool.Exec(ctx,
		`DELETE FROM registry_verifications WHERE expires_at < NOW()`)
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired verifications: %w", err)
	}
	return result.RowsAffected(), nil
}

func scanRegistryVerifications(rows pgx.Rows) ([]models.RegistryVerification, error) {
	var out []models.RegistryVerification
	for rows.Next() {
		var v models.RegistryVerification
		var verifiedData interface{}
		var verifiedAt, expiresAt *time.Time

		err := rows.Scan(
			&v.ID, &v.TenantID, &v.BatchID, &v.RegistryType, &v.CertificateNo,
			&v.Status, &v.TrustTier, &verifiedData, &v.ErrorMessage,
			&verifiedAt, &expiresAt, &v.CreatedAt, &v.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan registry verification: %w", err)
		}

		v.VerifiedAt = verifiedAt
		v.ExpiresAt = expiresAt
		if verifiedData != nil {
			if m, ok := verifiedData.(map[string]interface{}); ok {
				v.VerifiedData = &m
			} else if b, ok := verifiedData.([]byte); ok {
				var parsed map[string]interface{}
				if json.Unmarshal(b, &parsed) == nil {
					v.VerifiedData = &parsed
				}
			}
		}
		out = append(out, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}
