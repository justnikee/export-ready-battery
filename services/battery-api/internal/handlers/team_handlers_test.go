package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"

	"github.com/google/uuid"
)

// ============================================================================
// FAKE TEAM REPO
// ============================================================================

type fakeTeamRepo struct {
	tenants        map[uuid.UUID]*models.Tenant
	members        map[uuid.UUID]*models.TeamMember
	membersByEmail map[string]*models.TeamMember
}

var _ repository.RepositoryInterface = (*fakeTeamRepo)(nil)

func newFakeTeamRepo() *fakeTeamRepo {
	return &fakeTeamRepo{
		tenants:        make(map[uuid.UUID]*models.Tenant),
		members:        make(map[uuid.UUID]*models.TeamMember),
		membersByEmail: make(map[string]*models.TeamMember),
	}
}

func (f *fakeTeamRepo) seedTenant(tenant *models.Tenant) {
	f.tenants[tenant.ID] = tenant
}

func (f *fakeTeamRepo) seedMember(member *models.TeamMember) {
	f.members[member.ID] = member
	key := member.TenantID.String() + ":" + member.Email
	f.membersByEmail[key] = member
}

// --- Real implementations for team handlers ---

func (f *fakeTeamRepo) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	if t, ok := f.tenants[id]; ok {
		return t, nil
	}
	return nil, errors.New("tenant not found")
}

func (f *fakeTeamRepo) CountTeamMembers(ctx context.Context, tenantID uuid.UUID) (int, error) {
	count := 0
	for _, m := range f.members {
		if m.TenantID == tenantID && m.Status != models.TeamStatusRevoked {
			count++
		}
	}
	return count, nil
}

func (f *fakeTeamRepo) GetTeamMembers(ctx context.Context, tenantID uuid.UUID) ([]*models.TeamMember, error) {
	var out []*models.TeamMember
	for _, m := range f.members {
		if m.TenantID == tenantID {
			out = append(out, m)
		}
	}
	return out, nil
}

