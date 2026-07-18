package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/auth"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

type fakeMagicRepo struct {
	passports       map[uuid.UUID]*models.Passport
	tokens          map[string]*repository.MagicLinkTokenRecord
	otps            map[string]*repository.OTPRecord
	defaultTenantID uuid.UUID
}

func newFakeMagicRepo() *fakeMagicRepo {
	return &fakeMagicRepo{
		passports:       make(map[uuid.UUID]*models.Passport),
		tokens:          make(map[string]*repository.MagicLinkTokenRecord),
		otps:            make(map[string]*repository.OTPRecord),
		defaultTenantID: uuid.MustParse("11111111-1111-1111-1111-111111111111"),
	}
}

func (f *fakeMagicRepo) GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	passport, ok := f.passports[passportID]
	if !ok {
		return nil, context.DeadlineExceeded
	}
	return passport, nil
}

func (f *fakeMagicRepo) VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*repository.VerificationResult, error) {
	return &repository.VerificationResult{Allowed: true, Tier: "A", CompanyName: "Test", Role: string(models.ActorRoleLogistics)}, nil
}

func (f *fakeMagicRepo) ValidatePartnerCode(ctx context.Context, code string) (*repository.PartnerCode, error) {
	return nil, nil
}

func (f *fakeMagicRepo) IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error {
	return nil
}

func (f *fakeMagicRepo) CreateMagicLinkToken(ctx context.Context, req repository.CreateMagicLinkTokenRequest) error {
	f.tokens[req.TokenHash] = &repository.MagicLinkTokenRecord{
		PassportID: req.PassportID,
		Email:      req.Email,
		Role:       req.Role,
		Action:     req.Action,
		ExpiresAt:  req.ExpiresAt,
	}
	return nil
}

func (f *fakeMagicRepo) GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*repository.MagicLinkTokenRecord, error) {
	return f.tokens[tokenHash], nil
}

func (f *fakeMagicRepo) MarkMagicTokenUsed(ctx context.Context, tokenHash string) error {
	if token := f.tokens[tokenHash]; token != nil {
		now := time.Now()
		token.UsedAt = &now
	}
	return nil
}

func (f *fakeMagicRepo) SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error {
	if token := f.tokens[tokenHash]; token != nil {
		token.RequiresOTP = required
	}
	return nil
}

func (f *fakeMagicRepo) CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error {
	f.otps[tokenHash] = &repository.OTPRecord{
		ID:                 uuid.New(),
		MagicLinkTokenHash: tokenHash,
		OTPHash:            otpHash,
		AttemptCount:       0,
		MaxAttempts:        5,
		ResendCount:        0,
		MaxResends:         3,
		CreatedAt:          time.Now(),
	}
	return nil
}

func (f *fakeMagicRepo) GetMagicLinkOTP(ctx context.Context, tokenHash string) (*repository.OTPRecord, error) {
	return f.otps[tokenHash], nil
}

func (f *fakeMagicRepo) IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error {
	for _, otp := range f.otps {
		if otp.ID == otpID {
			otp.AttemptCount++
		}
	}
	return nil
}

func (f *fakeMagicRepo) MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error {
	now := time.Now()
	for _, otp := range f.otps {
		if otp.ID == otpID {
			otp.UsedAt = &now
		}
	}
	return nil
}

func (f *fakeMagicRepo) RecordOTPResend(ctx context.Context, otpID uuid.UUID) error {
	now := time.Now()
	for _, otp := range f.otps {
		if otp.ID == otpID {
			otp.ResendCount++
			otp.LastResentAt = &now
		}
	}
	return nil
}

func (f *fakeMagicRepo) ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error {
	f.otps[tokenHash] = &repository.OTPRecord{
		ID:                 uuid.New(),
		MagicLinkTokenHash: tokenHash,
		OTPHash:            newOTPHash,
		AttemptCount:       0,
		MaxAttempts:        5,
		ResendCount:        0,
		MaxResends:         3,
		CreatedAt:          time.Now(),
	}
	return nil
}

func (f *fakeMagicRepo) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) {
	return models.MarketRegionGlobal, nil
}

func (f *fakeMagicRepo) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) {
	return f.defaultTenantID, nil
}

func (f *fakeMagicRepo) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*repository.PassportListItem, int, error) {
	return []*repository.PassportListItem{}, 0, nil
}

func (f *fakeMagicRepo) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	if params.Event == nil {
		return context.DeadlineExceeded
	}
	passport, ok := f.passports[params.PassportID]
	if !ok {
		return context.DeadlineExceeded
	}

	if params.MagicLinkTokenHash != "" {
		token := f.tokens[params.MagicLinkTokenHash]
		if token == nil || token.UsedAt != nil || time.Now().After(token.ExpiresAt) {
			return models.ErrMagicLinkTokenInvalid
		}
		if token.PassportID != params.PassportID || token.Role != string(params.Event.ActorRole) || token.Action != string(params.Event.Action) {
			return models.ErrMagicLinkTokenInvalid
		}
		now := time.Now()
		token.UsedAt = &now
	}

	passport.Status = params.NewStatus
	return nil
}

