package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type TallyImportLog struct {
	ID              uuid.UUID  `db:"id" json:"id"`
	TenantID        uuid.UUID  `db:"tenant_id" json:"tenant_id"`
	FileName        string     `db:"file_name" json:"file_name"`
	Status          string     `db:"status" json:"status"`
	ErrorMessage    *string    `db:"error_message" json:"error_message,omitempty"`
	VouchersCount   int        `db:"vouchers_count" json:"vouchers_count"`
	StockItemsCount int        `db:"stock_items_count" json:"stock_items_count"`
	CreatedLotID    *uuid.UUID `db:"created_lot_id" json:"created_lot_id,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
}

func (r *Repository) CreateTallyImportLog(ctx context.Context, log *TallyImportLog) error {
	query := `
		INSERT INTO tally_import_logs (tenant_id, file_name, status, error_message, vouchers_count, stock_items_count, created_lot_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	err := r.db.Pool.QueryRow(ctx, query,
		log.TenantID, log.FileName, log.Status, log.ErrorMessage,
		log.VouchersCount, log.StockItemsCount, log.CreatedLotID,
	).Scan(&log.ID, &log.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create tally import log: %w", err)
	}
	return nil
}

func (r *Repository) GetTallyImportLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*TallyImportLog, int, error) {
	var total int
	err := r.db.Pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM tally_import_logs WHERE tenant_id = $1",
		tenantID,
	).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count tally import logs: %w", err)
	}

	query := `
		SELECT id, tenant_id, file_name, status, error_message, vouchers_count, stock_items_count, created_lot_id, created_at
		FROM tally_import_logs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query tally import logs: %w", err)
	}
	defer rows.Close()

	return scanTallyImportLogs(rows, total)
}

func scanTallyImportLogs(rows pgx.Rows, total int) ([]*TallyImportLog, int, error) {
	var logs []*TallyImportLog
	for rows.Next() {
		l := &TallyImportLog{}
		err := rows.Scan(
			&l.ID, &l.TenantID, &l.FileName, &l.Status, &l.ErrorMessage,
			&l.VouchersCount, &l.StockItemsCount, &l.CreatedLotID, &l.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan tally import log: %w", err)
		}
		logs = append(logs, l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows error: %w", err)
	}
	return logs, total, nil
}
