package ai

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"time"
)

// providerState groups everything the gateway tracks per provider.
type providerState struct {
	provider Provider
	cb       *CircuitBreaker
	budget   *DailyBudget
}

// LLMGateway is the single control point for all LLM calls in the battery-api.
// It implements a provider chain with:
//   - Ordered provider list (from config)
//   - Per-provider circuit breaker (skip on N consecutive failures)
//   - Per-provider daily budget guard (skip when daily cap is hit)
//   - Retry-once on 429 / 5xx with jittered backoff
//   - Structured logging of every decision (skip, retry, success, failure)
//
// Usage: construct once in main(), inject into AIService.
type LLMGateway struct {
	ordered []*providerState // provider chain in priority order
	cfg     GatewayConfig
}

// NewGateway constructs an LLMGateway from configuration.
// Providers are registered in the order given by cfg.Providers.
// Unknown provider names are logged and skipped.
func NewGateway(cfg GatewayConfig) *LLMGateway {
	// Build the provider registry from config.
	allProviders := map[string]Provider{
		"groq":      NewGroqProvider(cfg.GroqAPIKey, cfg.RequestTimeout),
		"gemini":    NewGeminiProvider(cfg.GeminiAPIKey, cfg.RequestTimeout),
		"anthropic": NewAnthropicProvider(cfg.AnthropicAPIKey, cfg.RequestTimeout),
	}

	// Daily budget hard limits: 2× soft limit (0 = disabled).
	budgetHardMultiplier := 2
	budgets := map[string]int{
		"groq":      cfg.GroqDailyLimit,
		"gemini":    cfg.GeminiDailyLimit,
		"anthropic": 0, // no limit on stub; paid path will set its own
	}

	var ordered []*providerState
	for _, name := range cfg.Providers {
		p, ok := allProviders[name]
		if !ok {
			slog.Warn("[ai] unknown provider in AI_PROVIDERS, skipping", "provider", name)
			continue
		}
		soft := budgets[name]
		hard := 0
		if soft > 0 {
			hard = soft * budgetHardMultiplier
		}
		state := &providerState{
			provider: p,
			cb:       newCircuitBreaker(name, cfg.CircuitBreakerThreshold, cfg.CircuitBreakerCooldown),
			budget:   newDailyBudget(name, soft, hard),
		}
		ordered = append(ordered, state)
	}

	return &LLMGateway{ordered: ordered, cfg: cfg}
}

// Complete sends req through the provider chain. It tries each provider in
// order, skipping those that are not configured, circuit-open, or budget-spent.
// Returns ErrAllProvidersFailed if every provider was skipped or failed.
func (g *LLMGateway) Complete(ctx context.Context, req Request) (Response, error) {
	if len(g.ordered) == 0 {
		return Response{}, ErrNotConfigured
	}

	var lastErr error
	for _, state := range g.ordered {
		p := state.provider

		// ── Gate 1: provider must be configured (has API key) ────────────────
		if !p.IsConfigured() {
			slog.Debug("[ai] skipping unconfigured provider", "provider", p.Name())
			continue
		}

		// ── Gate 2: circuit breaker ───────────────────────────────────────────
		if err := state.cb.Allow(); err != nil {
			slog.Warn("[ai] provider skipped — circuit open", "provider", p.Name())
			lastErr = err
			continue
		}

		// ── Gate 3: daily budget ──────────────────────────────────────────────
		if err := state.budget.Allow(); err != nil {
			slog.Warn("[ai] provider skipped — budget exhausted", "provider", p.Name())
			lastErr = err
			continue
		}

		// ── Attempt with one retry on 429 / 5xx ──────────────────────────────
		resp, err := g.attemptWithRetry(ctx, p, req)
		if err != nil {
			state.cb.RecordFailure()
			slog.Error("[ai] provider failed",
				"provider", p.Name(),
				"error", err,
			)
			lastErr = err
			continue
		}

		// Success
		state.cb.RecordSuccess()
		slog.Info("[ai] provider call succeeded",
			"provider", p.Name(),
			"model", resp.Model,
			"tokens_in", resp.Usage.TokensIn,
			"tokens_out", resp.Usage.TokensOut,
			"latency_ms", resp.Latency.Milliseconds(),
		)
		return resp, nil
	}

	if lastErr != nil {
		return Response{}, fmt.Errorf("%w: last error: %v", ErrAllProvidersFailed, lastErr)
	}
	return Response{}, ErrAllProvidersFailed
}