func (f *fakeMagicRepo) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	return nil, nil
}

func (f *fakeMagicRepo) UndoLifecycleTransition(ctx context.Context, passportID uuid.UUID, fromStatus, toStatus string, event *models.PassportEvent) error {
	passport, ok := f.passports[passportID]
	if !ok {
		return context.DeadlineExceeded
	}
	passport.Status = toStatus
	return nil
}

func (f *fakeMagicRepo) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	return nil
}

func (f *fakeMagicRepo) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, ownerIdentifier string) error {
	return nil
}

func (f *fakeMagicRepo) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeMagicRepo) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeMagicRepo) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error {
	return nil
}

func (f *fakeMagicRepo) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	return nil
}

func (f *fakeMagicRepo) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, updatedAt time.Time) error {
	return nil
}

func (f *fakeMagicRepo) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	return nil
}

func (f *fakeMagicRepo) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	return nil, nil
}

func (f *fakeMagicRepo) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeMagicRepo) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeMagicRepo) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) {
	var passportIDs []uuid.UUID
	for passportID, passport := range f.passports {
		if passport.BatchID == batchID {
			passportIDs = append(passportIDs, passportID)
		}
	}
	return passportIDs, nil
}
func (f *fakeMagicRepo) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error { return nil }
func (f *fakeMagicRepo) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) { return nil, nil }
func (f *fakeMagicRepo) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) { return nil, nil }
func (f *fakeMagicRepo) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) { return 0, nil }
func (f *fakeMagicRepo) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error { return nil }
func (f *fakeMagicRepo) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeMagicRepo) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) { return nil, nil }
func (f *fakeMagicRepo) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeMagicRepo) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error { return nil }
func (f *fakeMagicRepo) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error { return nil }
func (f *fakeMagicRepo) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeMagicRepo) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeMagicRepo) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) { return nil, nil }
func (f *fakeMagicRepo) CreateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeMagicRepo) GetSupplierRiskProfileBySupplier(ctx context.Context, supplierID uuid.UUID) (*models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeMagicRepo) UpdateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeMagicRepo) ListSupplierRiskProfilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeMagicRepo) CreateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeMagicRepo) GetDueDiligenceAssessmentsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeMagicRepo) GetDueDiligenceAssessmentByID(ctx context.Context, id uuid.UUID) (*models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeMagicRepo) UpdateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeMagicRepo) CreateSupplierCMRTReport(ctx context.Context, rep *models.SupplierCMRTReport) error { return nil }
func (f *fakeMagicRepo) GetSupplierCMRTReports(ctx context.Context, supplierID uuid.UUID) ([]models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeMagicRepo) GetLatestSupplierCMRTReport(ctx context.Context, supplierID uuid.UUID) (*models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeMagicRepo) CreateCorrectiveAction(ctx context.Context, ca *models.CorrectiveAction) error { return nil }
func (f *fakeMagicRepo) GetCorrectiveActionByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) { return nil, nil }
func (f *fakeMagicRepo) ListCorrectiveActionsByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeMagicRepo) ListCorrectiveActionsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeMagicRepo) UpdateCorrectiveActionStatus(ctx context.Context, id uuid.UUID, status string, remediatedAt interface{}, verifiedBy interface{}) error { return nil }
func (f *fakeMagicRepo) GetSupplierRiskProfilesBySuppliers(ctx context.Context, tenantID uuid.UUID, supplierIDs []uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }

func setupMagicLinkHandler(t *testing.T, status string, action string, role string) (*MagicLinkHandler, *fakeMagicRepo, *auth.MagicLinkToken, uuid.UUID) {
	t.Helper()
	repo := newFakeMagicRepo()
	passportID := uuid.New()
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   uuid.New(),
		Status:    status,
		CreatedAt: time.Now(),
	}

	secret := "test-secret"
	token, err := auth.GenerateMagicToken(passportID.String(), "partner@example.com", role, action, secret, time.Hour)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	repo.tokens[token.TokenHash] = &repository.MagicLinkTokenRecord{
		PassportID: passportID,
		Email:      "partner@example.com",
		Role:       role,
		Action:     action,
		ExpiresAt:  token.ExpiresAt,
	}

	lifecycleService := services.NewLifecycleService(repo)
	handler := NewMagicLinkHandler(repo, lifecycleService, nil, nil, secret, "http://localhost")

	return handler, repo, token, passportID
}

func TestMagicLinkTransition_ReusedTokenRejected(t *testing.T) {
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+token.Token)
	rr2 := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr2, req2)
	if rr2.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr2.Code)
	}
}

