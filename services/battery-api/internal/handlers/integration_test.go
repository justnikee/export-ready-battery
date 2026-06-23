package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/compliance/battery"
	"github.com/anvayalabs/battery-api/internal/config"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/schema"
	schemaSeeds "github.com/anvayalabs/battery-api/internal/schema/seeds"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// ============================================================================
// INTEGRATION TESTS
// Tests verify the full handler → service → mock-repo flow using httptest.
// ============================================================================

// newTestHandler creates a Handler with a MockRepository for integration tests.
func newTestHandler(m *repository.MockRepository) *Handler {
	complianceReg := compliance.NewRegistry()
	complianceReg.Register(models.ProductTypeBattery, models.MarketRegionIndia, battery.NewIndiaValidator())
	complianceReg.Register(models.ProductTypeBattery, models.MarketRegionEU, battery.NewEUValidator())

	schemaReg := schema.NewRegistry(nil)
	if batteryV1, err := schemaSeeds.LoadBatteryV1(); err == nil {
		schemaReg.Seed(batteryV1)
	}

	return &Handler{
		repo:         m,
		batchService: services.NewBatchService(schemaReg, complianceReg, m),
	}
}

// setAuthContext injects tenant ID, email, and product type into the request context.
func setAuthContext(req *http.Request, tenantID uuid.UUID, email string, productType models.ProductType) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
	ctx = context.WithValue(ctx, middleware.EmailKey, email)
	ctx = context.WithValue(ctx, middleware.ProductTypeKey, string(productType))
	return req.WithContext(ctx)
}

// ============================================================================
// LIFECYCLE FLOW: INVALID TRANSITIONS
// ============================================================================

func TestLifecycleFlow_SkipStateBlocked(t *testing.T) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()

	// Start at CREATED — cannot directly SHIP (must ACTIVATE first)
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   batchID,
		Status:    models.PassportStatusCreated,
		CreatedAt: time.Now(),
	}

	service := services.NewLifecycleService(repo)
	roleResolver := &fakeRoleResolver{role: "MEMBER"}
	handler := NewLifecycleHandler(service, roleResolver)

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-X","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@test.com"))

	rr := httptest.NewRecorder()
	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409 for skipped state, got %d: %s", rr.Code, rr.Body.String())
	}
}

// ============================================================================
// ASYNC REGISTRY VERIFICATION INTEGRATION TESTS
// ============================================================================

func TestVerifyBatchRegistry_AsyncCreatesJob(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	mockRepo.On("GetRegistryVerificationByBatchAndType", mock.Anything, batchID, "bis", "R-41012345").Return(nil, nil)
	mockRepo.On("CreateRegistryJob", mock.Anything, mock.AnythingOfType("*models.RegistryJob")).Return(nil)
	mockRepo.On("CreateRegistryVerification", mock.Anything, mock.AnythingOfType("*models.RegistryVerification")).Return(nil)

	// Inject registry verification service with async enabled
	cfg := &config.Config{RegistryAsyncEnabled: true}
	svc := services.NewRegistryVerificationService(mockRepo, cfg)
	handler.registryVerificationService = svc

	body := `{"registry_type":"bis","certificate_no":"R-41012345"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/verify-registry", bytes.NewReader([]byte(body)))
	req.SetPathValue("id", batchID.String())
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.VerifyBatchRegistry(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.RegistryVerification
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}

	if resp.Status != string(models.RegistryStatusPending) {
		t.Errorf("expected pending status, got %s", resp.Status)
	}
	if resp.TrustTier != string(models.TrustTierSelfDeclared) {
		t.Errorf("expected self_declared trust tier, got %s", resp.TrustTier)
	}
	if resp.VerifiedData == nil {
		t.Fatal("expected verified_data")
	}
	if (*resp.VerifiedData)["job_id"] == nil {
		t.Error("expected job_id in verified_data")
	}
	if (*resp.VerifiedData)["message"] == nil {
		t.Error("expected message in verified_data")
	}

	mockRepo.AssertExpectations(t)
}

func TestVerifyBatchRegistry_AsyncCacheHit(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()
	expires := time.Now().Add(24 * time.Hour)

	cached := &models.RegistryVerification{
		ID:            uuid.New().String(),
		BatchID:       batchID.String(),
		TenantID:      tenantID.String(),
		RegistryType:  "bis",
		CertificateNo: "R-41012345",
		Status:        string(models.RegistryStatusVerified),
		TrustTier:     string(models.TrustTierRegistry),
		ExpiresAt:     &expires,
	}

	mockRepo.On("GetRegistryVerificationByBatchAndType", mock.Anything, batchID, "bis", "R-41012345").Return(cached, nil)

	cfg := &config.Config{RegistryAsyncEnabled: true}
	svc := services.NewRegistryVerificationService(mockRepo, cfg)
	handler.registryVerificationService = svc

	body := `{"registry_type":"bis","certificate_no":"R-41012345"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/verify-registry", bytes.NewReader([]byte(body)))
	req.SetPathValue("id", batchID.String())
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.VerifyBatchRegistry(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.RegistryVerification
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}

	if resp.ID != cached.ID {
		t.Error("expected cached verification to be returned")
	}

	mockRepo.AssertExpectations(t)
}

func TestAutoVerifyBatchRegistry_AsyncCreatesMultipleJobs(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := &models.Batch{
		ID:       batchID,
		TenantID: tenantID,
		Status:   models.BatchStatusActive,
		Specs: models.BatchSpec{
			BISNumber:    "R-41012345",
			EPRNumber:    "EPR/WP/2024/00001",
			UN383TestDate: "2025-01-01",
		UN383LabName:  "TÜV SÜD",
		},
	}

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetRegistryVerificationByBatchAndType", mock.Anything, batchID, mock.Anything, mock.Anything).Return(nil, nil)
	mockRepo.On("CreateRegistryJob", mock.Anything, mock.AnythingOfType("*models.RegistryJob")).Return(nil).Times(3)
	mockRepo.On("CreateRegistryVerification", mock.Anything, mock.AnythingOfType("*models.RegistryVerification")).Return(nil).Times(3)

	cfg := &config.Config{RegistryAsyncEnabled: true}
	svc := services.NewRegistryVerificationService(mockRepo, cfg)
	handler.registryVerificationService = svc

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/auto-verify", nil)
	req.SetPathValue("id", batchID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.AutoVerifyBatchRegistry(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}

	if resp["count"] == nil {
		t.Error("expected count in response")
	}

	mockRepo.AssertExpectations(t)
}
