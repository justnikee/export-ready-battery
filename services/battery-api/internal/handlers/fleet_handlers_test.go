package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

func TestGetFleetStats_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/stats", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetFleetStats(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp repository.FleetStats
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetFleetStats_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/stats", nil)

	rr := httptest.NewRecorder()
	handler.GetFleetStats(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestGetFleetWorstHealth_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/worst-health?limit=5", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetFleetWorstHealth(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Passports []repository.FleetPassportHealth `json:"passports"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetFleetEvents_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/events?days=30", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetFleetEvents(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Events []repository.FleetLifecycleEvent `json:"events"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetFleetGeo_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/geo", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetFleetGeo(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Locations []repository.FleetGeoLocation `json:"locations"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetFleetThermalEvents_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/thermal-events?days=30&limit=20", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetFleetThermalEvents(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Events []repository.FleetThermalEvent `json:"events"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetFleetThermalEvents_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/fleet/thermal-events", nil)

	rr := httptest.NewRecorder()
	handler.GetFleetThermalEvents(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}
