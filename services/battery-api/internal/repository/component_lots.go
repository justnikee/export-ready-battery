package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrLotImportChanged = errors.New("validate the file again before importing")

type resolvedLotRow struct {
	models.ComponentLotRow
	PassportID *uuid.UUID `json:"passport_id"`
}

type lotAssignmentKey struct {
	BatchID, PassportID         uuid.UUID
	Source, PartNumber, LotCode string
}

// ProcessComponentLotImport previews by default. With a validation token, it
// resolves the same input again under locks and inserts the whole file atomically.
func (r *Repository) ProcessComponentLotImport(ctx context.Context, tenantID, actorID uuid.UUID, input models.ComponentLotImportInput) (models.ComponentLotImportResult, error) {
	result := models.ComponentLotImportResult{Rows: []models.ComponentLotPreviewRow{}, Issues: append([]models.ComponentLotIssue{}, input.Issues...)}
	if len(input.Rows) == 0 {
		return result, nil
	}
	rowsJSON, err := json.Marshal(input.Rows)
	if err != nil {
		return result, err
	}
	commit := input.ExpectedToken != ""
	options := pgx.TxOptions{AccessMode: pgx.ReadOnly}
	if commit {
		options = pgx.TxOptions{IsoLevel: pgx.ReadCommitted}
	}
	tx, err := r.db.Pool.BeginTx(ctx, options)
	if err != nil {
		return result, err
	}
	defer tx.Rollback(ctx)
	if commit {
		if err := lockLotImportTargets(ctx, tx, tenantID, string(rowsJSON)); err != nil {
			return result, err
		}
	}
	resolved, additions, err := resolveLotImport(ctx, tx, tenantID, input.Rows, string(rowsJSON), &result)
	if err != nil || len(result.Issues) != 0 {
		return result, err
	}

	// Duplicate status can change after preview. The fingerprint binds the file,
	// workspace, operator and resolved identities, so this cannot redirect a link.
	fingerprint, err := json.Marshal(struct {
		Tenant, Actor uuid.UUID
		FileHash      string
		Rows          []resolvedLotRow
	}{tenantID, actorID, input.FileSHA256, resolved})
	if err != nil {
		return result, err
	}
	digest := sha256.Sum256(fingerprint)
	if !commit {
		result.Token = hex.EncodeToString(digest[:])
		return result, nil
	}
	if input.ExpectedToken != hex.EncodeToString(digest[:]) {
		return result, ErrLotImportChanged
	}
	var importID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM public.component_lot_imports WHERE tenant_id=$1 AND file_sha256=$2`, tenantID, input.FileSHA256).Scan(&importID)
	if err == nil {
		result.ImportID = &importID
		return result, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return result, err
	}
	if len(additions) == 0 {
		return result, nil
	}
	importID = uuid.New()
	if err := saveLotImport(ctx, tx, tenantID, actorID, importID, input, additions); err != nil {
		return result, err
	}
	if err := tx.Commit(ctx); err != nil {
		return result, err
	}
	result.ImportID = &importID
	return result, nil
}

func lockLotImportTargets(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, rowsJSON string) error {
	// Match issuance and draft deletion: tenant first, then batches, then packs.
	var id uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT id FROM public.tenants WHERE id=$1 FOR UPDATE`, tenantID).Scan(&id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `SELECT b.id FROM public.batches b
		WHERE b.tenant_id=$1 AND b.deleted_at IS NULL AND b.id IN (
			SELECT batch_id FROM jsonb_to_recordset($2::jsonb) AS r(batch_id uuid)
		) ORDER BY b.id FOR UPDATE`, tenantID, rowsJSON); err != nil {
		return err
	}
	_, err := tx.Exec(ctx, `SELECT p.uuid FROM public.passports p JOIN public.batches b ON b.id=p.batch_id
		WHERE b.tenant_id=$1 AND b.deleted_at IS NULL AND p.deleted_at IS NULL AND EXISTS (
			SELECT 1 FROM jsonb_to_recordset($2::jsonb) AS r(batch_id uuid, serial_number text, scope text)
			WHERE r.scope='pack' AND p.batch_id=r.batch_id AND p.serial_number=r.serial_number
		) ORDER BY p.uuid FOR SHARE OF p`, tenantID, rowsJSON)
	return err
}

