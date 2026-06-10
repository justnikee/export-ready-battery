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

func (m *MockRepository) GetBatchesChartData(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchChartData, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.BatchChartData), args.Error(1)
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

func (m *MockRepository) SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte, carbonClass string) error {
	args := m.Called(ctx, batchID, tenantID, resultJSON, carbonClass)
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

func (m *MockRepository) GetActiveComplianceRules(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceRule, error) {
	args := m.Called(ctx, productType, marketRegion)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ComplianceRule), args.Error(1)
}

func (m *MockRepository) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) {
	args := m.Called(ctx, productType, marketRegion)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ComplianceDeadline), args.Error(1)
}

func (m *MockRepository) GetAllFactors(ctx context.Context) ([]models.CarbonFactor, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.CarbonFactor), args.Error(1)
}

func (m *MockRepository) GetFactorByCategoryAndSubcategory(ctx context.Context, category, subcategory string) (*models.CarbonFactor, error) {
	args := m.Called(ctx, category, subcategory)
	if args.Get(0) == nil {
		return nil, args.Error(1)
}
	return args.Get(0).(*models.CarbonFactor), args.Error(1)
}

func (m *MockRepository) GetFactorsByCategory(ctx context.Context, category string) ([]models.CarbonFactor, error) {
	args := m.Called(ctx, category)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.CarbonFactor), args.Error(1)
}

func (m *MockRepository) CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error {
	args := m.Called(ctx, wh)
	return args.Error(0)
}

func (m *MockRepository) ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.OutboundWebhook), args.Error(1)
}

func (m *MockRepository) GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.OutboundWebhook), args.Error(1)
}

func (m *MockRepository) GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error) {
	args := m.Called(ctx, tenantID, eventType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.OutboundWebhook), args.Error(1)
}

func (m *MockRepository) IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error {
	args := m.Called(ctx, id, at)
	return args.Error(0)
}

func (m *MockRepository) DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) CreateSignupRequest(ctx context.Context, req *models.SignupRequest) error {
	args := m.Called(ctx, req)
	return args.Error(0)
}

func (m *MockRepository) GetSignupRequestByEmail(ctx context.Context, email string) (*models.SignupRequest, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SignupRequest), args.Error(1)
}

func (m *MockRepository) ListSignupRequests(ctx context.Context, status string, limit, offset int) ([]*models.SignupRequest, int, error) {
	args := m.Called(ctx, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.SignupRequest), args.Int(1), args.Error(2)
}

func (m *MockRepository) UpdateSignupRequestStatus(ctx context.Context, id uuid.UUID, status, reason string, reviewedBy uuid.UUID) error {
	args := m.Called(ctx, id, status, reason, reviewedBy)
	return args.Error(0)
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

func (m *MockRepository) GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.AnalyticsOverview, error) {
	args := m.Called(ctx, tenantID, productType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AnalyticsOverview), args.Error(1)
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

func (m *MockRepository) TransactionExistsForPayment(ctx context.Context, paymentID string) (bool, error) {
	args := m.Called(ctx, paymentID)
	return args.Bool(0), args.Error(1)
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

func (m *MockRepository) CreateCertificateAnchor(ctx context.Context, anchor *models.CertificateAnchor) error {
	args := m.Called(ctx, anchor)
	return args.Error(0)
}

func (m *MockRepository) GetCertificateAnchorsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.CertificateAnchor, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CertificateAnchor), args.Error(1)
}

func (m *MockRepository) GetAnchorsNeedingUpgrade(ctx context.Context) ([]*models.CertificateAnchor, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CertificateAnchor), args.Error(1)
}

func (m *MockRepository) UpdateCertificateAnchorStatus(ctx context.Context, id string, status string, otsProof, bitcoinTxID *string, anchoredAt *time.Time) error {
	args := m.Called(ctx, id, status, otsProof, bitcoinTxID, anchoredAt)
	return args.Error(0)
}

func (m *MockRepository) ListAllBatches(ctx context.Context, productType models.ProductType, limit, offset int) ([]*models.Batch, error) {
	args := m.Called(ctx, productType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Batch), args.Error(1)
}

