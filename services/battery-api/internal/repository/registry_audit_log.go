package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateRegistryAuditLog inserts an audit record.
func (r *Repository) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error {
	var reqPayload, respPayload interface{}
	if a.RequestPayload != nil {
		reqPayload = *a.RequestPayload
	}
	if a.ResponsePayload != nil {
		respPayload = *a.ResponsePayload
	}

	query := `
		INSERT INTO registry_audit_log (
			id, job_id, registry_type, certificate_no,
			request_method, request_url, request_payload,
			response_status, response_payload, latency_ms, error_message,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.Pool.Exec(ctx, query,
		a.ID, a.JobID, a.RegistryType, a.CertificateNo,
		a.RequestMethod, a.RequestURL, reqPayload,
		a.ResponseStatus, respPayload, a.LatencyMs, a.ErrorMessage,
		a.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create registry audit log: %w", err)
	}
	return nil
}

// GetRegistryAuditLogsByCertificate returns audit history for a certificate.
func (r *Repository) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) {
	query := `
		SELECT id, job_id, registry_type, certificate_no,
			request_method, request_url, request_payload,
			response_status, response_payload, latency_ms, error_message,
			created_at
		FROM registry_audit_log
		WHERE registry_type = $1 AND certificate_no = $2
		ORDER BY created_at DESC
		LIMIT 100
	`
	rows, err := r.db.Pool.Query(ctx, query, registryType, certificateNo)
	if err != nil {
		return nil, fmt.Errorf("failed to list audit logs: %w", err)
	}
	defer rows.Close()
	return scanRegistryAuditLogs(rows)
}

// GetRegistryAuditLogsByJob returns audit entries for a job.
func (r *Repository) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) {
	query := `
		SELECT id, job_id, registry_type, certificate_no,
			request_method, request_url, request_payload,
			response_status, response_payload, latency_ms, error_message,
			created_at
		FROM registry_audit_log
		WHERE job_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to list audit logs by job: %w", err)
	}
	defer rows.Close()
	return scanRegistryAuditLogs(rows)
}

func scanRegistryAuditLogs(rows pgx.Rows) ([]models.RegistryAuditLog, error) {
	var out []models.RegistryAuditLog
	for rows.Next() {
		var a models.RegistryAuditLog
		var reqPayload, respPayload interface{}
		err := rows.Scan(
			&a.ID, &a.JobID, &a.RegistryType, &a.CertificateNo,
			&a.RequestMethod, &a.RequestURL, &reqPayload,
			&a.ResponseStatus, &respPayload, &a.LatencyMs, &a.ErrorMessage,
			&a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		if reqPayload != nil {
			if m, ok := reqPayload.(map[string]interface{}); ok {
				a.RequestPayload = &m
			} else if b, ok := reqPayload.([]byte); ok {
				var parsed map[string]interface{}
				if json.Unmarshal(b, &parsed) == nil {
					a.RequestPayload = &parsed
				}
			}
		}
		if respPayload != nil {
			if m, ok := respPayload.(map[string]interface{}); ok {
				a.ResponsePayload = &m
			} else if b, ok := respPayload.([]byte); ok {
				var parsed map[string]interface{}
				if json.Unmarshal(b, &parsed) == nil {
					a.ResponsePayload = &parsed
				}
			}
		}
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return out, nil
}
