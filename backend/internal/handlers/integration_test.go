package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// ============================================================================
// INTEGRATION TESTS
// Tests verify the full handler → service → mock-repo flow using httptest.
// ============================================================================

// newTestHandler creates a Handler with a MockRepository for integration tests.
func newTestHandler(m *repository.MockRepository) *Handler {
	return &Handler{
		repo: m,
	}
}

// setAuthContext injects tenant ID and email into the request context.
func setAuthContext(req *http.Request, tenantID uuid.UUID, email string) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
	ctx = context.WithValue(ctx, middleware.EmailKey, email)
	return req.WithContext(ctx)
}

// ============================================================================
// EPR HANDLER INTEGRATION TESTS
// GET /api/v1/epr/obligation
// ============================================================================

func TestGetEPRObligation_Success(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	mfgDate := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)

	tenant := &models.Tenant{
		ID:                    tenantID,
		CompanyName:           "Test Battery Co",
		EPRRegistrationNumber: "EPR/WP/2024/00001",
	}

	batches := []*models.Batch{
		{
			ID:                     uuid.New(),
			TenantID:               tenantID,
			Status:                 models.BatchStatusActive,
			MarketRegion:           models.MarketRegionIndia,
			TotalPassports:         100,
			ManufacturingStartDate: &mfgDate,
			Specs: models.BatchSpec{
				Weight: "500g",
			},
		},
		{
			ID:                     uuid.New(),
			TenantID:               tenantID,
			Status:                 models.BatchStatusActive,
			MarketRegion:           models.MarketRegionIndia,
			TotalPassports:         50,
			ManufacturingStartDate: &mfgDate,
			Specs: models.BatchSpec{
				Weight: "1.2kg",
			},
		},
	}

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("ListBatches", mock.Anything, tenantID, 1000, 0).Return(batches, 2, nil)
	mockRepo.On("GetEPRCertificateSummary", mock.Anything, tenantID, mock.AnythingOfType("string")).Return(float64(0), 0, nil)

	req := httptest.NewRequest("GET", "/api/v1/epr/obligation?year=2026", nil)
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.GetEPRObligation(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var result services.EPRObligation
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if result.TotalBatches != 2 {
		t.Errorf("expected 2 batches, got %d", result.TotalBatches)
	}
	if result.TotalPassports != 150 {
		t.Errorf("expected 150 passports, got %d", result.TotalPassports)
	}
	// 100×0.5 + 50×1.2 = 50 + 60 = 110 kg
	if result.TotalWeightKg != 110.0 {
		t.Errorf("expected 110.0 kg, got %.2f", result.TotalWeightKg)
	}
	if result.CollectionTargetPct != 80.0 {
		t.Errorf("expected 80%% target for 2026, got %.0f%%", result.CollectionTargetPct)
	}
	// 110 * 80 / 100 = 88 kg required
	if result.RequiredCollectionKg != 88.0 {
		t.Errorf("expected 88.0 kg required, got %.2f", result.RequiredCollectionKg)
	}
	if result.Status != "NON_COMPLIANT" {
		t.Errorf("expected NON_COMPLIANT (0 collected), got %s", result.Status)
	}

	mockRepo.AssertExpectations(t)
}

