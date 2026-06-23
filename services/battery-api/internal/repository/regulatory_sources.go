package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateRegulatorySource inserts a new source.
func (r *Repository) CreateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error {
	query := `INSERT INTO regulatory_sources
		(id, name, source_type, url, config, fetch_interval, is_active, last_fetched_at, last_etag, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
	_, err := r.db.Pool.Exec(ctx, query,
		s.ID, s.Name, s.SourceType, s.URL, s.Config, s.FetchInterval, s.IsActive,
		s.LastFetchedAt, s.LastETag, s.CreatedAt, s.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create regulatory source: %w", err)
	}
	return nil
}

// ListRegulatorySources returns all sources, optionally filtering active only.
func (r *Repository) ListRegulatorySources(ctx context.Context, activeOnly bool) ([]*models.RegulatorySource, error) {
	query := `SELECT id, name, source_type, url, config, fetch_interval, is_active, last_fetched_at, last_etag, created_at, updated_at
		FROM regulatory_sources`
	if activeOnly {
		query += ` WHERE is_active = true`
	}
	query += ` ORDER BY name`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list regulatory sources: %w", err)
	}
	defer rows.Close()

	return scanRegulatorySources(rows)
}

// GetRegulatorySourceByID fetches a single source.
func (r *Repository) GetRegulatorySourceByID(ctx context.Context, id uuid.UUID) (*models.RegulatorySource, error) {
	query := `SELECT id, name, source_type, url, config, fetch_interval, is_active, last_fetched_at, last_etag, created_at, updated_at
		FROM regulatory_sources WHERE id = $1`
	row := r.db.Pool.QueryRow(ctx, query, id)
	return scanRegulatorySourceRow(row)
}

// UpdateRegulatorySource modifies a source.
func (r *Repository) UpdateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error {
	query := `UPDATE regulatory_sources SET
		name=$2, source_type=$3, url=$4, config=$5, fetch_interval=$6, is_active=$7,
		last_fetched_at=$8, last_etag=$9, updated_at=$10
		WHERE id=$1`
	_, err := r.db.Pool.Exec(ctx, query,
		s.ID, s.Name, s.SourceType, s.URL, s.Config, s.FetchInterval, s.IsActive,
		s.LastFetchedAt, s.LastETag, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to update regulatory source: %w", err)
	}
	return nil
}

// UpdateRegulatorySourceFetchMeta updates only the fetch metadata (etag, timestamp).
func (r *Repository) UpdateRegulatorySourceFetchMeta(ctx context.Context, id uuid.UUID, fetchedAt time.Time, etag string) error {
	query := `UPDATE regulatory_sources SET last_fetched_at=$2, last_etag=$3, updated_at=$4 WHERE id=$1`
	_, err := r.db.Pool.Exec(ctx, query, id, fetchedAt, etag, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update fetch meta: %w", err)
	}
	return nil
}

// DeleteRegulatorySource removes a source and cascades to items/alerts.
func (r *Repository) DeleteRegulatorySource(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM regulatory_sources WHERE id=$1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete regulatory source: %w", err)
	}
	return nil
}

func scanRegulatorySources(rows pgx.Rows) ([]*models.RegulatorySource, error) {
	var out []*models.RegulatorySource
	for rows.Next() {
		s, err := scanRegulatorySource(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func scanRegulatorySource(rows pgx.Row) (*models.RegulatorySource, error) {
	var s models.RegulatorySource
	var config map[string]string
	err := rows.Scan(
		&s.ID, &s.Name, &s.SourceType, &s.URL, &config, &s.FetchInterval, &s.IsActive,
		&s.LastFetchedAt, &s.LastETag, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	s.Config = config
	return &s, nil
}

func scanRegulatorySourceRow(row pgx.Row) (*models.RegulatorySource, error) {
	return scanRegulatorySource(row)
}