func (f *fakeTeamRepo) GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error) {
	key := tenantID.String() + ":" + email
	if m, ok := f.membersByEmail[key]; ok {
		return m, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeTeamRepo) GetTeamMemberByID(ctx context.Context, id uuid.UUID) (*models.TeamMember, error) {
	if m, ok := f.members[id]; ok {
		return m, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeTeamRepo) CreateTeamMember(ctx context.Context, member *models.TeamMember) error {
	f.members[member.ID] = member
	key := member.TenantID.String() + ":" + member.Email
	f.membersByEmail[key] = member
	return nil
}

func (f *fakeTeamRepo) UpdateTeamMemberRole(ctx context.Context, id uuid.UUID, role string) error {
	if m, ok := f.members[id]; ok {
		m.Role = role
		return nil
	}
	return errors.New("not found")
}

func (f *fakeTeamRepo) DeleteTeamMember(ctx context.Context, id uuid.UUID) error {
	if m, ok := f.members[id]; ok {
		m.Status = models.TeamStatusRevoked
		return nil
	}
	return errors.New("not found")
}

// --- Stubs for remaining RepositoryInterface methods ---

func (f *fakeTeamRepo) CreateAPIKey(ctx context.Context, key *models.APIKey) error { return nil }
func (f *fakeTeamRepo) ListAPIKeys(ctx context.Context, tenantID uuid.UUID) ([]*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAPIKeyByPrefix(ctx context.Context, prefix string) (*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAllActiveAPIKeys(ctx context.Context) ([]*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateAPIKeyLastUsed(ctx context.Context, keyID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateAPIKey(ctx context.Context, id uuid.UUID, name *string, isActive *bool) error { return nil }
func (f *fakeTeamRepo) DeleteAPIKey(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) GetOrCreateUsageWindow(ctx context.Context, keyID uuid.UUID, endpoint string) (*models.APIKeyUsage, error) { return nil, nil }
func (f *fakeTeamRepo) GetActiveComplianceRules(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceRule, error) { return nil, nil }
func (f *fakeTeamRepo) GetAllFactors(ctx context.Context) ([]models.CarbonFactor, error) { return nil, nil }
func (f *fakeTeamRepo) GetFactorByCategoryAndSubcategory(ctx context.Context, category, subcategory string) (*models.CarbonFactor, error) { return nil, nil }
func (f *fakeTeamRepo) GetFactorsByCategory(ctx context.Context, category string) ([]models.CarbonFactor, error) { return nil, nil }
func (f *fakeTeamRepo) CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error { return nil }
func (f *fakeTeamRepo) ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error) { return nil, nil }
func (f *fakeTeamRepo) GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) { return nil, nil }
func (f *fakeTeamRepo) GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error) { return nil, nil }
func (f *fakeTeamRepo) IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error { return nil }
func (f *fakeTeamRepo) DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CreateSignupRequest(ctx context.Context, req *models.SignupRequest) error { return nil }
func (f *fakeTeamRepo) GetSignupRequestByEmail(ctx context.Context, email string) (*models.SignupRequest, error) { return nil, nil }
func (f *fakeTeamRepo) ListSignupRequests(ctx context.Context, status string, limit, offset int) ([]*models.SignupRequest, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) UpdateSignupRequestStatus(ctx context.Context, id uuid.UUID, status, reason string, reviewedBy uuid.UUID) error { return nil }
func (f *fakeTeamRepo) IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error) { return 0, nil }
func (f *fakeTeamRepo) CleanupOldUsage(ctx context.Context) error { return nil }

func (f *fakeTeamRepo) CreateBatch(ctx context.Context, req repository.CreateBatchRequest) (*models.Batch, error) { return nil, nil }
func (f *fakeTeamRepo) GetBatch(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.Batch, error) { return nil, nil }
func (f *fakeTeamRepo) ListBatches(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int) ([]*models.Batch, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) ListBatchesFiltered(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int, status, search string) ([]*models.Batch, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) GetBatchesChartData(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchChartData, error) { return nil, nil }
func (f *fakeTeamRepo) DeleteBatch(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateBatchMetadata(ctx context.Context, id uuid.UUID, domesticValue *float64) error { return nil }
func (f *fakeTeamRepo) PatchBatchDraft(ctx context.Context, id uuid.UUID, tenantID uuid.UUID, req models.PatchBatchRequest) error { return nil }
func (f *fakeTeamRepo) SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error { return nil }
func (f *fakeTeamRepo) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) { return "", nil }
func (f *fakeTeamRepo) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) { return uuid.Nil, nil }
func (f *fakeTeamRepo) SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte, carbonClass string) error { return nil }
func (f *fakeTeamRepo) UpdateBatchComplianceResult(ctx context.Context, batchID uuid.UUID, score float64, gapsJSON []byte) error { return nil }

func (f *fakeTeamRepo) GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error) { return nil, nil }
func (f *fakeTeamRepo) GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error) { return nil, nil }
func (f *fakeTeamRepo) UpsertProductSchema(ctx context.Context, s *models.ProductSchema) error { return nil }
func (f *fakeTeamRepo) ListProductSchemas(ctx context.Context) ([]*models.ProductSchema, error) { return nil, nil }

func (f *fakeTeamRepo) BulkUpdatePassportStatus(ctx context.Context, passportIDs []uuid.UUID, newStatus string) (int64, error) { return 0, nil }
func (f *fakeTeamRepo) BulkDeletePassports(ctx context.Context, passportIDs []uuid.UUID) (int64, error) { return 0, nil }
func (f *fakeTeamRepo) DeleteBatchWithPassports(ctx context.Context, batchID uuid.UUID) (int64, error) { return 0, nil }
func (f *fakeTeamRepo) GetPassportsByIDs(ctx context.Context, passportIDs []uuid.UUID) ([]*struct {
	UUID    uuid.UUID
	BatchID uuid.UUID
}, error) { return nil, nil }

