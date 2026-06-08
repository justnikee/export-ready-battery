package registry

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCircuitBreaker_InitialStateIsClosed(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 3, time.Hour, time.Hour)
	assert.Equal(t, "closed", cb.State())
}

func TestCircuitBreaker_SuccessResetsFailures(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 3, time.Hour, time.Hour)
	callCount := 0

	err := cb.Call(func() error {
		callCount++
		return errors.New("fail")
	})
	require.Error(t, err)
	assert.Equal(t, 1, callCount)
	assert.Equal(t, "closed", cb.State())

	// Success should reset failures
	err = cb.Call(func() error {
		callCount++
		return nil
	})
	require.NoError(t, err)
	assert.Equal(t, 2, callCount)
	assert.Equal(t, "closed", cb.State())
}

func TestCircuitBreaker_OpensAfterThreshold(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 3, time.Hour, time.Hour)
	failFn := func() error { return errors.New("boom") }

	// 2 failures — still closed
	_ = cb.Call(failFn)
	_ = cb.Call(failFn)
	assert.Equal(t, "closed", cb.State())

	// 3rd failure — opens
	err := cb.Call(failFn)
	require.Error(t, err)
	assert.Equal(t, "open", cb.State())
}

func TestCircuitBreaker_OpenRejectsImmediately(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 1, time.Hour, time.Hour)
	callCount := 0

	_ = cb.Call(func() error { callCount++; return errors.New("boom") })
	require.Equal(t, "open", cb.State())

	// Subsequent calls must be rejected without executing fn
	err := cb.Call(func() error { callCount++; return nil })
	require.Error(t, err)
	assert.Contains(t, err.Error(), "circuit breaker OPEN")
	assert.Equal(t, 1, callCount) // fn not called again
}

func TestCircuitBreaker_HalfOpenAfterRecovery(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 1, time.Millisecond, 10*time.Millisecond)

	_ = cb.Call(func() error { return errors.New("boom") })
	assert.Equal(t, "open", cb.State())

	// Wait for recovery window
	time.Sleep(20 * time.Millisecond)

	// Next call transitions to half-open
	_ = cb.Call(func() error { return nil })
	assert.Equal(t, "closed", cb.State())
}

func TestCircuitBreaker_HalfOpenFailureReopens(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 1, time.Millisecond, 10*time.Millisecond)

	_ = cb.Call(func() error { return errors.New("boom") })
	assert.Equal(t, "open", cb.State())

	time.Sleep(20 * time.Millisecond)

	// Half-open call fails → reopens
	err := cb.Call(func() error { return errors.New("boom again") })
	require.Error(t, err)
	assert.Equal(t, "open", cb.State())
}

func TestCircuitBreaker_HalfOpenSuccessCloses(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 2, time.Millisecond, 10*time.Millisecond)

	_ = cb.Call(func() error { return errors.New("boom") })
	_ = cb.Call(func() error { return errors.New("boom") })
	assert.Equal(t, "open", cb.State())

	time.Sleep(20 * time.Millisecond)

	// Half-open call succeeds → closes
	err := cb.Call(func() error { return nil })
	require.NoError(t, err)
	assert.Equal(t, "closed", cb.State())
}

func TestCircuitBreaker_ConcurrentSafety(t *testing.T) {
	cb := newCircuitBreakerWithConfig("test", 100, time.Hour, time.Hour)
	var wg sync.WaitGroup
	numGoroutines := 50
	numCalls := 20

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < numCalls; j++ {
				_ = cb.Call(func() error { return nil })
			}
		}()
	}
	wg.Wait()

	assert.Equal(t, "closed", cb.State())
	assert.Equal(t, 0, cb.failures)
}

func TestCircuitBreaker_OpenErrorMessage(t *testing.T) {
	cb := newCircuitBreakerWithConfig("bis", 1, time.Hour, 5*time.Minute)
	_ = cb.Call(func() error { return errors.New("timeout") })

	err := cb.Call(func() error { return nil })
	require.Error(t, err)
	assert.Contains(t, err.Error(), "bis")
	assert.Contains(t, err.Error(), "circuit breaker OPEN")
}
