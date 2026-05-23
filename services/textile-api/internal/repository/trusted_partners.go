package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// TrustedPartner represents a pre-registered partner domain
type TrustedPartner struct {
	ID           uuid.UUID  `json:"id"`
	TenantID     uuid.UUID  `json:"tenant_id"`
	CompanyName  string     `json:"company_name"`
	EmailDomain  string     `json:"email_domain"`
	Role         string     `json:"role"`
	ContactEmail string     `json:"contact_email,omitempty"`
	ContactPhone string     `json:"contact_phone,omitempty"`
	Notes        string     `json:"notes,omitempty"`
	IsActive     bool       `json:"is_active"`
	VerifiedAt   *time.Time `json:"verified_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// PartnerCode represents a shared secret code for unknown emails
type PartnerCode struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	Code        string     `json:"code"`
	Role        string     `json:"role"`
	Description string     `json:"description,omitempty"`
	MaxUses     *int       `json:"max_uses,omitempty"`
	CurrentUses int        `json:"current_uses"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
}

// VerificationResult represents the result of partner verification
type VerificationResult struct {
	Allowed      bool   `json:"allowed"`
	Tier         string `json:"tier"` // "A" (trusted), "B" (code), "REJECTED"
	CompanyName  string `json:"company_name,omitempty"`
	Role         string `json:"role,omitempty"`
	RejectReason string `json:"reject_reason,omitempty"`
}

// ============================================================================
// TRUSTED PARTNER VERIFICATION
// ============================================================================

// CheckTrustedPartner checks if an email domain is in the trusted partners list
// Returns the partner info if found, nil if not
func (r *Repository) CheckTrustedPartner(ctx context.Context, email string) (*TrustedPartner, error) {
	// Extract domain from email
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid email format")
	}
	domain := strings.ToLower(parts[1])

	query := `SELECT id, tenant_id, company_name, email_domain, role, 
	          contact_email, contact_phone, notes, is_active, verified_at, created_at
	          FROM trusted_partners 
	          WHERE LOWER(email_domain) = $1 AND is_active = TRUE`

	var partner TrustedPartner
	var contactEmail, contactPhone, notes *string
	err := r.db.Pool.QueryRow(ctx, query, domain).Scan(
		&partner.ID,
		&partner.TenantID,
		&partner.CompanyName,
		&partner.EmailDomain,
		&partner.Role,
		&contactEmail,
		&contactPhone,
		&notes,
		&partner.IsActive,
		&partner.VerifiedAt,
		&partner.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil // Not found, but not an error
	}
	if err != nil {
		return nil, fmt.Errorf("failed to check trusted partner: %w", err)
	}

	if contactEmail != nil {
		partner.ContactEmail = *contactEmail
	}
	if contactPhone != nil {
		partner.ContactPhone = *contactPhone
	}
	if notes != nil {
		partner.Notes = *notes
	}

	return &partner, nil
}

// ============================================================================
// PARTNER CODE VERIFICATION
// ============================================================================

// ValidatePartnerCode checks if a partner code is valid
func (r *Repository) ValidatePartnerCode(ctx context.Context, code string) (*PartnerCode, error) {
	query := `SELECT id, tenant_id, code, role, description, max_uses, current_uses, expires_at, is_active, created_at
	          FROM partner_codes 
	          WHERE UPPER(code) = UPPER($1) AND is_active = TRUE`

	var pc PartnerCode
	var description *string
	err := r.db.Pool.QueryRow(ctx, query, code).Scan(
		&pc.ID,
		&pc.TenantID,
		&pc.Code,
		&pc.Role,
		&description,
		&pc.MaxUses,
		&pc.CurrentUses,
		&pc.ExpiresAt,
		&pc.IsActive,
		&pc.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to validate partner code: %w", err)
	}

	if description != nil {
		pc.Description = *description
	}

	// Check if expired
	if pc.ExpiresAt != nil && pc.ExpiresAt.Before(time.Now()) {
		return nil, nil // Expired
	}

	// Check if max uses exceeded
	if pc.MaxUses != nil && pc.CurrentUses >= *pc.MaxUses {
		return nil, nil // Max uses reached
	}

	return &pc, nil
}

