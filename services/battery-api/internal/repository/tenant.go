package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/anvayalabs/battery-api/internal/models"
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
	COALESCE(bp.epr_registration_number, ''),
	COALESCE(bp.bis_r_number, ''),
	COALESCE(bp.iec_code, ''),
	COALESCE(bp.eu_authorized_representative_name, ''),
	COALESCE(bp.eu_authorized_representative_address, ''),
	COALESCE(bp.eu_contact_email, ''),
	COALESCE(bp.epr_certificate_path, ''),
	COALESCE(bp.bis_certificate_path, ''),
	COALESCE(bp.pli_certificate_path, ''),
	COALESCE(bp.epr_status, 'NOT_UPLOADED'),
	COALESCE(bp.bis_status, 'NOT_UPLOADED'),
	COALESCE(bp.pli_status, 'NOT_UPLOADED'),
	COALESCE(t.onboarding_completed, FALSE),
	COALESCE(t.manufacturer_code, ''),
	COALESCE(bp.morth_manufacturer_code, ''),
	COALESCE(bp.morth_factory_codes, ''),
	COALESCE(t.data_visibility, '{}'::jsonb),
	COALESCE(t.plan_type, 'STARTER'),
	t.subscription_expires_at,
	COALESCE(t.plan_status, 'ACTIVE')
`

const tenantProfileJoin = `
	FROM public.tenants t
	LEFT JOIN public.battery_tenant_profiles bp ON bp.tenant_id = t.id
`

func scanTenant(row pgx.Row, tenant *models.Tenant) error {
	bp := &models.BatteryTenantProfile{}

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
		&bp.EPRRegistrationNumber,
		&bp.BISRNumber,
		&bp.IECCode,
		&bp.EUAuthorizedRepresentativeName,
		&bp.EUAuthorizedRepresentativeAddress,
		&bp.EUContactEmail,
		&bp.EPRCertificatePath,
		&bp.BISCertificatePath,
		&bp.PLICertificatePath,
		&bp.EPRStatus,
		&bp.BISStatus,
		&bp.PLIStatus,
		&tenant.OnboardingCompleted,
		&tenant.ManufacturerCode,
		&bp.MorthManufacturerCode,
		&bp.MorthFactoryCodes,
		&tenant.DataVisibility,
		&tenant.PlanType,
		&tenant.SubscriptionExpiresAt,
		&tenant.PlanStatus,
	)
	if err != nil {
		return err
	}

	bp.TenantID = tenant.ID
	tenant.BatteryProfile = bp

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

// GetTenantSubscriptionStatus returns the tenant's plan type, plan status, and
// expiry in a single lean query — used by RequireFeature to evaluate both
// "does the plan include this feature" and "has the subscription lapsed" gates
// without a second round trip.
func (r *Repository) GetTenantSubscriptionStatus(ctx context.Context, tenantID uuid.UUID) (planType, planStatus string, expiresAt *time.Time, err error) {
	err = r.db.Pool.QueryRow(ctx,
		`SELECT COALESCE(plan_type, 'STARTER'), COALESCE(plan_status, 'ACTIVE'), subscription_expires_at
		 FROM public.tenants WHERE id = $1`, tenantID).Scan(&planType, &planStatus, &expiresAt)
	return
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
		`SELECT COALESCE(product_type, 'BATTERY') FROM public.tenants WHERE id = $1 FOR UPDATE`,
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

	if productType == models.ProductTypeBattery {
		battery := req.BatteryProfileUpdate
		if battery == nil {
			battery = &models.BatteryProfileUpdate{}
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO public.battery_tenant_profiles (
				tenant_id,
				epr_registration_number,
				bis_r_number,
				iec_code,
				eu_authorized_representative_name,
				eu_authorized_representative_address,
				eu_contact_email,
				morth_manufacturer_code,
				morth_factory_codes,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				epr_registration_number = EXCLUDED.epr_registration_number,
				bis_r_number = EXCLUDED.bis_r_number,
				iec_code = EXCLUDED.iec_code,
				eu_authorized_representative_name = EXCLUDED.eu_authorized_representative_name,
				eu_authorized_representative_address = EXCLUDED.eu_authorized_representative_address,
				eu_contact_email = EXCLUDED.eu_contact_email,
				morth_manufacturer_code = EXCLUDED.morth_manufacturer_code,
				morth_factory_codes = EXCLUDED.morth_factory_codes,
				updated_at = NOW()`,
			id,
			battery.EPRRegistrationNumber,
			battery.BISRNumber,
			battery.IECCode,
			battery.EUAuthorizedRepresentativeName,
			battery.EUAuthorizedRepresentativeAddress,
			battery.EUContactEmail,
			battery.MorthManufacturerCode,
			battery.MorthFactoryCodes,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update battery tenant profile: %w", err)
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

	// If the BIS R-Number was just added/changed and a certificate is already
	// on file, kick off an async registry check (best-effort, non-blocking).
	if bp := tenant.BatteryProfile; bp != nil && bp.BISRNumber != "" &&
		(bp.BISStatus == "PENDING" || bp.BISStatus == "VERIFIED") {
		_ = r.CreateTenantCertVerificationJob(ctx, &models.TenantCertVerificationJob{
			ID:            uuid.New().String(),
			TenantID:      id.String(),
			DocType:       "bis",
			CertificateNo: bp.BISRNumber,
			Status:        "pending",
			MaxAttempts:   5,
		})
	}

	return tenant, nil
}

