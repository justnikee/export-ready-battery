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

	// Get all migration files
	files, err := os.ReadDir(filepath.Join("internal", "db", "migrations"))
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".sql" && len(file.Name()) > 7 && file.Name()[len(file.Name())-7:] == ".up.sql" {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}

	// files return sorted by name, ensuring 000001 runs before 000002

	for _, fileName := range migrationFiles {
		migrationPath := filepath.Join("internal", "db", "migrations", fileName)
		migrationSQL, err := os.ReadFile(migrationPath)
		if err != nil {
			log.Fatalf("Failed to read migration file %s: %v", fileName, err)
		}

		log.Printf("📄 Running migration: %s", fileName)

		// Execute the migration
		_, err = conn.Exec(ctx, string(migrationSQL))
		if err != nil {
			log.Printf("⚠️  Migration %s encountered error (might be already applied): %v", fileName, err)
			// Continue to next migration instead of crashing, as some might be non-idempotent but already applied
		} else {
			log.Printf("✅ Applied %s", fileName)
		}
	}

	fmt.Println("")
	fmt.Println("🎉 All migrations processed!")
}