func (m *MockRepository) CreateAlert(ctx context.Context, alert *models.TenantAlert) error {
	args := m.Called(ctx, alert)
	return args.Error(0)
}

func (m *MockRepository) GetAlertsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantAlert, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TenantAlert), args.Error(1)
}

func (m *MockRepository) GetUnreadAlerts(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.TenantAlert, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TenantAlert), args.Error(1)
}

func (m *MockRepository) GetUnreadAlertCount(ctx context.Context, tenantID uuid.UUID) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) MarkAlertRead(ctx context.Context, alertID uuid.UUID) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

func (m *MockRepository) MarkAlertEmailed(ctx context.Context, alertID uuid.UUID) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

func (m *MockRepository) HasRecentAlert(ctx context.Context, tenantID uuid.UUID, alertType string, resourceID *string, within time.Duration) (bool, error) {
	args := m.Called(ctx, tenantID, alertType, resourceID, within)
	return args.Bool(0), args.Error(1)
}

func (m *MockRepository) CreatePassportVC(ctx context.Context, vc *models.PassportVC) error {
	args := m.Called(ctx, vc)
	return args.Error(0)
}

func (m *MockRepository) GetPassportVCByPassportID(ctx context.Context, passportID uuid.UUID) (*models.PassportVC, error) {
	args := m.Called(ctx, passportID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PassportVC), args.Error(1)
}

// ============================================================================
// mass_balance.go
// ============================================================================

func (m *MockRepository) CreateMassBalanceLedger(ctx context.Context, ledger *models.MassBalanceLedger) error {
	args := m.Called(ctx, ledger)
	return args.Error(0)
}

func (m *MockRepository) GetMassBalanceLedgersByTenant(ctx context.Context, tenantID uuid.UUID, materialType string) ([]*models.MassBalanceLedger, error) {
	args := m.Called(ctx, tenantID, materialType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.MassBalanceLedger), args.Error(1)
}

func (m *MockRepository) GetMassBalanceLedgerByID(ctx context.Context, id uuid.UUID) (*models.MassBalanceLedger, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MassBalanceLedger), args.Error(1)
}

func (m *MockRepository) UpdateMassBalanceLedger(ctx context.Context, id uuid.UUID, incomingDelta, allocatedDelta float64) error {
	args := m.Called(ctx, id, incomingDelta, allocatedDelta)
	return args.Error(0)
}

func (m *MockRepository) CreateMassBalanceAllocation(ctx context.Context, allocation *models.MassBalanceAllocation) error {
	args := m.Called(ctx, allocation)
	return args.Error(0)
}

func (m *MockRepository) GetMassBalanceAllocationsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.MassBalanceAllocation, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.MassBalanceAllocation), args.Error(1)
}

func (m *MockRepository) CreateTallyImportLog(ctx context.Context, log *TallyImportLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockRepository) GetTallyImportLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*TallyImportLog, int, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*TallyImportLog), args.Int(1), args.Error(2)
}

func (m *MockRepository) UpsertTallySyncConfig(ctx context.Context, cfg *TallySyncConfig) error {
	args := m.Called(ctx, cfg)
	return args.Error(0)
}

func (m *MockRepository) GetTallySyncConfig(ctx context.Context, tenantID uuid.UUID) (*TallySyncConfig, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TallySyncConfig), args.Error(1)
}

func (m *MockRepository) ListEnabledTallySyncConfigs(ctx context.Context) ([]*TallySyncConfig, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*TallySyncConfig), args.Error(1)
}

func (m *MockRepository) UpdateTallySyncLastSync(ctx context.Context, tenantID uuid.UUID, t time.Time) error {
	args := m.Called(ctx, tenantID, t)
	return args.Error(0)
}

func (m *MockRepository) CreateTallySyncStaging(ctx context.Context, item *TallySyncStaging) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockRepository) GetTallySyncStagingByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*TallySyncStaging, int, error) {
	args := m.Called(ctx, tenantID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*TallySyncStaging), args.Int(1), args.Error(2)
}