func (f *fakeTeamRepo) CreateMagicLinkToken(ctx context.Context, req repository.CreateMagicLinkTokenRequest) error { return nil }
func (f *fakeTeamRepo) GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*repository.MagicLinkTokenRecord, error) { return nil, nil }
func (f *fakeTeamRepo) MarkMagicTokenUsed(ctx context.Context, tokenHash string) error { return nil }
func (f *fakeTeamRepo) IsMagicTokenUsed(ctx context.Context, tokenHash string) (bool, error) { return false, nil }
func (f *fakeTeamRepo) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, email string) error { return nil }
func (f *fakeTeamRepo) UpdatePassportRecycledAt(ctx context.Context, passportID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CleanupExpiredMagicTokens(ctx context.Context) (int, error) { return 0, nil }
func (f *fakeTeamRepo) SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error { return nil }
func (f *fakeTeamRepo) CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error { return nil }
func (f *fakeTeamRepo) GetMagicLinkOTP(ctx context.Context, tokenHash string) (*repository.OTPRecord, error) { return nil, nil }
func (f *fakeTeamRepo) IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) RecordOTPResend(ctx context.Context, otpID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error { return nil }
func (f *fakeTeamRepo) CleanupExpiredOTPs(ctx context.Context) error { return nil }

func (f *fakeTeamRepo) CreatePassport(ctx context.Context, passport *models.Passport) error { return nil }
func (f *fakeTeamRepo) CreatePassportsBatch(ctx context.Context, passports []*models.Passport) (int, error) { return 0, nil }
func (f *fakeTeamRepo) CreatePassportsWithEvents(ctx context.Context, passports []*models.Passport, events []*models.PassportEvent) (int, error) { return 0, nil }
func (f *fakeTeamRepo) GetPassport(ctx context.Context, id uuid.UUID) (*models.Passport, error) { return nil, nil }
func (f *fakeTeamRepo) GetPassportWithSpecs(ctx context.Context, id uuid.UUID) (*models.PassportWithSpecs, error) { return nil, nil }
func (f *fakeTeamRepo) GetPassportsByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.Passport, error) { return nil, nil }
func (f *fakeTeamRepo) CountPassportsByBatch(ctx context.Context, batchID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*repository.PassportListItem, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) GetPassportStatusCounts(ctx context.Context, tenantID uuid.UUID, batchID string) (map[string]int, error) { return nil, nil }
func (f *fakeTeamRepo) FindDuplicateSerials(ctx context.Context, serials []string) ([]repository.DuplicateInfo, error) { return nil, nil }
func (f *fakeTeamRepo) GetPassportByUUID(ctx context.Context, id uuid.UUID) (*models.Passport, error) { return nil, nil }
func (f *fakeTeamRepo) UpdatePassportStatus(ctx context.Context, id uuid.UUID, status string) error { return nil }
func (f *fakeTeamRepo) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error { return nil }
func (f *fakeTeamRepo) UpdatePassportLifecycle(ctx context.Context, passport *models.Passport) error { return nil }
func (f *fakeTeamRepo) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error { return nil }
func (f *fakeTeamRepo) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) { return nil, nil }
func (f *fakeTeamRepo) GetEventsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.AuditEventRow, error) { return nil, nil }
func (f *fakeTeamRepo) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error { return nil }
func (f *fakeTeamRepo) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CountPassportsMissingShippedEvent(ctx context.Context, batchID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error { return nil }
func (f *fakeTeamRepo) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error { return nil }
func (f *fakeTeamRepo) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error { return nil }
func (f *fakeTeamRepo) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error { return nil }
func (f *fakeTeamRepo) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, ts time.Time) error { return nil }
func (f *fakeTeamRepo) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error { return nil }
func (f *fakeTeamRepo) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) { return nil, nil }
func (f *fakeTeamRepo) SetRecyclingInfo(ctx context.Context, passportID uuid.UUID, status, recyclerEprID string, date time.Time) error { return nil }

func (f *fakeTeamRepo) CreateRewardEntry(ctx context.Context, entry *models.RewardLedger) error { return nil }
func (f *fakeTeamRepo) GetRewardBalance(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error) { return nil, nil }
func (f *fakeTeamRepo) GetRewardLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error) { return nil, nil }
func (f *fakeTeamRepo) GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error) { return nil, nil }

