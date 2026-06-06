package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// UpsertRegulatoryItem inserts or updates a regulatory item (unique on source_id + external_id).
func (r *Repository) UpsertRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) error {
	query := `INSERT INTO regulatory_items
		(id, source_id, external_id, title, summary, url, published_at, product_type, market_region, urgency, tags, deadline, raw_content, classified_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		ON CONFLICT (source_id, external_id) DO UPDATE SET
			title = EXCLUDED.title,
			summary = EXCLUDED.summary,
			url = EXCLUDED.url,
			published_at = EXCLUDED.published_at,
			product_type = EXCLUDED.product_type,
			market_region = EXCLUDED.market_region,
			urgency = EXCLUDED.urgency,
			tags = EXCLUDED.tags,
			deadline = EXCLUDED.deadline,
			raw_content = EXCLUDED.raw_content,
			classified_at = EXCLUDED.classified_at,
			updated_at = EXCLUDED.updated_at`
	_, err := r.db.Pool.Exec(ctx, query,
		item.ID, item.SourceID, item.ExternalID, item.Title, item.Summary, item.URL,
		item.PublishedAt, item.ProductType, item.MarketRegion, item.Urgency,
		item.Tags, item.Deadline, item.RawContent, item.ClassifiedAt,
		item.CreatedAt, item.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert regulatory item: %w", err)
	}
	return nil
}

// GetRegulatoryItemBySourceAndExternalID looks up an item after upsert to get the real ID.
func (r *Repository) GetRegulatoryItemBySourceAndExternalID(ctx context.Context, sourceID uuid.UUID, externalID string) (*models.RegulatoryItem, error) {
	query := `SELECT id, source_id, external_id, title, summary, url, published_at, product_type, market_region, urgency, tags, deadline, raw_content, classified_at, created_at, updated_at
		FROM regulatory_items WHERE source_id = $1 AND external_id = $2`
	row := r.db.Pool.QueryRow(ctx, query, sourceID, externalID)
	return scanRegulatoryItemRow(row)
}

// ListRegulatoryItems returns items with optional filters.
type ListRegulatoryItemsFilter struct {
	ProductType  string
	MarketRegion string
	Urgency      string
	Limit        int
	Offset       int
}

func (r *Repository) ListRegulatoryItems(ctx context.Context, f ListRegulatoryItemsFilter) ([]*models.RegulatoryItem, int, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if f.ProductType != "" {
		where += fmt.Sprintf(" AND product_type = $%d", argIdx)
		args = append(args, f.ProductType)
		argIdx++
	}
	if f.MarketRegion != "" {
		where += fmt.Sprintf(" AND market_region = $%d", argIdx)
		args = append(args, f.MarketRegion)
		argIdx++
	}
	if f.Urgency != "" {
		where += fmt.Sprintf(" AND urgency = $%d", argIdx)
		args = append(args, f.Urgency)
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM regulatory_items " + where
	var total int
	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count regulatory items: %w", err)
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := f.Offset
	if offset < 0 {
		offset = 0
	}

	selectQuery := fmt.Sprintf(
		`SELECT id, source_id, external_id, title, summary, url, published_at, product_type, market_region, urgency, tags, deadline, raw_content, classified_at, created_at, updated_at
		FROM regulatory_items %s ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)
	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list regulatory items: %w", err)
	}
	defer rows.Close()

	items, err := scanRegulatoryItems(rows)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// GetRegulatoryItemByID fetches a single item.
func (r *Repository) GetRegulatoryItemByID(ctx context.Context, id uuid.UUID) (*models.RegulatoryItem, error) {
	query := `SELECT id, source_id, external_id, title, summary, url, published_at, product_type, market_region, urgency, tags, deadline, raw_content, classified_at, created_at, updated_at
		FROM regulatory_items WHERE id = $1`
	row := r.db.Pool.QueryRow(ctx, query, id)
	return scanRegulatoryItemRow(row)
}

func scanRegulatoryItems(rows pgx.Rows) ([]*models.RegulatoryItem, error) {
	var out []*models.RegulatoryItem
	for rows.Next() {
		item, err := scanRegulatoryItem(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func scanRegulatoryItem(rows pgx.Row) (*models.RegulatoryItem, error) {
	var item models.RegulatoryItem
	var tags []string
	err := rows.Scan(
		&item.ID, &item.SourceID, &item.ExternalID, &item.Title, &item.Summary, &item.URL,
		&item.PublishedAt, &item.ProductType, &item.MarketRegion, &item.Urgency,
		&tags, &item.Deadline, &item.RawContent, &item.ClassifiedAt,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	item.Tags = tags
	return &item, nil
}

func scanRegulatoryItemRow(row pgx.Row) (*models.RegulatoryItem, error) {
	return scanRegulatoryItem(row)
}
