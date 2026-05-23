package repository

import (
	"context"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// MockRepository is a mock implementation of RepositoryInterface
type MockRepository struct {
	mock.Mock
}

// Ensure MockRepository implements RepositoryInterface
var _ RepositoryInterface = (*MockRepository)(nil)

// ============================================================================
// apikey.go
// ============================================================================

func (m *MockRepository) CreateAPIKey(ctx context.Context, key *models.APIKey) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *MockRepository) ListAPIKeys(ctx context.Context, tenantID uuid.UUID) ([]*models.APIKey, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.APIKey), args.Error(1)
}

func (m *MockRepository) GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.APIKey), args.Error(1)
}

func (m *MockRepository) GetAPIKeyByPrefix(ctx context.Context, prefix string) (*models.APIKey, error) {
	args := m.Called(ctx, prefix)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.APIKey), args.Error(1)
}

func (m *MockRepository) GetAllActiveAPIKeys(ctx context.Context) ([]*models.APIKey, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.APIKey), args.Error(1)
}

func (m *MockRepository) UpdateAPIKeyLastUsed(ctx context.Context, keyID uuid.UUID) error {
	args := m.Called(ctx, keyID)
	return args.Error(0)
}

func (m *MockRepository) UpdateAPIKey(ctx context.Context, id uuid.UUID, name *string, isActive *bool) error {
	args := m.Called(ctx, id, name, isActive)
	return args.Error(0)
}

func (m *MockRepository) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) GetOrCreateUsageWindow(ctx context.Context, keyID uuid.UUID, endpoint string) (*models.APIKeyUsage, error) {
	args := m.Called(ctx, keyID, endpoint)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.APIKeyUsage), args.Error(1)
}

func (m *MockRepository) IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error) {
	args := m.Called(ctx, keyID, endpoint)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) CleanupOldUsage(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// ============================================================================
// batch.go
// ============================================================================

func (m *MockRepository) CreateBatch(ctx context.Context, req CreateBatchRequest) (*models.Batch, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Batch), args.Error(1)
}

func (m *MockRepository) GetBatch(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.Batch, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Batch), args.Error(1)
}

func (m *MockRepository) ListBatches(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int) ([]*models.Batch, int, error) {
	args := m.Called(ctx, tenantID, productType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.Batch), args.Int(1), args.Error(2)
}

func (m *MockRepository) DeleteBatch(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) UpdateBatchMetadata(ctx context.Context, id uuid.UUID, domesticValue *float64) error {
	args := m.Called(ctx, id, domesticValue)
	return args.Error(0)
}

func (m *MockRepository) PatchBatchDraft(ctx context.Context, id uuid.UUID, tenantID uuid.UUID, req models.PatchBatchRequest) error {
	args := m.Called(ctx, id, tenantID, req)
	return args.Error(0)
}

func (m *MockRepository) SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error {
	args := m.Called(ctx, batchID, status)
	return args.Error(0)
}

func (m *MockRepository) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) {
	args := m.Called(ctx, batchID)
	return args.Get(0).(models.MarketRegion), args.Error(1)
}

func (m *MockRepository) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) {
	args := m.Called(ctx, batchID)
	return args.Get(0).(uuid.UUID), args.Error(1)
}

func (m *MockRepository) SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte) error {
	args := m.Called(ctx, batchID, tenantID, resultJSON)
	return args.Error(0)
}

func (m *MockRepository) UpdateBatchComplianceResult(ctx context.Context, batchID uuid.UUID, score float64, gapsJSON []byte) error {
	args := m.Called(ctx, batchID, score, gapsJSON)
	return args.Error(0)
}

// ============================================================================
// schema_repository.go
// ============================================================================

func (m *MockRepository) GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error) {
	args := m.Called(ctx, productType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProductSchema), args.Error(1)
}

func (m *MockRepository) GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error) {
	args := m.Called(ctx, productType, version)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProductSchema), args.Error(1)
}

func (m *MockRepository) UpsertProductSchema(ctx context.Context, s *models.ProductSchema) error {
	args := m.Called(ctx, s)
	return args.Error(0)
}

func (m *MockRepository) ListProductSchemas(ctx context.Context) ([]*models.ProductSchema, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ProductSchema), args.Error(1)
}

// ============================================================================
// bulk.go
// ============================================================================

