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
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Printf("FAIL: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)
	conn.Exec(ctx, "SET search_path TO public")

	allGood := true
	colChecks := []struct{ t, c string }{
		{"passport_events", "action"}, {"passport_events", "actor_role"},
		{"magic_link_tokens", "action"},
		{"batches", "hsn_code"}, {"batches", "bis_number"}, {"batches", "epr_number"},
		{"tenants", "oauth_provider"}, {"tenants", "oauth_provider_id"},
		{"batches", "carbon_footprint_result"}, {"tenants", "manufacturer_code"},
		{"passports", "cycle_count"}, {"passports", "last_temperature"},
		{"passports", "last_voltage"}, {"passports", "thermal_event_count"},
		{"passports", "last_telemetry_at"}, {"tenants", "onboarding_completed"},
		{"batches", "dva_source"}, {"batches", "pli_certificate_url"},
	}
	for _, c := range colChecks {
		var e bool
		conn.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2)`, c.t, c.c).Scan(&e)
		s := "OK"
		if !e {
			s = "MISSING"
			allGood = false
		}
		fmt.Printf("[%s] %s.%s\n", s, c.t, c.c)
	}
	for _, t := range []string{"carbon_factors", "serial_sequences", "device_tokens", "passport_telemetry"} {
		var e bool
		conn.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`, t).Scan(&e)
		s := "OK"
		if !e {
			s = "MISSING"
			allGood = false
		}
		fmt.Printf("[%s] table:%s\n", s, t)
	}
	if allGood {
		fmt.Println("\nALL CHECKS PASSED")
	} else {
		fmt.Println("\nSOME CHECKS FAILED")
	}
}
