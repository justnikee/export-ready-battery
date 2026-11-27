package testutil

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// This fixture starts a disposable PostgreSQL cluster in a private temporary
// directory. It never reads DATABASE_URL or connects to an existing database.
func OpenPostgres(t *testing.T) *pgxpool.Pool {
	t.Helper()
	initdb, err := exec.LookPath("initdb")
	if err != nil {
		t.Skip("initdb unavailable: PostgreSQL integration tests require local PostgreSQL")
	}
	pgctl, err := exec.LookPath("pg_ctl")
	if err != nil {
		t.Skip("pg_ctl unavailable")
	}
	dir, err := os.MkdirTemp("", "anviora-pg-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	data := filepath.Join(dir, "data")
	if out, err := exec.Command(initdb, "-D", data, "-A", "trust", "-U", "postgres", "--no-locale").CombinedOutput(); err != nil {
		t.Fatalf("initdb: %v %s", err, out)
	}
	if out, err := exec.Command(pgctl, "-D", data, "-l", filepath.Join(dir, "postgres.log"), "-o", fmt.Sprintf("-F -k %s -h ''", dir), "-w", "start").CombinedOutput(); err != nil {
		log, _ := os.ReadFile(filepath.Join(dir, "postgres.log"))
		t.Fatalf("start private postgres: %v %s\n%s", err, out, log)
	}
	t.Cleanup(func() { exec.Command(pgctl, "-D", data, "-m", "immediate", "-w", "stop").Run() })
	pool, err := pgxpool.New(context.Background(), fmt.Sprintf("host=%s user=postgres dbname=postgres sslmode=disable", dir))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	return pool
}