func TestMagicLinkTransition_WrongActionRejected(t *testing.T) {
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	body := `{"action":"INSTALL","evidence":{"installation_date":"2026-01-15","installer_id":"TECH-1"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", rr.Code)
	}
}

func TestMagicLinkTransition_ExpiredTokenRejected(t *testing.T) {
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	record := repo.tokens[token.TokenHash]
	expired := time.Now().Add(-1 * time.Hour)
	record.ExpiresAt = expired

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestMagicLinkTransition_RoleMismatchRejected(t *testing.T) {
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	record := repo.tokens[token.TokenHash]
	record.Role = "TECHNICIAN"

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", rr.Code)
	}
}

func TestMagicLinkTransition_ValidTokenSucceeds(t *testing.T) {
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
}

func TestGetPassportForAction_FiltersByTokenRole(t *testing.T) {
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionRecall), "LOGISTICS")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passport/"+passportID.String()+"?token="+token.Token, nil)
	rr := httptest.NewRecorder()

	handler.GetPassportForAction(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp struct {
		AllowedActions []string `json:"allowed_actions"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.AllowedActions) != 0 {
		t.Fatalf("expected no allowed actions for LOGISTICS RECALL token, got %v", resp.AllowedActions)
	}
}

func TestGetPassportForAction_AllowsMatchingTokenRole(t *testing.T) {
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionShip), "LOGISTICS")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passport/"+passportID.String()+"?token="+token.Token, nil)
	rr := httptest.NewRecorder()

	handler.GetPassportForAction(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp struct {
		AllowedActions []string `json:"allowed_actions"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.AllowedActions) != 1 || resp.AllowedActions[0] != string(models.ActionShip) {
		t.Fatalf("expected only SHIP, got %v", resp.AllowedActions)
	}
}

func TestMagicLinkTransition_ActiveOTPIsReused(t *testing.T) {
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionRecall), "LOGISTICS")
	repo.tokens[token.TokenHash].RequiresOTP = true

	body := `{"action":"RECALL"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.Token)
	rr := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr, req)
	if rr.Code != http.StatusAccepted {
		t.Fatalf("expected status 202, got %d", rr.Code)
	}
	firstOTP := repo.otps[token.TokenHash]
	if firstOTP == nil {
		t.Fatal("expected OTP to be created")
	}
	firstHash := firstOTP.OTPHash

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/passport/"+passportID.String()+"/transition", strings.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+token.Token)
	rr2 := httptest.NewRecorder()

	handler.TransitionWithMagicLink(rr2, req2)
	if rr2.Code != http.StatusAccepted {
		t.Fatalf("expected status 202, got %d", rr2.Code)
	}
	secondOTP := repo.otps[token.TokenHash]
	if secondOTP == nil {
		t.Fatal("expected OTP to remain present")
	}
	if secondOTP.OTPHash != firstHash {
		t.Fatal("expected existing active OTP to be reused instead of reissued")
	}
	if secondOTP.ResendCount != 0 {
		t.Fatalf("expected resend count to remain 0, got %d", secondOTP.ResendCount)
	}
}

// Regulatory stubs
func (f *fakeMagicRepo) CreateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeMagicRepo) ListRegulatorySources(ctx context.Context, activeOnly bool) ([]*models.RegulatorySource, error) { return nil, nil }
func (f *fakeMagicRepo) GetRegulatorySourceByID(ctx context.Context, id uuid.UUID) (*models.RegulatorySource, error) { return nil, nil }
func (f *fakeMagicRepo) UpdateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeMagicRepo) UpdateRegulatorySourceFetchMeta(ctx context.Context, id uuid.UUID, fetchedAt time.Time, etag string) error { return nil }
func (f *fakeMagicRepo) DeleteRegulatorySource(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeMagicRepo) UpsertRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) error { return nil }
func (f *fakeMagicRepo) GetRegulatoryItemBySourceAndExternalID(ctx context.Context, sourceID uuid.UUID, externalID string) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeMagicRepo) ListRegulatoryItems(ctx context.Context, f2 repository.ListRegulatoryItemsFilter) ([]*models.RegulatoryItem, int, error) { return nil, 0, nil }
func (f *fakeMagicRepo) GetRegulatoryItemByID(ctx context.Context, id uuid.UUID) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeMagicRepo) CreateTenantRegulatoryAlert(ctx context.Context, alert *models.TenantRegulatoryAlert) error { return nil }
func (f *fakeMagicRepo) GetTenantRegulatoryAlerts(ctx context.Context, tenantID uuid.UUID, unreadOnly bool, limit, offset int) ([]*models.TenantRegulatoryAlert, int, error) { return nil, 0, nil }
func (f *fakeMagicRepo) GetTenantRegulatoryAlertUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeMagicRepo) MarkTenantRegulatoryAlertRead(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeMagicRepo) MarkTenantRegulatoryAlertDismissed(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeMagicRepo) ListTenantsForRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) ([]uuid.UUID, error) { return nil, nil }

// AI parse cache stubs
func (f *fakeMagicRepo) GetAIParseCache(ctx context.Context, textHash string, promptVersion int, task string) (*models.AIParseCacheEntry, error) { return nil, nil }
func (f *fakeMagicRepo) SetAIParseCache(ctx context.Context, entry *models.AIParseCacheEntry) error { return nil }

