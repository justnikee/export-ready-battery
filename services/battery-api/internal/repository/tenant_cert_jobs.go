package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// CreateTenantCertVerificationJob enqueues an async registry check for a
// tenant's compliance registration number. If a pending/running job already
// exists for this tenant+doc_type, this is a no-op.
func (r *Repository) CreateTenantCertVerificationJob(ctx context.Context, j *models.TenantCertVerificationJob) error {
	query := `
		INSERT INTO tenant_cert_verification_jobs (
			id, tenant_id, doc_type, certificate_no, status, attempt_count, max_attempts, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		ON CONFLICT (tenant_id, doc_type) WHERE status IN ('pending','running') DO NOTHING`
	_, err := r.db.Pool.Exec(ctx, query, j.ID, j.TenantID, j.DocType, j.CertificateNo, j.Status, j.AttemptCount, j.MaxAttempts)
	if err != nil {
		return fmt.Errorf("failed to create tenant cert verification job: %w", err)
	}
	return nil
}

// GetPendingTenantCertVerificationJobs polls jobs that are ready to run.
func (r *Repository) GetPendingTenantCertVerificationJobs(ctx context.Context, limit int) ([]models.TenantCertVerificationJob, error) {
	query := `
		SELECT id, tenant_id, doc_type, certificate_no, status, attempt_count, max_attempts,
			next_attempt_at, COALESCE(result_status, ''), COALESCE(result_trust_tier, ''), COALESCE(error_message, ''),
			created_at, updated_at
		FROM tenant_cert_verification_jobs
		WHERE status IN ('pending', 'failed')
		  AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
		ORDER BY next_attempt_at NULLS FIRST, created_at
		FOR UPDATE SKIP LOCKED
		LIMIT $1
	`
	rows, err := r.db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to poll tenant cert verification jobs: %w", err)
	}
	defer rows.Close()

	var out []models.TenantCertVerificationJob
	for rows.Next() {
		var j models.TenantCertVerificationJob
		if err := rows.Scan(
			&j.ID, &j.TenantID, &j.DocType, &j.CertificateNo, &j.Status, &j.AttemptCount, &j.MaxAttempts,
			&j.NextAttemptAt, &j.ResultStatus, &j.ResultTrustTier, &j.ErrorMessage,
			&j.CreatedAt, &j.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan tenant cert verification job: %w", err)
		}
		out = append(out, j)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

// UpdateTenantCertVerificationJobStatus updates a job's state after processing.
func (r *Repository) UpdateTenantCertVerificationJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, errorMessage string) error {
	query := `
		UPDATE tenant_cert_verification_jobs SET
			status = $2,
			attempt_count = $3,
			next_attempt_at = $4,
			result_status = $5,
			result_trust_tier = $6,
			error_message = $7,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, id, status, attemptCount, nextAttemptAt, resultStatus, resultTrustTier, errorMessage)
	if err != nil {
		return fmt.Errorf("failed to update tenant cert verification job: %w", err)
	}
	return nil
}