func (m *MockRepository) GetTallySyncStagingByID(ctx context.Context, id, tenantID uuid.UUID) (*TallySyncStaging, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*TallySyncStaging), args.Error(1)
}

func (m *MockRepository) ApplyTallySyncStaging(ctx context.Context, id, tenantID, batchID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID, batchID)
	return args.Error(0)
}

func (m *MockRepository) DiscardTallySyncStaging(ctx context.Context, id, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) CreateTallySyncRun(ctx context.Context, run *TallySyncRun) error {
	args := m.Called(ctx, run)
	return args.Error(0)
}

func (m *MockRepository) UpdateTallySyncRun(ctx context.Context, id uuid.UUID, status, errorMsg string, fetched, staged int) error {
	args := m.Called(ctx, id, status, errorMsg, fetched, staged)
	return args.Error(0)
}

func (m *MockRepository) CreateComponent(ctx context.Context, c *Component) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}

func (m *MockRepository) GetComponent(ctx context.Context, id, tenantID uuid.UUID) (*Component, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Component), args.Error(1)
}

func (m *MockRepository) UpdateComponent(ctx context.Context, c *Component) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}

func (m *MockRepository) DeleteComponent(ctx context.Context, id, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) ListComponentsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*Component, error) {
	args := m.Called(ctx, batchID, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*Component), args.Error(1)
}

func (m *MockRepository) GetComponentTreeByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*ComponentTreeNode, error) {
	args := m.Called(ctx, batchID, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*ComponentTreeNode), args.Error(1)
}

// ============================================================================
// dgft_claims.go
// ============================================================================

func (m *MockRepository) ListDGFTSchemeConfigs(ctx context.Context) ([]models.DGFTSchemeConfig, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.DGFTSchemeConfig), args.Error(1)
}

func (m *MockRepository) CreateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error {
	args := m.Called(ctx, claim)
	return args.Error(0)
}

func (m *MockRepository) GetDGFTClaimByID(ctx context.Context, id, tenantID uuid.UUID) (*models.DGFTClaim, error) {
	args := m.Called(ctx, id, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DGFTClaim), args.Error(1)
}

func (m *MockRepository) UpdateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error {
	args := m.Called(ctx, claim)
	return args.Error(0)
}

func (m *MockRepository) DeleteDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) ListDGFTClaimsByTenant(ctx context.Context, tenantID uuid.UUID, schemeType, status string, page, pageSize int) ([]models.DGFTClaim, int, error) {
	args := m.Called(ctx, tenantID, schemeType, status, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]models.DGFTClaim), args.Int(1), args.Error(2)
}

func (m *MockRepository) SubmitDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error {
	args := m.Called(ctx, id, tenantID)
	return args.Error(0)
}

func (m *MockRepository) AddDGFTClaimDocument(ctx context.Context, id, tenantID uuid.UUID, doc models.DGFTClaimDocument) error {
	args := m.Called(ctx, id, tenantID, doc)
	return args.Error(0)
}

func (m *MockRepository) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error {
	args := m.Called(ctx, v)
	return args.Error(0)
}

func (m *MockRepository) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.RegistryVerification), args.Error(1)
}

func (m *MockRepository) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) {
	args := m.Called(ctx, batchID, registryType, certificateNo)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RegistryVerification), args.Error(1)
}

func (m *MockRepository) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockRepository) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error {
	args := m.Called(ctx, j)
	return args.Error(0)
}

func (m *MockRepository) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) {
	args := m.Called(ctx, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.RegistryJob), args.Error(1)
}

func (m *MockRepository) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RegistryJob), args.Error(1)
}

func (m *MockRepository) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.RegistryJob), args.Error(1)
}

func (m *MockRepository) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error {
	args := m.Called(ctx, id, status, attemptCount, nextAttemptAt, resultStatus, resultTrustTier, resultID, errorMessage)
	return args.Error(0)
}

func (m *MockRepository) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error {
	args := m.Called(ctx, a)
	return args.Error(0)
}