// DeductQuota atomically decrements quota by the specified count if balance >= count
func (r *Repository) DeductQuota(ctx context.Context, tenantID uuid.UUID, count int) error {
	query := `
		UPDATE public.tenants 
		SET quota_balance = quota_balance - $2 
		WHERE id = $1 AND quota_balance >= $2
		RETURNING quota_balance`

	var newBalance int
	err := r.db.Pool.QueryRow(ctx, query, tenantID, count).Scan(&newBalance)
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

// UpdateTenantSubscription updates a tenant's subscription details (plan type, expiry, and status)
func (r *Repository) UpdateTenantSubscription(ctx context.Context, tenantID uuid.UUID, planType string, expiresAt time.Time, planStatus string) error {
	query := `UPDATE public.tenants 
	          SET plan_type = $2, subscription_expires_at = $3, plan_status = $4 
	          WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, tenantID, planType, expiresAt, planStatus)
	if err != nil {
		return fmt.Errorf("failed to update tenant subscription: %w", err)
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
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, epr_certificate_path, epr_status, updated_at)
			VALUES ($1, $2, 'PENDING', NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				epr_certificate_path = EXCLUDED.epr_certificate_path,
				epr_status = 'PENDING',
				updated_at = NOW()`
	case "bis":
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, bis_certificate_path, bis_status, updated_at)
			VALUES ($1, $2, 'PENDING', NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				bis_certificate_path = EXCLUDED.bis_certificate_path,
				bis_status = 'PENDING',
				updated_at = NOW()`
	case "pli":
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, pli_certificate_path, pli_status, updated_at)
			VALUES ($1, $2, 'PENDING', NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				pli_certificate_path = EXCLUDED.pli_certificate_path,
				pli_status = 'PENDING',
				updated_at = NOW()`
	default:
		return fmt.Errorf("invalid document type: %s", docType)
	}

	_, err := r.db.Pool.Exec(ctx, query, tenantID, path)
	if err != nil {
		return fmt.Errorf("failed to update certificate path: %w", err)
	}

	// If the matching registration number is already on file, kick off an
	// async registry check so bis_status can move to VERIFIED automatically
	// without waiting on manual admin review.
	if docType == "bis" {
		r.enqueueCertVerificationIfReady(ctx, tenantID, "bis")
	}
	return nil
}

// enqueueCertVerificationIfReady enqueues a tenant cert verification job for
// docType if the corresponding registration number is present on the
// tenant's battery profile. Errors are logged by the caller's repo methods
// and intentionally swallowed here — verification is best-effort and must
// never block the certificate upload / profile save it's triggered from.
func (r *Repository) enqueueCertVerificationIfReady(ctx context.Context, tenantID uuid.UUID, docType string) {
	var certificateNo string
	switch docType {
	case "bis":
		_ = r.db.Pool.QueryRow(ctx, `SELECT COALESCE(bis_r_number, '') FROM public.battery_tenant_profiles WHERE tenant_id = $1`, tenantID).Scan(&certificateNo)
	default:
		return
	}
	if certificateNo == "" {
		return
	}
	_ = r.CreateTenantCertVerificationJob(ctx, &models.TenantCertVerificationJob{
		ID:            uuid.New().String(),
		TenantID:      tenantID.String(),
		DocType:       docType,
		CertificateNo: certificateNo,
		Status:        "pending",
		MaxAttempts:   5,
	})
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
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, epr_status, updated_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				epr_status = EXCLUDED.epr_status,
				updated_at = NOW()`
	case "bis":
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, bis_status, updated_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				bis_status = EXCLUDED.bis_status,
				updated_at = NOW()`
	case "pli":
		query = `
			INSERT INTO public.battery_tenant_profiles (tenant_id, pli_status, updated_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT (tenant_id) DO UPDATE SET
				pli_status = EXCLUDED.pli_status,
				updated_at = NOW()`
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
