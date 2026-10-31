package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// This fixture starts a disposable PostgreSQL cluster in a private temporary
// directory. It never reads DATABASE_URL or connects to an existing database.
func issuanceTestRepository(t *testing.T) *Repository {
	t.Helper()
	initdb, err := exec.LookPath("initdb")
	if err != nil {
		t.Skip("initdb unavailable: PostgreSQL issuance integration tests require local PostgreSQL")
	}
	pgctl, err := exec.LookPath("pg_ctl")
	if err != nil {
		t.Skip("pg_ctl unavailable")
	}
	dir, err := os.MkdirTemp("", "issuance-pg-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	data := filepath.Join(dir, "data")
	if out, err := exec.Command(initdb, "-D", data, "-A", "trust", "-U", "postgres", "--no-locale").CombinedOutput(); err != nil {
		t.Fatalf("initdb: %v %s", err, out)
	}
	if out, err := exec.Command(pgctl, "-D", data, "-l", filepath.Join(dir, "postgres.log"), "-o", fmt.Sprintf("-F -k %s -h ''", dir), "-w", "start").CombinedOutput(); err != nil {
		t.Fatalf("start private postgres: %v %s", err, out)
	}
	t.Cleanup(func() { exec.Command(pgctl, "-D", data, "-m", "immediate", "-w", "stop").Run() })
	pool, err := pgxpool.New(context.Background(), fmt.Sprintf("host=%s user=postgres dbname=postgres sslmode=disable", dir))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
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

func TestIssuancePostgres(t *testing.T) {
	r := issuanceTestRepository(t)
	ctx := context.Background()
	seed := func() (uuid.UUID, uuid.UUID) {
		tenant, batch := uuid.New(), uuid.New()
		if _, err := r.db.Pool.Exec(ctx, `INSERT INTO tenants(id) VALUES ($1)`, tenant); err != nil {
			t.Fatal(err)
		}
		if _, err := r.db.Pool.Exec(ctx, `INSERT INTO batches(id,tenant_id,specs) VALUES ($1,$2,'{"capacity":"200"}')`, batch, tenant); err != nil {
			t.Fatal(err)
		}
		return tenant, batch
	}
	records := func(batch uuid.UUID) ([]*models.Passport, []*models.PassportEvent) {
		p := &models.Passport{UUID: uuid.New(), BatchID: batch, SerialNumber: uuid.NewString(), ManufactureDate: time.Now(), CreatedAt: time.Now(), Status: models.PassportStatusCreated, BatchSnapshot: json.RawMessage(`{"specs":{"capacity":"100"}}`)}
		e := &models.PassportEvent{ID: uuid.New(), PassportID: p.UUID, CreatedAt: time.Now(), Hash: "original-genesis-hash"}
		return []*models.Passport{p}, []*models.PassportEvent{e}
	}
	prepare := func(b *models.Batch, tenant *models.Tenant, _ []*ComponentTreeNode) (json.RawMessage, error) {
		return json.Marshal(map[string]any{"specs": b.Specs, "tenant": map[string]any{"company_name": tenant.CompanyName}})
	}
	assertState := func(tenant, batch uuid.UUID, balance, passports, ledger int, status string) {
		t.Helper()
		var gotBalance, gotCount, gotLedger int
		var gotStatus string
		err := r.db.Pool.QueryRow(ctx, `SELECT quota_balance,(SELECT count(*) FROM passports WHERE batch_id=$2),(SELECT count(*) FROM transactions WHERE batch_id=$2),(SELECT status FROM batches WHERE id=$2) FROM tenants WHERE id=$1`, tenant, batch).Scan(&gotBalance, &gotCount, &gotLedger, &gotStatus)
		if err != nil {
			t.Fatal(err)
		}
		if gotBalance != balance || gotCount != passports || gotLedger != ledger || gotStatus != status {
			t.Fatalf("state got %d/%d/%d/%s want %d/%d/%d/%s", gotBalance, gotCount, gotLedger, gotStatus, balance, passports, ledger, status)
		}
	}
	t.Run("concurrent activation charges once and freezes corrected draft", func(t *testing.T) {
		tenant, batch := seed()
		p, e := records(batch)
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "DRAFT", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		var wg sync.WaitGroup
		results := make(chan error, 2)
		start := make(chan struct{})
		for range 2 {
			wg.Add(1)
			go func() {
				defer wg.Done()
				<-start
				_, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare)
				results <- err
			}()
		}
		close(start)
		wg.Wait()
		close(results)
		success, conflicts := 0, 0
		for err := range results {
			if err == nil {
				success++
			} else if errors.Is(err, ErrIssuanceChanged) {
				conflicts++
			} else {
				t.Fatal(err)
			}
		}
		if success != 1 || conflicts != 1 {
			t.Fatalf("success=%d conflicts=%d", success, conflicts)
		}
		assertState(tenant, batch, 19, 1, 1, "ACTIVE")
		var capacity, hash string
		if err := r.db.Pool.QueryRow(ctx, `SELECT p.batch_snapshot->'specs'->>'capacity',e.hash FROM passports p JOIN passport_events e ON e.passport_id=p.uuid WHERE p.uuid=$1`, p[0].UUID).Scan(&capacity, &hash); err != nil {
			t.Fatal(err)
		}
		if _, err := r.db.Pool.Exec(ctx, `UPDATE tenants SET data_visibility='{"supply_chain":"REGULATOR"}' WHERE id=$1`, tenant); err != nil {
			t.Fatal(err)
		}
		public, err := r.GetPassportWithSpecs(ctx, p[0].UUID)
		if err != nil {
			t.Fatal(err)
		}
		if public.BatchStatus != "ACTIVE" || models.ParseDisplayConfig(public.Tenant.DataVisibility).IsFieldVisible("supply_chain", models.AccessTierPartner) {
			t.Fatal("public lookup lost stored visibility or publication status")
		}
		if capacity != "200" || hash != "original-genesis-hash" {
			t.Fatalf("snapshot=%s hash=%s", capacity, hash)
		}
		if _, err := r.ActivateBatchAtomic(ctx, batch, uuid.New(), prepare); err == nil {
			t.Fatal("foreign tenant activation allowed")
		}
	})
	t.Run("activation winning race rejects stale draft insertion", func(t *testing.T) {
		tenant, batch := seed()
		p, e := records(batch)
		entered, release := make(chan struct{}), make(chan struct{})
		done := make(chan error, 1)
		go func() {
			_, err := r.ActivateBatchAtomic(ctx, batch, tenant, func(b *models.Batch, ten *models.Tenant, tree []*ComponentTreeNode) (json.RawMessage, error) {
				close(entered)
				<-release
				return prepare(b, ten, tree)
			})
			done <- err
		}()
		<-entered
		inserted := make(chan error, 1)
		go func() { _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "DRAFT", p, e, prepare); inserted <- err }()
		close(release)
		if err := <-done; err != nil {
			t.Fatal(err)
		}
		if err := <-inserted; !errors.Is(err, ErrIssuanceChanged) {
			t.Fatalf("stale insert: %v", err)
		}
		assertState(tenant, batch, 20, 0, 1, "ACTIVE")
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "ACTIVE", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		assertState(tenant, batch, 19, 1, 2, "ACTIVE")
	})
	t.Run("insertion winning race is counted by activation", func(t *testing.T) {
		tenant, batch := seed()
		p, e := records(batch)
		tx, err := r.db.Pool.Begin(ctx)
		if err != nil {
			t.Fatal(err)
		}
		defer tx.Rollback(ctx)
		if _, err := insertPassportsTx(ctx, tx, batch, tenant, "DRAFT", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		done := make(chan error, 1)
		go func() { _, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare); done <- err }()
		if err := tx.Commit(ctx); err != nil {
			t.Fatal(err)
		}
		if err := <-done; err != nil {
			t.Fatal(err)
		}
		assertState(tenant, batch, 19, 1, 1, "ACTIVE")
	})
	t.Run("ledger failure rolls back activation and snapshot", func(t *testing.T) {
		tenant, batch := seed()
		p, e := records(batch)
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "DRAFT", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		_, err := r.db.Pool.Exec(ctx, `ALTER TABLE transactions ADD CONSTRAINT reject_test_batch CHECK (batch_id <> '`+batch.String()+`')`)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare); err == nil {
			t.Fatal("expected ledger failure")
		}
		assertState(tenant, batch, 20, 1, 0, "DRAFT")
		var provisional bool
		if err := r.db.Pool.QueryRow(ctx, `SELECT batch_snapshot IS NULL FROM passports WHERE uuid=$1`, p[0].UUID).Scan(&provisional); err != nil || !provisional {
			t.Fatalf("snapshot must stay provisional: %v", err)
		}
	})
	t.Run("duplicate insert and genesis failure roll back charge", func(t *testing.T) {
		tenant, batch := seed()
		if _, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare); err != nil {
			t.Fatal(err)
		}
		p, e := records(batch)
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "ACTIVE", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "ACTIVE", p, e, prepare); err == nil {
			t.Fatal("duplicate must fail")
		}
		p2, e2 := records(batch)
		e2[0].ID = e[0].ID
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "ACTIVE", p2, e2, prepare); err == nil {
			t.Fatal("duplicate event must fail")
		}
		assertState(tenant, batch, 19, 1, 2, "ACTIVE")
	})
	t.Run("archived and insufficient balance cannot activate", func(t *testing.T) {
		tenant, batch := seed()
		p, e := records(batch)
		if _, err := r.InsertPassportsAtomic(ctx, batch, tenant, "DRAFT", p, e, prepare); err != nil {
			t.Fatal(err)
		}
		r.db.Pool.Exec(ctx, `UPDATE tenants SET quota_balance=0 WHERE id=$1`, tenant)
		if _, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare); !errors.Is(err, ErrInsufficientQuota) {
			t.Fatalf("quota: %v", err)
		}
		assertState(tenant, batch, 0, 1, 0, "DRAFT")
		r.db.Pool.Exec(ctx, `UPDATE batches SET status='ARCHIVED' WHERE id=$1`, batch)
		if _, err := r.ActivateBatchAtomic(ctx, batch, tenant, prepare); !errors.Is(err, ErrIssuanceChanged) {
			t.Fatalf("archive: %v", err)
		}
		assertState(tenant, batch, 0, 1, 0, "ARCHIVED")
	})
}