func (m *MockRepository) BulkUpdatePassportStatus(ctx context.Context, passportIDs []uuid.UUID, newStatus string) (int64, error) {
	args := m.Called(ctx, passportIDs, newStatus)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockRepository) BulkDeletePassports(ctx context.Context, passportIDs []uuid.UUID) (int64, error) {
	args := m.Called(ctx, passportIDs)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockRepository) DeleteBatchWithPassports(ctx context.Context, batchID uuid.UUID) (int64, error) {
	args := m.Called(ctx, batchID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockRepository) GetPassportsByIDs(ctx context.Context, passportIDs []uuid.UUID) ([]*struct {
	UUID    uuid.UUID
	BatchID uuid.UUID
}, error) {
	args := m.Called(ctx, passportIDs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*struct {
		UUID    uuid.UUID
		BatchID uuid.UUID
	}), args.Error(1)
}

// ============================================================================
// magic_link.go
// ============================================================================

func (m *MockRepository) CreateMagicLinkToken(ctx context.Context, req CreateMagicLinkTokenRequest) error {
	args := m.Called(ctx, req)
	return args.Error(0)
}

func (m *MockRepository) GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*MagicLinkTokenRecord, error) {
	args := m.Called(ctx, tokenHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*MagicLinkTokenRecord), args.Error(1)
}

func (m *MockRepository) MarkMagicTokenUsed(ctx context.Context, tokenHash string) error {
	args := m.Called(ctx, tokenHash)
	return args.Error(0)
}

func (m *MockRepository) IsMagicTokenUsed(ctx context.Context, tokenHash string) (bool, error) {
	args := m.Called(ctx, tokenHash)
	return args.Bool(0), args.Error(1)
}

func (m *MockRepository) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, email string) error {
	args := m.Called(ctx, passportID, email)
	return args.Error(0)
}

func (m *MockRepository) UpdatePassportRecycledAt(ctx context.Context, passportID uuid.UUID) error {
	args := m.Called(ctx, passportID)
	return args.Error(0)
}

func (m *MockRepository) CleanupExpiredMagicTokens(ctx context.Context) (int, error) {
	args := m.Called(ctx)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error {
	args := m.Called(ctx, tokenHash, required)
	return args.Error(0)
}

func (m *MockRepository) CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error {
	args := m.Called(ctx, tokenHash, otpHash)
	return args.Error(0)
}

func (m *MockRepository) GetMagicLinkOTP(ctx context.Context, tokenHash string) (*OTPRecord, error) {
	args := m.Called(ctx, tokenHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*OTPRecord), args.Error(1)
}

func (m *MockRepository) IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error {
	args := m.Called(ctx, otpID)
	return args.Error(0)
}

func (m *MockRepository) MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error {
	args := m.Called(ctx, otpID)
	return args.Error(0)
}

func (m *MockRepository) RecordOTPResend(ctx context.Context, otpID uuid.UUID) error {
	args := m.Called(ctx, otpID)
	return args.Error(0)
}

func (m *MockRepository) ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error {
	args := m.Called(ctx, tokenHash, newOTPHash)
	return args.Error(0)
}

func (m *MockRepository) CleanupExpiredOTPs(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// ============================================================================
// passport.go
// ============================================================================

func (m *MockRepository) CreatePassport(ctx context.Context, passport *models.Passport) error {
	args := m.Called(ctx, passport)
	return args.Error(0)
}

func (m *MockRepository) CreatePassportsBatch(ctx context.Context, passports []*models.Passport) (int, error) {
	args := m.Called(ctx, passports)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) CreatePassportsWithEvents(ctx context.Context, passports []*models.Passport, events []*models.PassportEvent) (int, error) {
	args := m.Called(ctx, passports, events)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) GetPassport(ctx context.Context, id uuid.UUID) (*models.Passport, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Passport), args.Error(1)
}

func (m *MockRepository) GetPassportWithSpecs(ctx context.Context, id uuid.UUID) (*models.PassportWithSpecs, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PassportWithSpecs), args.Error(1)
}

func (m *MockRepository) GetPassportsByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.Passport, error) {
	args := m.Called(ctx, batchID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Passport), args.Error(1)
}

func (m *MockRepository) CountPassportsByBatch(ctx context.Context, batchID uuid.UUID) (int, error) {
	args := m.Called(ctx, batchID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*PassportListItem, int, error) {
	args := m.Called(ctx, tenantID, status, search, batchID, productType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*PassportListItem), args.Int(1), args.Error(2)
}

func (m *MockRepository) GetPassportStatusCounts(ctx context.Context, tenantID uuid.UUID, batchID string) (map[string]int, error) {
	args := m.Called(ctx, tenantID, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]int), args.Error(1)
}

func (m *MockRepository) FindDuplicateSerials(ctx context.Context, serials []string) ([]DuplicateInfo, error) {
	args := m.Called(ctx, serials)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]DuplicateInfo), args.Error(1)
}

