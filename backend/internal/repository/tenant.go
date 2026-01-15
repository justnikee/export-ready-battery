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
	query := `SELECT id, company_name, COALESCE(address, ''), COALESCE(logo_url, ''), COALESCE(support_email, ''), COALESCE(website, ''), created_at,
	          COALESCE(quota_balance, 2),
	          COALESCE(epr_registration_number, ''), COALESCE(bis_r_number, ''), COALESCE(iec_code, '')
	          FROM public.tenants WHERE id = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&tenant.ID,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.CreatedAt,
		&tenant.QuotaBalance,
		&tenant.EPRRegistrationNumber,
		&tenant.BISRNumber,
		&tenant.IECCode,
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
		SET company_name = $2, address = $3, logo_url = $4, support_email = $5, website = $6,
		    epr_registration_number = $7, bis_r_number = $8, iec_code = $9
		WHERE id = $1 
		RETURNING id, company_name, COALESCE(address, ''), COALESCE(logo_url, ''), COALESCE(support_email, ''), COALESCE(website, ''), created_at,
		          COALESCE(epr_registration_number, ''), COALESCE(bis_r_number, ''), COALESCE(iec_code, '')`

	tenant := &models.Tenant{}
	err := r.db.Pool.QueryRow(ctx, query, id, req.CompanyName, req.Address, req.LogoURL, req.SupportEmail, req.Website,
		req.EPRRegistrationNumber, req.BISRNumber, req.IECCode).Scan(
		&tenant.ID,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.CreatedAt,
		&tenant.EPRRegistrationNumber,
		&tenant.BISRNumber,
		&tenant.IECCode,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update tenant profile: %w", err)
	}

	return tenant, nil
}

// DeductQuota atomically decrements quota by 1 if balance > 0
func (r *Repository) DeductQuota(ctx context.Context, tenantID uuid.UUID) error {
	query := `
		UPDATE public.tenants 
		SET quota_balance = quota_balance - 1 
		WHERE id = $1 AND quota_balance > 0
		RETURNING quota_balance`

	var newBalance int
	err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(&newBalance)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("insufficient quota")
		}
		return fmt.Errorf("failed to deduct quota: %w", err)
	}

	return nil
}

// AddQuota adds credits to tenant's quota balance
func (r *Repository) AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error {
	query := `UPDATE public.tenants SET quota_balance = quota_balance + $2 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, tenantID, amount)
	if err != nil {
		return fmt.Errorf("failed to add quota: %w", err)
	}
	return nil
}

// GetQuotaBalance returns tenant's current quota balance
func (r *Repository) GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error) {
	var balance int
	query := `SELECT COALESCE(quota_balance, 2) FROM public.tenants WHERE id = $1`
	err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(&balance)
	if err != nil {
		return 0, fmt.Errorf("failed to get quota balance: %w", err)
	}
	return balance, nil
}