func (f *fakeTeamRepo) CreateScanEvent(ctx context.Context, event *models.ScanEvent) error { return nil }
func (f *fakeTeamRepo) GetLastScanTime(ctx context.Context, passportID uuid.UUID) (*time.Time, error) { return nil, nil }
func (f *fakeTeamRepo) GetScanFeed(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.ScanFeedItem, error) { return nil, nil }
func (f *fakeTeamRepo) GetDashboardStats(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.DashboardStats, error) { return nil, nil }
func (f *fakeTeamRepo) GetRecentBatches(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.BatchSummary, error) { return nil, nil }
func (f *fakeTeamRepo) GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.AnalyticsOverview, error) {
	return &models.AnalyticsOverview{
		BatchStatusBreakdown:   make(map[string]int),
		SupplierDocStatus:      make(map[string]int),
		AlertSeverityBreakdown: make(map[string]int),
	}, nil
}
func (f *fakeTeamRepo) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error { return nil }
func (f *fakeTeamRepo) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) { return nil, nil }
func (f *fakeTeamRepo) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) { return nil, nil }
func (f *fakeTeamRepo) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) { return 0, nil }
func (f *fakeTeamRepo) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error { return nil }
func (f *fakeTeamRepo) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeTeamRepo) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) { return nil, nil }
func (f *fakeTeamRepo) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error { return nil }
func (f *fakeTeamRepo) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error { return nil }
func (f *fakeTeamRepo) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeTeamRepo) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeTeamRepo) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) { return nil, nil }
func (f *fakeTeamRepo) CreateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeTeamRepo) GetSupplierRiskProfileBySupplier(ctx context.Context, supplierID uuid.UUID) (*models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeTeamRepo) ListSupplierRiskProfilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeTeamRepo) CreateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeTeamRepo) GetDueDiligenceAssessmentsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeTeamRepo) GetDueDiligenceAssessmentByID(ctx context.Context, id uuid.UUID) (*models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeTeamRepo) CreateSupplierCMRTReport(ctx context.Context, rep *models.SupplierCMRTReport) error { return nil }
func (f *fakeTeamRepo) GetSupplierCMRTReports(ctx context.Context, supplierID uuid.UUID) ([]models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeTeamRepo) GetLatestSupplierCMRTReport(ctx context.Context, supplierID uuid.UUID) (*models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeTeamRepo) CreateCorrectiveAction(ctx context.Context, ca *models.CorrectiveAction) error { return nil }
func (f *fakeTeamRepo) GetCorrectiveActionByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) { return nil, nil }
func (f *fakeTeamRepo) ListCorrectiveActionsByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeTeamRepo) ListCorrectiveActionsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateCorrectiveActionStatus(ctx context.Context, id uuid.UUID, status string, remediatedAt interface{}, verifiedBy interface{}) error { return nil }

func (f *fakeTeamRepo) GetTeamMemberByToken(ctx context.Context, token string) (*models.TeamMember, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateTeamMemberStatus(ctx context.Context, id uuid.UUID, status string, userID *uuid.UUID) error { return nil }
func (f *fakeTeamRepo) GetPendingInvitesByEmail(ctx context.Context, email string) ([]models.TeamMember, error) { return nil, nil }

func (f *fakeTeamRepo) CreateTemplate(ctx context.Context, tenantID uuid.UUID, name string, productType models.ProductType, marketRegion models.MarketRegion, specs models.BatchSpec) (*models.Template, error) { return nil, nil }
func (f *fakeTeamRepo) ListTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.Template, error) { return nil, nil }
func (f *fakeTeamRepo) GetTemplate(ctx context.Context, id uuid.UUID) (*models.Template, error) { return nil, nil }
func (f *fakeTeamRepo) DeleteTemplate(ctx context.Context, id uuid.UUID) error { return nil }

func (f *fakeTeamRepo) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error) { return nil, nil }
func (f *fakeTeamRepo) DeductQuota(ctx context.Context, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error { return nil }
func (f *fakeTeamRepo) GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) UpdateCertificatePath(ctx context.Context, tenantID uuid.UUID, docType string, path string) error { return nil }
func (f *fakeTeamRepo) UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error { return nil }
func (f *fakeTeamRepo) UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error { return nil }
func (f *fakeTeamRepo) GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error) { return nil, nil }
func (f *fakeTeamRepo) NextSequence(ctx context.Context, prefix string) (int, error) { return 0, nil }
func (f *fakeTeamRepo) NextSequenceBatch(ctx context.Context, prefix string, count int) (int, error) { return 0, nil }
func (f *fakeTeamRepo) GetOrCreateManufacturerCode(ctx context.Context, tenantID uuid.UUID, companyName string) (string, error) { return "", nil }

