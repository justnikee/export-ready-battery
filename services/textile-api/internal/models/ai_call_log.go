package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AICallLogEntry represents an execution trace of a call made to the AI gateway.
type AICallLogEntry struct {
	ID             uuid.UUID       `json:"id"`
	Task           string          `json:"task"`
	TextHash       string          `json:"text_hash"`
	Provider       string          `json:"provider"`
	Model          string          `json:"model"`
	PromptVersion  int             `json:"prompt_version"`
	LatencyMs      int             `json:"latency_ms"`
	TokensIn       int             `json:"tokens_in"`
	TokensOut      int             `json:"tokens_out"`
	Outcome        string          `json:"outcome"` // 'success', 'failure', 'budget_exceeded', 'circuit_open', 'validation_failed'
	FieldsWonByLLM json.RawMessage `json:"fields_won_by_llm"`
	CreatedAt      time.Time       `json:"created_at"`
}
