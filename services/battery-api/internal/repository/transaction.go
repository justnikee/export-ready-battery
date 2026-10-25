package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/battery-api/internal/models"
)

// PaymentGrant is derived from a captured provider payment and its original
// order, never from a browser-supplied package or tenant identifier.
type PaymentGrant struct {
	TenantID         uuid.UUID
	PaymentID        string
	PackageName      string
	QuotaUnits       int
	SeatBonus        int
	PlanType         string
	BillingCycleDays int
}

type PaymentGrantResult struct {
	Applied      bool
	QuotaBalance int
}

// ApplyPaymentGrant atomically records and fulfills one captured payment. The
// tenant row lock serializes verify, webhook and issuance updates; the unique
// payment_id index prevents reuse even across different tenant requests.
func (r *Repository) ApplyPaymentGrant(ctx context.Context, grant PaymentGrant) (PaymentGrantResult, error) {
	if grant.TenantID == uuid.Nil || grant.PaymentID == "" || grant.PackageName == "" ||
		grant.QuotaUnits < 0 || grant.SeatBonus < 0 ||
		(grant.QuotaUnits == 0 && grant.SeatBonus == 0) ||
		(grant.PlanType != "" && grant.BillingCycleDays <= 0) {
		return PaymentGrantResult{}, fmt.Errorf("invalid payment grant")
	}
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return PaymentGrantResult{}, fmt.Errorf("begin payment fulfillment: %w", err)
	}
	defer tx.Rollback(ctx)
	var balance int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(quota_balance, 0) FROM public.tenants WHERE id=$1 FOR UPDATE`, grant.TenantID).Scan(&balance); err != nil {
		return PaymentGrantResult{}, fmt.Errorf("lock payment tenant: %w", err)
	}
	var ledgerID uuid.UUID
	err = tx.QueryRow(ctx, `INSERT INTO public.transactions
		(id, tenant_id, description, quota_change, payment_id, created_at)
		VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT DO NOTHING RETURNING id`,
		uuid.New(), grant.TenantID, "Razorpay Purchase: "+grant.PackageName,
		grant.QuotaUnits, grant.PaymentID).Scan(&ledgerID)
	if err == pgx.ErrNoRows {
		if err := tx.Commit(ctx); err != nil {
			return PaymentGrantResult{}, fmt.Errorf("commit duplicate payment check: %w", err)
		}
		return PaymentGrantResult{Applied: false, QuotaBalance: balance}, nil
	}
	if err != nil {
		return PaymentGrantResult{}, fmt.Errorf("record payment: %w", err)
	}
	if err := tx.QueryRow(ctx, `UPDATE public.tenants SET
		quota_balance=COALESCE(quota_balance,0)+$2,
		bonus_seats=COALESCE(bonus_seats,0)+$3
		WHERE id=$1 RETURNING quota_balance`, grant.TenantID, grant.QuotaUnits, grant.SeatBonus).Scan(&balance); err != nil {
		return PaymentGrantResult{}, fmt.Errorf("grant purchased units: %w", err)
	}
	if grant.PlanType != "" {
		// Renewing the same plan early preserves the remainder of its paid term.
		_, err = tx.Exec(ctx, `UPDATE public.tenants SET plan_type=$2, plan_status='ACTIVE',
			subscription_expires_at=(CASE WHEN plan_type=$2 AND subscription_expires_at>NOW()
				THEN subscription_expires_at ELSE NOW() END)+($3::int * INTERVAL '1 day')
			WHERE id=$1`, grant.TenantID, grant.PlanType, grant.BillingCycleDays)
		if err != nil {
			return PaymentGrantResult{}, fmt.Errorf("activate purchased plan: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return PaymentGrantResult{}, fmt.Errorf("commit payment fulfillment: %w", err)
	}
	return PaymentGrantResult{Applied: true, QuotaBalance: balance}, nil
}

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

// GetTransactionByPaymentID retrieves a specific transaction by payment ID.
func (r *Repository) GetTransactionByPaymentID(ctx context.Context, tenantID uuid.UUID, paymentID string) (*models.Transaction, error) {
	query := `
		SELECT id, tenant_id, description, quota_change, batch_id, payment_id, created_at
		FROM public.transactions
		WHERE tenant_id = $1 AND payment_id = $2
		LIMIT 1`

	tx := &models.Transaction{}
	err := r.db.Pool.QueryRow(ctx, query, tenantID, paymentID).Scan(
		&tx.ID,
		&tx.TenantID,
		&tx.Description,
		&tx.QuotaChange,
		&tx.BatchID,
		&tx.PaymentID,
		&tx.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction by payment id: %w", err)
	}

	return tx, nil
}
