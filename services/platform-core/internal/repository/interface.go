package repository

import (
	"context"

	"github.com/anvayalabs/platform-core/internal/models"
	"github.com/google/uuid"
)

// RepositoryInterface defines the methods that the Repository must implement.
// This interface is used for mocking the repository in tests.
type RepositoryInterface interface {
	// apikey.go
	CreateAPIKey(ctx context.Context, key *models.APIKey) error
	ListAPIKeys(ctx context.Context, tenantID uuid.UUID) ([]*models.APIKey, error)
	GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error)
	GetAPIKeyByPrefix(ctx context.Context, prefix string) (*models.APIKey, error)
	GetAllActiveAPIKeys(ctx context.Context) ([]*models.APIKey, error)
	UpdateAPIKeyLastUsed(ctx context.Context, keyID uuid.UUID) error
	UpdateAPIKey(ctx context.Context, id uuid.UUID, name *string, isActive *bool) error
	DeleteAPIKey(ctx context.Context, id uuid.UUID) error
	GetOrCreateUsageWindow(ctx context.Context, keyID uuid.UUID, endpoint string) (*models.APIKeyUsage, error)
	IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error)
	CleanupOldUsage(ctx context.Context) error

	// team_repository.go
	CountTeamMembers(ctx context.Context, tenantID uuid.UUID) (int, error)
	CreateTeamMember(ctx context.Context, member *models.TeamMember) error
	GetTeamMembers(ctx context.Context, tenantID uuid.UUID) ([]*models.TeamMember, error)
	GetTeamMemberByToken(ctx context.Context, token string) (*models.TeamMember, error)
	GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error)
	UpdateTeamMemberStatus(ctx context.Context, id uuid.UUID, status string, userID *uuid.UUID) error
	UpdateTeamMemberRole(ctx context.Context, id uuid.UUID, role string) error
	DeleteTeamMember(ctx context.Context, id uuid.UUID) error
	GetTeamMemberByID(ctx context.Context, id uuid.UUID) (*models.TeamMember, error)
	GetPendingInvitesByEmail(ctx context.Context, email string) ([]models.TeamMember, error)

	// tenant.go
	CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error)
	GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error)
	UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error)
	DeductQuota(ctx context.Context, tenantID uuid.UUID) error
	AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error
	GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error)
	UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error
	GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error)

	// transaction.go
	CreateTransaction(ctx context.Context, tx *models.Transaction) error
	ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error)
}
