package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateRegistryJob inserts a new async registry verification job.
func (r *Repository) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error {
	query := `
		INSERT INTO registry_jobs (
			id, registry_type, certificate_no, batch_id, tenant_id,
			status, attempt_count, max_attempts, next_attempt_at,
			result_status, result_trust_tier, result_id, error_message,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		j.ID, j.RegistryType, j.CertificateNo, j.BatchID, j.TenantID,
		j.Status, j.AttemptCount, j.MaxAttempts, j.NextAttemptAt,
		j.ResultStatus, j.ResultTrustTier, j.ResultID, j.ErrorMessage,
		j.CreatedAt, j.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create registry job: %w", err)
	}
	return nil
}

// GetPendingRegistryJobs polls jobs that are ready to run.
func (r *Repository) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) {
	query := `
		SELECT id, registry_type, certificate_no, batch_id, tenant_id,
			status, attempt_count, max_attempts, next_attempt_at,
			result_status, result_trust_tier, result_id, error_message,
			created_at, updated_at
		FROM registry_jobs
		WHERE status IN ('pending', 'failed')
		  AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
		ORDER BY next_attempt_at NULLS FIRST, created_at
		FOR UPDATE SKIP LOCKED
		LIMIT $1
	`
	rows, err := r.db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to poll registry jobs: %w", err)
	}
	defer rows.Close()
	return scanRegistryJobs(rows)
}

// GetRegistryJobByID returns a single job.
func (r *Repository) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) {
	query := `
		SELECT id, registry_type, certificate_no, batch_id, tenant_id,
			status, attempt_count, max_attempts, next_attempt_at,
			result_status, result_trust_tier, result_id, error_message,
			created_at, updated_at
		FROM registry_jobs WHERE id = $1
	`
	row := r.db.Pool.QueryRow(ctx, query, id)
	return scanRegistryJobRow(row)
}

// GetRegistryJobsByBatch returns all jobs for a batch.
func (r *Repository) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) {
	query := `
		SELECT id, registry_type, certificate_no, batch_id, tenant_id,
			status, attempt_count, max_attempts, next_attempt_at,
			result_status, result_trust_tier, result_id, error_message,
			created_at, updated_at
		FROM registry_jobs WHERE batch_id = $1 ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to list registry jobs: %w", err)
	}
	defer rows.Close()
	return scanRegistryJobs(rows)
}

// UpdateRegistryJobStatus updates a job's state after processing.
func (r *Repository) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error {
	query := `
		UPDATE registry_jobs SET
			status = $2,
			attempt_count = $3,
			next_attempt_at = $4,
			result_status = $5,
			result_trust_tier = $6,
			result_id = $7,
			error_message = $8,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, id, status, attemptCount, nextAttemptAt, resultStatus, resultTrustTier, resultID, errorMessage)
	if err != nil {
		return fmt.Errorf("failed to update registry job: %w", err)
	}
	return nil
}

func scanRegistryJobs(rows pgx.Rows) ([]models.RegistryJob, error) {
	var out []models.RegistryJob
	for rows.Next() {
		j, err := scanRegistryJobRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *j)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}

func scanRegistryJobRow(row pgx.Row) (*models.RegistryJob, error) {
	var j models.RegistryJob
	var nextAttemptAt *time.Time
	err := row.Scan(
		&j.ID, &j.RegistryType, &j.CertificateNo, &j.BatchID, &j.TenantID,
		&j.Status, &j.AttemptCount, &j.MaxAttempts, &nextAttemptAt,
		&j.ResultStatus, &j.ResultTrustTier, &j.ResultID, &j.ErrorMessage,
		&j.CreatedAt, &j.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan registry job: %w", err)
	}
	j.NextAttemptAt = nextAttemptAt
	return &j, nil
}
