package repository

import (
	"context"
	"fmt"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// GetActiveSchema returns the highest-versioned active schema for the given product type.
// Implements schema.Store.GetActiveSchema.
func (r *Repository) GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error) {
	s := &models.ProductSchema{}
	var schemaJSON, displayConfig, complianceFields []byte
	var productTypeStr string

	query := `SELECT id, product_type, version, schema_json,
	                 COALESCE(display_config, '{}'::jsonb),
	                 COALESCE(compliance_fields, '{}'::jsonb),
	                 is_active, created_at
	          FROM public.product_schemas
	          WHERE product_type = $1 AND is_active = true
	          ORDER BY version DESC
	          LIMIT 1`

	err := r.db.Pool.QueryRow(ctx, query, string(productType)).Scan(
		&s.ID,
		&productTypeStr,
		&s.Version,
		&schemaJSON,
		&displayConfig,
		&complianceFields,
		&s.IsActive,
		&s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("schema not found for product type %s: %w", productType, err)
	}

	s.ProductType = models.ProductType(productTypeStr)
	s.SchemaJSON = schemaJSON
	s.DisplayConfig = displayConfig
	s.ComplianceFields = complianceFields
	return s, nil
}

// GetSchemaByVersion returns a specific version of the schema for the given product type.
// Implements schema.Store.GetSchemaByVersion.
func (r *Repository) GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error) {
	s := &models.ProductSchema{}
	var schemaJSON, displayConfig, complianceFields []byte
	var productTypeStr string

	query := `SELECT id, product_type, version, schema_json,
	                 COALESCE(display_config, '{}'::jsonb),
	                 COALESCE(compliance_fields, '{}'::jsonb),
	                 is_active, created_at
	          FROM public.product_schemas
	          WHERE product_type = $1 AND version = $2
	          LIMIT 1`

	err := r.db.Pool.QueryRow(ctx, query, string(productType), version).Scan(
		&s.ID,
		&productTypeStr,
		&s.Version,
		&schemaJSON,
		&displayConfig,
		&complianceFields,
		&s.IsActive,
		&s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("schema not found for product type %s version %d: %w", productType, version, err)
	}

	s.ProductType = models.ProductType(productTypeStr)
	s.SchemaJSON = schemaJSON
	s.DisplayConfig = displayConfig
	s.ComplianceFields = complianceFields
	return s, nil
}

// UpsertProductSchema inserts or replaces a product schema.
// Used at startup to seed the battery_v1 schema when the DB table is empty.
// The unique constraint on (product_type, version) ensures idempotent upserts.
func (r *Repository) UpsertProductSchema(ctx context.Context, s *models.ProductSchema) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}

	// Nil-safe JSON defaults — avoid passing null into NOT NULL columns.
	schemaJSON := string(s.SchemaJSON)
	displayConfig := "{}"
	if len(s.DisplayConfig) > 0 {
		displayConfig = string(s.DisplayConfig)
	}
	complianceFields := "{}"
	if len(s.ComplianceFields) > 0 {
		complianceFields = string(s.ComplianceFields)
	}

	query := `INSERT INTO public.product_schemas
	              (id, product_type, version, schema_json, display_config, compliance_fields, is_active, created_at)
	          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)
	          ON CONFLICT (product_type, version) DO UPDATE
	              SET schema_json        = EXCLUDED.schema_json,
	                  display_config     = EXCLUDED.display_config,
	                  compliance_fields  = EXCLUDED.compliance_fields,
	                  is_active          = EXCLUDED.is_active`

	_, err := r.db.Pool.Exec(ctx, query,
		s.ID,
		string(s.ProductType),
		s.Version,
		schemaJSON,
		displayConfig,
		complianceFields,
		s.IsActive,
		s.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert product schema: %w", err)
	}
	return nil
}
