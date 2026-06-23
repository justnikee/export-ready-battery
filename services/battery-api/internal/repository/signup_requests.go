package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateSignupRequest inserts a new signup request into the database.
func (r *Repository) CreateSignupRequest(ctx context.Context, req *models.SignupRequest) error {
	query := `
		INSERT INTO signup_requests (company_name, email, gstin, iec_code, product_type, estimated_batches, market_region, phone, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		RETURNING id, created_at
	`
	return r.db.Pool.QueryRow(ctx, query,
		req.CompanyName,
		req.Email,
		req.GSTIN,
		req.IECCode,
		req.ProductType,
		req.EstimatedBatches,
		req.MarketRegion,
		req.Phone,
		req.Status,
	).Scan(&req.ID, &req.CreatedAt)
}

// GetSignupRequestByEmail returns the most recent signup request for an email.
func (r *Repository) GetSignupRequestByEmail(ctx context.Context, email string) (*models.SignupRequest, error) {
	query := `
		SELECT id, company_name, email, gstin, iec_code, product_type, estimated_batches, market_region, phone, status, rejection_reason, reviewed_at, reviewed_by, created_at
		FROM signup_requests
		WHERE email = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	req := &models.SignupRequest{}
	err := r.db.Pool.QueryRow(ctx, query, email).Scan(
		&req.ID, &req.CompanyName, &req.Email, &req.GSTIN, &req.IECCode,
		&req.ProductType, &req.EstimatedBatches, &req.MarketRegion, &req.Phone,
		&req.Status, &req.RejectionReason, &req.ReviewedAt, &req.ReviewedBy, &req.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return req, nil
}

// ListSignupRequests returns signup requests filtered by status.
func (r *Repository) ListSignupRequests(ctx context.Context, status string, limit, offset int) ([]*models.SignupRequest, int, error) {
	where := ""
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		where = fmt.Sprintf("WHERE status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM signup_requests " + where
	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT id, company_name, email, gstin, iec_code, product_type, estimated_batches, market_region, phone, status, rejection_reason, reviewed_at, reviewed_by, created_at
		FROM signup_requests
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var requests []*models.SignupRequest
	for rows.Next() {
		req := &models.SignupRequest{}
		if err := rows.Scan(
			&req.ID, &req.CompanyName, &req.Email, &req.GSTIN, &req.IECCode,
			&req.ProductType, &req.EstimatedBatches, &req.MarketRegion, &req.Phone,
			&req.Status, &req.RejectionReason, &req.ReviewedAt, &req.ReviewedBy, &req.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		requests = append(requests, req)
	}

	return requests, total, rows.Err()
}

// UpdateSignupRequestStatus updates the status of a signup request.
func (r *Repository) UpdateSignupRequestStatus(ctx context.Context, id uuid.UUID, status, reason string, reviewedBy uuid.UUID) error {
	query := `
		UPDATE signup_requests
		SET status = $1, rejection_reason = $2, reviewed_at = NOW(), reviewed_by = $3
		WHERE id = $4
	`
	_, err := r.db.Pool.Exec(ctx, query, status, reason, reviewedBy, id)
	return err
}
