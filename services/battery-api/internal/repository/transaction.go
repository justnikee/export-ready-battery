package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

// CreateTransaction logs a quota usage event
func (r *Repository) CreateTransaction(ctx context.Context, tx *models.Transaction) error {
	query := `
		INSERT INTO public.transactions (id, tenant_id, description, quota_change, batch_id, payment_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING created_at`

	tx.ID = uuid.New()
	err := r.db.Pool.QueryRow(ctx, query,
		tx.ID, tx.TenantID, tx.Description, tx.QuotaChange, tx.BatchID, tx.PaymentID,
	).Scan(&tx.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	return nil
}

// TransactionExistsForPayment reports whether a transaction has already been
// recorded for the given Razorpay payment ID, used to make payment
// verification idempotent against retried/duplicate requests.
func (r *Repository) TransactionExistsForPayment(ctx context.Context, paymentID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM public.transactions WHERE payment_id = $1)`

	var exists bool
	err := r.db.Pool.QueryRow(ctx, query, paymentID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check transaction for payment: %w", err)
	}

	return exists, nil
}

// ListTransactions returns all transactions for a tenant
func (r *Repository) ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, tenant_id, description, quota_change, batch_id, payment_id, created_at
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
			&tx.PaymentID,
			&tx.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}
		transactions = append(transactions, tx)
	}

	return transactions, nil
}
