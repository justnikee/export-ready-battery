package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/anvayalabs/battery-api/internal/models"
)

// SaveRegulationChunk inserts a chunk and its vector representation into pgvector table.
func (r *Repository) SaveRegulationChunk(ctx context.Context, chunk *models.AIRegulationChunk) error {
	const query = `
		INSERT INTO public.ai_regulation_chunks (source_doc, title, section, content, embedding)
		VALUES ($1, $2, $3, $4, $5)
	`
	embStr := formatVector(chunk.Embedding)
	_, err := r.db.Pool.Exec(ctx, query, chunk.SourceDoc, chunk.Title, chunk.Section, chunk.Content, embStr)
	if err != nil {
		return fmt.Errorf("repo: failed to save regulation chunk: %w", err)
	}
	return nil
}

// QuerySemanticChunks searches for regulation chunks using cosine similarity.
// Return chunks sorted by similarity (descending).
func (r *Repository) QuerySemanticChunks(ctx context.Context, queryEmbedding []float32, limit int) ([]*models.AIRegulationChunk, error) {
	const query = `
		SELECT id, source_doc, title, section, content, embedding::text, created_at
		FROM public.ai_regulation_chunks
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	embStr := formatVector(queryEmbedding)
	rows, err := r.db.Pool.Query(ctx, query, embStr, limit)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to query semantic chunks: %w", err)
	}
	defer rows.Close()

	var chunks []*models.AIRegulationChunk
	for rows.Next() {
		var chunk models.AIRegulationChunk
		var embText string
		err := rows.Scan(&chunk.ID, &chunk.SourceDoc, &chunk.Title, &chunk.Section, &chunk.Content, &embText, &chunk.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("repo: failed to scan chunk: %w", err)
		}
		chunk.Embedding, err = parseVectorString(embText)
		if err != nil {
			return nil, fmt.Errorf("repo: failed to parse vector embedding: %w", err)
		}
		chunks = append(chunks, &chunk)
	}
	return chunks, nil
}

func formatVector(v []float32) string {
	var sb strings.Builder
	sb.WriteByte('[')
	for i, f := range v {
		if i > 0 {
			sb.WriteByte(',')
		}
		sb.WriteString(strconv.FormatFloat(float64(f), 'f', -1, 32))
	}
	sb.WriteByte(']')
	return sb.String()
}

func parseVectorString(s string) ([]float32, error) {
	s = strings.TrimPrefix(s, "[")
	s = strings.TrimSuffix(s, "]")
	if s == "" {
		return nil, nil
	}
	parts := strings.Split(s, ",")
	res := make([]float32, len(parts))
	for i, p := range parts {
		val, err := strconv.ParseFloat(p, 32)
		if err != nil {
			return nil, fmt.Errorf("parse float %s: %w", p, err)
		}
		res[i] = float32(val)
	}
	return res, nil
}

// QueryTextChunks searches for regulation chunks using text matching (for offline/fallback scenarios).
func (r *Repository) QueryTextChunks(ctx context.Context, searchText string, limit int) ([]*models.AIRegulationChunk, error) {
	terms := strings.Fields(searchText)
	var conditions []string
	var args []interface{}
	for _, t := range terms {
		// skip small noise terms to avoid irrelevant matches
		if len(t) < 3 {
			continue
		}
		conditions = append(conditions, fmt.Sprintf("content ILIKE $%d", len(conditions)+1))
		args = append(args, "%"+t+"%")
	}

	var query string
	if len(conditions) == 0 {
		query = `
			SELECT id, source_doc, title, section, content, embedding::text, created_at
			FROM public.ai_regulation_chunks
			LIMIT $1
		`
		args = []interface{}{limit}
	} else {
		query = fmt.Sprintf(`
			SELECT id, source_doc, title, section, content, embedding::text, created_at
			FROM public.ai_regulation_chunks
			WHERE %s
			LIMIT $%d
		`, strings.Join(conditions, " OR "), len(conditions)+1)
		args = append(args, limit)
	}

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to query text chunks: %w", err)
	}
	defer rows.Close()

	var chunks []*models.AIRegulationChunk
	for rows.Next() {
		var chunk models.AIRegulationChunk
		var embText string
		err := rows.Scan(&chunk.ID, &chunk.SourceDoc, &chunk.Title, &chunk.Section, &chunk.Content, &embText, &chunk.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("repo: failed to scan chunk: %w", err)
		}
		chunk.Embedding, err = parseVectorString(embText)
		if err != nil {
			return nil, fmt.Errorf("repo: failed to parse vector embedding: %w", err)
		}
		chunks = append(chunks, &chunk)
	}
	return chunks, nil
}

