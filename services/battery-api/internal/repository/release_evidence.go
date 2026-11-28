package repository

import (
	"context"
	"errors"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrReleaseEvidenceRevision = errors.New("a newer evidence revision exists")
	ErrReleaseEvidenceSample   = errors.New("each sampled serial must match exactly one pack in the batch")
)

// AppendReleaseEvidence writes metadata and exact pack links in one transaction.
func (r *Repository) AppendReleaseEvidence(ctx context.Context, tenantID uuid.UUID, evidence models.ReleaseEvidenceRevision, expected int) error {
	tx, err := r.db.Pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := lockBatchForWrite(ctx, tx, evidence.BatchID, tenantID); err != nil {
		return err
	}

	var latest int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(revision), 0) FROM public.release_evidence_revisions
		WHERE tenant_id=$1 AND batch_id=$2 AND source_system=$3 AND record_ref=$4
	`, tenantID, evidence.BatchID, evidence.SourceSystem, evidence.RecordRef).Scan(&latest); err != nil {
		return err
	}
	if latest != expected {
		return ErrReleaseEvidenceRevision
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO public.release_evidence_revisions (
			id, tenant_id, batch_id, source_system, record_ref, revision, source_revision,
			disposition, reviewer, recorded_on, scope, file_name, file_size, file_sha256, actor_id
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text::date,$11,$12,$13,$14,$15)
	`, evidence.ID, tenantID, evidence.BatchID, evidence.SourceSystem, evidence.RecordRef, latest+1,
		evidence.SourceRevision, evidence.Disposition, evidence.Reviewer, evidence.RecordedOn, evidence.Scope,
		evidence.FileName, evidence.FileSize, evidence.FileSHA256, evidence.ActorID); err != nil {
		return err
	}
	if evidence.Scope == "sampled_packs" {
		rows, err := tx.Exec(ctx, `
			INSERT INTO public.release_evidence_sampled_packs (revision_id, batch_id, passport_id, serial_number)
			SELECT $1, $2, (array_agg(p.uuid))[1], p.serial_number
			FROM public.passports AS p
			WHERE p.batch_id=$2 AND p.deleted_at IS NULL AND p.serial_number=ANY($3)
			GROUP BY p.serial_number HAVING COUNT(*)=1
		`, evidence.ID, evidence.BatchID, evidence.SampleSerials)
		if err != nil {
			return err
		}
		if len(evidence.SampleSerials) == 0 || rows.RowsAffected() != int64(len(evidence.SampleSerials)) {
			return ErrReleaseEvidenceSample
		}
	}
	return tx.Commit(ctx)
}

// ListReleaseEvidence verifies that the batch or pack belongs to the workspace,
// then lists the revisions applicable to that subject.
func (r *Repository) ListReleaseEvidence(ctx context.Context, tenantID, subjectID uuid.UUID, byPack bool, limit, offset int) ([]models.ReleaseEvidenceRevision, error) {
	batchID := subjectID
	var packID *uuid.UUID
	if byPack {
		packID = &subjectID
		if err := r.db.Pool.QueryRow(ctx, `
			SELECT b.id FROM public.passports p JOIN public.batches b ON b.id=p.batch_id
			WHERE p.uuid=$1 AND p.deleted_at IS NULL AND b.tenant_id=$2 AND b.deleted_at IS NULL
		`, subjectID, tenantID).Scan(&batchID); err != nil {
			return nil, err
		}
	} else if err := r.CheckReleaseEvidenceBatch(ctx, tenantID, batchID); err != nil {
		return nil, err
	}

	rows, err := r.db.Pool.Query(ctx, `
		SELECT e.id, e.batch_id, e.source_system, e.record_ref, e.revision,
			NOT EXISTS (
				SELECT 1 FROM public.release_evidence_revisions n WHERE n.tenant_id=e.tenant_id
					AND n.batch_id=e.batch_id AND n.source_system=e.source_system
					AND n.record_ref=e.record_ref AND n.revision>e.revision
			),
			e.source_revision, e.disposition, e.reviewer, to_char(e.recorded_on, 'YYYY-MM-DD'), e.scope,
			ARRAY(SELECT s.serial_number FROM public.release_evidence_sampled_packs s
				WHERE s.revision_id=e.id ORDER BY s.serial_number),
			e.file_name, e.file_size, e.actor_id, e.created_at
		FROM public.release_evidence_revisions e
		JOIN public.batches b ON b.id=e.batch_id AND b.tenant_id=e.tenant_id AND b.deleted_at IS NULL
		WHERE e.tenant_id=$1 AND e.batch_id=$2 AND ($3::uuid IS NULL OR e.scope='batch' OR EXISTS (
			SELECT 1 FROM public.release_evidence_sampled_packs s
			WHERE s.revision_id=e.id AND s.passport_id=$3
		))
		ORDER BY e.created_at DESC, e.id DESC
		LIMIT $4 OFFSET $5
	`, tenantID, batchID, packID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []models.ReleaseEvidenceRevision
	for rows.Next() {
		var item models.ReleaseEvidenceRevision
		if err := rows.Scan(&item.ID, &item.BatchID, &item.SourceSystem, &item.RecordRef, &item.Revision,
			&item.Current, &item.SourceRevision, &item.Disposition, &item.Reviewer, &item.RecordedOn, &item.Scope,
			&item.SampleSerials, &item.FileName, &item.FileSize, &item.ActorID, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetReleaseEvidenceDownload(ctx context.Context, tenantID, revisionID uuid.UUID) (models.ReleaseEvidenceRevision, error) {
	var item models.ReleaseEvidenceRevision
	err := r.db.Pool.QueryRow(ctx, `
		SELECT e.batch_id, e.file_name, e.file_size, e.file_sha256 FROM public.release_evidence_revisions e
		JOIN public.batches b ON b.id=e.batch_id AND b.tenant_id=e.tenant_id AND b.deleted_at IS NULL
		WHERE e.tenant_id=$1 AND e.id=$2
	`, tenantID, revisionID).Scan(&item.BatchID, &item.FileName, &item.FileSize, &item.FileSHA256)
	return item, err
}

func (r *Repository) CheckReleaseEvidenceBatch(ctx context.Context, tenantID, batchID uuid.UUID) error {
	var ownedID uuid.UUID
	return r.db.Pool.QueryRow(ctx, `
		SELECT id FROM public.batches WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL
	`, batchID, tenantID).Scan(&ownedID)
}
