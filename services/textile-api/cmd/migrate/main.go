package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"

	"github.com/anvayalabs/textile-api/internal/db"
)

// expectedTables lists every table the application requires.
var expectedTables = []string{
	"tenants",
	"textile_tenant_profiles",
	"batches",
	"passports",
	"passport_events",
	"scan_events",
	"transactions",
	"trusted_domains",
	"reward_ledger",
	"batch_templates",
	"blog_posts",
	"export_jobs",
	"trusted_partners",
	"partner_codes",
	"partner_code_usage",
	"magic_link_tokens",
	"serial_sequences",
	"device_tokens",
	"passport_telemetry",
	"data_access_tokens",
	"carbon_factors",
	"epr_certificates",
	"api_keys",
	"api_key_usage",
	"soh_history",
}

// expectedColumns maps table → list of critical columns to verify.
var expectedColumns = []struct{ table, column string }{
	// tenants
	{"tenants", "company_name"},
	{"tenants", "email"},
	{"tenants", "manufacturer_code"},
	{"tenants", "data_visibility"},
	{"tenants", "oauth_provider"},
	{"tenants", "oauth_provider_id"},
	{"tenants", "onboarding_completed"},
	{"tenants", "refresh_token_jti"},
	{"tenants", "email_verified"},
	{"tenants", "email_verification_token"},
	{"tenants", "product_type"},

	// product profiles
	{"textile_tenant_profiles", "tenant_id"},
	{"textile_tenant_profiles", "facility_type"},
	{"textile_tenant_profiles", "supply_chain_tier"},
	{"textile_tenant_profiles", "primary_markets"},
	{"textile_tenant_profiles", "default_fiber_types"},
	{"textile_tenant_profiles", "certifications"},
	{"textile_tenant_profiles", "compliance_defaults"},

	// batches
	{"batches", "tenant_id"},
	{"batches", "batch_name"},
	{"batches", "product_type"},
	{"batches", "specs"},
	{"batches", "market_region"},
	{"batches", "pli_compliant"},
	{"batches", "domestic_value_add"},
	{"batches", "cell_source"},
	{"batches", "dva_source"},
	{"batches", "pli_certificate_url"},
	{"batches", "hsn_code"},
	{"batches", "bis_number"},
	{"batches", "epr_number"},
	{"batches", "carbon_footprint_result"},
	{"batches", "model_name"},
	{"batches", "audited_domestic_value_add"},

	// passports
	{"passports", "batch_id"},
	{"passports", "serial_number"},
	{"passports", "product_type"},
	{"passports", "status"},

	// passport_events
	{"passport_events", "passport_id"},
	{"passport_events", "event_type"},
	{"passport_events", "action"},
	{"passport_events", "actor_role"},

	// magic_link_tokens
	{"magic_link_tokens", "action"},
	{"batch_templates", "product_type"},
}

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("FAIL: DATABASE_URL not set")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	database, err := db.Connect(dbURL)
	if err != nil {
		fmt.Printf("FAIL connect: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()
	pool := database.Pool

	allGood := true
	tableOK := 0
	tableMissing := 0
	colOK := 0
	colMissing := 0

	// --- Migration version ---
	var version int
	var dirty bool
	err = pool.QueryRow(ctx,
		`SELECT version, dirty FROM schema_migrations LIMIT 1`).Scan(&version, &dirty)
	if err != nil {
		fmt.Printf("[WARN] could not read schema_migrations: %v\n", err)
	} else {
		status := "clean"
		if dirty {
			status = "DIRTY ⚠️"
		}
		fmt.Printf("Migration version: %d (%s)\n", version, status)
	}
	fmt.Println()

	// --- Check tables ---
	fmt.Println("=== Tables ===")
	for _, t := range expectedTables {
		var exists bool
		// Use pg_class as fallback — information_schema can miss tables via Supabase transaction pooler
		err = pool.QueryRow(ctx,
			`SELECT EXISTS(
				SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1
				UNION ALL
				SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=$1 AND c.relkind IN ('r','v','m')
			)`,
			t).Scan(&exists)
		if err != nil {
			fmt.Printf("  [ERROR]   table:%s (%v)\n", t, err)
			tableMissing++
			allGood = false
			continue
		}
		if exists {
			fmt.Printf("  [OK]      table:%s\n", t)
			tableOK++
		} else {
			fmt.Printf("  [MISSING] table:%s\n", t)
			tableMissing++
			allGood = false
		}
	}

	// --- Check columns ---
	fmt.Println("\n=== Critical Columns ===")
	for _, c := range expectedColumns {
		var exists bool
		// Use pg_attribute as fallback for Supabase pooler compatibility
		err = pool.QueryRow(ctx,
			`SELECT EXISTS(
				SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2
				UNION ALL
				SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
				WHERE n.nspname='public' AND c.relname=$1 AND a.attname=$2 AND a.attnum>0 AND NOT a.attisdropped
			)`,
			c.table, c.column).Scan(&exists)
		if err != nil {
			fmt.Printf("  [ERROR]   %s.%s (%v)\n", c.table, c.column, err)
			colMissing++
			allGood = false
			continue
		}
		if exists {
			fmt.Printf("  [OK]      %s.%s\n", c.table, c.column)
			colOK++
		} else {
			fmt.Printf("  [MISSING] %s.%s\n", c.table, c.column)
			colMissing++
			allGood = false
		}
	}

	// --- Summary ---
	fmt.Println("\n=== Summary ===")
	fmt.Printf("Tables:  %d OK, %d missing\n", tableOK, tableMissing)
	fmt.Printf("Columns: %d OK, %d missing\n", colOK, colMissing)

	if allGood {
		fmt.Println("\n✅ ALL CHECKS PASSED")
	} else {
		fmt.Println("\n❌ SOME CHECKS FAILED — run 'make migrate-up' to apply pending migrations")
		os.Exit(1)
	}
}
