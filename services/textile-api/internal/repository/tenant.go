package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/textile-api/internal/models"
)

const tenantSelectColumns = `
	t.id,
	t.company_name,
	COALESCE(t.address, ''),
	COALESCE(t.logo_url, ''),
	COALESCE(t.support_email, ''),
	COALESCE(t.website, ''),
	COALESCE(t.product_type, 'TEXTILE'),
	t.created_at,
	COALESCE(t.quota_balance, 2),
	COALESCE(t.onboarding_completed, FALSE),
	COALESCE(t.manufacturer_code, ''),
	COALESCE(t.data_visibility, '{}'::jsonb),
	COALESCE(tp.facility_type, ''),
	COALESCE(tp.supply_chain_tier, ''),
	COALESCE(tp.primary_markets, '[]'::jsonb),
	COALESCE(tp.default_fiber_types, '[]'::jsonb),
	COALESCE(tp.certifications, '[]'::jsonb),
	COALESCE(tp.compliance_defaults, '{}'::jsonb)
`

const tenantProfileJoin = `
	FROM public.tenants t
	LEFT JOIN public.textile_tenant_profiles tp ON tp.tenant_id = t.id
`

func scanTenant(row pgx.Row, tenant *models.Tenant) error {
	tp := &models.TextileTenantProfile{}

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
		&tenant.ManufacturerCode,
		&tenant.DataVisibility,
		&tp.FacilityType,
		&tp.SupplyChainTier,
		&tp.PrimaryMarkets,
		&tp.DefaultFiberTypes,
		&tp.Certifications,
		&tp.ComplianceDefaults,
	)
	if err != nil {
		return err
	}

	tp.TenantID = tenant.ID
	tenant.TextileProfile = tp

	return nil
}

// safeJSONStr encodes a json.RawMessage as a Go string for pgx SimpleProtocol.
// In SimpleProtocol mode pgx encodes []byte as PostgreSQL bytea (hex: \x...) which
// PostgreSQL CANNOT cast to JSONB. A Go string is sent as a plain text literal
// which PostgreSQL CAN cast with ::jsonb. Always returns valid JSON (minimum "{}").
func safeJSONStr(v json.RawMessage) string {
	if len(v) == 0 {
		return "{}"
	}
	return string(v)
}