func (f *fakeTeamRepo) CreateTransaction(ctx context.Context, tx *models.Transaction) error { return nil }
func (f *fakeTeamRepo) ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error) { return nil, nil }
func (f *fakeTeamRepo) TransactionExistsForPayment(ctx context.Context, paymentID string) (bool, error) { return false, nil }

func (f *fakeTeamRepo) CreateTrustedDomain(ctx context.Context, domain *models.TrustedDomain) error { return nil }
func (f *fakeTeamRepo) GetTrustedDomainByDomain(ctx context.Context, tenantID uuid.UUID, domain string) (*models.TrustedDomain, error) { return nil, nil }
func (f *fakeTeamRepo) GetTrustedDomainsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TrustedDomain, error) { return nil, nil }
func (f *fakeTeamRepo) DeleteTrustedDomain(ctx context.Context, tenantID, domainID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateTrustedDomainActive(ctx context.Context, tenantID, domainID uuid.UUID, isActive bool) error { return nil }
func (f *fakeTeamRepo) LookupTrustedDomainByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TrustedDomain, error) { return nil, nil }

func (f *fakeTeamRepo) CheckTrustedPartner(ctx context.Context, email string) (*repository.TrustedPartner, error) { return nil, nil }
func (f *fakeTeamRepo) ValidatePartnerCode(ctx context.Context, code string) (*repository.PartnerCode, error) { return nil, nil }
func (f *fakeTeamRepo) IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error { return nil }
func (f *fakeTeamRepo) VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*repository.VerificationResult, error) { return nil, nil }
func (f *fakeTeamRepo) CreateTrustedPartner(ctx context.Context, partner *repository.TrustedPartner) error { return nil }
func (f *fakeTeamRepo) ListTrustedPartners(ctx context.Context, tenantID uuid.UUID) ([]*repository.TrustedPartner, error) { return nil, nil }
func (f *fakeTeamRepo) DeleteTrustedPartner(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CreatePartnerCode(ctx context.Context, code *repository.PartnerCode) error { return nil }
func (f *fakeTeamRepo) ListPartnerCodes(ctx context.Context, tenantID uuid.UUID) ([]*repository.PartnerCode, error) { return nil, nil }
func (f *fakeTeamRepo) DeactivatePartnerCode(ctx context.Context, id uuid.UUID) error { return nil }

func (f *fakeTeamRepo) CreateDeviceToken(ctx context.Context, token *repository.DeviceToken) error { return nil }
func (f *fakeTeamRepo) GetDeviceTokenByHash(ctx context.Context, hash string) (*repository.DeviceToken, error) { return nil, nil }
func (f *fakeTeamRepo) ListDeviceTokens(ctx context.Context, tenantID uuid.UUID) ([]*repository.DeviceToken, error) { return nil, nil }
func (f *fakeTeamRepo) RevokeDeviceToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateDeviceTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error { return nil }

func (f *fakeTeamRepo) InsertTelemetry(ctx context.Context, reading *repository.TelemetryReading) error { return nil }
func (f *fakeTeamRepo) UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error { return nil }
func (f *fakeTeamRepo) GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*repository.TelemetryReading, int, error) { return nil, 0, nil }

func (f *fakeTeamRepo) CreateDataAccessToken(ctx context.Context, req repository.CreateDataAccessTokenRequest) (*repository.DataAccessToken, error) { return nil, nil }
func (f *fakeTeamRepo) GetDataAccessTokenByHash(ctx context.Context, tokenHash string) (*repository.DataAccessToken, error) { return nil, nil }
func (f *fakeTeamRepo) ListDataAccessTokens(ctx context.Context, tenantID uuid.UUID) ([]*repository.DataAccessToken, error) { return nil, nil }
func (f *fakeTeamRepo) RevokeDataAccessToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateDataAccessTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error { return nil }

func (f *fakeTeamRepo) CreateEPRCertificate(ctx context.Context, cert *models.EPRCertificate) error { return nil }
func (f *fakeTeamRepo) ListEPRCertificates(ctx context.Context, tenantID uuid.UUID, financialYear string) ([]*models.EPRCertificate, error) { return nil, nil }
func (f *fakeTeamRepo) GetEPRCertificateSummary(ctx context.Context, tenantID uuid.UUID, financialYear string) (float64, int, error) { return 0, 0, nil }
func (f *fakeTeamRepo) RetireEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) DeleteEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error { return nil }

