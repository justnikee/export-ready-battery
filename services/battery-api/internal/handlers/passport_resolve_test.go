package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func TestResolvePassport_BySerial(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	p := &models.Passport{
		UUID:         uuid.New(),
		BatchID:      uuid.New(),
		SerialNumber: "EU-FOO-LFP-2026-00001",
		Status:       models.PassportStatusCreated,
	}
	mockRepo.On("GetPassportBySerialForTenant", mock.Anything, tenantID, "EU-FOO-LFP-2026-00001").Return(p, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/resolve?q=EU-FOO-LFP-2026-00001", nil)
	req = setAuthContext(req, tenantID, "ops@test.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	handler.ResolvePassport(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var body map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["uuid"] != p.UUID.String() {
		t.Errorf("uuid=%v want %s", body["uuid"], p.UUID)
	}
	if body["serial_number"] != p.SerialNumber {
		t.Errorf("serial=%v", body["serial_number"])
	}
	mockRepo.AssertExpectations(t)
}

func TestResolvePassport_ByUUID_ForeignTenant404(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	otherTenant := uuid.New()
	p := &models.Passport{
		UUID:    uuid.New(),
		BatchID: uuid.New(),
		Status:  models.PassportStatusCreated,
	}
	mockRepo.On("GetPassport", mock.Anything, p.UUID).Return(p, nil)
	mockRepo.On("GetBatchTenantID", mock.Anything, p.BatchID).Return(otherTenant, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/resolve?q="+p.UUID.String(), nil)
	req = setAuthContext(req, tenantID, "ops@test.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	handler.ResolvePassport(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

func TestResolvePassport_SerialNotFound(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	mockRepo.On("GetPassportBySerialForTenant", mock.Anything, tenantID, "EU-NOPE-LFP-2026-00099").
		Return(nil, fmt.Errorf("passport not found"))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/resolve?q=EU-NOPE-LFP-2026-00099", nil)
	req = setAuthContext(req, tenantID, "ops@test.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	handler.ResolvePassport(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestResolvePassport_MissingQuery(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)
	tenantID := uuid.New()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/resolve", nil)
	req = setAuthContext(req, tenantID, "ops@test.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	handler.ResolvePassport(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
