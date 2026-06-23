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
	if err := godotenv.Load(); err != nil {
		fmt.Fprintln(os.Stderr, "warning: failed to load .env:", err)
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL not set")
		os.Exit(1)
	}

	sqlPath := "internal/db/schema_clean.sql"
	if len(os.Args) > 1 {
		sqlPath = os.Args[1]
	}

	sqlBytes, err := os.ReadFile(sqlPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to read %s: %v\n", sqlPath, err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "parse database URL: %v\n", err)
		os.Exit(1)
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	fmt.Printf("Applying %s...\n", sqlPath)
	_, err = conn.Exec(ctx, string(sqlBytes))
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to apply schema: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Schema applied successfully")
}
