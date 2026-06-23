package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

func TestGetAnalyticsOverview_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})

	// Seed some batches for analytics
	repo.suppliers[uuid.New()] = &models.Supplier{ID: uuid.New().String(), TenantID: tenantID.String(), Status: "active"}

	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetAnalyticsOverview(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.AnalyticsOverview
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}

	// Should have initialized maps even if empty
	if resp.BatchStatusBreakdown == nil {
		t.Error("expected batch_status_breakdown to be initialized")
	}
	if resp.SupplierDocStatus == nil {
		t.Error("expected supplier_document_status to be initialized")
	}
	if resp.AlertSeverityBreakdown == nil {
		t.Error("expected alert_severity_breakdown to be initialized")
	}
}

func TestGetAnalyticsOverview_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview", nil)
	// No auth context

	rr := httptest.NewRecorder()
	handler.GetAnalyticsOverview(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}
