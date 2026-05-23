package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anvayalabs/platform-core/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const tenantSelectColumns = `
	t.id,
	t.company_name,
	COALESCE(t.address, ''),
	COALESCE(t.logo_url, ''),
	COALESCE(t.support_email, ''),
	COALESCE(t.website, ''),
	COALESCE(t.product_type, 'BATTERY'),
	t.created_at,
	COALESCE(t.quota_balance, 2),
	COALESCE(t.onboarding_completed, FALSE),
	COALESCE(t.data_visibility, '{}'::jsonb)
`

func scanTenant(row pgx.Row, tenant *models.Tenant) error {
	err := row.Scan(
		&tenant.ID,
		&tenant.CompanyName,
		&tenant.Address,
		&tenant.LogoURL,
		&tenant.SupportEmail,
		&tenant.Website,
		&tenant.ProductType,
		&tenant.CreatedAt,
		&tenant.QuotaBalance,
		&tenant.OnboardingCompleted,
		&tenant.DataVisibility,
	)
	if err != nil {
		return err
	}
	return nil
}

// safeJSONStr encodes a json.RawMessage as a Go string for pgx SimpleProtocol.
func safeJSONStr(v json.RawMessage) string {
	if len(v) == 0 {
		return "{}"
	}
	return string(v)
}

// CreateTenant creates a new tenant
func (r *Repository) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) {
	tenant := &models.Tenant{
		ID:          uuid.New(),
		CompanyName: companyName,
		ProductType: models.DefaultProductType(),
		CreatedAt:   time.Now(),
	}

	query := `INSERT INTO public.tenants (id, company_name, product_type, created_at) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Pool.Exec(ctx, query, tenant.ID, tenant.CompanyName, tenant.ProductType, tenant.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	return tenant, nil
}

// GetTenant retrieves a tenant by ID
func (r *Repository) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	tenant := &models.Tenant{}
	query := fmt.Sprintf(`SELECT %s FROM public.tenants t WHERE t.id = $1`, tenantSelectColumns)

	err := scanTenant(r.db.Pool.QueryRow(ctx, query, id), tenant)
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
	newlyComplete := req.Address != "" && req.SupportEmail != ""

	_, err := r.db.Pool.Exec(ctx, `
		UPDATE public.tenants
		SET company_name = $2,
		    address = $3,
		    logo_url = $4,
		    support_email = $5,
		    website = $6,
		    onboarding_completed = (COALESCE(onboarding_completed, false) OR $7),
		    data_visibility = $8::jsonb
		WHERE id = $1`,
		id,
		req.CompanyName,
		req.Address,
		req.LogoURL,
		req.SupportEmail,
		req.Website,
		newlyComplete,
		safeJSONStr(req.DataVisibility),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update shared tenant profile: %w", err)
	}

	tenant := &models.Tenant{}
	err = scanTenant(r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM public.tenants t WHERE t.id = $1`, tenantSelectColumns),
		id,
	), tenant)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated tenant profile: %w", err)
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

// UpdateLogoURL updates the logo URL for a tenant
func (r *Repository) UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error {
	query := `UPDATE public.tenants SET logo_url = $2 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, tenantID, logoURL)
	if err != nil {
		return fmt.Errorf("failed to update logo URL: %w", err)
	}
	return nil
}

// GetTenantByEmail retrieves a tenant by email
func (r *Repository) GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error) {
	tenant := &models.Tenant{}
	query := `SELECT id FROM public.tenants WHERE email = $1`

	err := r.db.Pool.QueryRow(ctx, query, email).Scan(&tenant.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant by email: %w", err)
	}

	return tenant, nil
}
