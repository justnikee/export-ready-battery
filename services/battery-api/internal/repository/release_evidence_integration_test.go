package repository

import (
	"os"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

func TestReleaseEvidencePostgres(t *testing.T) {
	r := modelTestRepository(t)
	ctx := t.Context()
	exec := func(query string, args ...any) {
		t.Helper()
		_, err := r.db.Pool.Exec(ctx, query, args...)
		require.NoError(t, err)
	}
	apply := func(name string) {
		t.Helper()
		sql, err := os.ReadFile("../db/migrations/" + name + ".sql")
		require.NoError(t, err)
		exec(string(sql))
	}
	apply("000113_component_lot_imports.up")
	apply("000114_release_evidence.up")
	apply("000114_release_evidence.down")
	apply("000114_release_evidence.up")

	tenant, outsider, actor := uuid.New(), uuid.New(), uuid.New()
	a, b, draft := uuid.New(), uuid.New(), uuid.New()
	a01, a02, a03, b01, b02 := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	exec(`INSERT INTO tenants(id) VALUES($1),($2)`, tenant, outsider)
	exec(`INSERT INTO batches(id,tenant_id,status) VALUES
		($1,$4,'ACTIVE'),($2,$4,'ACTIVE'),($3,$4,'DRAFT')`, a, b, draft, tenant)
	exec(`INSERT INTO passports(uuid,batch_id,serial_number) VALUES
		($1,$6,'A01'),($2,$6,'A02'),($3,$6,'A03'),($4,$7,'B01'),($5,$7,'B02')`, a01, a02, a03, b01, b02, a, b)
	first := models.ReleaseEvidenceRevision{
		ID: uuid.New(), BatchID: a, SourceSystem: "QA log", RecordRef: "QA-1",
		SourceRevision: "original", Reviewer: "Quality operator", Disposition: "Accepted",
		RecordedOn: "2026-11-25", Scope: "sampled_packs", SampleSerials: []string{"A01", "A02"},
		FileName: "first.pdf", FileSize: 42, FileSHA256: strings.Repeat("a", 64), ActorID: actor,
	}
	require.NoError(t, r.AppendReleaseEvidence(ctx, tenant, first, 0))

	invalid := first
	invalid.ID = uuid.New()
	invalid.SampleSerials = []string{"A01", "B01"}
	require.ErrorIs(t, r.AppendReleaseEvidence(ctx, tenant, invalid, 1), ErrReleaseEvidenceSample)
	_, err := r.GetReleaseEvidenceDownload(ctx, tenant, invalid.ID)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	require.ErrorIs(t, r.AppendReleaseEvidence(ctx, outsider, invalid, 1), pgx.ErrNoRows)

	next := first
	next.ID = uuid.New()
	next.SourceRevision = "corrected"
	next.FileName = "second.pdf"
	next.SampleSerials = []string{"A02"}
	require.NoError(t, r.AppendReleaseEvidence(ctx, tenant, next, 1))
	require.ErrorIs(t, r.AppendReleaseEvidence(ctx, tenant, next, 1), ErrReleaseEvidenceRevision)

	whole := first
	whole.ID = uuid.New()
	whole.BatchID = b
	whole.Scope = "batch"
	whole.SampleSerials = nil
	require.NoError(t, r.AppendReleaseEvidence(ctx, tenant, whole, 0))

	list := func(id uuid.UUID, byPack bool) []models.ReleaseEvidenceRevision {
		t.Helper()
		items, err := r.ListReleaseEvidence(ctx, tenant, id, byPack, 26, 0)
		require.NoError(t, err)
		return items
	}
	history := list(a, false)
	require.Len(t, history, 2)
	require.Equal(t, next.ID, history[0].ID)
	require.True(t, history[0].Current)
	require.Equal(t, []string{"A02"}, history[0].SampleSerials)
	require.Equal(t, []string{"A01", "A02"}, history[1].SampleSerials)
	historical := list(a01, true)
	require.Len(t, historical, 1)
	require.Equal(t, first.ID, historical[0].ID)
	require.False(t, historical[0].Current)
	require.Len(t, list(a02, true), 2)
	require.Empty(t, list(a03, true))
	for _, id := range []uuid.UUID{b01, b02} {
		result := list(id, true)
		require.Len(t, result, 1)
		require.Equal(t, whole.ID, result[0].ID)
	}
	for _, byPack := range []bool{false, true} {
		subject := a
		if byPack {
			subject = a01
		}
		_, err = r.ListReleaseEvidence(ctx, outsider, subject, byPack, 26, 0)
		require.ErrorIs(t, err, pgx.ErrNoRows)
	}
	_, err = r.GetReleaseEvidenceDownload(ctx, outsider, first.ID)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	download, err := r.GetReleaseEvidenceDownload(ctx, tenant, first.ID)
	require.NoError(t, err)
	require.Equal(t, first.FileName, download.FileName)
	require.Equal(t, first.FileSHA256, download.FileSHA256)

	whole.ID = uuid.New()
	whole.BatchID = draft
	require.NoError(t, r.AppendReleaseEvidence(ctx, tenant, whole, 0))
	_, err = r.DeleteEmptyDraftBatch(ctx, draft, tenant)
	require.ErrorIs(t, err, ErrBatchHasReleaseEvidence)
}
