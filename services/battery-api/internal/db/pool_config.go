package db

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Default pool sizes for the battery-api process (HTTP + in-process workers).
// Previous default MaxConns=4 starved concurrent dashboard queries and
// background jobs under modest load (P-01).
//
// Supabase / PgBouncer math (set DB_MAX_CONNS so sum across instances fits):
//
//	instances × DB_MAX_CONNS  ≤  pooler max clients (often 15–60 on free/pro)
//
// Prefer transaction-mode pooler URL; this process disables prepared statements
// for that mode (see Connect).
const (
	DefaultMaxConns           = 20
	DefaultMinConns           = 2
	DefaultMaxConnLifetimeMin  = 60
	DefaultMaxConnIdleMin     = 30
	// Absolute clamps so a mis-set env cannot open hundreds of connections.
	AbsoluteMaxConns = 100
	AbsoluteMinConns = 0
)

// PoolConfig holds validated pgxpool sizing for one process.
type PoolConfig struct {
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
}

// LoadPoolConfig reads DB_* env vars with production-safe defaults (P-01).
func LoadPoolConfig() PoolConfig {
	maxConns := clampInt(getEnvInt("DB_MAX_CONNS", DefaultMaxConns), 1, AbsoluteMaxConns)
	minConns := clampInt(getEnvInt("DB_MIN_CONNS", DefaultMinConns), AbsoluteMinConns, maxConns)
	lifetimeMin := clampInt(getEnvInt("DB_MAX_CONN_LIFETIME_MIN", DefaultMaxConnLifetimeMin), 1, 24*60)
	idleMin := clampInt(getEnvInt("DB_MAX_CONN_IDLE_MIN", DefaultMaxConnIdleMin), 1, 24*60)

	return PoolConfig{
		MaxConns:        int32(maxConns),
		MinConns:        int32(minConns),
		MaxConnLifetime: time.Duration(lifetimeMin) * time.Minute,
		MaxConnIdleTime: time.Duration(idleMin) * time.Minute,
	}
}

// String is for startup logs.
func (c PoolConfig) String() string {
	return fmt.Sprintf(
		"max_conns=%d min_conns=%d max_lifetime=%s max_idle=%s",
		c.MaxConns, c.MinConns, c.MaxConnLifetime, c.MaxConnIdleTime,
	)
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

func clampInt(n, lo, hi int) int {
	if n < lo {
		return lo
	}
	if n > hi {
		return hi
	}
	return n
}
