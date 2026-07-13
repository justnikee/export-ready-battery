package ai

import (
	"sync"
	"time"
)

// CircuitBreaker implements a per-provider consecutive-failure circuit breaker.
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
func (cb *CircuitBreaker) Allow() error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if cb.openUntil.IsZero() {
		return nil // breaker closed
	}
	if time.Now().After(cb.openUntil) {
		cb.openUntil = time.Time{} // tentatively close
		return nil
	}
	return ErrCircuitOpen
}

// RecordSuccess records a successful provider response.
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures = 0
	cb.openUntil = time.Time{}
}

// RecordFailure records a failed provider response.
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures++
	if cb.failures >= cb.threshold {
		cb.openUntil = time.Now().Add(cb.cooldown)
	}
}

// IsOpen returns true if the circuit breaker is currently open.
func (cb *CircuitBreaker) IsOpen() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return !cb.openUntil.IsZero() && time.Now().Before(cb.openUntil)
}
