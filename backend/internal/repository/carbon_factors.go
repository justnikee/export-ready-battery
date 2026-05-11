package repository

import (
	"context"
	"fmt"

	"anvayalabs-battery/internal/models"

	"github.com/jackc/pgx/v5"
)

// CarbonFactor is an alias for models.CarbonFactor for backward compatibility in this package.
type CarbonFactor = models.CarbonFactor

// GetFactorByCategoryAndSubcategory retrieves a carbon factor by its category and subcategory.
// Returns the currently valid factor (valid_to is NULL or in the future).
func (r *Repository) GetFactorByCategoryAndSubcategory(ctx context.Context, category, subcategory string) (*CarbonFactor, error) {
	query := `
		SELECT id, category, subcategory, factor_value, unit, source, valid_from, valid_to, notes, created_at
		FROM public.carbon_factors
		WHERE category = $1 AND subcategory = $2
			AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
		ORDER BY valid_from DESC
		LIMIT 1
	`

	factor := &CarbonFactor{}
	err := r.db.Pool.QueryRow(ctx, query, category, subcategory).Scan(
		&factor.ID,
		&factor.Category,
		&factor.Subcategory,
		&factor.FactorValue,
		&factor.Unit,
		&factor.Source,
		&factor.ValidFrom,
		&factor.ValidTo,
		&factor.Notes,
		&factor.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("carbon factor not found for category=%s, subcategory=%s", category, subcategory)
		}
		return nil, fmt.Errorf("failed to get carbon factor: %w", err)
	}

	return factor, nil
}

// GetAllFactors retrieves all carbon factors from the database.
func (r *Repository) GetAllFactors(ctx context.Context) ([]CarbonFactor, error) {
	query := `
		SELECT id, category, subcategory, factor_value, unit, source, valid_from, valid_to, notes, created_at
		FROM public.carbon_factors
		ORDER BY category, subcategory, valid_from DESC
	`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list carbon factors: %w", err)
	}
	defer rows.Close()

	var factors []CarbonFactor
	for rows.Next() {
		var factor CarbonFactor
		err := rows.Scan(
			&factor.ID,
			&factor.Category,
			&factor.Subcategory,
			&factor.FactorValue,
			&factor.Unit,
			&factor.Source,
			&factor.ValidFrom,
			&factor.ValidTo,
			&factor.Notes,
			&factor.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan carbon factor: %w", err)
		}
		factors = append(factors, factor)
	}

	if factors == nil {
		factors = []CarbonFactor{}
	}

	return factors, nil
}

// GetFactorsByCategory retrieves all carbon factors for a specific category.
func (r *Repository) GetFactorsByCategory(ctx context.Context, category string) ([]CarbonFactor, error) {
	query := `
		SELECT id, category, subcategory, factor_value, unit, source, valid_from, valid_to, notes, created_at
		FROM public.carbon_factors
		WHERE category = $1
		ORDER BY subcategory, valid_from DESC
	`

	rows, err := r.db.Pool.Query(ctx, query, category)
	if err != nil {
		return nil, fmt.Errorf("failed to list carbon factors by category: %w", err)
	}
	defer rows.Close()

	var factors []CarbonFactor
	for rows.Next() {
		var factor CarbonFactor
		err := rows.Scan(
			&factor.ID,
			&factor.Category,
			&factor.Subcategory,
			&factor.FactorValue,
			&factor.Unit,
			&factor.Source,
			&factor.ValidFrom,
			&factor.ValidTo,
			&factor.Notes,
			&factor.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan carbon factor: %w", err)
		}
		factors = append(factors, factor)
	}

	if factors == nil {
		factors = []CarbonFactor{}
	}

	return factors, nil
}
