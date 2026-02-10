package db

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps the pgx connection pool
type DB struct {
	Pool *pgxpool.Pool
}

// Connect establishes a connection pool to PostgreSQL
func Connect(databaseURL string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Connection pool settings (configurable via env vars)
	config.MaxConns = int32(getEnvInt("DB_MAX_CONNS", 4))
	config.MinConns = int32(getEnvInt("DB_MIN_CONNS", 1))
	config.MaxConnLifetime = time.Duration(getEnvInt("DB_MAX_CONN_LIFETIME_MIN", 60)) * time.Minute
	config.MaxConnIdleTime = time.Duration(getEnvInt("DB_MAX_CONN_IDLE_MIN", 30)) * time.Minute

	// CRITICAL: Disable statement caching for Supabase PgBouncer compatibility
	// PgBouncer in transaction mode doesn't support prepared statements
	// This fixes "prepared statement already exists" errors
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// Set search_path to public schema after each connection
	// This is required for Supabase session pooler
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		_, err := conn.Exec(ctx, "SET search_path TO public")
		return err
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close closes the database connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// Ping checks if the database is reachable
func (db *DB) Ping(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// getEnvInt reads an env var as int, returning defaultVal if missing or invalid.
func getEnvInt(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}
