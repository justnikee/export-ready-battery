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
	          COALESCE(epr_registration_number, ''), COALESCE(bis_r_number, ''), COALESCE(iec_code, ''),
	          COALESCE(eu_authorized_representative_name, ''), COALESCE(eu_authorized_representative_address, ''), COALESCE(eu_contact_email, ''),
	          COALESCE(epr_certificate_path, ''), COALESCE(bis_certificate_path, ''), COALESCE(pli_certificate_path, ''),
	          COALESCE(epr_status, 'NOT_UPLOADED'), COALESCE(bis_status, 'NOT_UPLOADED'), COALESCE(pli_status, 'NOT_UPLOADED'),
	          COALESCE(onboarding_completed, FALSE),
	          COALESCE(manufacturer_code, ''),
	          COALESCE(morth_manufacturer_code, ''), COALESCE(morth_factory_codes, ''),
	          COALESCE(data_visibility, '{}'::jsonb)
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
		&tenant.EUAuthorizedRepresentativeName,
		&tenant.EUAuthorizedRepresentativeAddress,
		&tenant.EUContactEmail,
		&tenant.EPRCertificatePath,
		&tenant.BISCertificatePath,
		&tenant.PLICertificatePath,
		&tenant.EPRStatus,
		&tenant.BISStatus,
		&tenant.PLIStatus,
		&tenant.OnboardingCompleted,
		&tenant.ManufacturerCode,
		&tenant.MorthManufacturerCode,
		&tenant.MorthFactoryCodes,
		&tenant.DataVisibility,
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
	// onboarding_completed is a one-way latch: once TRUE it stays TRUE regardless of future edits.
	// The SQL merges the existing value (COALESCE to false) with the new eligibility check,
	// so clearing address/support_email in Settings can never un-complete onboarding.
	newlyComplete := req.Address != "" && req.SupportEmail != ""

	query := `
		UPDATE public.tenants 
		SET company_name = $2, address = $3, logo_url = $4, support_email = $5, website = $6,
		    epr_registration_number = $7, bis_r_number = $8, iec_code = $9,
		    eu_authorized_representative_name = $10,
		    eu_authorized_representative_address = $11,
		    eu_contact_email = $12,
		    onboarding_completed = (COALESCE(onboarding_completed, false) OR $13),
		    morth_manufacturer_code = $14,
		    morth_factory_codes = $15
		WHERE id = $1 
		RETURNING id, company_name, COALESCE(address, ''), COALESCE(logo_url, ''), COALESCE(support_email, ''), COALESCE(website, ''), created_at,
		          COALESCE(epr_registration_number, ''), COALESCE(bis_r_number, ''), COALESCE(iec_code, ''),
		          COALESCE(eu_authorized_representative_name, ''), COALESCE(eu_authorized_representative_address, ''), COALESCE(eu_contact_email, ''),
		          onboarding_completed, COALESCE(morth_manufacturer_code, ''), COALESCE(morth_factory_codes, ''),
		          COALESCE(data_visibility, '{}'::jsonb)`

	tenant := &models.Tenant{}
	err := r.db.Pool.QueryRow(ctx, query, id, req.CompanyName, req.Address, req.LogoURL, req.SupportEmail, req.Website,
		req.EPRRegistrationNumber, req.BISRNumber, req.IECCode,
		req.EUAuthorizedRepresentativeName, req.EUAuthorizedRepresentativeAddress, req.EUContactEmail,
		newlyComplete, req.MorthManufacturerCode, req.MorthFactoryCodes).Scan(
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
		&tenant.EUAuthorizedRepresentativeName,
		&tenant.EUAuthorizedRepresentativeAddress,
		&tenant.EUContactEmail,
		&tenant.OnboardingCompleted,
		&tenant.MorthManufacturerCode,
		&tenant.MorthFactoryCodes,
		&tenant.DataVisibility,
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

// UpdateCertificatePath updates a specific certificate path for a tenant and sets status to PENDING
func (r *Repository) UpdateCertificatePath(ctx context.Context, tenantID uuid.UUID, docType string, path string) error {
	var query string
	switch docType {
	case "epr":
		query = `UPDATE public.tenants SET epr_certificate_path = $2, epr_status = 'PENDING' WHERE id = $1`
	case "bis":
		query = `UPDATE public.tenants SET bis_certificate_path = $2, bis_status = 'PENDING' WHERE id = $1`
	case "pli":
		query = `UPDATE public.tenants SET pli_certificate_path = $2, pli_status = 'PENDING' WHERE id = $1`
	default:
		return fmt.Errorf("invalid document type: %s", docType)
	}

	_, err := r.db.Pool.Exec(ctx, query, tenantID, path)
	if err != nil {
		return fmt.Errorf("failed to update certificate path: %w", err)
	}
	return nil
}

// UpdateDocumentStatus updates the verification status of a document (for admin use)
func (r *Repository) UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error {
	// Validate status
	validStatuses := map[string]bool{"NOT_UPLOADED": true, "PENDING": true, "VERIFIED": true, "REJECTED": true}
	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	var query string
	switch docType {
	case "epr":
		query = `UPDATE public.tenants SET epr_status = $2 WHERE id = $1`
	case "bis":
		query = `UPDATE public.tenants SET bis_status = $2 WHERE id = $1`
	case "pli":
		query = `UPDATE public.tenants SET pli_status = $2 WHERE id = $1`
	default:
		return fmt.Errorf("invalid document type: %s", docType)
	}

	_, err := r.db.Pool.Exec(ctx, query, tenantID, status)
	if err != nil {
		return fmt.Errorf("failed to update document status: %w", err)
	}
	return nil
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