func (m *MockRepository) GetPassportByUUID(ctx context.Context, id uuid.UUID) (*models.Passport, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Passport), args.Error(1)
}

func (m *MockRepository) UpdatePassportStatus(ctx context.Context, id uuid.UUID, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockRepository) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	args := m.Called(ctx, params)
	return args.Error(0)
}

func (m *MockRepository) UpdatePassportLifecycle(ctx context.Context, passport *models.Passport) error {
	args := m.Called(ctx, passport)
	return args.Error(0)
}

func (m *MockRepository) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockRepository) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	args := m.Called(ctx, passportID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PassportEvent), args.Error(1)
}

func (m *MockRepository) GetEventsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.AuditEventRow, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditEventRow), args.Error(1)
}

func (m *MockRepository) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	args := m.Called(ctx, events)
	return args.Error(0)
}

func (m *MockRepository) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error {
	args := m.Called(ctx, passportID, newOwnerID)
	return args.Error(0)
}

func (m *MockRepository) CountPassportsMissingShippedEvent(ctx context.Context, batchID uuid.UUID) (int, error) {
	args := m.Called(ctx, batchID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	args := m.Called(ctx, passportID, entryJSON)
	return args.Error(0)
}

func (m *MockRepository) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	args := m.Called(ctx, passportID, entryJSON)
	return args.Error(0)
}

func (m *MockRepository) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	args := m.Called(ctx, passportID, entryJSON)
	return args.Error(0)
}

func (m *MockRepository) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	args := m.Called(ctx, passportID, entryJSON)
	return args.Error(0)
}

func (m *MockRepository) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) {
	args := m.Called(ctx, batchID, tenantID)
	if ids, ok := args.Get(0).([]uuid.UUID); ok {
		return ids, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockRepository) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, ts time.Time) error {
	args := m.Called(ctx, passportID, soh, ts)
	return args.Error(0)
}

func (m *MockRepository) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	args := m.Called(ctx, entry)
	return args.Error(0)
}

func (m *MockRepository) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	args := m.Called(ctx, passportID)
	if v := args.Get(0); v != nil {
		return v.([]models.SoHHistoryEntry), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockRepository) SetRecyclingInfo(ctx context.Context, passportID uuid.UUID, status, recyclerEprID string, date time.Time) error {
	args := m.Called(ctx, passportID, status, recyclerEprID, date)
	return args.Error(0)
}

// ============================================================================
// reward.go
// ============================================================================

func (m *MockRepository) CreateRewardEntry(ctx context.Context, entry *models.RewardLedger) error {
	args := m.Called(ctx, entry)
	return args.Error(0)
}

func (m *MockRepository) GetRewardBalance(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error) {
	args := m.Called(ctx, tenantID, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RewardBalance), args.Error(1)
}

func (m *MockRepository) GetRewardLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.RewardBalance), args.Error(1)
}

func (m *MockRepository) GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error) {
	args := m.Called(ctx, tenantID, email, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.RewardLedger), args.Error(1)
}

// ============================================================================
// scan.go
// ============================================================================

func (m *MockRepository) CreateScanEvent(ctx context.Context, event *models.ScanEvent) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockRepository) GetLastScanTime(ctx context.Context, passportID uuid.UUID) (*time.Time, error) {
	args := m.Called(ctx, passportID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*time.Time), args.Error(1)
}

func (m *MockRepository) GetScanFeed(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.ScanFeedItem, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ScanFeedItem), args.Error(1)
}

func (m *MockRepository) GetDashboardStats(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.DashboardStats, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DashboardStats), args.Error(1)
}

func (m *MockRepository) GetRecentBatches(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchSummary, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.BatchSummary), args.Error(1)
}

// ============================================================================
// team_repository.go
// ============================================================================

func (m *MockRepository) CountTeamMembers(ctx context.Context, tenantID uuid.UUID) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) CreateTeamMember(ctx context.Context, member *models.TeamMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockRepository) GetTeamMembers(ctx context.Context, tenantID uuid.UUID) ([]*models.TeamMember, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TeamMember), args.Error(1)
}

func (m *MockRepository) GetTeamMemberByToken(ctx context.Context, token string) (*models.TeamMember, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TeamMember), args.Error(1)
}

func (m *MockRepository) GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error) {
	args := m.Called(ctx, tenantID, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TeamMember), args.Error(1)
}

func (m *MockRepository) UpdateTeamMemberStatus(ctx context.Context, id uuid.UUID, status string, userID *uuid.UUID) error {
	args := m.Called(ctx, id, status, userID)
	return args.Error(0)
}

