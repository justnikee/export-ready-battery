package db

import (
	"testing"
	"time"
)

func TestLoadPoolConfig_Defaults(t *testing.T) {
	t.Setenv("DB_MAX_CONNS", "")
	t.Setenv("DB_MIN_CONNS", "")
	t.Setenv("DB_MAX_CONN_LIFETIME_MIN", "")
	t.Setenv("DB_MAX_CONN_IDLE_MIN", "")
	// Clear may not unset if already set — Setenv to empty then Load uses default
	// when empty string: getEnvInt treats "" as missing → defaults. Good.

	// Explicitly unset
	t.Setenv("DB_MAX_CONNS", "")
	cfg := LoadPoolConfig()
	if cfg.MaxConns != DefaultMaxConns {
		t.Fatalf("MaxConns default: got %d want %d", cfg.MaxConns, DefaultMaxConns)
	}
	if cfg.MinConns != DefaultMinConns {
		t.Fatalf("MinConns default: got %d want %d", cfg.MinConns, DefaultMinConns)
	}
	if cfg.MaxConnLifetime != time.Duration(DefaultMaxConnLifetimeMin)*time.Minute {
		t.Fatalf("lifetime: %v", cfg.MaxConnLifetime)
	}
}

func TestLoadPoolConfig_FromEnv(t *testing.T) {
	t.Setenv("DB_MAX_CONNS", "25")
	t.Setenv("DB_MIN_CONNS", "5")
	t.Setenv("DB_MAX_CONN_LIFETIME_MIN", "45")
	t.Setenv("DB_MAX_CONN_IDLE_MIN", "10")

	cfg := LoadPoolConfig()
	if cfg.MaxConns != 25 || cfg.MinConns != 5 {
		t.Fatalf("got max=%d min=%d", cfg.MaxConns, cfg.MinConns)
	}
	if cfg.MaxConnLifetime != 45*time.Minute {
		t.Fatalf("lifetime %v", cfg.MaxConnLifetime)
	}
	if cfg.MaxConnIdleTime != 10*time.Minute {
		t.Fatalf("idle %v", cfg.MaxConnIdleTime)
	}
}

func TestLoadPoolConfig_Clamps(t *testing.T) {
	t.Setenv("DB_MAX_CONNS", "9999")
	t.Setenv("DB_MIN_CONNS", "50")
	cfg := LoadPoolConfig()
	if cfg.MaxConns != AbsoluteMaxConns {
		t.Fatalf("max should clamp to %d, got %d", AbsoluteMaxConns, cfg.MaxConns)
	}
	if cfg.MinConns != 50 {
		t.Fatalf("min 50 is valid under max 100, got %d", cfg.MinConns)
	}

	// min cannot exceed max
	t.Setenv("DB_MAX_CONNS", "10")
	t.Setenv("DB_MIN_CONNS", "50")
	cfg = LoadPoolConfig()
	if cfg.MaxConns != 10 || cfg.MinConns != 10 {
		t.Fatalf("min should clamp down to max: max=%d min=%d", cfg.MaxConns, cfg.MinConns)
	}

	t.Setenv("DB_MAX_CONNS", "0")
	t.Setenv("DB_MIN_CONNS", "-3")
	cfg = LoadPoolConfig()
	if cfg.MaxConns != 1 {
		t.Fatalf("max floor 1, got %d", cfg.MaxConns)
	}
	if cfg.MinConns != 0 {
		t.Fatalf("min floor 0, got %d", cfg.MinConns)
	}
}

func TestLoadPoolConfig_InvalidEnvFallsBack(t *testing.T) {
	t.Setenv("DB_MAX_CONNS", "not-a-number")
	cfg := LoadPoolConfig()
	if cfg.MaxConns != DefaultMaxConns {
		t.Fatalf("invalid env should use default %d, got %d", DefaultMaxConns, cfg.MaxConns)
	}
}

func TestDefaultMaxConnsAboveOldDefault(t *testing.T) {
	// Guard: never regress to the starvation default of 4 without an explicit decision.
	if DefaultMaxConns < 15 {
		t.Fatalf("DefaultMaxConns=%d is too low for API+workers (P-01)", DefaultMaxConns)
	}
}
