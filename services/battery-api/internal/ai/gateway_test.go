package ai

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ── Mock provider ──────────────────────────────────────────────────────────────

type mockProvider struct {
	name         string
	configured   bool
	response     Response
	err          error
	callCount    int
}

func (m *mockProvider) Name() string         { return m.name }
func (m *mockProvider) IsConfigured() bool   { return m.configured }
func (m *mockProvider) Complete(_ context.Context, _ Request) (Response, error) {
	m.callCount++
	return m.response, m.err
}

// newMockProvider returns a configured, always-succeeding mock.
func newMockProvider(name string) *mockProvider {
	return &mockProvider{
		name:       name,
		configured: true,
		response: Response{
			Text:     `{"model_name":"test"}`,
			Provider: name,
			Model:    "mock-model",
		},
	}
}

// ── Circuit breaker tests ──────────────────────────────────────────────────────

func TestCircuitBreaker_ClosedByDefault(t *testing.T) {
	cb := newCircuitBreaker("groq", 3, 60*time.Second)
	assert.NoError(t, cb.Allow())
	assert.False(t, cb.IsOpen())
}

func TestCircuitBreaker_OpensAfterThreshold(t *testing.T) {
	cb := newCircuitBreaker("groq", 3, 60*time.Second)
	cb.RecordFailure()
	cb.RecordFailure()
	assert.False(t, cb.IsOpen()) // not yet
	cb.RecordFailure()
	assert.True(t, cb.IsOpen())
	assert.ErrorIs(t, cb.Allow(), ErrCircuitOpen)
}

func TestCircuitBreaker_RecoveryAfterCooldown(t *testing.T) {
	// Use a very short cooldown so the test doesn't sleep.
	cb := newCircuitBreaker("groq", 2, 50*time.Millisecond)
	cb.RecordFailure()
	cb.RecordFailure()
	assert.True(t, cb.IsOpen())

	time.Sleep(60 * time.Millisecond)
	// After cooldown, breaker should allow through.
	assert.NoError(t, cb.Allow())
}

func TestCircuitBreaker_SuccessResetsFailures(t *testing.T) {
	cb := newCircuitBreaker("groq", 3, 60*time.Second)
	cb.RecordFailure()
	cb.RecordFailure()
	cb.RecordSuccess()
	cb.RecordFailure()
	cb.RecordFailure()
	// Only 2 failures since last success — should not open.
	assert.False(t, cb.IsOpen())
}

// ── Daily budget tests ─────────────────────────────────────────────────────────

func TestDailyBudget_AllowsUnderSoftLimit(t *testing.T) {
	b := newDailyBudget("groq", 100, 200)
	for i := 0; i < 99; i++ {
		require.NoError(t, b.Allow())
	}
	assert.Equal(t, 99, b.Count())
}

func TestDailyBudget_BlocksAtHardLimit(t *testing.T) {
	b := newDailyBudget("groq", 2, 4)
	for i := 0; i < 4; i++ {
		require.NoError(t, b.Allow())
	}
	err := b.Allow()
	assert.ErrorIs(t, err, ErrBudgetExhausted)
}

func TestDailyBudget_NoLimitWhenHardLimitZero(t *testing.T) {
	b := newDailyBudget("groq", 0, 0)
	for i := 0; i < 1000; i++ {
		require.NoError(t, b.Allow())
	}
}

// ── isRetryable tests ──────────────────────────────────────────────────────────

func TestIsRetryable(t *testing.T) {
	tests := []struct {
		err      error
		expected bool
	}{
		{errors.New("status 429: rate limited"), true},
		{errors.New("groq: status 500: internal server error"), true},
		{errors.New("groq: status 503: service unavailable"), true},
		{errors.New("status 400: bad request"), false},
		{errors.New("json: cannot unmarshal"), false},
		{nil, false},
	}
	for _, tc := range tests {
		assert.Equal(t, tc.expected, isRetryable(tc.err), "err: %v", tc.err)
	}
}

// ── Gateway chain tests ────────────────────────────────────────────────────────

func TestGateway_UsesFirstAvailableProvider(t *testing.T) {
	p := newMockProvider("groq")
	gw := gatewayWithProviders(p)

	resp, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	require.NoError(t, err)
	assert.Equal(t, "groq", resp.Provider)
	assert.Equal(t, 1, p.callCount)
}