// IncrementPartnerCodeUsage increments the usage count and logs it
func (r *Repository) IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error {
	// Increment counter
	updateQuery := `UPDATE partner_codes SET current_uses = current_uses + 1 WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, updateQuery, codeID)
	if err != nil {
		return fmt.Errorf("failed to increment partner code usage: %w", err)
	}

	// Log usage
	logQuery := `INSERT INTO partner_code_usage (partner_code_id, email, passport_id) VALUES ($1, $2, $3)`
	_, err = r.db.Pool.Exec(ctx, logQuery, codeID, email, passportID)
	if err != nil {
		return fmt.Errorf("failed to log partner code usage: %w", err)
	}

	return nil
}

// ============================================================================
// COMBINED VERIFICATION (Tier A + Tier B)
// ============================================================================

// VerifyPartnerAccess checks both trusted partner (Tier A) and partner code (Tier B)
func (r *Repository) VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*VerificationResult, error) {
	// Tier A: Check trusted partner by email domain
	partner, err := r.CheckTrustedPartner(ctx, email)
	if err != nil {
		return nil, err
	}

	if partner != nil {
		return &VerificationResult{
			Allowed:     true,
			Tier:        "A",
			CompanyName: partner.CompanyName,
			Role:        partner.Role,
		}, nil
	}

	// Tier B: Check partner code (if provided)
	if partnerCode == "" {
		return &VerificationResult{
			Allowed:      false,
			Tier:         "REJECTED",
			RejectReason: "Email domain not recognized. Please provide a partner code.",
		}, nil
	}

	code, err := r.ValidatePartnerCode(ctx, partnerCode)
	if err != nil {
		return nil, err
	}

	if code == nil {
		return &VerificationResult{
			Allowed:      false,
			Tier:         "REJECTED",
			RejectReason: "Invalid or expired partner code.",
		}, nil
	}

	return &VerificationResult{
		Allowed:     true,
		Tier:        "B",
		CompanyName: code.Description,
		Role:        code.Role,
	}, nil
}

// ============================================================================
// CRUD FOR TRUSTED PARTNERS
// ============================================================================

// CreateTrustedPartner adds a new trusted partner domain
func (r *Repository) CreateTrustedPartner(ctx context.Context, partner *TrustedPartner) error {
	query := `INSERT INTO trusted_partners 
	          (tenant_id, company_name, email_domain, role, contact_email, contact_phone, notes, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	          RETURNING id, created_at`

	err := r.db.Pool.QueryRow(ctx, query,
		partner.TenantID,
		partner.CompanyName,
		strings.ToLower(partner.EmailDomain),
		partner.Role,
		nullIfEmpty(partner.ContactEmail),
		nullIfEmpty(partner.ContactPhone),
		nullIfEmpty(partner.Notes),
		partner.IsActive,
	).Scan(&partner.ID, &partner.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create trusted partner: %w", err)
	}

	return nil
}

// ListTrustedPartners returns all trusted partners for a tenant
func (r *Repository) ListTrustedPartners(ctx context.Context, tenantID uuid.UUID) ([]*TrustedPartner, error) {
	query := `SELECT id, tenant_id, company_name, email_domain, role, 
	          contact_email, contact_phone, notes, is_active, verified_at, created_at
	          FROM trusted_partners 
	          WHERE tenant_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list trusted partners: %w", err)
	}
	defer rows.Close()

	var partners []*TrustedPartner
	for rows.Next() {
		var p TrustedPartner
		var contactEmail, contactPhone, notes *string
		err := rows.Scan(
			&p.ID, &p.TenantID, &p.CompanyName, &p.EmailDomain, &p.Role,
			&contactEmail, &contactPhone, &notes, &p.IsActive, &p.VerifiedAt, &p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan trusted partner: %w", err)
		}
		if contactEmail != nil {
			p.ContactEmail = *contactEmail
		}
		if contactPhone != nil {
			p.ContactPhone = *contactPhone
		}
		if notes != nil {
			p.Notes = *notes
		}
		partners = append(partners, &p)
	}

	return partners, nil
}

// DeleteTrustedPartner removes a trusted partner
func (r *Repository) DeleteTrustedPartner(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM trusted_partners WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete trusted partner: %w", err)
	}
	return nil
}

// ============================================================================
// CRUD FOR PARTNER CODES
// ============================================================================

// CreatePartnerCode creates a new partner code
func (r *Repository) CreatePartnerCode(ctx context.Context, code *PartnerCode) error {
	query := `INSERT INTO partner_codes 
	          (tenant_id, code, role, description, max_uses, expires_at, is_active)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          RETURNING id, created_at`

	err := r.db.Pool.QueryRow(ctx, query,
		code.TenantID,
		strings.ToUpper(code.Code),
		code.Role,
		nullIfEmpty(code.Description),
		code.MaxUses,
		code.ExpiresAt,
		code.IsActive,
	).Scan(&code.ID, &code.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create partner code: %w", err)
	}

	return nil
}

// ListPartnerCodes returns all partner codes for a tenant
func (r *Repository) ListPartnerCodes(ctx context.Context, tenantID uuid.UUID) ([]*PartnerCode, error) {
	query := `SELECT id, tenant_id, code, role, description, max_uses, current_uses, expires_at, is_active, created_at
	          FROM partner_codes 
	          WHERE tenant_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list partner codes: %w", err)
	}
	defer rows.Close()

	var codes []*PartnerCode
	for rows.Next() {
		var c PartnerCode
		var description *string
		err := rows.Scan(
			&c.ID, &c.TenantID, &c.Code, &c.Role, &description,
			&c.MaxUses, &c.CurrentUses, &c.ExpiresAt, &c.IsActive, &c.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan partner code: %w", err)
		}
		if description != nil {
			c.Description = *description
		}
		codes = append(codes, &c)
	}

	return codes, nil
}

// DeactivatePartnerCode deactivates a partner code
func (r *Repository) DeactivatePartnerCode(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE partner_codes SET is_active = FALSE WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to deactivate partner code: %w", err)
	}
	return nil
}

// Helper to convert empty strings to nil for nullable columns
func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
