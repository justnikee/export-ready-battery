package repository

import (
	"crypto/sha256"
	"encoding/csv"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

func TestComponentLotImportPostgres(t *testing.T) {
	base := modelTestRepository(t)
	ctx := t.Context()
	config := base.db.Pool.Config()
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	config.ConnConfig.RuntimeParams["client_encoding"] = "UTF8"
	pool, err := pgxpool.NewWithConfig(ctx, config)
	require.NoError(t, err)
	t.Cleanup(pool.Close)
	r := New(&db.DB{Pool: pool})
	exec := func(query string, args ...any) {
		t.Helper()
		_, err := pool.Exec(ctx, query, args...)
		require.NoError(t, err)
	}
	exec(`ALTER TABLE passports DROP CONSTRAINT passports_serial_number_key;
		CREATE UNIQUE INDEX passports_batch_serial_key ON passports(batch_id, serial_number)`)
	apply := func(direction string) {
		t.Helper()
		sql, err := os.ReadFile("../db/migrations/000113_component_lot_imports." + direction + ".sql")
		require.NoError(t, err)
		exec(string(sql))
	}
	apply("up")
	apply("down")
	apply("up")

	tenant, otherTenant, actor := uuid.New(), uuid.New(), uuid.New()
	batch1 := uuid.MustParse("12000000-0000-4000-8000-000000000011")
	batch2 := uuid.MustParse("12000000-0000-4000-8000-000000000012")
	pack1, pack2, replacementPack, otherBatch := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	exec(`INSERT INTO tenants(id) VALUES ($1),($2)`, tenant, otherTenant)
	exec(`INSERT INTO batches (id, tenant_id, batch_name, status) VALUES ($1,$4,'Assembly 1','ACTIVE'), ($2,$4,'Assembly 2','DRAFT'), ($3,$5,'Other workspace','ACTIVE')`, batch1, batch2, otherBatch, tenant, otherTenant)
	exec(`INSERT INTO passports (uuid, batch_id, serial_number, batch_snapshot) VALUES
		($1,$3,'PACK-001','{"specs":{"capacity":"original"}}'), ($2,$4,'PACK-001',NULL), ($5,$4,'REPLACEABLE',NULL)`, pack1, pack2, batch1, batch2, replacementPack)
	data, err := os.ReadFile("../../../../apps/battery-web/public/templates/component-lots.csv")
	require.NoError(t, err)
	const header = "batch_id,scope,serial_number,source,part_number,lot_code\n"
	inputFor := func(content string) models.ComponentLotImportInput {
		t.Helper()
		records, err := csv.NewReader(strings.NewReader(content)).ReadAll()
		require.NoError(t, err)
		input := models.ComponentLotImportInput{FileName: "assembly.csv", FileSHA256: fmt.Sprintf("%x", sha256.Sum256([]byte(content)))}
		for i, row := range records[1:] {
			input.Rows = append(input.Rows, models.ComponentLotRow{Line: i + 2, BatchID: uuid.MustParse(row[0]), Scope: row[1], SerialNumber: row[2], Source: row[3], PartNumber: row[4], LotCode: row[5]})
		}
		return input
	}
	counts := func(lots, assignments, receipts int) {
		t.Helper()
		var l, a, i int
		require.NoError(t, pool.QueryRow(ctx, `SELECT (SELECT count(*) FROM component_lots), (SELECT count(*) FROM lot_assignments), (SELECT count(*) FROM component_lot_imports)`).Scan(&l, &a, &i))
		require.Equal(t, []int{lots, assignments, receipts}, []int{l, a, i})
	}
	valid := inputFor(string(data))
	invalid := inputFor(string(data) + fmt.Sprintf("%s,pack,UNKNOWN,SUPPLIER,CELL,0007\n%s,batch_unknown,,SUPPLIER,CELL,0007\n%s,batch_unknown,,ENCLOSURE-SUPPLIER-A,BOX-48V,0189\n", batch1, otherBatch, batch2))
	preview, err := r.ProcessComponentLotImport(ctx, tenant, actor, invalid)
	require.NoError(t, err)
	require.Empty(t, preview.Token)
	require.Equal(t, []models.ComponentLotIssue{
		{Line: 7, Field: "serial_number", Message: "No pack with that serial in the specified batch. Check both identifiers."},
		{Line: 8, Field: "batch_id", Message: "Batch not found in this workspace. Check the UUID."},
		{Line: 9, Field: "scope", Message: "This lot has conflicting batch scopes. Check whether the source confirms every pack."},
	}, preview.Issues)
	invalid.ExpectedToken = strings.Repeat("0", 64)
	blocked, err := r.ProcessComponentLotImport(ctx, tenant, actor, invalid)
	require.NoError(t, err)
	require.Equal(t, preview.Issues, blocked.Issues)
	counts(0, 0, 0)

	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, valid)
	require.NoError(t, err)
	require.Empty(t, preview.Issues)
	require.Len(t, preview.Token, 64)
	require.Equal(t, 5, preview.NewRows)
	require.Equal(t, "0007", preview.Rows[0].LotCode)
	require.Equal(t, "Assembly 1", preview.Rows[0].BatchName)
	require.Equal(t, "Assembly 2", preview.Rows[2].BatchName)
	counts(0, 0, 0)

	valid.ExpectedToken = preview.Token
	_, err = r.ProcessComponentLotImport(ctx, tenant, uuid.New(), valid)
	require.ErrorIs(t, err, ErrLotImportChanged)
	foreign, err := r.ProcessComponentLotImport(ctx, otherTenant, actor, valid)
	require.NoError(t, err)
	require.Len(t, foreign.Issues, 5)
	counts(0, 0, 0)

	// Two commits from the same preview submit concurrently. Exactly one saves.
	type outcome struct {
		result models.ComponentLotImportResult
		err    error
	}
	start := make(chan struct{})
	done := make(chan outcome, 2)
	for range 2 {
		go func() {
			<-start
			result, err := r.ProcessComponentLotImport(ctx, tenant, actor, valid)
			done <- outcome{result, err}
		}()
	}
	close(start)
	first, second := <-done, <-done
	require.NoError(t, first.err)
	require.NoError(t, second.err)
	require.NotNil(t, first.result.ImportID)
	require.Equal(t, first.result.ImportID, second.result.ImportID)
	require.Equal(t, 5, first.result.NewRows+second.result.NewRows)
	require.Equal(t, 5, first.result.ExistingRows+second.result.ExistingRows)
	counts(4, 5, 1)

	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, inputFor(string(data)))
	require.NoError(t, err)
	require.Equal(t, 0, preview.NewRows)
	require.Equal(t, 5, preview.ExistingRows)
	valid.ExpectedToken = preview.Token
	replay, err := r.ProcessComponentLotImport(ctx, tenant, actor, valid)
	require.NoError(t, err)
	require.Equal(t, first.result.ImportID, replay.ImportID)
	require.Equal(t, 0, replay.NewRows)
	counts(4, 5, 1)

	rows, err := pool.Query(ctx, `SELECT batch_id, passport_id, scope FROM lot_assignments ORDER BY source_row`)
	require.NoError(t, err)
	type assignment struct {
		batch uuid.UUID
		pack  *uuid.UUID
		scope string
	}
	assignments, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (assignment, error) {
		var a assignment
		err := row.Scan(&a.batch, &a.pack, &a.scope)
		return a, err
	})
	require.NoError(t, err)
	require.Equal(t, []assignment{
		{batch1, &pack1, models.LotScopePack}, {batch1, &pack1, models.LotScopePack},
		{batch2, &pack2, models.LotScopePack}, {batch2, nil, models.LotScopeBatchUnknown},
		{batch2, nil, models.LotScopeBatchAll},
	}, assignments)
	var sourceActor uuid.UUID
	var filename, checksum, capacity string
	require.NoError(t, pool.QueryRow(ctx, `SELECT actor_id,file_name,file_sha256 FROM component_lot_imports WHERE id=$1`, *replay.ImportID).Scan(&sourceActor, &filename, &checksum))
	require.Equal(t, actor, sourceActor)
	require.Equal(t, valid.FileName, filename)
	require.Equal(t, valid.FileSHA256, checksum)
	require.NoError(t, pool.QueryRow(ctx, `SELECT batch_snapshot->'specs'->>'capacity' FROM passports WHERE uuid=$1`, pack1).Scan(&capacity))
	require.Equal(t, "original", capacity)

	// A different file containing the same assignments only skips rows.
	semanticReplay := inputFor(strings.ReplaceAll(string(data), "\n", "\r\n"))
	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, semanticReplay)
	require.NoError(t, err)
	semanticReplay.ExpectedToken = preview.Token
	replay, err = r.ProcessComponentLotImport(ctx, tenant, actor, semanticReplay)
	require.NoError(t, err)
	require.Equal(t, 5, replay.ExistingRows)
	counts(4, 5, 1)

	conflict := inputFor(header + fmt.Sprintf("%s,batch_all,,BMS-SUPPLIER-A,BMS-48V,0145\n", batch2))
	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, conflict)
	require.NoError(t, err)
	require.Len(t, preview.Issues, 1)
	require.Equal(t, "scope", preview.Issues[0].Field)

	stale := inputFor(header + fmt.Sprintf("%s,pack,REPLACEABLE,PARTNER,CELL,0001\n", batch2))
	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, stale)
	require.NoError(t, err)
	stale.ExpectedToken = preview.Token
	exec(`UPDATE passports SET serial_number='REPLACED' WHERE uuid=$1`, replacementPack)
	exec(`INSERT INTO passports (uuid, batch_id, serial_number) VALUES ($1,$2,'REPLACEABLE')`, uuid.New(), batch2)
	_, err = r.ProcessComponentLotImport(ctx, tenant, actor, stale)
	require.ErrorIs(t, err, ErrLotImportChanged)
	counts(4, 5, 1)

	// A lot-only draft has traceability history and cannot be deleted.
	draft := uuid.New()
	exec(`INSERT INTO batches (id, tenant_id) VALUES ($1,$2)`, draft, tenant)
	draftFile := inputFor(header + fmt.Sprintf("%s,batch_unknown,,PARTNER,CELL,0001\n", draft))
	preview, err = r.ProcessComponentLotImport(ctx, tenant, actor, draftFile)
	require.NoError(t, err)
	draftFile.ExpectedToken = preview.Token
	_, err = r.ProcessComponentLotImport(ctx, tenant, actor, draftFile)
	require.NoError(t, err)
	_, err = r.DeleteEmptyDraftBatch(ctx, draft, tenant)
	require.ErrorIs(t, err, ErrBatchHasLotAssignments)
	_, err = pool.Exec(ctx, `UPDATE lot_assignments SET batch_id=$2 WHERE tenant_id=$1 AND batch_id=$3`, tenant, otherBatch, draft)
	var constraint *pgconn.PgError
	require.ErrorAs(t, err, &constraint)
	require.Equal(t, "lot_assignments_batch_fk", constraint.ConstraintName)
	counts(5, 6, 2)
}