func (m *MockRepository) UpdateTeamMemberRole(ctx context.Context, id uuid.UUID, role string) error {
	args := m.Called(ctx, id, role)
	return args.Error(0)
}

func (m *MockRepository) DeleteTeamMember(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) GetTeamMemberByID(ctx context.Context, id uuid.UUID) (*models.TeamMember, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TeamMember), args.Error(1)
}

func (m *MockRepository) GetPendingInvitesByEmail(ctx context.Context, email string) ([]models.TeamMember, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.TeamMember), args.Error(1)
}

// ============================================================================
// template.go
// ============================================================================

func (m *MockRepository) CreateTemplate(ctx context.Context, tenantID uuid.UUID, name string, productType models.ProductType, marketRegion models.MarketRegion, specs models.BatchSpec) (*models.Template, error) {
	args := m.Called(ctx, tenantID, name, productType, marketRegion, specs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Template), args.Error(1)
}

func (m *MockRepository) ListTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.Template, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Template), args.Error(1)
}

func (m *MockRepository) GetTemplate(ctx context.Context, id uuid.UUID) (*models.Template, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Template), args.Error(1)
}

func (m *MockRepository) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// ============================================================================
// tenant.go
// ============================================================================

func (m *MockRepository) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) {
	args := m.Called(ctx, companyName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockRepository) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockRepository) UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockRepository) DeductQuota(ctx context.Context, tenantID uuid.UUID) error {
	args := m.Called(ctx, tenantID)
	return args.Error(0)
}

func (m *MockRepository) AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error {
	args := m.Called(ctx, tenantID, amount)
	return args.Error(0)
}

func (m *MockRepository) GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) UpdateCertificatePath(ctx context.Context, tenantID uuid.UUID, docType string, path string) error {
	args := m.Called(ctx, tenantID, docType, path)
	return args.Error(0)
}

func (m *MockRepository) UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error {
	args := m.Called(ctx, tenantID, docType, status)
	return args.Error(0)
}

func (m *MockRepository) UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error {
	args := m.Called(ctx, tenantID, logoURL)
	return args.Error(0)
}

func (m *MockRepository) GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockRepository) NextSequence(ctx context.Context, prefix string) (int, error) {
	args := m.Called(ctx, prefix)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) NextSequenceBatch(ctx context.Context, prefix string, count int) (int, error) {
	args := m.Called(ctx, prefix, count)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) GetOrCreateManufacturerCode(ctx context.Context, tenantID uuid.UUID, companyName string) (string, error) {
	args := m.Called(ctx, tenantID, companyName)
	return args.String(0), args.Error(1)
}

// ============================================================================
// transaction.go
// ============================================================================

func (m *MockRepository) CreateTransaction(ctx context.Context, tx *models.Transaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockRepository) ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Transaction), args.Error(1)
}

// ============================================================================
// trusted_domain.go
// ============================================================================

func (m *MockRepository) CreateTrustedDomain(ctx context.Context, domain *models.TrustedDomain) error {
	args := m.Called(ctx, domain)
	return args.Error(0)
}

func (m *MockRepository) GetTrustedDomainByDomain(ctx context.Context, tenantID uuid.UUID, domain string) (*models.TrustedDomain, error) {
	args := m.Called(ctx, tenantID, domain)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TrustedDomain), args.Error(1)
}

func (m *MockRepository) GetTrustedDomainsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TrustedDomain, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TrustedDomain), args.Error(1)
}

func (m *MockRepository) DeleteTrustedDomain(ctx context.Context, tenantID, domainID uuid.UUID) error {
	args := m.Called(ctx, tenantID, domainID)
	return args.Error(0)
}

func (m *MockRepository) UpdateTrustedDomainActive(ctx context.Context, tenantID, domainID uuid.UUID, isActive bool) error {
	args := m.Called(ctx, tenantID, domainID, isActive)
	return args.Error(0)
}

func (m *MockRepository) LookupTrustedDomainByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TrustedDomain, error) {
	args := m.Called(ctx, tenantID, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TrustedDomain), args.Error(1)
}

// ============================================================================
// trusted_partners.go
// ============================================================================

func (m *MockRepository) CheckTrustedPartner(ctx context.Context, email string) (*TrustedPartner, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TrustedPartner), args.Error(1)
}

func (m *MockRepository) ValidatePartnerCode(ctx context.Context, code string) (*PartnerCode, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*PartnerCode), args.Error(1)
}

func (m *MockRepository) IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error {
	args := m.Called(ctx, codeID, email, passportID)
	return args.Error(0)
}

