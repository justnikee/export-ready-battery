// DANGER: This is a one-off manual migration script.
// It bypasses schema_migrations version tracking and should NOT be used
// as a standard migration runner. Use backend/cmd/migration_runner instead.
// Only run this if you know exactly why the normal migrator cannot be used.
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"anvayalabs-battery/internal/db"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../../.env")
	godotenv.Load("../.env")
	godotenv.Load(".env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("FAIL: DATABASE_URL not set")
		os.Exit(1)
	}

	database, err := db.Connect(dbURL)
	if err != nil {
		fmt.Printf("FAIL connect: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	sqlContent, err := os.ReadFile("../internal/db/migrations/000049_magic_link_otp.up.sql")
	if err != nil {
		fmt.Printf("FAIL read file: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Applying 000049_magic_link_otp.up.sql...")
	_, err = database.Pool.Exec(ctx, string(sqlContent))
	if err != nil {
		fmt.Printf("FAIL execute: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Migration applied successfully!")
}
