package repository

import (
	"context"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// A direct link is the strongest evidence, followed by an explicitly full-batch link.
// Use the same ranking in both directions when evidence overlaps for a pack and lot.
const traceScopeOrder = "CASE a.scope WHEN 'pack' THEN 1 WHEN 'batch_all' THEN 2 ELSE 3 END"

const tracePackColumns = "p.uuid, p.serial_number, b.id, b.batch_name, b.status"

func scanTracePack(row pgx.Row) (models.TracePack, error) {
	var pack models.TracePack
	err := row.Scan(&pack.ID, &pack.Serial, &pack.BatchID, &pack.BatchName, &pack.BatchState)
	return pack, err
}

func (r *Repository) FindTracePacks(ctx context.Context, tenantID uuid.UUID, serial string, limit, offset int) ([]models.TracePack, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT `+tracePackColumns+`
		FROM public.passports p JOIN public.batches b ON b.id=p.batch_id
		WHERE b.tenant_id=$1 AND b.deleted_at IS NULL AND p.deleted_at IS NULL AND p.serial_number=$2
		ORDER BY b.batch_name, b.id, p.uuid LIMIT $3 OFFSET $4`, tenantID, serial, limit, offset)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.TracePack, error) { return scanTracePack(row) })
}

func (r *Repository) GetTracePack(ctx context.Context, tenantID, packID uuid.UUID, limit, offset int) (models.TracePack, []models.TracePackLot, error) {
	pack, err := scanTracePack(r.db.Pool.QueryRow(ctx, `SELECT `+tracePackColumns+`
		FROM public.passports p JOIN public.batches b ON b.id=p.batch_id
		WHERE b.tenant_id=$1 AND p.uuid=$2 AND b.deleted_at IS NULL AND p.deleted_at IS NULL`, tenantID, packID))
	if err != nil {
		return pack, nil, err
	}
	rows, err := r.db.Pool.Query(ctx, `SELECT DISTINCT ON (l.source,l.part_number,l.lot_code)
		l.id, l.source, l.part_number, l.lot_code, a.scope, i.file_name, a.source_row, i.created_at
		FROM public.passports p JOIN public.batches b ON b.id=p.batch_id
		JOIN public.lot_assignments a ON a.tenant_id=b.tenant_id AND a.batch_id=b.id
		  AND (a.passport_id=p.uuid OR a.passport_id IS NULL)
		JOIN public.component_lots l ON l.tenant_id=a.tenant_id AND l.id=a.lot_id
		JOIN public.component_lot_imports i ON i.tenant_id=a.tenant_id AND i.id=a.import_id
		WHERE b.tenant_id=$1 AND b.id=$2 AND p.uuid=$3 AND b.deleted_at IS NULL AND p.deleted_at IS NULL
		ORDER BY l.source,l.part_number,l.lot_code, `+traceScopeOrder+`
		LIMIT $4 OFFSET $5`, tenantID, pack.BatchID, packID, limit, offset)
	if err != nil {
		return pack, nil, err
	}
	matches, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.TracePackLot, error) {
		var item models.TracePackLot
		err := row.Scan(&item.Lot.ID, &item.Lot.Source, &item.Lot.PartNumber, &item.Lot.LotCode, &item.Evidence.Scope,
			&item.Evidence.FileName, &item.Evidence.SourceRow, &item.Evidence.RecordedAt)
		return item, err
	})
	return pack, matches, err
}

func (r *Repository) FindTraceLots(ctx context.Context, tenantID uuid.UUID, lotCode string, limit, offset int) ([]models.TraceLot, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT id,source,part_number,lot_code FROM public.component_lots
		WHERE tenant_id=$1 AND lot_code=$2 ORDER BY source,part_number,id LIMIT $3 OFFSET $4`, tenantID, lotCode, limit, offset)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.TraceLot, error) {
		var lot models.TraceLot
		err := row.Scan(&lot.ID, &lot.Source, &lot.PartNumber, &lot.LotCode)
		return lot, err
	})
}

func (r *Repository) GetTraceLot(ctx context.Context, tenantID, lotID uuid.UUID, limit, offset int) (models.TraceLot, []models.TraceLotImpact, error) {
	var lot models.TraceLot
	err := r.db.Pool.QueryRow(ctx, `SELECT id,source,part_number,lot_code FROM public.component_lots WHERE tenant_id=$1 AND id=$2`,
		tenantID, lotID).Scan(&lot.ID, &lot.Source, &lot.PartNumber, &lot.LotCode)
	if err != nil {
		return lot, nil, err
	}
	// Keep batch-wide evidence visible even when no pack identities exist yet.
	// A direct assignment to an unavailable pack must never expand to a batch match.
	rows, err := r.db.Pool.Query(ctx, `SELECT DISTINCT ON (b.batch_name,b.id,p.serial_number,p.uuid)
		p.uuid, p.serial_number, b.id, b.batch_name, b.status, a.scope, i.file_name, a.source_row, i.created_at
		FROM public.lot_assignments a
		JOIN public.batches b ON b.tenant_id=a.tenant_id AND b.id=a.batch_id AND b.deleted_at IS NULL
		JOIN public.component_lot_imports i ON i.tenant_id=a.tenant_id AND i.id=a.import_id
		LEFT JOIN public.passports p ON p.batch_id=b.id AND p.deleted_at IS NULL
		  AND (a.passport_id=p.uuid OR a.passport_id IS NULL)
		WHERE a.tenant_id=$1 AND a.lot_id=$2 AND (p.uuid IS NOT NULL OR a.passport_id IS NULL)
		ORDER BY b.batch_name,b.id,p.serial_number,p.uuid, `+traceScopeOrder+`
		LIMIT $3 OFFSET $4`, tenantID, lotID, limit, offset)
	if err != nil {
		return lot, nil, err
	}
	matches, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.TraceLotImpact, error) {
		var item models.TraceLotImpact
		err := row.Scan(&item.PackID, &item.Serial, &item.BatchID, &item.BatchName, &item.BatchState, &item.Evidence.Scope,
			&item.Evidence.FileName, &item.Evidence.SourceRow, &item.Evidence.RecordedAt)
		return item, err
	})
	return lot, matches, err
}
