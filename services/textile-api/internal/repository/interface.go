package repository

import (
	"context"
	"time"

	"github.com/anvayalabs/textile-api/internal/models"

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

	// batch.go
	CreateBatch(ctx context.Context, req CreateBatchRequest) (*models.Batch, error)
	GetBatch(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.Batch, error)
	ListBatches(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int) ([]*models.Batch, int, error)
	DeleteBatch(ctx context.Context, id uuid.UUID) error
	UpdateBatchMetadata(ctx context.Context, id uuid.UUID, domesticValue *float64) error
	PatchBatchDraft(ctx context.Context, id uuid.UUID, tenantID uuid.UUID, req models.PatchBatchRequest) error
	SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error
	GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error)
	GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error)
	SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte) error
	UpdateBatchComplianceResult(ctx context.Context, batchID uuid.UUID, score float64, gapsJSON []byte) error

	// schema_repository.go
	GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error)
	GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error)
	UpsertProductSchema(ctx context.Context, s *models.ProductSchema) error
	ListProductSchemas(ctx context.Context) ([]*models.ProductSchema, error)

	// bulk.go
	BulkUpdatePassportStatus(ctx context.Context, passportIDs []uuid.UUID, newStatus string) (int64, error)
	BulkDeletePassports(ctx context.Context, passportIDs []uuid.UUID) (int64, error)
	DeleteBatchWithPassports(ctx context.Context, batchID uuid.UUID) (int64, error)
	GetPassportsByIDs(ctx context.Context, passportIDs []uuid.UUID) ([]*struct {
		UUID    uuid.UUID
		BatchID uuid.UUID
	}, error)

	// magic_link.go
	CreateMagicLinkToken(ctx context.Context, req CreateMagicLinkTokenRequest) error
	GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*MagicLinkTokenRecord, error)
	MarkMagicTokenUsed(ctx context.Context, tokenHash string) error
	IsMagicTokenUsed(ctx context.Context, tokenHash string) (bool, error)
	UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, email string) error
	UpdatePassportRecycledAt(ctx context.Context, passportID uuid.UUID) error
	CleanupExpiredMagicTokens(ctx context.Context) (int, error)
	// Phase 7: OTP methods
	SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error
	CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error
	GetMagicLinkOTP(ctx context.Context, tokenHash string) (*OTPRecord, error)
	IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error
	MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error
	RecordOTPResend(ctx context.Context, otpID uuid.UUID) error
	ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error
	CleanupExpiredOTPs(ctx context.Context) error

	// passport.go
	CreatePassport(ctx context.Context, passport *models.Passport) error
	CreatePassportsBatch(ctx context.Context, passports []*models.Passport) (int, error)
	CreatePassportsWithEvents(ctx context.Context, passports []*models.Passport, events []*models.PassportEvent) (int, error)
	GetPassport(ctx context.Context, id uuid.UUID) (*models.Passport, error)
	GetPassportWithSpecs(ctx context.Context, id uuid.UUID) (*models.PassportWithSpecs, error)
	GetPassportsByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.Passport, error)
	CountPassportsByBatch(ctx context.Context, batchID uuid.UUID) (int, error)
	ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*PassportListItem, int, error)
	GetPassportStatusCounts(ctx context.Context, tenantID uuid.UUID, batchID string) (map[string]int, error)
	FindDuplicateSerials(ctx context.Context, serials []string) ([]DuplicateInfo, error)
	GetPassportByUUID(ctx context.Context, id uuid.UUID) (*models.Passport, error)
	UpdatePassportStatus(ctx context.Context, id uuid.UUID, status string) error
	ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error
	UpdatePassportLifecycle(ctx context.Context, passport *models.Passport) error
	CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error
	GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error)
	GetEventsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.AuditEventRow, error)
	CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error
	UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error
	CountPassportsMissingShippedEvent(ctx context.Context, batchID uuid.UUID) (int, error)
	AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, ts time.Time) error
	AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error
	GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error)
	SetRecyclingInfo(ctx context.Context, passportID uuid.UUID, status, recyclerEprID string, date time.Time) error

	// reward.go
	CreateRewardEntry(ctx context.Context, entry *models.RewardLedger) error
	GetRewardBalance(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error)
	GetRewardLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error)
	GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error)

	// scan.go
	CreateScanEvent(ctx context.Context, event *models.ScanEvent) error
	GetLastScanTime(ctx context.Context, passportID uuid.UUID) (*time.Time, error)
	GetScanFeed(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.ScanFeedItem, error)
	GetDashboardStats(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.DashboardStats, error)
	GetRecentBatches(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchSummary, error)

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

	// template.go
	CreateTemplate(ctx context.Context, tenantID uuid.UUID, name string, productType models.ProductType, marketRegion models.MarketRegion, specs models.BatchSpec) (*models.Template, error)
	ListTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.Template, error)
	GetTemplate(ctx context.Context, id uuid.UUID) (*models.Template, error)
	DeleteTemplate(ctx context.Context, id uuid.UUID) error

	// tenant.go
	CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error)
	GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error)
	UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error)
	DeductQuota(ctx context.Context, tenantID uuid.UUID) error
	AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error
	GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error)
	UpdateCertificatePath(ctx context.Context, tenantID uuid.UUID, docType string, path string) error
	UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error
	UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error
	GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error)
	NextSequence(ctx context.Context, prefix string) (int, error)
	NextSequenceBatch(ctx context.Context, prefix string, count int) (int, error)
	GetOrCreateManufacturerCode(ctx context.Context, tenantID uuid.UUID, companyName string) (string, error)

	// transaction.go
	CreateTransaction(ctx context.Context, tx *models.Transaction) error
	ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error)

	// trusted_domain.go
	CreateTrustedDomain(ctx context.Context, domain *models.TrustedDomain) error
	GetTrustedDomainByDomain(ctx context.Context, tenantID uuid.UUID, domain string) (*models.TrustedDomain, error)
	GetTrustedDomainsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TrustedDomain, error)
	DeleteTrustedDomain(ctx context.Context, tenantID, domainID uuid.UUID) error
	UpdateTrustedDomainActive(ctx context.Context, tenantID, domainID uuid.UUID, isActive bool) error
	LookupTrustedDomainByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TrustedDomain, error)

	// trusted_partners.go
	CheckTrustedPartner(ctx context.Context, email string) (*TrustedPartner, error)
	ValidatePartnerCode(ctx context.Context, code string) (*PartnerCode, error)
	IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error
	VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*VerificationResult, error)
	CreateTrustedPartner(ctx context.Context, partner *TrustedPartner) error
	ListTrustedPartners(ctx context.Context, tenantID uuid.UUID) ([]*TrustedPartner, error)
	DeleteTrustedPartner(ctx context.Context, id uuid.UUID) error
	CreatePartnerCode(ctx context.Context, code *PartnerCode) error
	ListPartnerCodes(ctx context.Context, tenantID uuid.UUID) ([]*PartnerCode, error)
	DeactivatePartnerCode(ctx context.Context, id uuid.UUID) error

	// data_access.go
	CreateDataAccessToken(ctx context.Context, req CreateDataAccessTokenRequest) (*DataAccessToken, error)
	GetDataAccessTokenByHash(ctx context.Context, tokenHash string) (*DataAccessToken, error)
	ListDataAccessTokens(ctx context.Context, tenantID uuid.UUID) ([]*DataAccessToken, error)
	RevokeDataAccessToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	UpdateDataAccessTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error

	// passport_documents.go
	InsertPassportDocument(ctx context.Context, doc *PassportDocument) error
	GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*PassportDocument, error)
	LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error
	ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*PassportDocument, error)

	// passport.go — geolocation
	AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error

	// passport.go — batch bulk action
	GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error)
}