func TestGateway_FallsBackToSecondProvider(t *testing.T) {
	p1 := newMockProvider("groq")
	p1.err = errors.New("status 500: server error") // first always fails
	p2 := newMockProvider("gemini")

	gw := gatewayWithProviders(p1, p2)

	resp, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	require.NoError(t, err)
	assert.Equal(t, "gemini", resp.Provider)
	// p1 called twice (original + 1 retry on 5xx)
	assert.Equal(t, 2, p1.callCount)
	assert.Equal(t, 1, p2.callCount)
}

func TestGateway_SkipsUnconfiguredProvider(t *testing.T) {
	p1 := &mockProvider{name: "groq", configured: false} // not configured
	p2 := newMockProvider("gemini")

	gw := gatewayWithProviders(p1, p2)

	resp, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	require.NoError(t, err)
	assert.Equal(t, "gemini", resp.Provider)
	assert.Equal(t, 0, p1.callCount) // never called
}

func TestGateway_ReturnsErrAllProvidersFailed(t *testing.T) {
	p1 := newMockProvider("groq")
	p1.err = errors.New("status 500: error")

	gw := gatewayWithProviders(p1)

	_, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	assert.ErrorIs(t, err, ErrAllProvidersFailed)
}

func TestGateway_ReturnsErrNotConfiguredWhenEmpty(t *testing.T) {
	gw := &LLMGateway{ordered: nil}
	_, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	assert.ErrorIs(t, err, ErrNotConfigured)
}

func TestGateway_SkipsCircuitOpenProvider(t *testing.T) {
	p1 := newMockProvider("groq")
	p2 := newMockProvider("gemini")

	gw := gatewayWithProviders(p1, p2)

	// Manually open p1's circuit breaker.
	gw.ordered[0].cb.RecordFailure()
	gw.ordered[0].cb.RecordFailure()
	gw.ordered[0].cb.RecordFailure()
	gw.ordered[0].cb.RecordFailure()
	gw.ordered[0].cb.RecordFailure() // default threshold = 5

	resp, err := gw.Complete(context.Background(), Request{UserPrompt: "test"})
	require.NoError(t, err)
	assert.Equal(t, "gemini", resp.Provider)
	assert.Equal(t, 0, p1.callCount) // skipped entirely
}

func TestGateway_IsAvailableReturnsFalseWhenNoProviders(t *testing.T) {
	gw := &LLMGateway{ordered: nil}
	assert.False(t, gw.IsAvailable())
}

func TestGateway_IsAvailableReturnsTrueWithConfiguredProvider(t *testing.T) {
	p := newMockProvider("groq")
	gw := gatewayWithProviders(p)
	assert.True(t, gw.IsAvailable())
}

func TestGateway_ProviderStatus(t *testing.T) {
	p1 := newMockProvider("groq")
	p2 := &mockProvider{name: "gemini", configured: false}
	gw := gatewayWithProviders(p1, p2)

	snaps := gw.ProviderStatus()
	require.Len(t, snaps, 2)
	assert.Equal(t, "groq", snaps[0].Name)
	assert.True(t, snaps[0].Configured)
	assert.False(t, snaps[0].CircuitOpen)
	assert.Equal(t, "gemini", snaps[1].Name)
	assert.False(t, snaps[1].Configured)
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// gatewayWithProviders builds a minimal LLMGateway backed by mock providers.
// Uses a high circuit breaker threshold so tests don't accidentally open it.
func gatewayWithProviders(providers ...Provider) *LLMGateway {
	cfg := GatewayConfig{
		CircuitBreakerThreshold: 5,
		CircuitBreakerCooldown:  60 * time.Second,
		GroqDailyLimit:          0, // unlimited in tests
		GeminiDailyLimit:        0,
	}
	var ordered []*providerState
	for _, p := range providers {
		soft := 0
		ordered = append(ordered, &providerState{
			provider: p,
			cb:       newCircuitBreaker(p.Name(), cfg.CircuitBreakerThreshold, cfg.CircuitBreakerCooldown),
			budget:   newDailyBudget(p.Name(), soft, 0),
		})
	}
	return &LLMGateway{ordered: ordered, cfg: cfg}
}
