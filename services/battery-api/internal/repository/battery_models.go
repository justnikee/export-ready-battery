package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrBatteryModelCodeExists = errors.New("a model with that code already exists")
	ErrModelDraftExists       = errors.New("this model already has a draft")
	ErrModelRevisionChanged   = errors.New("this revision was edited or released; reload before continuing")
	ErrModelDraftIncomplete   = errors.New("enter chemistry, nominal voltage, and rated capacity before releasing")
)

const batteryModelColumns = "id, code, name, created_at"
const batteryRevisionColumns = "id, model_id, revision_number, version, specs, created_at, updated_at, released_at, released_by"

func scanBatteryModel(row pgx.Row) (models.BatteryModel, error) {
	var model models.BatteryModel
	err := row.Scan(&model.ID, &model.Code, &model.Name, &model.CreatedAt)
	return model, err
}

func scanBatteryModelRevision(row pgx.Row) (models.BatteryModelRevision, error) {
	var revision models.BatteryModelRevision
	err := row.Scan(&revision.ID, &revision.ModelID, &revision.RevisionNumber, &revision.Version,
		&revision.Specs, &revision.CreatedAt, &revision.UpdatedAt, &revision.ReleasedAt, &revision.ReleasedBy)
	return revision, err
}

func modelConstraint(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == constraint
}

func (r *Repository) CreateBatteryModel(ctx context.Context, tenantID uuid.UUID, code, name string) (models.BatteryModel, error) {
	// The model and its initial draft are inserted together.
	model, err := scanBatteryModel(r.db.Pool.QueryRow(ctx, `
		WITH new_model AS (
			INSERT INTO public.battery_models (id, tenant_id, code, name) VALUES ($1, $2, $3, $4)
			RETURNING id, tenant_id, code, name, created_at
		), first_revision AS (
			INSERT INTO public.battery_model_revisions (id, tenant_id, model_id, revision_number)
			SELECT $5, tenant_id, id, 1 FROM new_model
		)
		SELECT `+batteryModelColumns+` FROM new_model`, uuid.New(), tenantID, code, name, uuid.New()))
	if modelConstraint(err, "battery_models_tenant_code_key") {
		return models.BatteryModel{}, ErrBatteryModelCodeExists
	}
	return model, err
}

