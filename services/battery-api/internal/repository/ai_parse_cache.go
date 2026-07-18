package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/jackc/pgx/v5"
)

// GetAIParseCache retrieves a cached extraction result by (text_hash, prompt_version, task).
// Returns nil, nil when no cached entry exists (not an error — just a cache miss).
func (r *Repository) GetAIParseCache(ctx context.Context, textHash string, promptVersion int, task string) (*models.AIParseCacheEntry, error) {
	query := `SELECT text_hash, prompt_version, task, result, method, confidence, model, created_at
		FROM public.ai_parse_cache
		WHERE text_hash = $1 AND prompt_version = $2 AND task = $3`

	var entry models.AIParseCacheEntry
	err := r.db.Pool.QueryRow(ctx, query, textHash, promptVersion, task).Scan(
		&entry.TextHash,
		&entry.PromptVersion,
		&entry.Task,
		&entry.Result,
		&entry.Method,
		&entry.Confidence,
		&entry.Model,
		&entry.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // cache miss, not an error
		}
		return nil, fmt.Errorf("failed to query ai_parse_cache: %w", err)
	}
	return &entry, nil
}

// SetAIParseCache upserts a cached extraction result. On conflict (same PK), the
// existing row is kept — immutable entries should not change once written. The only
// reason a conflict arises is a race between two concurrent parses of the same doc;
// both produce identical results, so ignoring the second write is safe.
func (r *Repository) SetAIParseCache(ctx context.Context, entry *models.AIParseCacheEntry) error {
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}

	// Validate that Result is valid JSON before inserting.
	if !json.Valid(entry.Result) {
		return fmt.Errorf("ai_parse_cache: result is not valid JSON")
	}

	query := `INSERT INTO public.ai_parse_cache
		(text_hash, prompt_version, task, result, method, confidence, model, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (text_hash, prompt_version, task) DO NOTHING`

	_, err := r.db.Pool.Exec(ctx, query,
		entry.TextHash,
		entry.PromptVersion,
		entry.Task,
		entry.Result,
		entry.Method,
		entry.Confidence,
		entry.Model,
		entry.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert ai_parse_cache: %w", err)
	}
	return nil
}