func (m *MockRepository) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) {
	args := m.Called(ctx, registryType, certificateNo)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.RegistryAuditLog), args.Error(1)
}

func (m *MockRepository) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) {
	args := m.Called(ctx, jobID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.RegistryAuditLog), args.Error(1)
}

func (m *MockRepository) CreateSupplier(ctx context.Context, supplier *models.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *MockRepository) GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockRepository) GetSupplierByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.Supplier, error) {
	args := m.Called(ctx, tenantID, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockRepository) GetSupplierByInvitationToken(ctx context.Context, token string) (*models.Supplier, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockRepository) ListSuppliersByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.Supplier, error) {
	args := m.Called(ctx, tenantID, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Supplier), args.Error(1)
}

func (m *MockRepository) UpdateSupplierStatus(ctx context.Context, id uuid.UUID, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockRepository) UpdateSupplierAcceptance(ctx context.Context, id uuid.UUID, passwordHash string) error {
	args := m.Called(ctx, id, passwordHash)
	return args.Error(0)
}

func (m *MockRepository) UpdateSupplierLastLogin(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepository) CreateSupplierDocument(ctx context.Context, doc *models.SupplierDocument) error {
	args := m.Called(ctx, doc)
	return args.Error(0)
}

func (m *MockRepository) GetSupplierDocumentByID(ctx context.Context, id uuid.UUID) (*models.SupplierDocument, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SupplierDocument), args.Error(1)
}

func (m *MockRepository) ListSupplierDocuments(ctx context.Context, supplierID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	args := m.Called(ctx, supplierID, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SupplierDocument), args.Error(1)
}

func (m *MockRepository) ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	args := m.Called(ctx, tenantID, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SupplierDocument), args.Error(1)
}

func (m *MockRepository) UpdateSupplierDocumentStatus(ctx context.Context, id uuid.UUID, status, reviewerNotes string, reviewedBy uuid.UUID) error {
	args := m.Called(ctx, id, status, reviewerNotes, reviewedBy)
	return args.Error(0)
}


// ============================================================================
// Due Diligence Engine Mocks (Phase B)
// ============================================================================

func (m *MockRepository) CreateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error {
	args := m.Called(ctx, p)
	return args.Error(0)
}

func (m *MockRepository) GetSupplierRiskProfileBySupplier(ctx context.Context, supplierID uuid.UUID) (*models.SupplierRiskProfile, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SupplierRiskProfile), args.Error(1)
}

func (m *MockRepository) UpdateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error {
	args := m.Called(ctx, p)
	return args.Error(0)
}

func (m *MockRepository) ListSupplierRiskProfilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.SupplierRiskProfile, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SupplierRiskProfile), args.Error(1)
}

func (m *MockRepository) CreateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error {
	args := m.Called(ctx, a)
	return args.Error(0)
}

func (m *MockRepository) GetDueDiligenceAssessmentsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.DueDiligenceAssessment, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.DueDiligenceAssessment), args.Error(1)
}

func (m *MockRepository) GetDueDiligenceAssessmentByID(ctx context.Context, id uuid.UUID) (*models.DueDiligenceAssessment, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DueDiligenceAssessment), args.Error(1)
}

func (m *MockRepository) UpdateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error {
	args := m.Called(ctx, a)
	return args.Error(0)
}

func (m *MockRepository) CreateSupplierCMRTReport(ctx context.Context, rep *models.SupplierCMRTReport) error {
	args := m.Called(ctx, rep)
	return args.Error(0)
}

func (m *MockRepository) GetSupplierCMRTReports(ctx context.Context, supplierID uuid.UUID) ([]models.SupplierCMRTReport, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SupplierCMRTReport), args.Error(1)
}

func (m *MockRepository) GetLatestSupplierCMRTReport(ctx context.Context, supplierID uuid.UUID) (*models.SupplierCMRTReport, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SupplierCMRTReport), args.Error(1)
}