func safeJSONStrWithDefault(v json.RawMessage, fallback string) string {
	if len(v) == 0 {
		return fallback
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
	query := fmt.Sprintf(`SELECT %s %s WHERE t.id = $1`, tenantSelectColumns, tenantProfileJoin)

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
	// onboarding_completed is a one-way latch: once TRUE it stays TRUE regardless of future edits.
	// The SQL merges the existing value (COALESCE to false) with the new eligibility check,
	// so clearing address/support_email in Settings can never un-complete onboarding.
	newlyComplete := req.Address != "" && req.SupportEmail != ""
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin tenant profile update: %w", err)
	}
	defer tx.Rollback(ctx)

	var productType models.ProductType
	err = tx.QueryRow(ctx,
		`SELECT COALESCE(product_type, 'TEXTILE') FROM public.tenants WHERE id = $1 FOR UPDATE`,
		id,
	).Scan(&productType)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to lock tenant for profile update: %w", err)
	}

	_, err = tx.Exec(ctx, `
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

	if productType == models.ProductTypeTextile {
		textile := req.TextileProfileUpdate
		if textile == nil {
			textile = &models.TextileProfileUpdate{}
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO public.textile_tenant_profiles (
				tenant_id,
				facility_type,
				supply_chain_tier,
				primary_markets,
				default_fiber_types,
				certifications,
				compliance_defaults,
				updated_at
			) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				facility_type = EXCLUDED.facility_type,
				supply_chain_tier = EXCLUDED.supply_chain_tier,
				primary_markets = EXCLUDED.primary_markets,
				default_fiber_types = EXCLUDED.default_fiber_types,
				certifications = EXCLUDED.certifications,
				compliance_defaults = EXCLUDED.compliance_defaults,
				updated_at = NOW()`,
			id,
			textile.TextileFacilityType,
			textile.TextileSupplyChainTier,
			safeJSONStrWithDefault(textile.TextilePrimaryMarkets, "[]"),
			safeJSONStrWithDefault(textile.TextileDefaultFiberTypes, "[]"),
			safeJSONStrWithDefault(textile.TextileCertifications, "[]"),
			safeJSONStrWithDefault(textile.TextileComplianceDefaults, "{}"),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update textile tenant profile: %w", err)
		}
	}

	tenant := &models.Tenant{}
	err = scanTenant(tx.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s %s WHERE t.id = $1`, tenantSelectColumns, tenantProfileJoin),
		id,
	), tenant)
	if err != nil {
		return nil, fmt.Errorf("failed to update tenant profile: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit tenant profile update: %w", err)
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

// UpdateCertificatePath updates a specific certificate path for a tenant and sets status to PENDING
func (r *Repository) UpdateCertificatePath(ctx context.Context, tenantID uuid.UUID, docType string, path string) error {
	switch docType {
	case "epr", "bis", "pli":
		return fmt.Errorf("document type %s is not supported for textile tenants", docType)
	default:
		return fmt.Errorf("invalid document type: %s", docType)
	}
}

// UpdateDocumentStatus updates the verification status of a document (for admin use)
func (r *Repository) UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error {
	// Validate status
	validStatuses := map[string]bool{"NOT_UPLOADED": true, "PENDING": true, "VERIFIED": true, "REJECTED": true}
	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	switch docType {
	case "epr", "bis", "pli":
		return fmt.Errorf("document type %s is not supported for textile tenants", docType)
	default:
		return fmt.Errorf("invalid document type: %s", docType)
	}
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
	// Only select what we scan to avoid column count mismatch
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

// ============================================================================
// BPAN V2: Serial Sequence + Manufacturer Code
// ============================================================================

// NextSequence atomically increments and returns the next BPAN sequence number
// for the given prefix (e.g. "IN-TEN-LFP-2026"). Uses INSERT ... ON CONFLICT
// for lock-free atomic increment.
func (r *Repository) NextSequence(ctx context.Context, prefix string) (int, error) {
	var nextVal int
	query := `
		INSERT INTO public.serial_sequences (prefix, last_value, updated_at)
		VALUES ($1, 1, NOW())
		ON CONFLICT (prefix) DO UPDATE
			SET last_value = serial_sequences.last_value + 1,
			    updated_at = NOW()
		RETURNING last_value`

	err := r.db.Pool.QueryRow(ctx, query, prefix).Scan(&nextVal)
	if err != nil {
		return 0, fmt.Errorf("failed to get next sequence for prefix %s: %w", prefix, err)
	}
	return nextVal, nil
}

// NextSequenceBatch atomically reserves N sequence numbers and returns the
// starting value. E.g., if last_value was 5 and count is 10, returns 6
// (the caller uses 6..15).
func (r *Repository) NextSequenceBatch(ctx context.Context, prefix string, count int) (int, error) {
	var newLast int
	query := `
		INSERT INTO public.serial_sequences (prefix, last_value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (prefix) DO UPDATE
			SET last_value = serial_sequences.last_value + $2,
			    updated_at = NOW()
		RETURNING last_value`

	err := r.db.Pool.QueryRow(ctx, query, prefix, count).Scan(&newLast)
	if err != nil {
		return 0, fmt.Errorf("failed to reserve %d sequences for prefix %s: %w", count, prefix, err)
	}
	// Starting value is (newLast - count + 1)
	return newLast - count + 1, nil
}

// GetOrCreateManufacturerCode retrieves the tenant's manufacturer code.
// If none exists, derives one from the company name, saves it, and returns it.
func (r *Repository) GetOrCreateManufacturerCode(ctx context.Context, tenantID uuid.UUID, companyName string) (string, error) {
	// Try to read existing code
	var code *string
	err := r.db.Pool.QueryRow(ctx,
		`SELECT manufacturer_code FROM public.tenants WHERE id = $1`, tenantID,
	).Scan(&code)
	if err != nil {
		return "", fmt.Errorf("failed to get manufacturer code: %w", err)
	}

	if code != nil && *code != "" {
		return *code, nil
	}

	// Derive from company name (import services package would create a cycle,
	// so we inline the logic here)
	derived := deriveManufacturerCode(companyName)

	_, err = r.db.Pool.Exec(ctx,
		`UPDATE public.tenants SET manufacturer_code = $2 WHERE id = $1`,
		tenantID, derived,
	)
	if err != nil {
		return "", fmt.Errorf("failed to save manufacturer code: %w", err)
	}

	return derived, nil
}

// deriveManufacturerCode generates a 3-char uppercase code from a company name.
func deriveManufacturerCode(companyName string) string {
	var code []rune
	for _, r := range companyName {
		if r >= 'A' && r <= 'Z' || r >= 'a' && r <= 'z' {
			if r >= 'a' && r <= 'z' {
				r = r - 32 // toUpper
			}
			code = append(code, r)
			if len(code) == 3 {
				break
			}
		}
	}
	switch len(code) {
	case 0:
		return "MFG"
	case 1:
		return string(code) + "XX"
	case 2:
		return string(code) + "X"
	default:
		return string(code)
	}
}
