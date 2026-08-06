package db

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps the pgx connection pool
type DB struct {
	Pool *pgxpool.Pool
	// PoolConfig is the sizing applied at Connect (for diagnostics / tests).
	PoolConfig PoolConfig
}

// Connect establishes a connection pool to PostgreSQL with exponential backoff
// retry logic. It will attempt up to maxRetries (5) with an initial delay of
// 1 second, doubling each attempt.
//
// Pool size defaults (P-01): MaxConns=20, MinConns=2 — override with DB_MAX_CONNS /
// DB_MIN_CONNS. Size against your Supabase pooler limit across all instances.
func Connect(databaseURL string) (*DB, error) {
	const maxRetries = 5
	const initialDelay = 1 * time.Second

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	poolCfg := LoadPoolConfig()
	config.MaxConns = poolCfg.MaxConns
	config.MinConns = poolCfg.MinConns
	config.MaxConnLifetime = poolCfg.MaxConnLifetime
	config.MaxConnIdleTime = poolCfg.MaxConnIdleTime

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

	var pool *pgxpool.Pool
	delay := initialDelay

	for attempt := 1; attempt <= maxRetries; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)

		pool, err = pgxpool.NewWithConfig(ctx, config)
		if err == nil {
			// Verify connection with ping
			err = pool.Ping(ctx)
		}
		cancel()

		if err == nil {
			slog.Info("database pool ready",
				"max_conns", poolCfg.MaxConns,
				"min_conns", poolCfg.MinConns,
				"max_conn_lifetime", poolCfg.MaxConnLifetime.String(),
				"max_conn_idle", poolCfg.MaxConnIdleTime.String(),
			)
			return &DB{Pool: pool, PoolConfig: poolCfg}, nil
		}

		if attempt < maxRetries {
			fmt.Fprintf(os.Stderr, "database connection attempt %d/%d failed: %v; retrying in %v\n", attempt, maxRetries, err, delay)
			time.Sleep(delay)
			delay *= 2
		}
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
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

// PoolStats returns a snapshot of pool utilization (for health / ops).
func (db *DB) PoolStats() *pgxpool.Stat {
	if db == nil || db.Pool == nil {
		return nil
	}
	return db.Pool.Stat()
}
