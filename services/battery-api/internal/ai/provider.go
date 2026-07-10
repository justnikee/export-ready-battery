// Package ai provides the LLM gateway used by the battery-api AI service.
//
// Architecture:
//
//	AIService (services/) → LLMGateway → [Provider chain]
//	                                        ├── GroqProvider     (free, fast)
//	                                        ├── GeminiProvider   (free, generous quota)
//	                                        └── AnthropicProvider (stub, paid-path ready)
//
// The gateway owns: provider ordering, retry policy, circuit breaking, budget
// enforcement, and structured error wrapping. No AI HTTP calls exist anywhere
// else in the codebase.
package ai

import (
	"context"
	"errors"
	"time"
)

// ── Error sentinels ────────────────────────────────────────────────────────────

// ErrNotConfigured is returned by stub providers (e.g. Anthropic) and by the
// gateway when no providers are configured at all.
var ErrNotConfigured = errors.New("ai: provider not configured")

// ErrAllProvidersFailed is returned when every provider in the chain has been
// tried (including retries) and all failed. The caller should fall back to
// deterministic extraction.
var ErrAllProvidersFailed = errors.New("ai: all providers in the chain failed")

// ErrBudgetExhausted is returned when a provider's daily request budget is
// spent. The gateway skips that provider and advances to the next one.
var ErrBudgetExhausted = errors.New("ai: daily request budget exhausted for provider")

// ErrCircuitOpen is returned when a provider's circuit breaker is open
// (too many consecutive failures). The gateway skips that provider.
var ErrCircuitOpen = errors.New("ai: circuit breaker open for provider")

// ── Request / Response types ───────────────────────────────────────────────────

// Request is the canonical input to every provider. Providers translate this
// into their own wire format; callers never touch provider-specific types.
type Request struct {
	// SystemPrompt is sent as the "system" role message (or prepended to user
	// prompt for providers that don't support system messages).
	SystemPrompt string

	// UserPrompt is the main content sent to the model.
	UserPrompt string

	// MaxTokens is the maximum number of completion tokens to generate.
	// If 0, providers use their own default (typically 2048).
	MaxTokens int

	// Temperature controls randomness. 0.0 = deterministic, 1.0 = creative.
	// For structured extraction keep this at or below 0.15.
	Temperature float64

	// JSONMode hints to the provider that the response should be valid JSON.
	// Providers that support native JSON mode (Groq's `response_format`) will
	// use it; others receive the hint via the system prompt.
	JSONMode bool
}

// Response is the canonical output from a provider. Gateway callers use this
// to get the raw text and meta-information about the call.
type Response struct {
	// Text is the raw content from the model. Callers are responsible for
	// extracting and validating structured data from it.
	Text string

	// Provider is the name of the provider that produced this response
	// (e.g. "groq", "gemini"). Useful for logging and cache metadata.
	Provider string

	// Model is the specific model identifier used (e.g. "llama-3.3-70b-versatile").
	Model string

	// Usage records the token consumption of this call.
	Usage Usage

	// Latency is the wall-clock time the provider took to respond.
	Latency time.Duration
}

// Usage records token counts for a single provider call.
type Usage struct {
	TokensIn  int
	TokensOut int
	Total     int
}

// ── Provider interface ─────────────────────────────────────────────────────────

// Provider is the interface every LLM backend must implement. Adding a new
// provider means implementing this interface — no other files change.
type Provider interface {
	// Name returns the canonical short name of the provider (e.g. "groq").
	// Used as the map key in the gateway and in log/metric labels.
	Name() string

	// Complete sends the request to the provider and returns its response.
	// Implementations are responsible for their own HTTP call and parsing.
	// Errors should be wrapped with fmt.Errorf("provider %s: %w", name, err)
	// so gateway retries can inspect the underlying cause.
	Complete(ctx context.Context, req Request) (Response, error)

	// IsConfigured reports whether the provider has all required credentials
	// (API keys, etc.) set. The gateway skips un-configured providers instead
	// of returning an error, which allows graceful degradation when keys are
	// absent in dev environments.
	IsConfigured() bool
}
