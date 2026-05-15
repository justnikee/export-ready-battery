package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"anvayalabs-battery/internal/compliance"
	"anvayalabs-battery/internal/compliance/battery"
	"anvayalabs-battery/internal/compliance/textile"
	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/schema"
	"anvayalabs-battery/internal/services"

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
	complianceReg.Register(models.ProductTypeTextile, models.MarketRegionIndia, textile.NewIndiaValidator())
	complianceReg.Register(models.ProductTypeTextile, models.MarketRegionEU, textile.NewEUValidator())

	return &Handler{
		repo:         m,
		batchService: services.NewBatchService(schema.NewRegistry(nil), complianceReg, m),
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
	mockRepo.On("ListBatches", mock.Anything, tenantID, models.ProductTypeBattery, 1000, 0).Return(batches, 2, nil)
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
	mockRepo.On("ListBatches", mock.Anything, tenantID, models.ProductTypeBattery, 1000, 0).Return([]*models.Batch{}, 0, nil)
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
	mockRepo.On("ListBatches", mock.Anything, tenantID, models.ProductTypeBattery, 1000, 0).Return([]*models.Batch{}, 0, nil)
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
		DomesticValueAdd:       55.0,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			Capacity:       "100Ah",
			NominalVoltage: "3.2V",
			Weight:         "1.5kg",
			Certifications: []string{"AIS-156", "AIS-038", "BIS"},
			CellSource:     "DOMESTIC",
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
		DomesticValueAdd:       55.0,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			Capacity:       "100Ah",
			NominalVoltage: "3.2V",
			Weight:         "1.5kg",
			CellSource:     "DOMESTIC",
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

// ============================================================================
// TEXTILE INTEGRATION TESTS
// ============================================================================

func TestCreateBatch_TextileIndia_Success(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	tenant := &models.Tenant{
		ID:          tenantID,
		CompanyName: "Anvaya Textiles",
		Address:     "Surat, Gujarat",
	}
	tenant.EnsureBatteryProfile()

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)

	// Capture the created batch
	var capturedReq repository.CreateBatchRequest
	mockRepo.On("CreateBatch", mock.Anything, mock.MatchedBy(func(req repository.CreateBatchRequest) bool {
		capturedReq = req
		return req.ProductType == models.ProductTypeTextile
	})).Return(&models.Batch{
		ID:           uuid.New(),
		TenantID:     tenantID,
		BatchName:    "Cotton Jersey Lot",
		ProductType:  models.ProductTypeTextile,
		MarketRegion: models.MarketRegionIndia,
		Status:       models.BatchStatusDraft,
	}, nil)

	body := `{
		"tenant_id": "` + tenantID.String() + `",
		"batch_name": "Cotton Jersey Lot",
		"model_name": "Jersey Tee",
		"product_type": "TEXTILE",
		"market_region": "INDIA",
		"manufacturing_start_date": "2026-01-01",
		"manufacturing_end_date": "2026-01-31",
		"specs": {
			"material_profile": "100% organic cotton",
			"country_of_origin": "India",
			"production_stage": "finished_goods",
			"gsm": 180,
			"fiber_composition": {"cotton_pct": 100},
			"labor_compliance": {"sa8000_certified": true, "audit_score": 85}
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.CreateBatch(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	if capturedReq.ProductType != models.ProductTypeTextile {
		t.Errorf("expected ProductType TEXTILE, got %s", capturedReq.ProductType)
	}
	if capturedReq.Specs.FiberComposition == nil {
		t.Error("expected FiberComposition to be set")
	}
	if capturedReq.Specs.GSM != 180 {
		t.Errorf("expected GSM 180, got %f", capturedReq.Specs.GSM)
	}
}

func TestComplianceCheck_TextileIndia_Valid(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	tenant := &models.Tenant{
		ID:          tenantID,
		CompanyName: "Anvaya Textiles",
		Address:     "Surat, Gujarat",
	}

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)

	body := `{
		"product_type": "TEXTILE",
		"market_region": "INDIA",
		"specs": {
			"manufacturer": "Anvaya Textiles",
			"material_profile": "100% organic cotton",
			"country_of_origin": "India",
			"production_stage": "finished_goods",
			"gsm": 180,
			"fiber_composition": {"cotton_pct": 100},
			"expected_lifetime_washes": 100,
			"labor_compliance": {"sa8000_certified": true, "audit_score": 85},
			"water_usage_liters": 150,
			"energy_usage_kwh": 25
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/compliance/check", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.ComplianceCheck(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	// ComplianceCheck dry-run does not fetch tenant data, so tenant checks appear as missing.
	// A complete textile batch should score ~81.8 (9/11 checks) without tenant context.
	score, _ := result["score"].(float64)
	if score < 75 {
		t.Errorf("expected decent compliance score for complete specs, got %.1f", score)
	}
}

func TestComplianceCheck_TextileEU_Valid(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	tenant := &models.Tenant{
		ID:                                tenantID,
		CompanyName:                       "Anvaya Textiles EU",
		Address:                           "Berlin, Germany",
		EUAuthorizedRepresentativeName:    "EU Rep GmbH",
		EUAuthorizedRepresentativeAddress: "Berlin, Germany",
	}

	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)

	body := `{
		"product_type": "TEXTILE",
		"market_region": "EU",
		"specs": {
			"manufacturer": "Anvaya Textiles EU",
			"material_profile": "100% organic cotton",
			"country_of_origin": "India",
			"production_stage": "finished_goods",
			"gsm": 180,
			"fiber_composition": {"cotton_pct": 100},
			"expected_lifetime_washes": 100,
			"recycled_content_pct": 15,
			"water_usage_liters": 150,
			"energy_usage_kwh": 25,
			"chemical_compliance_zdhc": {"zdhc_level": "2", "mrsl_tested": true},
			"hazardous_substances": {"declaration": "No SVHC above threshold"}
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/compliance/check", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.ComplianceCheck(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	// ComplianceCheck dry-run does not fetch tenant data, so tenant checks appear as missing.
	// A complete EU textile batch should score ~68.8 (11/16 checks) without tenant context.
	score, _ := result["score"].(float64)
	if score < 60 {
		t.Errorf("expected decent compliance score for complete EU specs, got %.1f", score)
	}
}

func TestActivateBatch_Textile_Success(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()
	now := time.Now()

	tenant := &models.Tenant{
		ID:            tenantID,
		CompanyName:   "Anvaya Textiles",
		Address:       "Surat, Gujarat",
		QuotaBalance:  10,
		PlanType:      "GROWTH",
	}

	batch := &models.Batch{
		ID:                     batchID,
		TenantID:               tenantID,
		BatchName:              "Cotton Jersey Lot",
		ModelName:              "Jersey Tee",
		ProductType:            models.ProductTypeTextile,
		MarketRegion:           models.MarketRegionIndia,
		Status:                 models.BatchStatusDraft,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			Manufacturer:    "Anvaya Textiles",
			MaterialProfile: "100% organic cotton",
			CountryOfOrigin: "India",
			ProductionStage: "finished_goods",
			GSM:             180,
			FiberComposition: &models.FiberComposition{
				CottonPct: 100,
			},
			ExpectedLifetimeWashes: &[]int{100}[0],
			LaborCompliance: &models.LaborCompliance{
				SA8000Certified: true,
				AuditScore:      85,
			},
			WaterUsageLiters: 150,
			EnergyUsageKWh:   25,
		},
	}

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(10, nil)
	mockRepo.On("DeductQuota", mock.Anything, tenantID).Return(nil)
	mockRepo.On("UpdateBatchComplianceResult", mock.Anything, batchID, mock.AnythingOfType("float64"), mock.Anything).Return(nil)
	mockRepo.On("SetBatchStatus", mock.Anything, batchID, models.BatchStatusActive).Return(nil)
	mockRepo.On("CreateTransaction", mock.Anything, mock.AnythingOfType("*models.Transaction")).Return(nil)
	mockRepo.On("UpdateTenantQuota", mock.Anything, tenantID, -1).Return(nil)
	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/activate/"+batchID.String(), nil)
	req.SetPathValue("id", batchID.String())
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for textile activation, got %d: %s", rr.Code, rr.Body.String())
	}
}
