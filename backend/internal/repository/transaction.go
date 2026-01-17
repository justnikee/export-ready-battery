package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"exportready-battery/internal/models"
)

// CreateTransaction logs a quota usage event
func (r *Repository) CreateTransaction(ctx context.Context, tx *models.Transaction) error {
	query := `
		INSERT INTO public.transactions (id, tenant_id, description, quota_change, batch_id, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING created_at`

	tx.ID = uuid.New()
	err := r.db.Pool.QueryRow(ctx, query,
		tx.ID, tx.TenantID, tx.Description, tx.QuotaChange, tx.BatchID,
	).Scan(&tx.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	return nil
}

// ListTransactions returns all transactions for a tenant
func (r *Repository) ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, tenant_id, description, quota_change, batch_id, created_at
		FROM public.transactions
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2`

	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list transactions: %w", err)
	}
	defer rows.Close()

	var transactions []*models.Transaction
	for rows.Next() {
		tx := &models.Transaction{}
		err := rows.Scan(
			&tx.ID,
			&tx.TenantID,
			&tx.Description,
			&tx.QuotaChange,
			&tx.BatchID,
			&tx.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}
		transactions = append(transactions, tx)
	}

	return transactions, nil
}