func (m *MockRepository) CreateCorrectiveAction(ctx context.Context, ca *models.CorrectiveAction) error {
	args := m.Called(ctx, ca)
	return args.Error(0)
}

func (m *MockRepository) GetCorrectiveActionByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CorrectiveAction), args.Error(1)
}

func (m *MockRepository) ListCorrectiveActionsByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.CorrectiveAction, error) {
	args := m.Called(ctx, tenantID, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.CorrectiveAction), args.Error(1)
}

func (m *MockRepository) ListCorrectiveActionsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.CorrectiveAction, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.CorrectiveAction), args.Error(1)
}

func (m *MockRepository) UpdateCorrectiveActionStatus(ctx context.Context, id uuid.UUID, status string, remediatedAt interface{}, verifiedBy interface{}) error {
	args := m.Called(ctx, id, status, remediatedAt, verifiedBy)
	return args.Error(0)
}

func (m *MockRepository) GetSupplierRiskProfilesBySuppliers(ctx context.Context, tenantID uuid.UUID, supplierIDs []uuid.UUID) ([]models.SupplierRiskProfile, error) {
	args := m.Called(ctx, tenantID, supplierIDs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SupplierRiskProfile), args.Error(1)
}


// Regulatory sources mock methods

func (m *MockRepository) CreateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error {
	args := m.Called(ctx, s)
	return args.Error(0)
}

func (m *MockRepository) ListRegulatorySources(ctx context.Context, activeOnly bool) ([]*models.RegulatorySource, error) {
	args := m.Called(ctx, activeOnly)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.RegulatorySource), args.Error(1)
}

func (m *MockRepository) GetRegulatorySourceByID(ctx context.Context, id uuid.UUID) (*models.RegulatorySource, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RegulatorySource), args.Error(1)
}

func (m *MockRepository) UpdateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error {
	args := m.Called(ctx, s)
	return args.Error(0)
}

func (m *MockRepository) UpdateRegulatorySourceFetchMeta(ctx context.Context, id uuid.UUID, fetchedAt time.Time, etag string) error {
	args := m.Called(ctx, id, fetchedAt, etag)
	return args.Error(0)
}

func (m *MockRepository) DeleteRegulatorySource(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Regulatory items mock methods

func (m *MockRepository) UpsertRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockRepository) GetRegulatoryItemBySourceAndExternalID(ctx context.Context, sourceID uuid.UUID, externalID string) (*models.RegulatoryItem, error) {
	args := m.Called(ctx, sourceID, externalID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RegulatoryItem), args.Error(1)
}

func (m *MockRepository) ListRegulatoryItems(ctx context.Context, f ListRegulatoryItemsFilter) ([]*models.RegulatoryItem, int, error) {
	args := m.Called(ctx, f)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*models.RegulatoryItem), args.Int(1), args.Error(2)
}

func (m *MockRepository) GetRegulatoryItemByID(ctx context.Context, id uuid.UUID) (*models.RegulatoryItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RegulatoryItem), args.Error(1)
}

// Tenant regulatory alerts mock methods

func (m *MockRepository) CreateTenantRegulatoryAlert(ctx context.Context, alert *models.TenantRegulatoryAlert) error {
	args := m.Called(ctx, alert)
	return args.Error(0)
}

func (m *MockRepository) GetTenantRegulatoryAlerts(ctx context.Context, tenantID uuid.UUID, unreadOnly bool, limit, offset int) ([]*models.TenantRegulatoryAlert, int, error) {
	args := m.Called(ctx, tenantID, unreadOnly, limit, offset)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*models.TenantRegulatoryAlert), args.Int(1), args.Error(2)
}

func (m *MockRepository) GetTenantRegulatoryAlertUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockRepository) MarkTenantRegulatoryAlertRead(ctx context.Context, alertID uuid.UUID) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

func (m *MockRepository) MarkTenantRegulatoryAlertDismissed(ctx context.Context, alertID uuid.UUID) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

func (m *MockRepository) ListTenantsForRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) ([]uuid.UUID, error) {
	args := m.Called(ctx, item)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]uuid.UUID), args.Error(1)
}
