package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrIssuanceChanged   = errors.New("batch is no longer eligible; reload before retrying")
	ErrInsufficientQuota = errors.New("insufficient quota")
)

// PrepareIssuance validates and snapshots locked, authoritative data. It must
// not mutate the database or call a remote service.
type PrepareIssuance func(*models.Batch, *models.Tenant, []*ComponentTreeNode) (json.RawMessage, error)
type rowQuerier interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

// Lock order is tenant then batch, shared by activation and all insertion paths.
// Tenant/profile edits and quota changes are serialized by the tenant lock;
// draft PATCH, archive and delete serialize on the batch row.
func lockIssuance(ctx context.Context, tx pgx.Tx, batchID, tenantID uuid.UUID) (*models.Batch, *models.Tenant, error) {
	var id uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT id FROM public.tenants WHERE id=$1 FOR UPDATE`, tenantID).Scan(&id); err != nil {
		return nil, nil, err
	}
	if err := tx.QueryRow(ctx, `SELECT id FROM public.batches WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL FOR UPDATE`, batchID, tenantID).Scan(&id); err != nil {
		return nil, nil, ErrIssuanceChanged
	}
	batch, err := getBatch(ctx, tx, batchID, tenantID)
	if err != nil {
		return nil, nil, err
	}
	tenant, err := getTenant(ctx, tx, tenantID)
	return batch, tenant, err
}

func chargeIssuance(ctx context.Context, tx pgx.Tx, batchID, tenantID uuid.UUID, count int, description string) (int, error) {
	var balance int
	err := tx.QueryRow(ctx, `UPDATE public.tenants SET quota_balance=COALESCE(quota_balance,2)-$2 WHERE id=$1 AND COALESCE(quota_balance,2)>=$2 RETURNING quota_balance`, tenantID, count).Scan(&balance)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrInsufficientQuota
	}
	if err != nil {
		return 0, err
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.transactions (id,tenant_id,description,quota_change,batch_id,created_at) VALUES ($1,$2,$3,$4,$5,NOW())`, uuid.New(), tenantID, description, -count, batchID)
	return balance, err
}

func (r *Repository) ActivateBatchAtomic(ctx context.Context, batchID, tenantID uuid.UUID, prepare PrepareIssuance) (int, error) {
	tx, err := r.db.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	balance, err := activateBatchTx(ctx, tx, batchID, tenantID, prepare)
	if err != nil {
		return 0, err
	}
	if err = tx.Commit(ctx); err != nil {
		return 0, err
	}
	return balance, nil
}

func activateBatchTx(ctx context.Context, tx pgx.Tx, batchID, tenantID uuid.UUID, prepare PrepareIssuance) (int, error) {
	batch, tenant, err := lockIssuance(ctx, tx, batchID, tenantID)
	if err != nil {
		return 0, err
	}
	// A retry after a successful commit returns a conflict without another debit.
	// ARCHIVED is terminal and cannot be activated again.
	if batch.Status != models.BatchStatusDraft {
		return 0, ErrIssuanceChanged
	}
	tree, err := getComponentTree(ctx, tx, batchID, tenantID)
	if err != nil {
		return 0, err
	}
	snapshot, err := prepare(batch, tenant, tree)
	if err != nil {
		return 0, err
	}
	if !json.Valid(snapshot) {
		return 0, fmt.Errorf("invalid issuance snapshot")
	}
	balance, err := chargeIssuance(ctx, tx, batchID, tenantID, batch.TotalPassports, fmt.Sprintf("Batch Activation (%d Passports): %s", batch.TotalPassports, batch.BatchName))
	if err != nil {
		return 0, err
	}
	// Only provisional snapshots of this still-DRAFT batch are finalized. Existing
	// issued passports and their immutable lifecycle events are never rewritten.
	if _, err = tx.Exec(ctx, `UPDATE public.passports SET batch_snapshot=$2::jsonb WHERE batch_id=$1 AND deleted_at IS NULL`, batchID, string(snapshot)); err != nil {
		return 0, err
	}
	tag, err := tx.Exec(ctx, `UPDATE public.batches SET status='ACTIVE' WHERE id=$1 AND tenant_id=$2 AND status='DRAFT' AND deleted_at IS NULL`, batchID, tenantID)
	if err != nil {
		return 0, err
	}
	if tag.RowsAffected() != 1 {
		return 0, ErrIssuanceChanged
	}
	return balance, nil
}

// InsertPassportsAtomic meters and inserts both records and genesis events in
// one transaction. A concurrent status change requires the caller to reload;
// it cannot turn a free draft insertion into an unmetered active insertion.
func (r *Repository) InsertPassportsAtomic(ctx context.Context, batchID, tenantID uuid.UUID, expectedStatus string, passports []*models.Passport, events []*models.PassportEvent, prepare PrepareIssuance) (int, error) {
	if len(passports) == 0 || len(passports) != len(events) {
		return 0, fmt.Errorf("invalid passport/event count")
	}
	for i, p := range passports {
		if p.BatchID != batchID || events[i].PassportID != p.UUID {
			return 0, fmt.Errorf("passport/event batch mismatch")
		}
	}
	tx, err := r.db.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	count, err := insertPassportsTx(ctx, tx, batchID, tenantID, expectedStatus, passports, events, prepare)
	if err != nil {
		return 0, err
	}
	if err = tx.Commit(ctx); err != nil {
		return 0, err
	}
	return count, nil
}

func insertPassportsTx(ctx context.Context, tx pgx.Tx, batchID, tenantID uuid.UUID, expectedStatus string, passports []*models.Passport, events []*models.PassportEvent, prepare PrepareIssuance) (int, error) {
	batch, tenant, err := lockIssuance(ctx, tx, batchID, tenantID)
	if err != nil {
		return 0, err
	}
	if batch.Status != expectedStatus || (batch.Status != models.BatchStatusDraft && batch.Status != models.BatchStatusActive) {
		return 0, ErrIssuanceChanged
	}
	var snapshot json.RawMessage
	if batch.Status == models.BatchStatusActive {
		tree, err := getComponentTree(ctx, tx, batchID, tenantID)
		if err != nil {
			return 0, err
		}
		snapshot, err = prepare(batch, tenant, tree)
		if err != nil {
			return 0, err
		}
		if !json.Valid(snapshot) {
			return 0, fmt.Errorf("invalid issuance snapshot")
		}
		if _, err = chargeIssuance(ctx, tx, batchID, tenantID, len(passports), fmt.Sprintf("Passport issuance (%d): %s", len(passports), batch.BatchName)); err != nil {
			return 0, err
		}
	}
	// Draft passports have no final snapshot. Activation freezes the corrected data.
	for _, p := range passports {
		p.BatchSnapshot = snapshot
	}
	count, err := copyPassports(ctx, tx, passports)
	if err != nil {
		return 0, err
	}
	if err = copyPassportEvents(ctx, tx, events); err != nil {
		return 0, err
	}
	return count, nil
}
