package ai

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// DailyBudget tracks the number of requests made to a single provider today
// and enforces a configurable daily soft and hard limit.
//
// Design:
//   - Soft limit: gateway logs a warning but still sends the request.
//   - Hard limit: gateway skips the provider entirely (ErrBudgetExhausted).
//   - The counter resets automatically at UTC midnight.
//   - Phase 5 will replace this with a Postgres-backed call log so the count
//     survives restarts; the interface here stays the same.
//
// Thread-safe: all operations acquire a mutex.
type DailyBudget struct {
	mu        sync.Mutex
	provider  string
	softLimit int
	hardLimit int // typically 2× soft; 0 = no hard limit
	count     int
	resetAt   time.Time // next midnight UTC
}

// newDailyBudget creates a budget tracker for a single provider.
// softLimit is the warn threshold; hardLimit is the cut-off (0 = disabled).
func newDailyBudget(provider string, softLimit, hardLimit int) *DailyBudget {
	return &DailyBudget{
		provider:  provider,
		softLimit: softLimit,
		hardLimit: hardLimit,
		resetAt:   nextMidnightUTC(),
	}
}

// Allow checks the budget and increments the counter.
// Returns ErrBudgetExhausted when the hard limit is hit.
// Logs a warning when the soft limit is hit.
func (b *DailyBudget) Allow(ctx context.Context, getDailyCount func(ctx context.Context, provider string, since time.Time) (int, error)) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if getDailyCount != nil {
		since := time.Now().UTC().Truncate(24 * time.Hour)
		dbCount, err := getDailyCount(ctx, b.provider, since)
		if err != nil {
			slog.Error("[ai] failed to query daily count from postgres, falling back to in-memory count", "provider", b.provider, "error", err)
			b.maybeReset()
		} else {
			b.count = dbCount
		}
	} else {
		b.maybeReset()
	}

	// Hard cut-off
	if b.hardLimit > 0 && b.count >= b.hardLimit {
		return ErrBudgetExhausted
	}

	// Soft warning
	if b.softLimit > 0 && b.count == b.softLimit {
		slog.Warn("[ai] daily soft limit reached for provider",
			"provider", b.provider,
			"count", b.count,
			"soft_limit", b.softLimit,
		)
	}

	b.count++
	return nil
}

// Count returns the current request count for today (for health endpoints).
func (b *DailyBudget) Count() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.maybeReset()
	return b.count
}

// maybeReset resets the counter if the day has rolled over.
// Caller must hold b.mu.
func (b *DailyBudget) maybeReset() {
	if time.Now().UTC().After(b.resetAt) {
		b.count = 0
		b.resetAt = nextMidnightUTC()
	}
}

// nextMidnightUTC returns the next UTC midnight after now.
func nextMidnightUTC() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
}
