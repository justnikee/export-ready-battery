package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/models"
)

// CreateTenant creates a new tenant
func (r *Repository) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) {
	tenant := &models.Tenant{
		ID:          uuid.New(),
		CompanyName: companyName,
		CreatedAt:   time.Now(),
	}

	query := `INSERT INTO public.tenants (id, company_name, created_at) VALUES ($1, $2, $3)`
	_, err := r.db.Pool.Exec(ctx, query, tenant.ID, tenant.CompanyName, tenant.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	return tenant, nil
}

// GetTenant retrieves a tenant by ID
func (r *Repository) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	tenant := &models.Tenant{}
	query := `SELECT id, company_name, COALESCE(address, ''), COALESCE(logo_url, ''), COALESCE(support_email, ''), COALESCE(website, ''), created_at FROM public.tenants WHERE id = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&tenant.ID,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return tenant, nil
}

// UpdateTenantProfile updates the tenant's profile information
func (r *Repository) UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error) {
	query := `
		UPDATE public.tenants 
		SET company_name = $2, address = $3, logo_url = $4, support_email = $5, website = $6 
		WHERE id = $1 
		RETURNING id, company_name, COALESCE(address, ''), COALESCE(logo_url, ''), COALESCE(support_email, ''), COALESCE(website, ''), created_at`

	tenant := &models.Tenant{}
	err := r.db.Pool.QueryRow(ctx, query, id, req.CompanyName, req.Address, req.LogoURL, req.SupportEmail, req.Website).Scan(
		&tenant.ID,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update tenant profile: %w", err)
	}

	return tenant, nil
}
