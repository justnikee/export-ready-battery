package repository

import (
	"os"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

func TestTraceabilityPostgres(t *testing.T) {
	r := modelTestRepository(t)
	ctx := t.Context()
	exec := func(query string, args ...any) {
		t.Helper()
		_, err := r.db.Pool.Exec(ctx, query, args...)
		require.NoError(t, err)
	}
	exec(`ALTER TABLE passports DROP CONSTRAINT passports_serial_number_key;
		CREATE UNIQUE INDEX passports_batch_serial_key ON passports(batch_id, serial_number)`)
	sql, err := os.ReadFile("../db/migrations/000113_component_lot_imports.up.sql")
	require.NoError(t, err)
	exec(string(sql))

	tenant, foreignTenant := uuid.New(), uuid.New()
	a, b, empty, foreign, hidden := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	x, y, otherY, deleted, foreignPack, hiddenPack := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	lot, otherLot, hiddenLot := uuid.New(), uuid.New(), uuid.New()
	exec(`INSERT INTO tenants(id) VALUES ($1),($2)`, tenant, foreignTenant)
	exec(`INSERT INTO batches(id,tenant_id,batch_name,status,deleted_at) VALUES
		($1,$6,'Assembly A','ACTIVE',NULL),($2,$6,'Assembly B','DRAFT',NULL),
		($3,$6,'Assembly C','DRAFT',NULL),($4,$7,'Foreign batch','ACTIVE',NULL),($5,$6,'Deleted batch','ACTIVE',now())`, a, b, empty, foreign, hidden, tenant, foreignTenant)
	exec(`INSERT INTO passports(uuid,batch_id,serial_number,deleted_at) VALUES
		($1,$7,'PACK-001',NULL),($2,$8,'PACK-001',NULL),($3,$8,'PACK-002',NULL),($4,$8,'DELETED',now()),
		($5,$9,'PACK-001',NULL),($6,$10,'PACK-001',NULL)`, x, y, otherY, deleted, foreignPack, hiddenPack, a, b, foreign, hidden)
	exec(`INSERT INTO component_lots(id,tenant_id,source,part_number,lot_code) VALUES
		($1,$4,'Supplier A','CELL','0007'),($2,$4,'Supplier B','CASE','0007'),($3,$5,'Supplier A','CELL','0007')`, lot, otherLot, hiddenLot, tenant, foreignTenant)
	importID := uuid.New()
	exec(`INSERT INTO component_lot_imports(id,tenant_id,actor_id,file_name,file_sha256)
		VALUES ($1,$2,$3,'assembly.csv',repeat('a',64))`, importID, tenant, uuid.New())
	exec(`INSERT INTO lot_assignments(tenant_id,lot_id,batch_id,passport_id,scope,import_id,source_row) VALUES
		($1,$2,$4,$8,'pack',$11,2),($1,$2,$5,NULL,'batch_unknown',$11,3),($1,$2,$5,$9,'pack',$11,4),
		($1,$2,$6,NULL,'batch_all',$11,5),($1,$3,$4,NULL,'batch_all',$11,6),
		($1,$3,$5,$10,'pack',$11,7),($1,$2,$7,NULL,'batch_all',$11,8)`, tenant, lot, otherLot, a, b, empty, hidden, x, y, deleted, importID)

	packs, err := r.FindTracePacks(ctx, tenant, "PACK-001", 50, 0)
	require.NoError(t, err)
	require.Len(t, packs, 2)
	require.Equal(t, []uuid.UUID{x, y}, []uuid.UUID{packs[0].ID, packs[1].ID})
	packs, err = r.FindTracePacks(ctx, tenant, "PACK-001", 1, 1)
	require.NoError(t, err)
	require.Len(t, packs, 1)
	require.Equal(t, y, packs[0].ID)
	lots, err := r.FindTraceLots(ctx, tenant, "0007", 50, 0)
	require.NoError(t, err)
	require.Len(t, lots, 2)
	require.Equal(t, []uuid.UUID{lot, otherLot}, []uuid.UUID{lots[0].ID, lots[1].ID})

	_, impact, err := r.GetTraceLot(ctx, tenant, lot, 50, 0)
	require.NoError(t, err)
	require.Len(t, impact, 4)
	require.Equal(t, []int{2, 4, 3, 5}, []int{impact[0].Evidence.SourceRow, impact[1].Evidence.SourceRow, impact[2].Evidence.SourceRow, impact[3].Evidence.SourceRow})
	require.Equal(t, empty, impact[3].BatchID)
	require.Nil(t, impact[3].PackID)
	require.Nil(t, impact[3].Serial)
	for _, match := range impact[:3] {
		require.NotNil(t, match.PackID)
		pack, links, err := r.GetTracePack(ctx, tenant, *match.PackID, 50, 0)
		require.NoError(t, err)
		require.Equal(t, match.BatchID, pack.BatchID)
		require.NotEmpty(t, links)
		require.Equal(t, lot, links[0].Lot.ID)
		require.Equal(t, match.Evidence, links[0].Evidence)
		require.Equal(t, "assembly.csv", match.Evidence.FileName)
	}
	require.Equal(t, models.LotScopePack, impact[1].Evidence.Scope)
	require.Equal(t, models.LotScopeBatchUnknown, impact[2].Evidence.Scope)
	_, otherImpact, err := r.GetTraceLot(ctx, tenant, otherLot, 50, 0)
	require.NoError(t, err)
	require.Len(t, otherImpact, 1)
	require.Equal(t, &x, otherImpact[0].PackID)
	require.Equal(t, models.LotScopeBatchAll, otherImpact[0].Evidence.Scope)

	_, _, err = r.GetTracePack(ctx, tenant, foreignPack, 50, 0)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, _, err = r.GetTraceLot(ctx, tenant, hiddenLot, 50, 0)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, _, err = r.GetTracePack(ctx, tenant, deleted, 50, 0)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, _, err = r.GetTracePack(ctx, foreignTenant, x, 50, 0)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, links, err := r.GetTracePack(ctx, foreignTenant, foreignPack, 50, 0)
	require.NoError(t, err)
	require.Empty(t, links)
}