func TestGetEPRObligation_NoAuth(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	req := httptest.NewRequest("GET", "/api/v1/epr/obligation", nil)
	rr := httptest.NewRecorder()

	handler.GetEPRObligation(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestGetEPRObligation_InvalidYear(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	req := httptest.NewRequest("GET", "/api/v1/epr/obligation?year=1999", nil)
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.GetEPRObligation(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid year, got %d", rr.Code)
	}
}

func TestGetEPRObligation_NotRegistered(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	tenant := &models.Tenant{
		ID:                    tenantID,
		CompanyName:           "Unregistered Co",
		EPRRegistrationNumber: "",
	}

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("ListBatches", mock.Anything, tenantID, 1000, 0).Return([]*models.Batch{}, 0, nil)
	mockRepo.On("GetEPRCertificateSummary", mock.Anything, tenantID, mock.AnythingOfType("string")).Return(float64(0), 0, nil)

	req := httptest.NewRequest("GET", "/api/v1/epr/obligation?year=2026", nil)
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.GetEPRObligation(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var result services.EPRObligation
	json.NewDecoder(rr.Body).Decode(&result)

	if result.Status != "NOT_REGISTERED" {
		t.Errorf("expected NOT_REGISTERED, got %s", result.Status)
	}

	mockRepo.AssertExpectations(t)
}

// ============================================================================
// EPR MULTI-YEAR SUMMARY INTEGRATION TEST
// GET /api/v1/epr/obligation/summary
// ============================================================================

func TestGetEPRMultiYear_Success(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	tenant := &models.Tenant{
		ID:                    tenantID,
		CompanyName:           "Multi Year Corp",
		EPRRegistrationNumber: "EPR/WP/2024/00002",
	}

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("ListBatches", mock.Anything, tenantID, 1000, 0).Return([]*models.Batch{}, 0, nil)
	mockRepo.On("GetEPRCertificateSummary", mock.Anything, tenantID, mock.AnythingOfType("string")).Return(float64(0), 0, nil)

	req := httptest.NewRequest("GET", "/api/v1/epr/obligation/summary", nil)
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.GetEPRMultiYear(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var results []services.EPRObligation
	if err := json.NewDecoder(rr.Body).Decode(&results); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(results) != 3 {
		t.Errorf("expected 3-year summary, got %d entries", len(results))
	}

	currentYear := time.Now().Year()
	if results[0].Year != currentYear-1 {
		t.Errorf("first entry should be %d, got %d", currentYear-1, results[0].Year)
	}
	if results[1].Year != currentYear {
		t.Errorf("second entry should be %d, got %d", currentYear, results[1].Year)
	}
	if results[2].Year != currentYear+1 {
		t.Errorf("third entry should be %d, got %d", currentYear+1, results[2].Year)
	}

	mockRepo.AssertExpectations(t)
}

// ============================================================================
// ACTIVATION COMPLIANCE + AIS GATE INTEGRATION TESTS
// Tests the batch activation flow: service validates India AIS certs
// ============================================================================

func TestActivation_IndiaWithAIS_Passes(t *testing.T) {
	mfgStart := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mfgEnd := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)

	tid := uuid.New()
	batch := &models.Batch{
		ID:                     uuid.New(),
		TenantID:               tid,
		ModelName:              "ER-100",
		Status:                 models.BatchStatusDraft,
		MarketRegion:           models.MarketRegionIndia,
		ManufacturingStartDate: &mfgStart,
		ManufacturingEndDate:   &mfgEnd,
		CellSource:             "DOMESTIC",
		DomesticValueAdd:       55.0,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			Capacity:       "100Ah",
			NominalVoltage: "3.2V",
			Weight:         "1.5kg",
			Certifications: []string{"AIS-156", "AIS-038", "BIS"},
		},
	}
	tenant := &models.Tenant{
		ID:                    tid,
		CompanyName:           "Test Co",
		EPRRegistrationNumber: "EPR/WP/2024/00001",
		BISRNumber:            "R-12345678",
		IECCode:               "IEC0123456",
		MorthManufacturerCode: "TCO",
	}

	result := services.ValidateActivationCompliance(batch, tenant)

	if !result.Valid {
		t.Errorf("expected Valid=true for India batch with AIS certs")
		for _, m := range result.Missing {
			t.Logf("missing: %s", m)
		}
		for _, e := range result.Errors {
			t.Logf("error: %s", e)
		}
	}
}

func TestActivation_IndiaWithoutAIS_Blocked(t *testing.T) {
	mfgStart := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mfgEnd := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)

	tid := uuid.New()
	batch := &models.Batch{
		ID:                     uuid.New(),
		TenantID:               tid,
		ModelName:              "ER-100",
		Status:                 models.BatchStatusDraft,
		MarketRegion:           models.MarketRegionIndia,
		ManufacturingStartDate: &mfgStart,
		ManufacturingEndDate:   &mfgEnd,
		CellSource:             "DOMESTIC",
		DomesticValueAdd:       55.0,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			Capacity:       "100Ah",
			NominalVoltage: "3.2V",
			Weight:         "1.5kg",
			Certifications: []string{"BIS"},
		},
	}
	tenant := &models.Tenant{
		ID:                    tid,
		CompanyName:           "Test Co",
		EPRRegistrationNumber: "EPR/WP/2024/00001",
		BISRNumber:            "R-12345678",
		IECCode:               "IEC0123456",
		MorthManufacturerCode: "TCO",
	}

	result := services.ValidateActivationCompliance(batch, tenant)

	if result.Valid {
		t.Errorf("expected Valid=false for India batch without AIS certs")
	}

	// AIS certs are in Missing (not Errors) since they're missing certifications
	aisMissing := 0
	for _, m := range result.Missing {
		if strings.Contains(m, "AIS-156") || strings.Contains(m, "AIS-038") {
			aisMissing++
		}
	}
	if aisMissing != 2 {
		t.Errorf("expected 2 AIS missing entries, got %d", aisMissing)
		for _, m := range result.Missing {
			t.Logf("missing: %s", m)
		}
	}
}

