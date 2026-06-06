package registry

import (
	"fmt"
	"sync"
	"time"
)

type cbState int

const (
	cbClosed cbState = iota
	cbOpen
	cbHalfOpen
)

// circuitBreaker prevents cascade failures when a registry is down.
type circuitBreaker struct {
	name      string
	state     cbState
	failures  int
	lastFailure time.Time
	threshold int
	timeout   time.Duration
	recovery  time.Duration
	mu        sync.RWMutex
}

func newCircuitBreaker(name string) *circuitBreaker {
	return &circuitBreaker{
		name:      name,
		state:     cbClosed,
		threshold: 5,
		timeout:   60 * time.Second,
		recovery:  5 * time.Minute,
	}
}

// Call executes fn if the circuit is closed or half-open.
// If the circuit is open, it returns an error immediately.
func (cb *circuitBreaker) Call(fn func() error) error {
	cb.mu.Lock()
	if cb.state == cbOpen {
		if time.Since(cb.lastFailure) > cb.recovery {
			cb.state = cbHalfOpen
		} else {
			cb.mu.Unlock()
			return fmt.Errorf("circuit breaker OPEN for %s (retry after %s)", cb.name, cb.recovery-time.Since(cb.lastFailure))
		}
	}
	cb.mu.Unlock()

	err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()
	if err != nil {
		cb.failures++
		cb.lastFailure = time.Now()
		if cb.failures >= cb.threshold {
			cb.state = cbOpen
		}
		return err
	}
	cb.failures = 0
	cb.state = cbClosed
	return nil
}

// State returns the current breaker state for observability.
func (cb *circuitBreaker) State() string {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	switch cb.state {
	case cbOpen:
		return "open"
	case cbHalfOpen:
		return "half_open"
	default:
		return "closed"
	}
}
