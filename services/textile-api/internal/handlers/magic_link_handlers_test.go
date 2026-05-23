package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/textile-api/internal/auth"
	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/repository"
	"github.com/anvayalabs/textile-api/internal/services"

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
	return &repository.VerificationResult{Allowed: true, Tier: "A", CompanyName: "Test", Role: string(models.ActorRoleSpinningMill)}, nil
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
	handler, _, token, passportID := setupMagicLinkHandler(t, models.TextileStatusRawMaterial, string(models.ActionProduce), string(models.ActorRoleSupplier))

	body := `{"action":"PRODUCE"}`
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
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionSell), "LOGISTICS")

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
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionSell), "LOGISTICS")

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
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionSell), "LOGISTICS")

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
	handler, _, token, passportID := setupMagicLinkHandler(t, models.TextileStatusRawMaterial, string(models.ActionProduce), string(models.ActorRoleSupplier))

	body := `{"action":"PRODUCE"}`
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
	handler, _, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionCollect), "LOGISTICS")

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
	handler, _, token, passportID := setupMagicLinkHandler(t, models.TextileStatusInProduction, string(models.ActionDye), string(models.ActorRoleDyeHouse))

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
	if len(resp.AllowedActions) != 1 || resp.AllowedActions[0] != string(models.ActionDye) {
		t.Fatalf("expected only DYE, got %v", resp.AllowedActions)
	}
}

func TestMagicLinkTransition_ActiveOTPIsReused(t *testing.T) {
	handler, repo, token, passportID := setupMagicLinkHandler(t, models.PassportStatusActive, string(models.ActionCollect), "LOGISTICS")
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
