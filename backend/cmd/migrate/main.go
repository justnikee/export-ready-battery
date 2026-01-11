package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Connect to database
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	log.Println("✅ Connected to database")

	// Read the migration file
	migrationPath := filepath.Join("internal", "db", "migrations", "000004_add_dual_mode.up.sql")
	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	log.Printf("📄 Running migration: %s", migrationPath)

	// Execute the migration
	_, err = conn.Exec(ctx, string(migrationSQL))
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	fmt.Println("✅ Migration completed successfully!")
	fmt.Println("")
	fmt.Println("Schema changes applied:")
	fmt.Println("  - Created market_region ENUM (INDIA, EU, GLOBAL)")
	fmt.Println("  - Added columns to batches: market_region, pli_compliant, domestic_value_add, cell_source, materials")
	fmt.Println("  - Updated passports status constraint (added END_OF_LIFE)")
	fmt.Println("  - Created passport_events table with indexes")
}
