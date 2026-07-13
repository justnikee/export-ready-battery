// Package ai provides the LLM gateway used by the textile-api AI service.
package ai

import (
	"context"
	"errors"
	"time"
)

// Task name constants
const (
	TaskTextileDatasheetParse = "textile_datasheet_parse"
)

// ValidationError defines a validation violation on a specific field.
type ValidationError struct {
	Field string `json:"field"`
	Msg   string `json:"message"`
}

func (v ValidationError) Error() string {
	return v.Field + ": " + v.Msg
}

// ── Error sentinels ────────────────────────────────────────────────────────────

var ErrNotConfigured = errors.New("ai: provider not configured")
var ErrAllProvidersFailed = errors.New("ai: all providers in the chain failed")
var ErrBudgetExhausted = errors.New("ai: daily request budget exhausted for provider")
var ErrCircuitOpen = errors.New("ai: circuit breaker open for provider")

// ── Request / Response types ───────────────────────────────────────────────────

type Request struct {
	SystemPrompt string
	UserPrompt   string
	MaxTokens    int
	Temperature  float64
	JSONMode     bool
	Task         string
	TextHash     string
}

type Response struct {
	Text     string
	Provider string
	Model    string
	Usage    Usage
	Latency  time.Duration
}

type Usage struct {
	TokensIn  int
	TokensOut int
	Total     int
}

// ── Provider interface ─────────────────────────────────────────────────────────

type Provider interface {
	Name() string
	Complete(ctx context.Context, req Request) (Response, error)
	IsConfigured() bool
}