func (f *fakeTeamRepo) InsertPassportDocument(ctx context.Context, doc *repository.PassportDocument) error { return nil }
func (f *fakeTeamRepo) GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*repository.PassportDocument, error) { return nil, nil }
func (f *fakeTeamRepo) LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*repository.PassportDocument, error) { return nil, nil }

func (f *fakeTeamRepo) CreateCertificateAnchor(ctx context.Context, anchor *models.CertificateAnchor) error { return nil }
func (f *fakeTeamRepo) GetCertificateAnchorsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.CertificateAnchor, error) { return nil, nil }
func (f *fakeTeamRepo) GetAnchorsNeedingUpgrade(ctx context.Context) ([]*models.CertificateAnchor, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateCertificateAnchorStatus(ctx context.Context, id string, status string, otsProof, bitcoinTxID *string, anchoredAt *time.Time) error { return nil }

func (f *fakeTeamRepo) CreateMassBalanceLedger(ctx context.Context, ledger *models.MassBalanceLedger) error { return nil }
func (f *fakeTeamRepo) GetMassBalanceLedgersByTenant(ctx context.Context, tenantID uuid.UUID, materialType string) ([]*models.MassBalanceLedger, error) { return nil, nil }
func (f *fakeTeamRepo) GetMassBalanceLedgerByID(ctx context.Context, id uuid.UUID) (*models.MassBalanceLedger, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateMassBalanceLedger(ctx context.Context, id uuid.UUID, incomingDelta, allocatedDelta float64) error { return nil }
func (f *fakeTeamRepo) CreateMassBalanceAllocation(ctx context.Context, allocation *models.MassBalanceAllocation) error { return nil }
func (f *fakeTeamRepo) GetMassBalanceAllocationsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.MassBalanceAllocation, error) { return nil, nil }

func (f *fakeTeamRepo) CreatePassportVC(ctx context.Context, vc *models.PassportVC) error { return nil }
func (f *fakeTeamRepo) GetPassportVCByPassportID(ctx context.Context, passportID uuid.UUID) (*models.PassportVC, error) { return nil, nil }

// ============================================================================
// TEST HELPERS
// ============================================================================

func newTeamHandler(repo repository.RepositoryInterface) *Handler {
	return &Handler{repo: repo}
}

// ============================================================================
// TESTS
// ============================================================================

func TestInviteUser_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"new@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["message"] != "Invitation sent successfully" {
		t.Errorf("unexpected message: %v", resp["message"])
	}
}

func TestInviteUser_Success_ElectronicsRole(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Electronics Co",
		ProductType: models.ProductTypeElectronics,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"supplier@example.com","role":"MEMBER"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeElectronics)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestInviteUser_InvalidRoleForProduct(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"dye@example.com","role":"DYE_HOUSE"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["error"] != "Invalid role for battery tenant. Must be ADMIN, MEMBER, or VIEWER." {
		t.Errorf("unexpected error message: %s", resp["error"])
	}
}

func TestInviteUser_SeatLimit(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	// Seed 2 active members (STARTER limit is 2)
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "a@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "b@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"new@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.SeatLimitError
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode seat limit error: %v", err)
	}
	if resp.Error != "seat_limit_reached" {
		t.Errorf("expected error code seat_limit_reached, got %s", resp.Error)
	}
}

func TestInviteUser_DuplicateEmail(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "existing@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"existing@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateTeamMemberRole_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/team/"+memberID.String()+"/role", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateTeamMemberRole(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	updated, _ := repo.GetTeamMemberByID(context.Background(), memberID)
	if updated.Role != models.TeamRoleAdmin {
		t.Errorf("expected role ADMIN, got %s", updated.Role)
	}
}

func TestUpdateTeamMemberRole_InvalidRoleForProduct(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"role":"SPINNING_MILL"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/team/"+memberID.String()+"/role", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateTeamMemberRole(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["error"] != "Invalid role for battery tenant. Must be ADMIN, MEMBER, or VIEWER." {
		t.Errorf("unexpected error message: %s", resp["error"])
	}
}

