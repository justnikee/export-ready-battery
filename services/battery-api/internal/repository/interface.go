package repository

import (
	"context"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"

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
	ListAllBatches(ctx context.Context, productType models.ProductType, limit, offset int) ([]*models.Batch, error)
	DeleteBatch(ctx context.Context, id uuid.UUID) error
	UpdateBatchMetadata(ctx context.Context, id uuid.UUID, domesticValue *float64) error
	PatchBatchDraft(ctx context.Context, id uuid.UUID, tenantID uuid.UUID, req models.PatchBatchRequest) error
	SetBatchStatus(ctx context.Context, batchID uuid.UUID, status string) error
	GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error)
	GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error)
	SaveCarbonFootprintResult(ctx context.Context, batchID, tenantID uuid.UUID, resultJSON []byte, carbonClass string) error
	UpdateBatchComplianceResult(ctx context.Context, batchID uuid.UUID, score float64, gapsJSON []byte) error

	// schema_repository.go
	GetActiveSchema(ctx context.Context, productType models.ProductType) (*models.ProductSchema, error)
	GetSchemaByVersion(ctx context.Context, productType models.ProductType, version int) (*models.ProductSchema, error)
	UpsertProductSchema(ctx context.Context, s *models.ProductSchema) error
	ListProductSchemas(ctx context.Context) ([]*models.ProductSchema, error)

	// compliance_rules.go
	GetActiveComplianceRules(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceRule, error)
	GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error)

	// carbon_factors.go
	GetAllFactors(ctx context.Context) ([]models.CarbonFactor, error)
	GetFactorByCategoryAndSubcategory(ctx context.Context, category, subcategory string) (*models.CarbonFactor, error)
	GetFactorsByCategory(ctx context.Context, category string) ([]models.CarbonFactor, error)

	// outbound_webhook.go
	CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error
	ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error)
	GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error)
	GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error)
	IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error
	UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error
	DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error

	// signup_requests.go
	CreateSignupRequest(ctx context.Context, req *models.SignupRequest) error
	GetSignupRequestByEmail(ctx context.Context, email string) (*models.SignupRequest, error)
	ListSignupRequests(ctx context.Context, status string, limit, offset int) ([]*models.SignupRequest, int, error)
	UpdateSignupRequestStatus(ctx context.Context, id uuid.UUID, status, reason string, reviewedBy uuid.UUID) error

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

	// analytics.go
	GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, productType models.ProductType) (*models.AnalyticsOverview, error)

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

	// device_tokens.go
	CreateDeviceToken(ctx context.Context, token *DeviceToken) error
	GetDeviceTokenByHash(ctx context.Context, hash string) (*DeviceToken, error)
	ListDeviceTokens(ctx context.Context, tenantID uuid.UUID) ([]*DeviceToken, error)
	RevokeDeviceToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	UpdateDeviceTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error

	// telemetry.go
	InsertTelemetry(ctx context.Context, reading *TelemetryReading) error
	UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error
	GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*TelemetryReading, int, error)

	// data_access.go
	CreateDataAccessToken(ctx context.Context, req CreateDataAccessTokenRequest) (*DataAccessToken, error)
	GetDataAccessTokenByHash(ctx context.Context, tokenHash string) (*DataAccessToken, error)
	ListDataAccessTokens(ctx context.Context, tenantID uuid.UUID) ([]*DataAccessToken, error)
	RevokeDataAccessToken(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	UpdateDataAccessTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error

	// epr_certificate_repository.go
	CreateEPRCertificate(ctx context.Context, cert *models.EPRCertificate) error
	ListEPRCertificates(ctx context.Context, tenantID uuid.UUID, financialYear string) ([]*models.EPRCertificate, error)
	GetEPRCertificateSummary(ctx context.Context, tenantID uuid.UUID, financialYear string) (float64, int, error)
	RetireEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error
	DeleteEPRCertificate(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error

	// passport_documents.go
	InsertPassportDocument(ctx context.Context, doc *PassportDocument) error
	GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*PassportDocument, error)
	LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error
	ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*PassportDocument, error)

	// passport.go — geolocation
	AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error

	// passport.go — batch bulk action
	GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error)

	// certificate_anchor.go
	CreateCertificateAnchor(ctx context.Context, anchor *models.CertificateAnchor) error
	GetCertificateAnchorsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.CertificateAnchor, error)
	GetAnchorsNeedingUpgrade(ctx context.Context) ([]*models.CertificateAnchor, error)
	UpdateCertificateAnchorStatus(ctx context.Context, id string, status string, otsProof, bitcoinTxID *string, anchoredAt *time.Time) error

	// alerts.go
	CreateAlert(ctx context.Context, alert *models.TenantAlert) error
	GetAlertsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantAlert, error)
	GetUnreadAlerts(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.TenantAlert, error)
	GetUnreadAlertCount(ctx context.Context, tenantID uuid.UUID) (int, error)
	MarkAlertRead(ctx context.Context, alertID uuid.UUID) error
	MarkAlertEmailed(ctx context.Context, alertID uuid.UUID) error
	HasRecentAlert(ctx context.Context, tenantID uuid.UUID, alertType string, resourceID *string, within time.Duration) (bool, error)

	// mass_balance.go
	CreateMassBalanceLedger(ctx context.Context, ledger *models.MassBalanceLedger) error
	GetMassBalanceLedgersByTenant(ctx context.Context, tenantID uuid.UUID, materialType string) ([]*models.MassBalanceLedger, error)
	GetMassBalanceLedgerByID(ctx context.Context, id uuid.UUID) (*models.MassBalanceLedger, error)
	UpdateMassBalanceLedger(ctx context.Context, id uuid.UUID, incomingDelta, allocatedDelta float64) error
	CreateMassBalanceAllocation(ctx context.Context, allocation *models.MassBalanceAllocation) error
	GetMassBalanceAllocationsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.MassBalanceAllocation, error)

	// vc_repository.go
	CreatePassportVC(ctx context.Context, vc *models.PassportVC) error
	GetPassportVCByPassportID(ctx context.Context, passportID uuid.UUID) (*models.PassportVC, error)

	// tally_import.go
	CreateTallyImportLog(ctx context.Context, log *TallyImportLog) error
	GetTallyImportLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*TallyImportLog, int, error)

	// tally_sync.go
	UpsertTallySyncConfig(ctx context.Context, cfg *TallySyncConfig) error
	GetTallySyncConfig(ctx context.Context, tenantID uuid.UUID) (*TallySyncConfig, error)
	ListEnabledTallySyncConfigs(ctx context.Context) ([]*TallySyncConfig, error)
	UpdateTallySyncLastSync(ctx context.Context, tenantID uuid.UUID, t time.Time) error
	CreateTallySyncStaging(ctx context.Context, item *TallySyncStaging) error
	GetTallySyncStagingByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*TallySyncStaging, int, error)
	GetTallySyncStagingByID(ctx context.Context, id, tenantID uuid.UUID) (*TallySyncStaging, error)
	ApplyTallySyncStaging(ctx context.Context, id, tenantID, batchID uuid.UUID) error
	DiscardTallySyncStaging(ctx context.Context, id, tenantID uuid.UUID) error
	CreateTallySyncRun(ctx context.Context, run *TallySyncRun) error
	UpdateTallySyncRun(ctx context.Context, id uuid.UUID, status, errorMsg string, fetched, staged int) error

	// component.go
	CreateComponent(ctx context.Context, c *Component) error
	GetComponent(ctx context.Context, id, tenantID uuid.UUID) (*Component, error)
	UpdateComponent(ctx context.Context, c *Component) error
	DeleteComponent(ctx context.Context, id, tenantID uuid.UUID) error
	ListComponentsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*Component, error)
	GetComponentTreeByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]*ComponentTreeNode, error)

	// DGFT Claims
	ListDGFTSchemeConfigs(ctx context.Context) ([]models.DGFTSchemeConfig, error)
	CreateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error
	GetDGFTClaimByID(ctx context.Context, id, tenantID uuid.UUID) (*models.DGFTClaim, error)
	UpdateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error
	DeleteDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error
	ListDGFTClaimsByTenant(ctx context.Context, tenantID uuid.UUID, schemeType, status string, page, pageSize int) ([]models.DGFTClaim, int, error)
	SubmitDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error
	AddDGFTClaimDocument(ctx context.Context, id, tenantID uuid.UUID, doc models.DGFTClaimDocument) error

	// registry_verifications.go
	CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error
	GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error)
	GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error)
	DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error)

	// registry_jobs.go
	CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error
	GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error)
	GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error)
	GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error)
	UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error

	// registry_audit_log.go
	CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error
	GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error)
	GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error)

	// Suppliers
	CreateSupplier(ctx context.Context, supplier *models.Supplier) error
	GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error)
	GetSupplierByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.Supplier, error)
	GetSupplierByInvitationToken(ctx context.Context, token string) (*models.Supplier, error)
	ListSuppliersByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.Supplier, error)
	UpdateSupplierStatus(ctx context.Context, id uuid.UUID, status string) error
	UpdateSupplierAcceptance(ctx context.Context, id uuid.UUID, passwordHash string) error
	UpdateSupplierLastLogin(ctx context.Context, id uuid.UUID) error

	// Supplier Documents
	CreateSupplierDocument(ctx context.Context, doc *models.SupplierDocument) error
	GetSupplierDocumentByID(ctx context.Context, id uuid.UUID) (*models.SupplierDocument, error)
	ListSupplierDocuments(ctx context.Context, supplierID uuid.UUID, status string) ([]models.SupplierDocument, error)
	ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string) ([]models.SupplierDocument, error)
	UpdateSupplierDocumentStatus(ctx context.Context, id uuid.UUID, status, reviewerNotes string, reviewedBy uuid.UUID) error
}
