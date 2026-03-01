package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("FAIL: DATABASE_URL not set")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Printf("FAIL connect: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)
	conn.Exec(ctx, "SET search_path TO public")

	migrations := []struct {
		name string
		sql  string
	}{
		{
			"030_add_oauth_support",
			`ALTER TABLE public.tenants ALTER COLUMN password_hash DROP NOT NULL;
			 ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
			 ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);
			 CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_oauth_provider_id
			     ON public.tenants (oauth_provider, oauth_provider_id)
			     WHERE oauth_provider IS NOT NULL;`,
		},
		{
			"035_add_morth_settings",
			`ALTER TABLE public.tenants 
			 ADD COLUMN IF NOT EXISTS morth_manufacturer_code VARCHAR(100),
			 ADD COLUMN IF NOT EXISTS morth_factory_codes TEXT;`,
		},
		{
			"036_add_data_visibility_settings",
			`ALTER TABLE public.tenants 
			 ADD COLUMN IF NOT EXISTS data_visibility JSONB NOT NULL DEFAULT '{}'::jsonb;`,
		},
	}

	for _, m := range migrations {
		fmt.Printf("Applying %s ... ", m.name)
		_, err := conn.Exec(ctx, m.sql)
		if err != nil {
			fmt.Printf("FAIL: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("OK")
	}

	// Verify
	fmt.Println("\nVerifying columns:")
	checks := []struct{ t, c string }{
		{"tenants", "morth_manufacturer_code"},
		{"tenants", "morth_factory_codes"},
		{"tenants", "data_visibility"},
	}
	for _, c := range checks {
		var exists bool
		conn.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2)`,
			c.t, c.c).Scan(&exists)
		if exists {
			fmt.Printf("[OK] %s.%s\n", c.t, c.c)
		} else {
			fmt.Printf("[MISSING] %s.%s\n", c.t, c.c)
		}
	}
}