func resolveLotImport(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, input []models.ComponentLotRow, rowsJSON string, result *models.ComponentLotImportResult) ([]resolvedLotRow, []resolvedLotRow, error) {
	rows, err := tx.Query(ctx, `
		SELECT r.line, b.batch_name, p.uuid, a.scope
		FROM jsonb_to_recordset($2::jsonb) AS r(line int, batch_id uuid, scope text, serial_number text, source text, part_number text, lot_code text)
		LEFT JOIN public.batches b ON b.tenant_id=$1 AND b.id=r.batch_id AND b.deleted_at IS NULL
		LEFT JOIN public.passports p ON r.scope='pack' AND p.batch_id=b.id AND p.serial_number=r.serial_number AND p.deleted_at IS NULL
		LEFT JOIN public.component_lots l ON l.tenant_id=b.tenant_id AND l.source=r.source AND l.part_number=r.part_number AND l.lot_code=r.lot_code
		LEFT JOIN public.lot_assignments a ON a.tenant_id=b.tenant_id AND a.batch_id=b.id AND a.lot_id=l.id
			AND ((r.scope='pack' AND a.passport_id=p.uuid) OR (r.scope<>'pack' AND a.passport_id IS NULL))
		ORDER BY r.line`, tenantID, rowsJSON)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	resolved := make([]resolvedLotRow, 0, len(input))
	var additions []resolvedLotRow
	seen := make(map[lotAssignmentKey]models.ComponentLotRow)
	for _, row := range input {
		if !rows.Next() {
			if err := rows.Err(); err != nil {
				return nil, nil, err
			}
			return nil, nil, errors.New("missing lot import row")
		}
		var line int
		var batchName, existingScope *string
		var packID *uuid.UUID
		if err := rows.Scan(&line, &batchName, &packID, &existingScope); err != nil {
			return nil, nil, err
		}
		if line != row.Line {
			return nil, nil, errors.New("unexpected lot import row")
		}
		preview := models.ComponentLotPreviewRow{ComponentLotRow: row, Status: "invalid"}
		if batchName != nil {
			preview.BatchName = *batchName
		}
		key := lotAssignmentKey{BatchID: row.BatchID, Source: row.Source, PartNumber: row.PartNumber, LotCode: row.LotCode}
		if packID != nil {
			key.PassportID = *packID
		}
		previous, repeated := seen[key]
		switch {
		case batchName == nil:
			result.Issues = append(result.Issues, models.ComponentLotIssue{Line: row.Line, Field: "batch_id", Message: "Batch not found in this workspace. Check the UUID."})
		case row.Scope == models.LotScopePack && packID == nil:
			result.Issues = append(result.Issues, models.ComponentLotIssue{Line: row.Line, Field: "serial_number", Message: "No pack with that serial in the specified batch. Check both identifiers."})
		case (repeated && previous.Scope != row.Scope) || (existingScope != nil && *existingScope != row.Scope):
			result.Issues = append(result.Issues, models.ComponentLotIssue{Line: row.Line, Field: "scope", Message: "This lot has conflicting batch scopes. Check whether the source confirms every pack."})
		default:
			assignment := resolvedLotRow{ComponentLotRow: row, PassportID: packID}
			resolved = append(resolved, assignment)
			seen[key] = row
			switch {
			case existingScope != nil:
				preview.Status = "existing"
				result.ExistingRows++
			case repeated:
				preview.Status = "duplicate"
				result.ExistingRows++
			default:
				preview.Status = "new"
				result.NewRows++
				additions = append(additions, assignment)
			}
		}
		result.Rows = append(result.Rows, preview)
	}
	if rows.Next() {
		return nil, nil, errors.New("unexpected lot import row")
	}
	return resolved, additions, rows.Err()
}

func saveLotImport(ctx context.Context, tx pgx.Tx, tenantID, actorID, importID uuid.UUID, input models.ComponentLotImportInput, additions []resolvedLotRow) error {
	data, err := json.Marshal(additions)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO public.component_lot_imports (id, tenant_id, actor_id, file_name, file_sha256)
		VALUES ($1,$2,$3,$4,$5)`, importID, tenantID, actorID, input.FileName, input.FileSHA256); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO public.component_lots (tenant_id, source, part_number, lot_code)
		SELECT DISTINCT $1::uuid, source, part_number, lot_code
		FROM jsonb_to_recordset($2::jsonb) AS r(source text, part_number text, lot_code text)
		ON CONFLICT (tenant_id, source, part_number, lot_code) DO NOTHING`, tenantID, string(data)); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.lot_assignments (tenant_id, lot_id, batch_id, passport_id, scope, import_id, source_row)
		SELECT l.tenant_id, l.id, r.batch_id, r.passport_id, r.scope, $2, r.line
		FROM jsonb_to_recordset($3::jsonb) AS r(line int, batch_id uuid, passport_id uuid, scope text, source text, part_number text, lot_code text)
		JOIN public.component_lots l ON l.tenant_id=$1 AND l.source=r.source AND l.part_number=r.part_number AND l.lot_code=r.lot_code`, tenantID, importID, string(data))
	return err
}
