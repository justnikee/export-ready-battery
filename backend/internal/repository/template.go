package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"anvayalabs-battery/internal/models"
)

// CreateTemplate creates a new batch template (Product SKU)
func (r *Repository) CreateTemplate(ctx context.Context, tenantID uuid.UUID, name string, productType models.ProductType, marketRegion models.MarketRegion, specs models.BatchSpec) (*models.Template, error) {
	// Default to GLOBAL if not specified
	if marketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}
	if productType == "" {
		productType = models.DefaultProductType()
	}

	template := &models.Template{
		ID:           uuid.New(),
		TenantID:     tenantID,
		Name:         name,
		ProductType:  productType,
		MarketRegion: marketRegion,
		Specs:        specs,
		CreatedAt:    time.Now(),
	}

	specsJSON, err := json.Marshal(specs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal specs: %w", err)
	}

	query := `INSERT INTO public.batch_templates (id, tenant_id, name, product_type, market_region, specs, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err = r.db.Pool.Exec(ctx, query, template.ID, template.TenantID, template.Name, template.ProductType, template.MarketRegion, specsJSON, template.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create template: %w", err)
	}

	return template, nil
}

// ListTemplates retrieves all templates for a tenant
func (r *Repository) ListTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.Template, error) {
	query := `SELECT id, tenant_id, name, COALESCE(product_type, 'BATTERY'), market_region, specs, created_at FROM public.batch_templates WHERE tenant_id = $1 ORDER BY name`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list templates: %w", err)
	}
	defer rows.Close()

	var templates []*models.Template
	for rows.Next() {
		template := &models.Template{}
		var specsJSON []byte

		if err := rows.Scan(&template.ID, &template.TenantID, &template.Name, &template.ProductType, &template.MarketRegion, &specsJSON, &template.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}

		if err := json.Unmarshal(specsJSON, &template.Specs); err != nil {
			return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
		}

		templates = append(templates, template)
	}

	return templates, nil
}

// GetTemplate retrieves a template by ID
func (r *Repository) GetTemplate(ctx context.Context, id uuid.UUID) (*models.Template, error) {
	template := &models.Template{}
	var specsJSON []byte

	query := `SELECT id, tenant_id, name, COALESCE(product_type, 'BATTERY'), market_region, specs, created_at FROM public.batch_templates WHERE id = $1`
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(&template.ID, &template.TenantID, &template.Name, &template.ProductType, &template.MarketRegion, &specsJSON, &template.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("template not found")
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	if err := json.Unmarshal(specsJSON, &template.Specs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal specs: %w", err)
	}

	return template, nil
}

// DeleteTemplate deletes a template by ID
func (r *Repository) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM public.batch_templates WHERE id = $1`
	result, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("template not found")
	}

	return nil
}
