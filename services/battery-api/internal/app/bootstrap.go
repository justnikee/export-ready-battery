// Package app provides shared initialization logic used by all AnvayaLabs
// binary entry-points (cmd/server, cmd/worker, cmd/migrate, etc.).
//
// Every binary performs three identical boot steps before doing anything
// domain-specific:
//  1. Load the .env file so that environment variables are available.
//  2. Initialise the structured JSON logger (respects LOG_LEVEL env var).
//  3. Load typed application configuration from the environment.
//  4. Open the PostgreSQL connection pool.
//
// Centralising these steps here ensures consistent behaviour (same log format,
// same env-loading semantics, same connection options) and eliminates the risk
// of the two entry-points drifting apart.
package app

import (
	"fmt"
	"log/slog"

	"github.com/joho/godotenv"

	"github.com/anvayalabs/battery-api/internal/config"
	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/logger"
)

// Deps holds the shared infrastructure dependencies that every binary needs.
// Callers should defer Deps.Close() to ensure the database pool is returned.
type Deps struct {
	Config   *config.Config
	Database *db.DB
	Logger   *slog.Logger
}

// Close releases resources held by Deps. Safe to call even if Bootstrap
// returned an error.
func (d *Deps) Close() {
	if d.Database != nil {
		d.Database.Close()
	}
}

// Bootstrap performs the four shared initialisation steps and returns the
// populated Deps struct. On failure it returns a descriptive error so the
// caller can log it and exit cleanly rather than panicking.
func Bootstrap(serviceName string) (*Deps, error) {
	// 1. Load .env — non-fatal; production deployments inject vars directly.
	if err := godotenv.Overload(); err != nil {
		slog.Info("No .env file found, using system environment variables")
	} else {
		slog.Info("Loaded .env file (overriding system env vars)")
	}

	// 2. Initialise structured logger (reads LOG_LEVEL; defaults to INFO).
	logger.Init()
	log := logger.Logger.With("service", serviceName)
	log.Info("starting " + serviceName)

	// 3. Load typed configuration.
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("bootstrap: invalid configuration: %w", err)
	}

	// 4. Connect to PostgreSQL.
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("bootstrap: failed to connect to database: %w", err)
	}
	log.Info("connected to PostgreSQL database")

	return &Deps{
		Config:   cfg,
		Database: database,
		Logger:   log,
	}, nil
}