func TestRemoveTeamMember_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/team/"+memberID.String(), nil)
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.RemoveTeamMember(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	removed, _ := repo.GetTeamMemberByID(context.Background(), memberID)
	if removed.Status != models.TeamStatusRevoked {
		t.Errorf("expected status REVOKED, got %s", removed.Status)
	}
}

func TestRemoveTeamMember_CannotRemoveOwner(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "owner@example.com",
		Role:     models.TeamRoleOwner,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/team/"+memberID.String(), nil)
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.RemoveTeamMember(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListTeamMembers_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeGrowth,
	})

	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "owner@example.com",
		Role:     models.TeamRoleOwner,
		Status:   models.TeamStatusActive,
	})
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/team", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListTeamMembers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	members, ok := resp["members"].([]interface{})
	if !ok {
		t.Fatalf("expected members array, got %T", resp["members"])
	}
	if len(members) != 2 {
		t.Errorf("expected 2 members, got %d", len(members))
	}
	if resp["seat_count"] != float64(2) {
		t.Errorf("expected seat_count 2, got %v", resp["seat_count"])
	}
	if resp["seat_limit"] != float64(models.GetSeatLimit(models.PlanTypeGrowth)) {
		t.Errorf("expected seat_limit %d, got %v", models.GetSeatLimit(models.PlanTypeGrowth), resp["seat_limit"])
	}
}

func (f *fakeTeamRepo) ListAllBatches(ctx context.Context, productType models.ProductType, limit, offset int) ([]*models.Batch, error) { return nil, nil }
func (f *fakeTeamRepo) CreateAlert(ctx context.Context, alert *models.TenantAlert) error { return nil }
func (f *fakeTeamRepo) GetAlertsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantAlert, error) { return nil, nil }
func (f *fakeTeamRepo) GetUnreadAlerts(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.TenantAlert, error) { return nil, nil }
func (f *fakeTeamRepo) GetUnreadAlertCount(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) MarkAlertRead(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) MarkAlertEmailed(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) HasRecentAlert(ctx context.Context, tenantID uuid.UUID, alertType string, resourceID *string, within time.Duration) (bool, error) { return false, nil }
func (f *fakeTeamRepo) CreateTallyImportLog(ctx context.Context, log *repository.TallyImportLog) error { return nil }
func (f *fakeTeamRepo) GetTallyImportLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*repository.TallyImportLog, int, error) { return nil, 0, nil }

func (f *fakeTeamRepo) UpsertTallySyncConfig(ctx context.Context, cfg *repository.TallySyncConfig) error { return nil }
func (f *fakeTeamRepo) GetTallySyncConfig(ctx context.Context, tenantID uuid.UUID) (*repository.TallySyncConfig, error) { return nil, nil }
func (f *fakeTeamRepo) ListEnabledTallySyncConfigs(ctx context.Context) ([]*repository.TallySyncConfig, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateTallySyncLastSync(ctx context.Context, tenantID uuid.UUID, t time.Time) error { return nil }
func (f *fakeTeamRepo) CreateTallySyncStaging(ctx context.Context, item *repository.TallySyncStaging) error { return nil }
func (f *fakeTeamRepo) GetTallySyncStagingByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*repository.TallySyncStaging, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) GetTallySyncStagingByID(ctx context.Context, id, tenantID uuid.UUID) (*repository.TallySyncStaging, error) { return nil, nil }
func (f *fakeTeamRepo) ApplyTallySyncStaging(ctx context.Context, id, tenantID, batchID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) DiscardTallySyncStaging(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CreateTallySyncRun(ctx context.Context, run *repository.TallySyncRun) error { return nil }
func (f *fakeTeamRepo) UpdateTallySyncRun(ctx context.Context, id uuid.UUID, status, errorMsg string, fetched, staged int) error { return nil }

func (f *fakeTeamRepo) CreateComponent(ctx context.Context, c *repository.Component) error { return nil }
func (f *fakeTeamRepo) GetComponent(ctx context.Context, id, tenantID uuid.UUID) (*repository.Component, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateComponent(ctx context.Context, c *repository.Component) error { return nil }
func (f *fakeTeamRepo) DeleteComponent(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) ListComponentsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*repository.Component, error) { return nil, nil }
func (f *fakeTeamRepo) GetComponentTreeByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*repository.ComponentTreeNode, error) { return nil, nil }

