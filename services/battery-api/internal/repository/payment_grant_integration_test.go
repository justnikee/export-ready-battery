package repository

import (
	"context"
	"fmt"
	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// This fixture uses a disposable local PostgreSQL cluster and never reads DATABASE_URL.
func paymentGrantTestRepository(t *testing.T) *Repository {
	t.Helper()
	initdb, err := exec.LookPath("initdb")
	if err != nil {
		t.Skip("initdb unavailable")
	}
	pgctl, err := exec.LookPath("pg_ctl")
	if err != nil {
		t.Skip("pg_ctl unavailable")
	}
	dir, err := os.MkdirTemp("", "payment-grant-pg-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	data := filepath.Join(dir, "data")
	if out, err := exec.Command(initdb, "-D", data, "-A", "trust", "-U", "postgres", "--no-locale").CombinedOutput(); err != nil {
		t.Fatalf("initdb: %v %s", err, out)
	}
	if out, err := exec.Command(pgctl, "-D", data, "-l", filepath.Join(dir, "postgres.log"), "-o", fmt.Sprintf("-F -k %s -h ''", dir), "-w", "start").CombinedOutput(); err != nil {
		t.Fatalf("start postgres: %v %s", err, out)
	}
	t.Cleanup(func() { exec.Command(pgctl, "-D", data, "-m", "immediate", "-w", "stop").Run() })
	pool, err := pgxpool.New(context.Background(), fmt.Sprintf("host=%s user=postgres dbname=postgres sslmode=disable", dir))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	schema := `CREATE TABLE public.tenants(id uuid PRIMARY KEY,quota_balance int DEFAULT 0,bonus_seats int DEFAULT 0,plan_type text,plan_status text,subscription_expires_at timestamptz);
 CREATE TABLE public.transactions(id uuid PRIMARY KEY,tenant_id uuid,description text,quota_change int,payment_id text,created_at timestamptz);
 CREATE UNIQUE INDEX idx_transactions_payment_id ON public.transactions(payment_id) WHERE payment_id IS NOT NULL;`
	if _, err := pool.Exec(context.Background(), schema); err != nil {
		t.Fatal(err)
	}
	return New(&db.DB{Pool: pool})
}

func TestApplyPaymentGrantConcurrentAndRollback(t *testing.T) {
	r := paymentGrantTestRepository(t)
	ctx := context.Background()
	id := uuid.New()
	if _, err := r.db.Pool.Exec(ctx, `INSERT INTO tenants(id,quota_balance,plan_type,plan_status,subscription_expires_at) VALUES ($1,20,'STARTER','EXPIRED',NOW()-INTERVAL '1 day')`, id); err != nil {
		t.Fatal(err)
	}
	grant := PaymentGrant{TenantID: id, PaymentID: "pay_concurrent", PackageName: "Growth annual", QuotaUnits: 6000, PlanType: "GROWTH", BillingCycleDays: 365}
	results := make(chan PaymentGrantResult, 2)
	errs := make(chan error, 2)
	var wg sync.WaitGroup
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); v, e := r.ApplyPaymentGrant(ctx, grant); results <- v; errs <- e }()
	}
	wg.Wait()
	close(results)
	close(errs)
	for e := range errs {
		if e != nil {
			t.Fatal(e)
		}
	}
	applied := 0
	for v := range results {
		if v.Applied {
			applied++
		}
	}
	if applied != 1 {
		t.Fatalf("payment applied %d times", applied)
	}
	var balance, ledgerCount int
	var plan, status string
	var expires time.Time
	if err := r.db.Pool.QueryRow(ctx, `SELECT quota_balance,plan_type,plan_status,subscription_expires_at FROM tenants WHERE id=$1`, id).Scan(&balance, &plan, &status, &expires); err != nil {
		t.Fatal(err)
	}
	if err := r.db.Pool.QueryRow(ctx, `SELECT count(*) FROM transactions WHERE payment_id=$1`, grant.PaymentID).Scan(&ledgerCount); err != nil {
		t.Fatal(err)
	}
	if balance != 6020 || ledgerCount != 1 || plan != "GROWTH" || status != "ACTIVE" || expires.Before(time.Now().Add(364*24*time.Hour)) {
		t.Fatalf("bad fulfillment: balance=%d ledgers=%d plan=%s status=%s expiry=%s", balance, ledgerCount, plan, status, expires)
	}
	firstExpiry := expires
	grant.PaymentID = "pay_renewal"
	if renewed, err := r.ApplyPaymentGrant(ctx, grant); err != nil || !renewed.Applied {
		t.Fatalf("early renewal failed: %+v %v", renewed, err)
	}
	if err := r.db.Pool.QueryRow(ctx, `SELECT subscription_expires_at FROM tenants WHERE id=$1`, id).Scan(&expires); err != nil {
		t.Fatal(err)
	}
	if expires.Before(firstExpiry.Add(364 * 24 * time.Hour)) {
		t.Fatalf("early renewal discarded paid term: before=%s after=%s", firstExpiry, expires)
	}
	// A failed plan update must roll back both the ledger and credit grant.
	_, err := r.db.Pool.Exec(ctx, `ALTER TABLE tenants DROP COLUMN subscription_expires_at`)
	if err != nil {
		t.Fatal(err)
	}
	grant.PaymentID = "pay_rollback"
	if _, err = r.ApplyPaymentGrant(ctx, grant); err == nil {
		t.Fatal("expected plan update failure")
	}
	if err := r.db.Pool.QueryRow(ctx, `SELECT quota_balance FROM tenants WHERE id=$1`, id).Scan(&balance); err != nil {
		t.Fatal(err)
	}
	if err := r.db.Pool.QueryRow(ctx, `SELECT count(*) FROM transactions WHERE payment_id=$1`, grant.PaymentID).Scan(&ledgerCount); err != nil {
		t.Fatal(err)
	}
	if balance != 12020 || ledgerCount != 0 {
		t.Fatalf("partial fulfillment: balance=%d ledgers=%d", balance, ledgerCount)
	}
}
