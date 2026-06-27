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

func TestGetTenantCertificateAnchors_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/anchors?cert_type=BIS&status=confirmed", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetTenantCertificateAnchors(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Anchors []repository.CertificateAnchorWithBatch `json:"anchors"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
}

func TestGetTenantCertificateAnchors_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/anchors", nil)

	rr := httptest.NewRecorder()
	handler.GetTenantCertificateAnchors(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}
