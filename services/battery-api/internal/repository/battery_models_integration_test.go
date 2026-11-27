package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/testutil"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

func TestBatteryModelsPostgres(t *testing.T) {
	r := modelTestRepository(t)
	ctx := t.Context()
	// Use the same query mode as the running API.
	cfg := r.db.Pool.Config()
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	cfg.ConnConfig.RuntimeParams["client_encoding"] = "UTF8"
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	require.NoError(t, err)
	t.Cleanup(pool.Close)
	r = New(&db.DB{Pool: pool})
	exec := func(query string, args ...any) {
		t.Helper()
		_, err := r.db.Pool.Exec(ctx, query, args...)
		require.NoError(t, err)
	}
	apply := func(direction string) {
		t.Helper()
		migration := filepath.Join("..", "db", "migrations", "000112_battery_model_revisions."+direction+".sql")
		sql, err := os.ReadFile(migration)
		require.NoError(t, err)
		exec(string(sql))
	}

	tenant, otherTenant, actor, batchID, passportID := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	exec(`INSERT INTO tenants(id) VALUES ($1),($2)`, tenant, otherTenant)
	exec(`INSERT INTO batches(id,tenant_id,batch_name,model_name,status,specs)
		VALUES ($1,$2,'Previously issued batch','Legacy model','ACTIVE','{"chemistry":"NMC","voltage":"48 V","capacity":"60 Ah"}')`, batchID, tenant)
	exec(`INSERT INTO passports(uuid,batch_id,serial_number,manufacture_date,status,created_at,batch_snapshot,state_of_health,battery_passport_id)
		VALUES ($1,$2,'LEGACY-001',now(),'CREATED',now(),'{"version":2,"specs":{"capacity":"55 Ah"}}',100,'LEGACY-PASSPORT')`, passportID, batchID)
	batchBefore, err := r.GetBatch(ctx, batchID, tenant)
	require.NoError(t, err)
	passportBefore, err := r.GetPassportWithSpecs(ctx, passportID)
	require.NoError(t, err)
	require.Equal(t, "ACTIVE", batchBefore.Status)
	require.JSONEq(t, `{"version":2,"specs":{"capacity":"55 Ah"}}`, string(passportBefore.Passport.BatchSnapshot))

	// Test reversible schema on a disposable upgrade, before saving model data.
	apply("up")
	apply("down")
	apply("up")

	model, err := r.CreateBatteryModel(ctx, tenant, "MK-48", "Utility pack")
	require.NoError(t, err)
	_, err = r.CreateBatteryModel(ctx, tenant, "mk-48", "Duplicate")
	require.ErrorIs(t, err, ErrBatteryModelCodeExists)
	otherModel, err := r.CreateBatteryModel(ctx, otherTenant, "MK-48", "Other workspace pack")
	require.NoError(t, err)
	list, total, err := r.ListBatteryModels(ctx, tenant, 50, 0)
	require.NoError(t, err)
	require.Equal(t, 1, total)
	require.Equal(t, []models.BatteryModel{model}, list)
	_, revisions, total, err := r.GetBatteryModel(ctx, tenant, model.ID, 20, 0)
	require.NoError(t, err)
	require.Equal(t, 1, total)
	require.Len(t, revisions, 1)
	draft := revisions[0]
	require.Equal(t, 1, draft.Version)
	require.Nil(t, draft.ReleasedAt)
	_, err = r.CreateBatteryModelDraft(ctx, tenant, model.ID)
	require.ErrorIs(t, err, ErrModelDraftExists)
	_, err = r.ReleaseBatteryModelDraft(ctx, tenant, model.ID, draft.ID, actor, draft.Version)
	require.ErrorIs(t, err, ErrModelDraftIncomplete)

	specs := models.ModelRevisionSpecs{
		Chemistry: "LFP", Voltage: "48 V", Capacity: "30 Ah", BatteryCategory: models.BatteryCategoryIndustrial,
		IntendedBOM: []models.IntendedBatteryPart{{PartNumber: "CELL-01", Name: "Cell", Quantity: 16}},
	}
	_, _, _, err = r.GetBatteryModel(ctx, otherTenant, model.ID, 20, 0)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, err = r.CreateBatteryModelDraft(ctx, otherTenant, model.ID)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, err = r.UpdateBatteryModelDraft(ctx, otherTenant, model.ID, draft.ID, draft.Version, specs)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, err = r.UpdateBatteryModelDraft(ctx, otherTenant, otherModel.ID, draft.ID, draft.Version, specs)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	_, err = r.ReleaseBatteryModelDraft(ctx, otherTenant, model.ID, draft.ID, actor, draft.Version)
	require.ErrorIs(t, err, pgx.ErrNoRows)
	saved, err := r.UpdateBatteryModelDraft(ctx, tenant, model.ID, draft.ID, draft.Version, specs)
	require.NoError(t, err)
	require.Equal(t, specs, saved.Specs)
	_, err = r.UpdateBatteryModelDraft(ctx, tenant, model.ID, draft.ID, draft.Version, specs)
	require.ErrorIs(t, err, ErrModelRevisionChanged)
	_, err = r.ReleaseBatteryModelDraft(ctx, tenant, model.ID, draft.ID, actor, draft.Version)
	require.ErrorIs(t, err, ErrModelRevisionChanged)

	// Release and a concurrent edit from the same version cannot both commit.
	type outcome struct {
		action string
		err    error
	}
	together := make(chan struct{})
	results := make(chan outcome, 2)
	revised := specs
	revised.Capacity = "32 Ah"
	go func() {
		<-together
		_, err := r.UpdateBatteryModelDraft(ctx, tenant, model.ID, draft.ID, saved.Version, revised)
		results <- outcome{"edit", err}
	}()
	go func() {
		<-together
		_, err := r.ReleaseBatteryModelDraft(ctx, tenant, model.ID, draft.ID, actor, saved.Version)
		results <- outcome{"release", err}
	}()
	close(together)
	winner := ""
	for range 2 {
		select {
		case result := <-results:
			if result.err == nil {
				require.Empty(t, winner, "edit and release both used the same version")
				winner = result.action
			} else {
				require.ErrorIs(t, result.err, ErrModelRevisionChanged)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("concurrent revision writes did not complete")
		}
	}
	require.NotEmpty(t, winner)
	if winner == "edit" {
		_, err := r.ReleaseBatteryModelDraft(ctx, tenant, model.ID, draft.ID, actor, saved.Version+1)
		require.NoError(t, err)
		specs = revised
	}
	_, releasedRevisions, _, err := r.GetBatteryModel(ctx, tenant, model.ID, 20, 0)
	require.NoError(t, err)
	require.Len(t, releasedRevisions, 1)
	released := releasedRevisions[0]
	require.NotNil(t, released.ReleasedAt)
	require.Equal(t, &actor, released.ReleasedBy)
	require.Equal(t, specs, released.Specs)
	_, err = r.UpdateBatteryModelDraft(ctx, tenant, model.ID, released.ID, released.Version, specs)
	require.ErrorIs(t, err, ErrModelRevisionChanged)
	_, err = r.ReleaseBatteryModelDraft(ctx, tenant, model.ID, released.ID, actor, released.Version)
	require.ErrorIs(t, err, ErrModelRevisionChanged)

	for _, statement := range []string{
		`UPDATE public.battery_model_revisions SET specs='{}' WHERE id=$1`,
		`UPDATE public.battery_model_revisions SET released_at=NULL, released_by=NULL WHERE id=$1`,
		`DELETE FROM public.battery_model_revisions WHERE id=$1`,
	} {
		_, err := r.db.Pool.Exec(ctx, statement, released.ID)
		var pgErr *pgconn.PgError
		require.True(t, errors.As(err, &pgErr) && pgErr.Code == "23514", "released revision accepted a direct write: %v", err)
	}
	_, err = r.db.Pool.Exec(ctx, `INSERT INTO public.battery_model_revisions(id,tenant_id,model_id,revision_number)
		VALUES ($1,$2,$3,2)`, uuid.New(), otherTenant, model.ID)
	var foreignKey *pgconn.PgError
	require.True(t, errors.As(err, &foreignKey) && foreignKey.Code == "23503")

	for range 2 {
		go func() {
			_, err := r.CreateBatteryModelDraft(ctx, tenant, model.ID)
			results <- outcome{"draft", err}
		}()
	}
	created := 0
	for range 2 {
		select {
		case result := <-results:
			if result.err == nil {
				created++
			} else {
				require.ErrorIs(t, result.err, ErrModelDraftExists)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("concurrent draft creation did not complete")
		}
	}
	require.Equal(t, 1, created)
	_, revisions, total, err = r.GetBatteryModel(ctx, tenant, model.ID, 20, 0)
	require.NoError(t, err)
	require.Equal(t, 2, total)
	require.Len(t, revisions, 2)
	next := revisions[0]
	require.Equal(t, 2, next.RevisionNumber)
	require.Nil(t, next.ReleasedAt)
	require.Equal(t, released.Specs, next.Specs)
	specs.Capacity = "35 Ah"
	_, err = r.UpdateBatteryModelDraft(ctx, tenant, model.ID, next.ID, next.Version, specs)
	require.NoError(t, err)
	_, history, _, err := r.GetBatteryModel(ctx, tenant, model.ID, 1, 1)
	require.NoError(t, err)
	require.Equal(t, []models.BatteryModelRevision{released}, history)

	batchAfter, err := r.GetBatch(ctx, batchID, tenant)
	require.NoError(t, err)
	require.True(t, reflect.DeepEqual(batchBefore, batchAfter), "legacy batch changed")
	passportAfter, err := r.GetPassportWithSpecs(ctx, passportID)
	require.NoError(t, err)
	before, err := json.Marshal(passportBefore)
	require.NoError(t, err)
	after, err := json.Marshal(passportAfter)
	require.NoError(t, err)
	require.JSONEq(t, string(before), string(after), "legacy passport projection changed")
	require.Equal(t, passportBefore.Passport.BatchSnapshot, passportAfter.Passport.BatchSnapshot)
}

func modelTestRepository(t *testing.T) *Repository {
	t.Helper()
	pool := testutil.OpenPostgres(t)
	// Minimal schema for the real production SQL, including the public projection.
	schema := `CREATE TABLE tenants(id uuid PRIMARY KEY,company_name text NOT NULL DEFAULT 'Test',created_at timestamptz DEFAULT now(),quota_balance int DEFAULT 20,onboarding_completed bool DEFAULT true,subscription_expires_at timestamptz,bonus_seats int DEFAULT 0,data_visibility jsonb DEFAULT '{}');
 CREATE TABLE battery_tenant_profiles(tenant_id uuid PRIMARY KEY);
 CREATE TABLE batches(id uuid PRIMARY KEY,tenant_id uuid REFERENCES tenants(id),batch_name text DEFAULT 'Test',model_name text DEFAULT '',specs jsonb DEFAULT '{}',created_at timestamptz DEFAULT now(),status text DEFAULT 'DRAFT',market_region text DEFAULT 'GLOBAL',pli_compliant bool DEFAULT false,domestic_value_add numeric DEFAULT 0,manufacturing_start_date timestamptz,manufacturing_end_date timestamptz,carbon_footprint_result jsonb,product_type text DEFAULT 'BATTERY',schema_version int DEFAULT 1,compliance_score numeric DEFAULT 0,compliance_gaps jsonb,ce_marking bool DEFAULT false,carbon_performance_class text DEFAULT '',removable_and_replaceable bool DEFAULT false,notified_body_number text DEFAULT '',declaration_of_conformity_path text DEFAULT '',gtin text DEFAULT '',deleted_at timestamptz);
 CREATE TABLE passports(uuid uuid PRIMARY KEY,batch_id uuid REFERENCES batches(id),serial_number text UNIQUE,manufacture_date timestamptz,status text,created_at timestamptz,batch_snapshot jsonb,current_owner_identifier text,ownership_history jsonb,state_of_health numeric,last_soh_update_timestamp timestamptz,csv_source_filename text,csv_row_index int,battery_passport_id text,deleted_at timestamptz);
 CREATE TABLE passport_events(id uuid PRIMARY KEY,passport_id uuid REFERENCES passports(uuid),event_type text,action text,actor text,actor_type text,actor_role text,actor_identifier text,source text,status_from text,status_to text,ip_address text,metadata jsonb,created_at timestamptz,hash text,previous_hash text);
 CREATE TABLE transactions(id uuid PRIMARY KEY,tenant_id uuid,description text,quota_change int,batch_id uuid,created_at timestamptz);`
	schema += `CREATE TABLE components(id uuid PRIMARY KEY, tenant_id uuid, batch_id uuid, parent_id uuid, hierarchy_level int, date_of_manufacture date, created_at timestamptz,updated_at timestamptz,ce_marking bool,hazardous_lead bool,hazardous_mercury bool,hazardous_cadmium bool);`
	for _, col := range strings.Fields("component_type name model_number serial_number lot_number manufacturer manufacturer_address manufacturer_email country_of_origin chemistry dimensions_mm bis_number") {
		schema += fmt.Sprintf("ALTER TABLE components ADD COLUMN %s text;", col)
	}
	for _, col := range strings.Fields("cobalt_pct lithium_pct nickel_pct manganese_pct graphite_pct lead_pct recycled_cobalt_pct recycled_lithium_pct recycled_nickel_pct recycled_lead_pct weight_kg") {
		schema += fmt.Sprintf("ALTER TABLE components ADD COLUMN %s numeric;", col)
	}
	for _, col := range strings.Fields("current_owner_email recycling_status recycler_epr_id") {
		schema += fmt.Sprintf("ALTER TABLE passports ADD COLUMN %s text;", col)
	}
	for _, col := range strings.Fields("shipped_at installed_at returned_at recycled_at recycling_date") {
		schema += fmt.Sprintf("ALTER TABLE passports ADD COLUMN %s timestamptz;", col)
	}
	schema += `ALTER TABLE passports ADD COLUMN repair_events jsonb, ADD COLUMN replacement_events jsonb, ADD COLUMN owner_id uuid;`
	for _, col := range strings.Fields("address logo_url support_email website product_type manufacturer_code plan_type plan_status") {
		schema += fmt.Sprintf("ALTER TABLE tenants ADD COLUMN %s text;", col)
	}
	for _, col := range strings.Fields("epr_registration_number bis_r_number iec_code eu_authorized_representative_name eu_authorized_representative_address eu_contact_email epr_certificate_path bis_certificate_path pli_certificate_path epr_status bis_status pli_status morth_manufacturer_code morth_factory_codes") {
		schema += fmt.Sprintf("ALTER TABLE battery_tenant_profiles ADD COLUMN %s text;", col)
	}
	if _, err := pool.Exec(context.Background(), schema); err != nil {
		t.Fatal(err)
	}
	return New(&db.DB{Pool: pool})
}