func (m *MockRepository) VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*VerificationResult, error) {
	args := m.Called(ctx, email, partnerCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*VerificationResult), args.Error(1)
}

func (m *MockRepository) CreateTrustedPartner(ctx context.Context, partner *TrustedPartner) error {
	args := m.Called(ctx, partner)
	return args.Error(0)
}

func (m *MockRepository) ListTrustedPartners(ctx context.Context, tenantID uuid.UUID) ([]*TrustedPartner, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*TrustedPartner), args.Error(1)
}

func (m *MockRepository) DeleteTrustedPartner(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) CreatePartnerCode(ctx context.Context, code *PartnerCode) error {
	args := m.Called(ctx, code)
	return args.Error(0)
}

func (m *MockRepository) ListPartnerCodes(ctx context.Context, tenantID uuid.UUID) ([]*PartnerCode, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*PartnerCode), args.Error(1)
}

func (m *MockRepository) DeactivatePartnerCode(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// ============================================================================
// device_tokens.go
// ============================================================================

func (m *MockRepository) CreateDeviceToken(ctx context.Context, token *DeviceToken) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *MockRepository) GetDeviceTokenByHash(ctx context.Context, hash string) (*DeviceToken, error) {
	args := m.Called(ctx, hash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*DeviceToken), args.Error(1)
}

func (m *MockRepository) ListDeviceTokens(ctx context.Context, tenantID uuid.UUID) ([]*DeviceToken, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*DeviceToken), args.Error(1)
}

func (m *MockRepository) RevokeDeviceToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) UpdateDeviceTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	args := m.Called(ctx, tokenID)
	return args.Error(0)
}

// ============================================================================
// telemetry.go
// ============================================================================

func (m *MockRepository) InsertTelemetry(ctx context.Context, reading *TelemetryReading) error {
	args := m.Called(ctx, reading)
	return args.Error(0)
}

func (m *MockRepository) UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error {
	args := m.Called(ctx, passportID, soh, cycleCount, temp, voltage, thermalIncrement, recordedAt)
	return args.Error(0)
}

func (m *MockRepository) GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*TelemetryReading, int, error) {
	args := m.Called(ctx, passportID, limit, offset, from, to)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*TelemetryReading), args.Int(1), args.Error(2)
}

// ============================================================================
// data_access.go
// ============================================================================

func (m *MockRepository) CreateDataAccessToken(ctx context.Context, req CreateDataAccessTokenRequest) (*DataAccessToken, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*DataAccessToken), args.Error(1)
}

func (m *MockRepository) GetDataAccessTokenByHash(ctx context.Context, tokenHash string) (*DataAccessToken, error) {
	args := m.Called(ctx, tokenHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*DataAccessToken), args.Error(1)
}

func (m *MockRepository) ListDataAccessTokens(ctx context.Context, tenantID uuid.UUID) ([]*DataAccessToken, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*DataAccessToken), args.Error(1)
}

func (m *MockRepository) RevokeDataAccessToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) UpdateDataAccessTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	args := m.Called(ctx, tokenID)
	return args.Error(0)
}

// ============================================================================
// epr_certificate_repository.go
// ============================================================================

func (m *MockRepository) CreateEPRCertificate(ctx context.Context, cert *models.EPRCertificate) error {
	args := m.Called(ctx, cert)
	return args.Error(0)
}

func (m *MockRepository) ListEPRCertificates(ctx context.Context, tenantID uuid.UUID, financialYear string) ([]*models.EPRCertificate, error) {
	args := m.Called(ctx, tenantID, financialYear)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.EPRCertificate), args.Error(1)
}

func (m *MockRepository) GetEPRCertificateSummary(ctx context.Context, tenantID uuid.UUID, financialYear string) (float64, int, error) {
	args := m.Called(ctx, tenantID, financialYear)
	return args.Get(0).(float64), args.Int(1), args.Error(2)
}

func (m *MockRepository) RetireEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) DeleteEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

// ============================================================================
// passport_documents.go
// ============================================================================

func (m *MockRepository) InsertPassportDocument(ctx context.Context, doc *PassportDocument) error {
	args := m.Called(ctx, doc)
	return args.Error(0)
}

func (m *MockRepository) GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*PassportDocument, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*PassportDocument), args.Error(1)
}

func (m *MockRepository) LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error {
	args := m.Called(ctx, docID, eventID)
	return args.Error(0)
}

func (m *MockRepository) ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*PassportDocument, error) {
	args := m.Called(ctx, passportID, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*PassportDocument), args.Error(1)
}