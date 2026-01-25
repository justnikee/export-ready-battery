package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ============================================================================
// TRUSTED DOMAINS REPOSITORY METHODS
// ============================================================================

// CreateTrustedDomain adds a new trusted domain for a tenant
func (r *Repository) CreateTrustedDomain(ctx context.Context, domain *models.TrustedDomain) error {
	query := `
		INSERT INTO public.trusted_domains (id, tenant_id, domain, role, description, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	now := time.Now()
	if domain.ID == uuid.Nil {
		domain.ID = uuid.New()
	}
	domain.CreatedAt = now
	domain.UpdatedAt = now
	domain.IsActive = true

	_, err := r.db.Pool.Exec(ctx, query,
		domain.ID,
		domain.TenantID,
		strings.ToLower(strings.TrimSpace(domain.Domain)),
		domain.Role,
		domain.Description,
		domain.IsActive,
		domain.CreatedAt,
		domain.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create trusted domain: %w", err)
	}
	return nil
}

// GetTrustedDomainByDomain looks up a trusted domain for a specific tenant
func (r *Repository) GetTrustedDomainByDomain(ctx context.Context, tenantID uuid.UUID, domain string) (*models.TrustedDomain, error) {
	query := `
		SELECT id, tenant_id, domain, role, description, is_active, created_at, updated_at
		FROM public.trusted_domains
		WHERE tenant_id = $1 AND domain = $2 AND is_active = TRUE
	`
	td := &models.TrustedDomain{}
	err := r.db.Pool.QueryRow(ctx, query, tenantID, strings.ToLower(strings.TrimSpace(domain))).Scan(
		&td.ID,
		&td.TenantID,
		&td.Domain,
		&td.Role,
		&td.Description,
		&td.IsActive,
		&td.CreatedAt,
		&td.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found is not an error
		}
		return nil, fmt.Errorf("failed to get trusted domain: %w", err)
	}
	return td, nil
}

// GetTrustedDomainsByTenant lists all trusted domains for a tenant
func (r *Repository) GetTrustedDomainsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TrustedDomain, error) {
	query := `
		SELECT id, tenant_id, domain, role, description, is_active, created_at, updated_at
		FROM public.trusted_domains
		WHERE tenant_id = $1
		ORDER BY domain
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list trusted domains: %w", err)
	}
	defer rows.Close()

	var domains []*models.TrustedDomain
	for rows.Next() {
		td := &models.TrustedDomain{}
		if err := rows.Scan(
			&td.ID,
			&td.TenantID,
			&td.Domain,
			&td.Role,
			&td.Description,
			&td.IsActive,
			&td.CreatedAt,
			&td.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan trusted domain: %w", err)
		}
		domains = append(domains, td)
	}
	return domains, nil
}

// DeleteTrustedDomain removes a trusted domain
func (r *Repository) DeleteTrustedDomain(ctx context.Context, tenantID, domainID uuid.UUID) error {
	query := `DELETE FROM public.trusted_domains WHERE id = $1 AND tenant_id = $2`
	result, err := r.db.Pool.Exec(ctx, query, domainID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete trusted domain: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("trusted domain not found or not owned by tenant")
	}
	return nil
}

// UpdateTrustedDomainActive enables/disables a trusted domain
func (r *Repository) UpdateTrustedDomainActive(ctx context.Context, tenantID, domainID uuid.UUID, isActive bool) error {
	query := `UPDATE public.trusted_domains SET is_active = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4`
	result, err := r.db.Pool.Exec(ctx, query, isActive, time.Now(), domainID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update trusted domain: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("trusted domain not found or not owned by tenant")
	}
	return nil
}

// LookupTrustedDomainByEmail extracts domain from email and checks if it's trusted
func (r *Repository) LookupTrustedDomainByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TrustedDomain, error) {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid email format")
	}
	domain := strings.ToLower(parts[1])
	return r.GetTrustedDomainByDomain(ctx, tenantID, domain)
}
