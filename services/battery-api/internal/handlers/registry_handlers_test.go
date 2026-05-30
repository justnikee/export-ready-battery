package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

func TestGetBatchRegistryVerifications_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	batchID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+batchID.String()+"/verifications", nil)
	req.SetPathValue("id", batchID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetBatchRegistryVerifications(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["batch_id"] == "" {
		t.Error("expected batch_id in response")
	}
}

func TestGetBatchRegistryVerifications_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+uuid.New().String()+"/verifications", nil)

	rr := httptest.NewRecorder()
	handler.GetBatchRegistryVerifications(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestVerifyBatchRegistry_InvalidRegistryType(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	batchID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"registry_type":"invalid_type","certificate_no":"123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/verify-registry", bytes.NewReader([]byte(body)))
	req.SetPathValue("id", batchID.String())
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.VerifyBatchRegistry(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestAutoVerifyBatchRegistry_BatchNotFound(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	batchID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/auto-verify", nil)
	req.SetPathValue("id", batchID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.AutoVerifyBatchRegistry(rr, req)

	// Should return 500 because batch doesn't exist in fake repo
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", rr.Code, rr.Body.String())
	}
}
