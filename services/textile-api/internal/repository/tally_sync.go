package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// TallySyncConfig stores per-tenant Tally ERP connection settings.
type TallySyncConfig struct {
	ID                   uuid.UUID  `db:"id" json:"id"`
	TenantID             uuid.UUID  `db:"tenant_id" json:"tenant_id"`
	TallyHost            string     `db:"tally_host" json:"tally_host"`
	TallyPort            int        `db:"tally_port" json:"tally_port"`
	SyncFrequencyMinutes int        `db:"sync_frequency_minutes" json:"sync_frequency_minutes"`
	AutoImport           bool       `db:"auto_import" json:"auto_import"`
	Enabled              bool       `db:"enabled" json:"enabled"`
	LastSyncAt           *time.Time `db:"last_sync_at" json:"last_sync_at,omitempty"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
}

// TallySyncStaging holds synced records from Tally pending user review.
type TallySyncStaging struct {
	ID                uuid.UUID  `db:"id" json:"id"`
	TenantID          uuid.UUID  `db:"tenant_id" json:"tenant_id"`
	SyncRunID         *uuid.UUID `db:"sync_run_id" json:"sync_run_id,omitempty"`
	SourceType        string     `db:"source_type" json:"source_type"`
	TallyName         string     `db:"tally_name" json:"tally_name"`
	TallyParent       *string    `db:"tally_parent" json:"tally_parent,omitempty"`
	TallyQty          *float64   `db:"tally_qty" json:"tally_qty,omitempty"`
	TallyRate         *float64   `db:"tally_rate" json:"tally_rate,omitempty"`
	TallyAmount       *float64   `db:"tally_amount" json:"tally_amount,omitempty"`
	TallyGST          *float64   `db:"tally_gst" json:"tally_gst,omitempty"`
	TallyHSN          *string    `db:"tally_hsn" json:"tally_hsn,omitempty"`
	TallyParty        *string    `db:"tally_party" json:"tally_party,omitempty"`
	DetectedCategory  *string    `db:"detected_category" json:"detected_category,omitempty"`
	DetectedFiberType *string    `db:"detected_fiber_type" json:"detected_fiber_type,omitempty"`
	RawXML            *string    `db:"raw_xml" json:"raw_xml,omitempty"`
	Status            string     `db:"status" json:"status"`
	AppliedLotID      *uuid.UUID `db:"applied_lot_id" json:"applied_lot_id,omitempty"`
	AppliedAt         *time.Time `db:"applied_at" json:"applied_at,omitempty"`
	DiscardedAt       *time.Time `db:"discarded_at" json:"discarded_at,omitempty"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
}

// TallySyncRun tracks each sync execution.
type TallySyncRun struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	TenantID      uuid.UUID  `db:"tenant_id" json:"tenant_id"`
	Status        string     `db:"status" json:"status"`
	ErrorMessage  *string    `db:"error_message" json:"error_message,omitempty"`
	ItemsFetched  int        `db:"items_fetched" json:"items_fetched"`
	ItemsStaged   int        `db:"items_staged" json:"items_staged"`
	StartedAt     time.Time  `db:"started_at" json:"started_at"`
	CompletedAt   *time.Time `db:"completed_at" json:"completed_at,omitempty"`
}

// --- TallySyncConfig ---

func (r *Repository) UpsertTallySyncConfig(ctx context.Context, cfg *TallySyncConfig) error {
	query := `
		INSERT INTO tally_sync_configs (tenant_id, tally_host, tally_port, sync_frequency_minutes, auto_import, enabled, last_sync_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tenant_id) DO UPDATE SET
			tally_host = EXCLUDED.tally_host,
			tally_port = EXCLUDED.tally_port,
			sync_frequency_minutes = EXCLUDED.sync_frequency_minutes,
			auto_import = EXCLUDED.auto_import,
			enabled = EXCLUDED.enabled,
			last_sync_at = EXCLUDED.last_sync_at,
			updated_at = NOW()
		RETURNING id, created_at, updated_at
	`
	return r.db.Pool.QueryRow(ctx, query,
		cfg.TenantID, cfg.TallyHost, cfg.TallyPort, cfg.SyncFrequencyMinutes,
		cfg.AutoImport, cfg.Enabled, cfg.LastSyncAt,
	).Scan(&cfg.ID, &cfg.CreatedAt, &cfg.UpdatedAt)
}