func (r *Repository) ListBatteryModels(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]models.BatteryModel, int, error) {
	var total int
	if err := r.db.Pool.QueryRow(ctx, `SELECT count(*) FROM public.battery_models WHERE tenant_id=$1`, tenantID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.db.Pool.Query(ctx, `SELECT `+batteryModelColumns+`
		FROM public.battery_models WHERE tenant_id=$1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
		tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	items, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.BatteryModel, error) { return scanBatteryModel(row) })
	return items, total, err
}

func (r *Repository) GetBatteryModel(ctx context.Context, tenantID, modelID uuid.UUID, limit, offset int) (models.BatteryModel, []models.BatteryModelRevision, int, error) {
	model, err := scanBatteryModel(r.db.Pool.QueryRow(ctx, `SELECT `+batteryModelColumns+`
		FROM public.battery_models WHERE tenant_id=$1 AND id=$2`, tenantID, modelID))
	if err != nil {
		return model, nil, 0, err
	}
	var total int
	if err := r.db.Pool.QueryRow(ctx, `SELECT count(*) FROM public.battery_model_revisions WHERE tenant_id=$1 AND model_id=$2`,
		tenantID, modelID).Scan(&total); err != nil {
		return model, nil, 0, err
	}
	rows, err := r.db.Pool.Query(ctx, `SELECT `+batteryRevisionColumns+`
		FROM public.battery_model_revisions WHERE tenant_id=$1 AND model_id=$2 ORDER BY revision_number DESC LIMIT $3 OFFSET $4`,
		tenantID, modelID, limit, offset)
	if err != nil {
		return model, nil, 0, err
	}
	revisions, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.BatteryModelRevision, error) {
		return scanBatteryModelRevision(row)
	})
	return model, revisions, total, err
}

func (r *Repository) CreateBatteryModelDraft(ctx context.Context, tenantID, modelID uuid.UUID) (models.BatteryModelRevision, error) {
	// A new draft inherits the latest released definition. The unique revision
	// and partial draft indexes arbitrate concurrent create/release requests.
	revision, err := scanBatteryModelRevision(r.db.Pool.QueryRow(ctx, `
		INSERT INTO public.battery_model_revisions (id, tenant_id, model_id, revision_number, specs)
		SELECT $3, m.tenant_id, m.id, latest.revision_number+1, latest.specs
		FROM public.battery_models m
		JOIN LATERAL (
			SELECT revision_number, specs FROM public.battery_model_revisions
			WHERE tenant_id=m.tenant_id AND model_id=m.id AND released_at IS NOT NULL
			ORDER BY revision_number DESC LIMIT 1
		) latest ON TRUE
		WHERE m.tenant_id=$1 AND m.id=$2
		RETURNING `+batteryRevisionColumns, tenantID, modelID, uuid.New()))
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return models.BatteryModelRevision{}, ErrModelDraftExists
	}
	if errors.Is(err, pgx.ErrNoRows) {
		var id uuid.UUID
		err = r.db.Pool.QueryRow(ctx, `SELECT id FROM public.battery_models WHERE tenant_id=$1 AND id=$2`, tenantID, modelID).Scan(&id)
		if err == nil {
			err = ErrModelDraftExists
		}
	}
	return revision, err
}

func (r *Repository) UpdateBatteryModelDraft(ctx context.Context, tenantID, modelID, revisionID uuid.UUID, version int, specs models.ModelRevisionSpecs) (models.BatteryModelRevision, error) {
	// Pass JSON as text so the cast works with pgx simple protocol and poolers.
	specsJSON, err := json.Marshal(specs)
	if err != nil {
		return models.BatteryModelRevision{}, err
	}
	revision, err := scanBatteryModelRevision(r.db.Pool.QueryRow(ctx, `
		UPDATE public.battery_model_revisions SET specs=$5::jsonb, version=version+1, updated_at=now()
		WHERE tenant_id=$1 AND model_id=$2 AND id=$3 AND version=$4 AND released_at IS NULL
		RETURNING `+batteryRevisionColumns, tenantID, modelID, revisionID, version, string(specsJSON)))
	return revision, r.modelRevisionWriteError(ctx, tenantID, modelID, revisionID, version, err)
}

func (r *Repository) ReleaseBatteryModelDraft(ctx context.Context, tenantID, modelID, revisionID, actorID uuid.UUID, version int) (models.BatteryModelRevision, error) {
	revision, err := scanBatteryModelRevision(r.db.Pool.QueryRow(ctx, `
		UPDATE public.battery_model_revisions SET released_at=now(), released_by=$5, version=version+1, updated_at=now()
		WHERE tenant_id=$1 AND model_id=$2 AND id=$3 AND version=$4 AND released_at IS NULL
		AND specs->>'chemistry' <> '' AND specs->>'voltage' <> '' AND specs->>'capacity' <> ''
		RETURNING `+batteryRevisionColumns, tenantID, modelID, revisionID, version, actorID))
	return revision, r.modelRevisionWriteError(ctx, tenantID, modelID, revisionID, version, err)
}

func (r *Repository) modelRevisionWriteError(ctx context.Context, tenantID, modelID, revisionID uuid.UUID, version int, err error) error {
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	var sameDraft bool
	err = r.db.Pool.QueryRow(ctx, `SELECT version=$4 AND released_at IS NULL
		FROM public.battery_model_revisions WHERE tenant_id=$1 AND model_id=$2 AND id=$3`,
		tenantID, modelID, revisionID, version).Scan(&sameDraft)
	if err != nil {
		return err
	}
	if sameDraft {
		return ErrModelDraftIncomplete
	}
	return ErrModelRevisionChanged
}