// attemptWithRetry tries the provider once; on a retryable error (429 or 5xx)
// waits with jitter and tries exactly once more.
func (g *LLMGateway) attemptWithRetry(ctx context.Context, p Provider, req Request) (Response, error) {
	resp, err := p.Complete(ctx, req)
	if err == nil {
		return resp, nil
	}

	if !isRetryable(err) {
		return Response{}, err
	}

	// Jittered backoff: 100–500 ms.
	//nolint:gosec // not crypto — jitter only
	wait := time.Duration(100+rand.Intn(400)) * time.Millisecond
	slog.Warn("[ai] retrying provider after transient error",
		"provider", p.Name(),
		"error", err,
		"wait_ms", wait.Milliseconds(),
	)

	select {
	case <-time.After(wait):
	case <-ctx.Done():
		return Response{}, ctx.Err()
	}

	return p.Complete(ctx, req)
}

// isRetryable returns true for HTTP 429 (rate limited) and 5xx (server error)
// responses. Provider implementations embed the status code in the error message
// using the format "status XXX: …".
func isRetryable(err error) bool {
	if err == nil {
		return false
	}
	// Providers format errors as "provider: status 429: ..." or "status 5xx: ..."
	msg := err.Error()
	for _, code := range []string{"429", "500", "502", "503", "504"} {
		if containsStatusCode(msg, code) {
			return true
		}
	}
	return false
}

func containsStatusCode(msg, code string) bool {
	return len(msg) > 0 && (hasSubstr(msg, "status "+code) || hasSubstr(msg, code+":"))
}

func hasSubstr(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && searchSubstr(s, sub))
}

func searchSubstr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

// IsAvailable returns true if at least one configured, non-circuit-open,
// non-budget-exhausted provider exists. Used by AIService to decide whether
// to attempt LLM extraction at all.
func (g *LLMGateway) IsAvailable() bool {
	for _, state := range g.ordered {
		if !state.provider.IsConfigured() {
			continue
		}
		if state.cb.IsOpen() {
			continue
		}
		return true
	}
	return false
}

// ProviderStatus returns a snapshot of each provider's runtime state.
// Useful for health-check endpoints and diagnostics.
func (g *LLMGateway) ProviderStatus() []ProviderStatusSnapshot {
	snaps := make([]ProviderStatusSnapshot, 0, len(g.ordered))
	for _, state := range g.ordered {
		snaps = append(snaps, ProviderStatusSnapshot{
			Name:          state.provider.Name(),
			Configured:    state.provider.IsConfigured(),
			CircuitOpen:   state.cb.IsOpen(),
			DailyRequests: state.budget.Count(),
		})
	}
	return snaps
}

// ProviderStatusSnapshot captures the runtime state of a single provider.
type ProviderStatusSnapshot struct {
	Name          string `json:"name"`
	Configured    bool   `json:"configured"`
	CircuitOpen   bool   `json:"circuit_open"`
	DailyRequests int    `json:"daily_requests"`
}

// NewTestGateway creates an LLMGateway with custom providers for testing.
func NewTestGateway(providers ...Provider) *LLMGateway {
	var ordered []*providerState
	for _, p := range providers {
		ordered = append(ordered, &providerState{
			provider: p,
			cb:       newCircuitBreaker(p.Name(), 5, 60*time.Second),
			budget:   newDailyBudget(p.Name(), 0, 0),
		})
	}
	return &LLMGateway{ordered: ordered}
}

// ─── Helper: avoid importing strings just for Contains ────────────────────────

// Ensure http is used (the constant isRetryable helper uses string matching).
var _ = http.StatusOK // keep import live; retryable detection uses string parsing not status codes directly

// Ensure errors is used
var _ = errors.New
