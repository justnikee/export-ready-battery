package ai

import (
	"sync"
	"time"
)

// CircuitBreaker implements a per-provider consecutive-failure circuit breaker.
//
// States:
//   - CLOSED  → normal operation; failures are counted
//   - OPEN    → provider is skipped; gateway treats this as ErrCircuitOpen
//   - half-open transition: after cooldown expires, one request is allowed through;
//     success closes the breaker, failure resets the cooldown
//
// Thread-safe: all operations acquire a mutex.
type CircuitBreaker struct {
	mu          sync.Mutex
	provider    string
	threshold   int           // consecutive failures before opening
	cooldown    time.Duration // how long to stay open
	failures    int           // current consecutive failure count
	openUntil   time.Time     // zero value = breaker is closed
}

// newCircuitBreaker creates a circuit breaker for the named provider.
func newCircuitBreaker(provider string, threshold int, cooldown time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		provider:  provider,
		threshold: threshold,
		cooldown:  cooldown,
	}
}

// Allow reports whether a request to this provider should be allowed through.
// Returns ErrCircuitOpen if the breaker is open and the cooldown hasn't expired.
func (cb *CircuitBreaker) Allow() error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if cb.openUntil.IsZero() {
		return nil // breaker closed
	}
	if time.Now().After(cb.openUntil) {
		// Cooldown expired — enter half-open: allow this one request through.
		// The breaker stays open until RecordSuccess or RecordFailure is called.
		cb.openUntil = time.Time{} // tentatively close
		return nil
	}
	return ErrCircuitOpen
}

// RecordSuccess records a successful provider response. Resets the failure
// counter and ensures the breaker is closed.
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures = 0
	cb.openUntil = time.Time{}
}

// RecordFailure records a failed provider response. If the failure count
// reaches the threshold, the breaker opens for the cooldown duration.
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures++
	if cb.failures >= cb.threshold {
		cb.openUntil = time.Now().Add(cb.cooldown)
	}
}

// IsOpen returns true if the circuit breaker is currently open.
// Useful for logging / health-check endpoints.
func (cb *CircuitBreaker) IsOpen() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return !cb.openUntil.IsZero() && time.Now().Before(cb.openUntil)
}
