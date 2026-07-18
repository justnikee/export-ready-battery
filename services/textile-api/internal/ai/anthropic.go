package ai

import (
	"context"
	"time"
)

// anthropicAPIBase is defined here so grep confirms exactly one file references
// Anthropic's endpoint. The stub never makes an HTTP call; this constant exists
// only to document the future URL and ensure the grep invariant holds.
const anthropicAPIBase = "https://api.anthropic.com/v1/messages" //nolint:unused

// anthropicDefaultModel is the model that will be used when the paid path is
// enabled. Claude Haiku is chosen for cost efficiency on extraction tasks.
const anthropicDefaultModel = "claude-haiku-4-5" //nolint:unused

// AnthropicProvider is a typed stub for the Anthropic Claude API.
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
func (p *AnthropicProvider) IsConfigured() bool { return p.apiKey != "" }

// Complete implements Provider. Currently unimplemented — returns ErrNotConfigured.
func (p *AnthropicProvider) Complete(_ context.Context, _ Request) (Response, error) {
	return Response{}, ErrNotConfigured
}