func (r *Repository) GetTallySyncConfig(ctx context.Context, tenantID uuid.UUID) (*TallySyncConfig, error) {
	query := `SELECT id, tenant_id, tally_host, tally_port, sync_frequency_minutes, auto_import, enabled, last_sync_at, created_at, updated_at
			  FROM tally_sync_configs WHERE tenant_id = $1`
	cfg := &TallySyncConfig{}
	err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(
		&cfg.ID, &cfg.TenantID, &cfg.TallyHost, &cfg.TallyPort, &cfg.SyncFrequencyMinutes,
		&cfg.AutoImport, &cfg.Enabled, &cfg.LastSyncAt, &cfg.CreatedAt, &cfg.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get tally sync config: %w", err)
	}
	return cfg, nil
}

func (r *Repository) ListEnabledTallySyncConfigs(ctx context.Context) ([]*TallySyncConfig, error) {
	query := `SELECT id, tenant_id, tally_host, tally_port, sync_frequency_minutes, auto_import, enabled, last_sync_at, created_at, updated_at
			  FROM tally_sync_configs WHERE enabled = true`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list enabled tally sync configs: %w", err)
	}
	defer rows.Close()

	var configs []*TallySyncConfig
	for rows.Next() {
		cfg := &TallySyncConfig{}
		if err := rows.Scan(
			&cfg.ID, &cfg.TenantID, &cfg.TallyHost, &cfg.TallyPort, &cfg.SyncFrequencyMinutes,
			&cfg.AutoImport, &cfg.Enabled, &cfg.LastSyncAt, &cfg.CreatedAt, &cfg.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan tally sync config: %w", err)
		}
		configs = append(configs, cfg)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return configs, nil
}

func (r *Repository) UpdateTallySyncLastSync(ctx context.Context, tenantID uuid.UUID, t time.Time) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE tally_sync_configs SET last_sync_at = $2, updated_at = NOW() WHERE tenant_id = $1`,
		tenantID, t,
	)
	return err
}

// --- TallySyncStaging ---

func (r *Repository) CreateTallySyncStaging(ctx context.Context, item *TallySyncStaging) error {
	query := `
		INSERT INTO tally_sync_staging (tenant_id, sync_run_id, source_type, tally_name, tally_parent, tally_qty, tally_rate, tally_amount, tally_gst, tally_hsn, tally_party, detected_category, detected_fiber_type, raw_xml)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, created_at
	`
	return r.db.Pool.QueryRow(ctx, query,
		item.TenantID, item.SyncRunID, item.SourceType, item.TallyName, item.TallyParent,
		item.TallyQty, item.TallyRate, item.TallyAmount, item.TallyGST, item.TallyHSN,
		item.TallyParty, item.DetectedCategory, item.DetectedFiberType, item.RawXML,
	).Scan(&item.ID, &item.CreatedAt)
}

func (r *Repository) GetTallySyncStagingByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*TallySyncStaging, int, error) {
	var total int
	countQuery := `SELECT COUNT(*) FROM tally_sync_staging WHERE tenant_id = $1`
	countArgs := []interface{}{tenantID}
	if status != "" {
		countQuery += " AND status = $2"
		countArgs = append(countArgs, status)
	}
	if err := r.db.Pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count staging: %w", err)
	}

	query := `SELECT id, tenant_id, sync_run_id, source_type, tally_name, tally_parent, tally_qty, tally_rate, tally_amount, tally_gst, tally_hsn, tally_party, detected_category, detected_fiber_type, raw_xml, status, applied_lot_id, applied_at, discarded_at, created_at
			  FROM tally_sync_staging WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 1
	if status != "" {
		argIdx++
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
	}
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx+1, argIdx+2)
	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query staging: %w", err)
	}
	defer rows.Close()

	return scanTallySyncStaging(rows, total)
}

