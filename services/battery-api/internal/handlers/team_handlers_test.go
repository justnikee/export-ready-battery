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
func (f *fakeTeamRepo) CreateSignupRequest(ctx context.Context, req *models.SignupRequest) error { return nil }
func (f *fakeTeamRepo) GetSignupRequestByEmail(ctx context.Context, email string) (*models.SignupRequest, error) { return nil, nil }
func (f *fakeTeamRepo) ListSignupRequests(ctx context.Context, status string, limit, offset int) ([]*models.SignupRequest, int, error) { return nil, 0, nil }
func (f *fakeTeamRepo) UpdateSignupRequestStatus(ctx context.Context, id uuid.UUID, status, reason string, reviewedBy uuid.UUID) error { return nil }
func (f *fakeTeamRepo) IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error) { return 0, nil }
func (f *fakeTeamRepo) CleanupOldUsage(ctx context.Context) error { return nil }

func (f *fakeTeamRepo) CreateBatch(ctx context.Context, req repository.CreateBatchRequest) (*models.Batch, error) { return nil, nil }
func (f *fakeTeamRepo) GetBatch(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) (*models.Batch, error) { return nil, nil }
func (f *fakeTeamRepo) ListBatches(ctx context.Context, tenantID uuid.UUID, productType models.ProductType, limit, offset int) ([]*models.Batch, int, error) { return nil, 0, nil }
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
