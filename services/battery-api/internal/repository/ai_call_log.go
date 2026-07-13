package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// LogAICall inserts a new call log entry into the ai_call_log table.
func (r *Repository) LogAICall(ctx context.Context, entry *models.AICallLogEntry) error {
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}
	if len(entry.FieldsWonByLLM) == 0 {
		entry.FieldsWonByLLM = json.RawMessage("[]")
	}

	query := `INSERT INTO public.ai_call_log
		(task, text_hash, provider, model, prompt_version, latency_ms, tokens_in, tokens_out, outcome, fields_won_by_llm, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id`

	err := r.db.Pool.QueryRow(ctx, query,
		entry.Task,
		entry.TextHash,
		entry.Provider,
		entry.Model,
		entry.PromptVersion,
		entry.LatencyMs,
		entry.TokensIn,
		entry.TokensOut,
		entry.Outcome,
		entry.FieldsWonByLLM,
		entry.CreatedAt,
	).Scan(&entry.ID)
	if err != nil {
		return fmt.Errorf("failed to log ai call: %w", err)
	}

	return nil
}

// GetDailyAICallCount queries the daily call count for a given provider since a specific timestamp.
func (r *Repository) GetDailyAICallCount(ctx context.Context, provider string, since time.Time) (int, error) {
	query := `SELECT COUNT(*) FROM public.ai_call_log
		WHERE provider = $1 AND created_at >= $2`

	var count int
	err := r.db.Pool.QueryRow(ctx, query, provider, since).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to query daily AI call count: %w", err)
	}

	return count, nil
}