func (r *Repository) GetTallySyncStagingByID(ctx context.Context, id, tenantID uuid.UUID) (*TallySyncStaging, error) {
	query := `SELECT id, tenant_id, sync_run_id, source_type, tally_name, tally_parent, tally_qty, tally_rate, tally_amount, tally_gst, tally_hsn, tally_party, detected_category, detected_fiber_type, raw_xml, status, applied_lot_id, applied_at, discarded_at, created_at
			  FROM tally_sync_staging WHERE id = $1 AND tenant_id = $2`
	item := &TallySyncStaging{}
	err := r.db.Pool.QueryRow(ctx, query, id, tenantID).Scan(
		&item.ID, &item.TenantID, &item.SyncRunID, &item.SourceType, &item.TallyName, &item.TallyParent,
		&item.TallyQty, &item.TallyRate, &item.TallyAmount, &item.TallyGST, &item.TallyHSN,
		&item.TallyParty, &item.DetectedCategory, &item.DetectedFiberType, &item.RawXML,
		&item.Status, &item.AppliedLotID, &item.AppliedAt, &item.DiscardedAt, &item.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get staging item: %w", err)
	}
	return item, nil
}

func (r *Repository) ApplyTallySyncStaging(ctx context.Context, id, tenantID, lotID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE tally_sync_staging SET status = 'applied', applied_lot_id = $3, applied_at = NOW() WHERE id = $1 AND tenant_id = $2`,
		id, tenantID, lotID,
	)
	return err
}

func (r *Repository) DiscardTallySyncStaging(ctx context.Context, id, tenantID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE tally_sync_staging SET status = 'discarded', discarded_at = NOW() WHERE id = $1 AND tenant_id = $2`,
		id, tenantID,
	)
	return err
}

// --- TallySyncRun ---

func (r *Repository) CreateTallySyncRun(ctx context.Context, run *TallySyncRun) error {
	query := `INSERT INTO tally_sync_runs (tenant_id, status, error_message, items_fetched, items_staged, started_at, completed_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7)
			  RETURNING id`
	return r.db.Pool.QueryRow(ctx, query,
		run.TenantID, run.Status, run.ErrorMessage, run.ItemsFetched, run.ItemsStaged, run.StartedAt, run.CompletedAt,
	).Scan(&run.ID)
}

func (r *Repository) UpdateTallySyncRun(ctx context.Context, id uuid.UUID, status, errorMsg string, fetched, staged int) error {
	var completedAt *time.Time
	if status == "success" || status == "error" {
		now := time.Now()
		completedAt = &now
	}
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE tally_sync_runs SET status = $2, error_message = $3, items_fetched = $4, items_staged = $5, completed_at = $6 WHERE id = $1`,
		id, status, errorMsg, fetched, staged, completedAt,
	)
	return err
}

func scanTallySyncStaging(rows pgx.Rows, total int) ([]*TallySyncStaging, int, error) {
	var items []*TallySyncStaging
	for rows.Next() {
		item := &TallySyncStaging{}
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.SyncRunID, &item.SourceType, &item.TallyName, &item.TallyParent,
			&item.TallyQty, &item.TallyRate, &item.TallyAmount, &item.TallyGST, &item.TallyHSN,
			&item.TallyParty, &item.DetectedCategory, &item.DetectedFiberType, &item.RawXML,
			&item.Status, &item.AppliedLotID, &item.AppliedAt, &item.DiscardedAt, &item.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan staging item: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows error: %w", err)
	}
	return items, total, nil
}
