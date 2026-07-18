package ai

import (
	"context"
	"time"
)

// anthropicAPIBase is defined here so grep confirms exactly one file references
// Anthropic's endpoint. The stub never makes an HTTP call; this constant exists
// only to document the future URL and ensure the grep invariant holds.
//
// When moving to paid tier (Phase 8), implement Complete() using this URL and
// the Messages API (POST /v1/messages).
const anthropicAPIBase = "https://api.anthropic.com/v1/messages" //nolint:unused

// anthropicDefaultModel is the model that will be used when the paid path is
// enabled. Claude Haiku is chosen for cost efficiency on extraction tasks.
const anthropicDefaultModel = "claude-haiku-4-5" //nolint:unused

// AnthropicProvider is a typed stub for the Anthropic Claude API.
// IsConfigured() returns false until ANTHROPIC_API_KEY is set, so the gateway
// never includes it in the chain during free-tier operation.
//
// To activate (Phase 8):
//  1. Set ANTHROPIC_API_KEY in env.
//  2. Add "anthropic" to AI_PROVIDERS.
//  3. Implement Complete() using the Messages API below.
//  4. Remove the unimplemented comment.
type AnthropicProvider struct {
	apiKey  string
	timeout time.Duration
}

// NewAnthropicProvider creates an AnthropicProvider stub.
func NewAnthropicProvider(apiKey string, timeout time.Duration) *AnthropicProvider {
	return &AnthropicProvider{apiKey: apiKey, timeout: timeout}
}

// Name implements Provider.
func (p *AnthropicProvider) Name() string { return "anthropic" }

// IsConfigured implements Provider. Returns false while ANTHROPIC_API_KEY is unset,
// causing the gateway to skip this provider entirely — no errors surfaced to callers.
func (p *AnthropicProvider) IsConfigured() bool { return p.apiKey != "" }

// Complete implements Provider. Currently unimplemented — returns ErrNotConfigured.
// Replace this body with a real implementation in Phase 8.
//
//nolint:unparam
func (p *AnthropicProvider) Complete(_ context.Context, _ Request) (Response, error) {
	// Phase 8: implement the Anthropic Messages API call here.
	// Reference: https://docs.anthropic.com/en/api/messages
	return Response{}, ErrNotConfigured
}