// DGFT Claims stubs
func (f *fakeTeamRepo) ListDGFTSchemeConfigs(ctx context.Context) ([]models.DGFTSchemeConfig, error) { return nil, nil }
func (f *fakeTeamRepo) CreateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error { return nil }
func (f *fakeTeamRepo) GetDGFTClaimByID(ctx context.Context, id, tenantID uuid.UUID) (*models.DGFTClaim, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error { return nil }
func (f *fakeTeamRepo) DeleteDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) ListDGFTClaimsByTenant(ctx context.Context, tenantID uuid.UUID, schemeType, status string, page, pageSize int) ([]models.DGFTClaim, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) SubmitDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) AddDGFTClaimDocument(ctx context.Context, id, tenantID uuid.UUID, doc models.DGFTClaimDocument) error { return nil }

// Supplier stubs
func (f *fakeTeamRepo) CreateSupplier(ctx context.Context, supplier *models.Supplier) error { return nil }
func (f *fakeTeamRepo) GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) { return nil, nil }
func (f *fakeTeamRepo) GetSupplierByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.Supplier, error) { return nil, nil }
func (f *fakeTeamRepo) GetSupplierByInvitationToken(ctx context.Context, token string) (*models.Supplier, error) { return nil, nil }
func (f *fakeTeamRepo) ListSuppliersByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.Supplier, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateSupplierStatus(ctx context.Context, id uuid.UUID, status string) error { return nil }
func (f *fakeTeamRepo) UpdateSupplierAcceptance(ctx context.Context, id uuid.UUID, passwordHash string) error { return nil }
func (f *fakeTeamRepo) UpdateSupplierLastLogin(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) CreateSupplierDocument(ctx context.Context, doc *models.SupplierDocument) error { return nil }
func (f *fakeTeamRepo) GetSupplierDocumentByID(ctx context.Context, id uuid.UUID) (*models.SupplierDocument, error) { return nil, nil }
func (f *fakeTeamRepo) ListSupplierDocuments(ctx context.Context, supplierID uuid.UUID, status string) ([]models.SupplierDocument, error) { return nil, nil }
func (f *fakeTeamRepo) ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string) ([]models.SupplierDocument, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateSupplierDocumentStatus(ctx context.Context, id uuid.UUID, status, reviewerNotes string, reviewedBy uuid.UUID) error { return nil }
func (f *fakeTeamRepo) GetSupplierRiskProfilesBySuppliers(ctx context.Context, tenantID uuid.UUID, supplierIDs []uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }

// Regulatory stubs
func (f *fakeTeamRepo) CreateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeTeamRepo) ListRegulatorySources(ctx context.Context, activeOnly bool) ([]*models.RegulatorySource, error) { return nil, nil }
func (f *fakeTeamRepo) GetRegulatorySourceByID(ctx context.Context, id uuid.UUID) (*models.RegulatorySource, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeTeamRepo) UpdateRegulatorySourceFetchMeta(ctx context.Context, id uuid.UUID, fetchedAt time.Time, etag string) error { return nil }
func (f *fakeTeamRepo) DeleteRegulatorySource(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpsertRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) error { return nil }
func (f *fakeTeamRepo) GetRegulatoryItemBySourceAndExternalID(ctx context.Context, sourceID uuid.UUID, externalID string) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeTeamRepo) ListRegulatoryItems(ctx context.Context, f2 repository.ListRegulatoryItemsFilter) ([]*models.RegulatoryItem, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) GetRegulatoryItemByID(ctx context.Context, id uuid.UUID) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeTeamRepo) CreateTenantRegulatoryAlert(ctx context.Context, alert *models.TenantRegulatoryAlert) error { return nil }
func (f *fakeTeamRepo) GetTenantRegulatoryAlerts(ctx context.Context, tenantID uuid.UUID, unreadOnly bool, limit, offset int) ([]*models.TenantRegulatoryAlert, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) GetTenantRegulatoryAlertUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) MarkTenantRegulatoryAlertRead(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) MarkTenantRegulatoryAlertDismissed(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) ListTenantsForRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) ([]uuid.UUID, error) { return nil, nil }
