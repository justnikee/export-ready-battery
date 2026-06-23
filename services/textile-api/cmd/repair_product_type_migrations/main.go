package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/anvayalabs/textile-api/internal/db"

	"github.com/joho/godotenv"
)

type migrationFile struct {
	version int
	name    string
}

var pendingMigrations = []migrationFile{
	{version: 47, name: "000047_create_audit_chain_alerts.up.sql"},
	{version: 48, name: "000048_create_passport_documents.up.sql"},
	{version: 49, name: "000049_magic_link_otp.up.sql"},
	{version: 50, name: "000050_fix_audit_chain_alerts_fk.up.sql"},
	{version: 51, name: "000051_add_missing_indexes.up.sql"},
	{version: 52, name: "000052_add_tenant_product_type.up.sql"},
	{version: 53, name: "000053_add_batch_template_product_type.up.sql"},
}

func loadEnv() {
	godotenv.Load("../../.env")
	godotenv.Load("../.env")
	godotenv.Load(".env")
}

func migrationPath(name string) (string, error) {
	candidates := []string{
		filepath.Join("internal", "db", "migrations", name),
		filepath.Join("backend", "internal", "db", "migrations", name),
		filepath.Join("..", "..", "internal", "db", "migrations", name),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("migration file not found: %s", name)
}

func queryExists(ctx context.Context, database *db.DB, query string) (bool, error) {
	var exists bool
	err := database.Pool.QueryRow(ctx, query).Scan(&exists)
	return exists, err
}

func main() {
	loadEnv()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		fmt.Println("DATABASE_URL not set")
		os.Exit(1)
	}

	database, err := db.Connect(databaseURL)
	if err != nil {
		fmt.Printf("connect error: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	var version int
	var dirty bool
	if err := database.Pool.QueryRow(ctx, `SELECT version, dirty FROM public.schema_migrations LIMIT 1`).Scan(&version, &dirty); err != nil {
		fmt.Printf("schema_migrations read error: %v\n", err)
		os.Exit(1)
	}

	auditAlertsExists, err := queryExists(ctx, database, `SELECT EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'audit_chain_alerts'
	)`)
	if err != nil {
		fmt.Printf("audit_chain_alerts check error: %v\n", err)
		os.Exit(1)
	}

	tenantsProductTypeExists, err := queryExists(ctx, database, `SELECT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'product_type'
	)`)
	if err != nil {
		fmt.Printf("tenants.product_type check error: %v\n", err)
		os.Exit(1)
	}

	if !(version == 47 && dirty && !auditAlertsExists && !tenantsProductTypeExists) {
		fmt.Printf("refusing repair: unexpected migration state (version=%d dirty=%t audit_chain_alerts=%t tenants.product_type=%t)\n", version, dirty, auditAlertsExists, tenantsProductTypeExists)
		os.Exit(1)
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		fmt.Printf("begin tx error: %v\n", err)
		os.Exit(1)
	}
	defer tx.Rollback(ctx)

	for _, migration := range pendingMigrations {
		path, pathErr := migrationPath(migration.name)
		if pathErr != nil {
			fmt.Println(pathErr)
			os.Exit(1)
		}

		sqlBytes, readErr := os.ReadFile(path)
		if readErr != nil {
			fmt.Printf("read %s error: %v\n", migration.name, readErr)
			os.Exit(1)
		}

		fmt.Printf("Applying %s...\n", migration.name)
		if _, execErr := tx.Exec(ctx, string(sqlBytes)); execErr != nil {
			fmt.Printf("apply %s error: %v\n", migration.name, execErr)
			os.Exit(1)
		}
	}

	if _, err := tx.Exec(ctx, `TRUNCATE TABLE public.schema_migrations`); err != nil {
		fmt.Printf("truncate schema_migrations error: %v\n", err)
		os.Exit(1)
	}

	if _, err := tx.Exec(ctx, `INSERT INTO public.schema_migrations(version, dirty) VALUES ($1, $2)`, 53, false); err != nil {
		fmt.Printf("update schema_migrations error: %v\n", err)
		os.Exit(1)
	}

	if err := tx.Commit(ctx); err != nil {
		fmt.Printf("commit error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Repair complete: schema_migrations set to version 53 clean.")
}