func TestActivation_EUSkipsAIS(t *testing.T) {
	mfgStart := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mfgEnd := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)

	batch := &models.Batch{
		ID:                     uuid.New(),
		TenantID:               uuid.New(),
		ModelName:              "ER-EU-100",
		Status:                 models.BatchStatusDraft,
		MarketRegion:           models.MarketRegionEU,
		ManufacturingStartDate: &mfgStart,
		ManufacturingEndDate:   &mfgEnd,
		Specs: models.BatchSpec{
			Chemistry:       "NMC",
			Capacity:        "100Ah",
			NominalVoltage:  "3.7V",
			Weight:          "2.0kg",
			CarbonFootprint: "45 kg CO2eq/kWh",
			Certifications:  []string{"CE", "UN38.3"},
		},
	}
	tenant := &models.Tenant{
		ID:          batch.TenantID,
		CompanyName: "Test EU Co",
	}

	result := services.ValidateActivationCompliance(batch, tenant)

	for _, e := range result.Errors {
		if strings.Contains(e, "AIS-156") || strings.Contains(e, "AIS-038") {
			t.Errorf("EU batch should not have AIS error: %s", e)
		}
	}
}

// ============================================================================
// LIFECYCLE FLOW INTEGRATION TEST
// Tests passport state transition: ACTIVE → SHIPPED via handler
// Note: INSTALL requires TECHNICIAN role which has no team-role mapping,
// so it's tested at the service level only. Handler tests cover SHIP.
// ============================================================================

func TestLifecycleFlow_ShipTransition(t *testing.T) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()
	tenantID := "11111111-1111-1111-1111-111111111111"
	email := "operator@test.com"

	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   batchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}

	service := services.NewLifecycleService(repo)
	roleResolver := &fakeRoleResolver{role: "MEMBER"}
	handler := NewLifecycleHandler(service, roleResolver)

	// ACTIVE → SHIPPED (MEMBER maps to INTERNAL_OPERATOR, allowed for SHIP)
	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-001","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail(tenantID, email))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("SHIP: expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["new_status"] != models.PassportStatusShipped {
		t.Fatalf("expected SHIPPED, got %v", resp["new_status"])
	}

	// Verify passport state was updated
	if repo.passports[passportID].Status != models.PassportStatusShipped {
		t.Errorf("passport state not persisted: expected SHIPPED, got %s", repo.passports[passportID].Status)
	}

	// Verify audit trail has 1 event
	events := repo.events[passportID]
	if len(events) != 1 {
		t.Errorf("expected 1 audit event, got %d", len(events))
	}
	if len(events) > 0 && events[0].Action != "SHIP" {
		t.Errorf("expected SHIP action in audit, got %s", events[0].Action)
	}
}

func TestLifecycleFlow_AdminRecall(t *testing.T) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()
	tenantID := "11111111-1111-1111-1111-111111111111"
	email := "admin@test.com"

	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   batchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}

	service := services.NewLifecycleService(repo)
	roleResolver := &fakeRoleResolver{role: "ADMIN"}
	handler := NewLifecycleHandler(service, roleResolver)

	// ACTIVE → RECALLED (ADMIN maps to ActorRoleAdmin, allowed for RECALL)
	body := `{"action":"RECALL","evidence":{"recall_reason":"Safety defect BMS-042","recall_reference":"RECALL-2026-001"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail(tenantID, email))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("RECALL: expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["new_status"] != models.PassportStatusRecalled {
		t.Fatalf("expected RECALLED, got %v", resp["new_status"])
	}
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
