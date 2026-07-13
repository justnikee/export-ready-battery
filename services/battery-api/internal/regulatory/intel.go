package regulatory

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// QueryRegulations performs semantic similarity search over regulatory corpus using Gemini embeddings and pgvector.
func QueryRegulations(ctx context.Context, gemini *ai.GeminiProvider, repo repository.RepositoryInterface, query string, limit int) ([]*models.AIRegulationChunk, error) {
	if query == "" {
		return nil, nil
	}

	if !gemini.IsConfigured() {
		// Fallback to text matching in offline mode
		return repo.QueryTextChunks(ctx, query, limit)
	}

	// Generate embedding for the search query
	queryEmbedding, err := gemini.Embed(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("regulatory: failed to generate query embedding: %w", err)
	}

	// Query pgvector similarity results from database
	chunks, err := repo.QuerySemanticChunks(ctx, queryEmbedding, limit)
	if err != nil {
		return nil, fmt.Errorf("regulatory: database similarity query failed: %w", err)
	}

	return chunks, nil
}
