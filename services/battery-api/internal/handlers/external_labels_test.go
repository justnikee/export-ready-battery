package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func withAPIKeyTenant(req *http.Request, tenantID uuid.UUID) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.APIKeyTenantIDKey, tenantID.String())
	return req.WithContext(ctx)
}

func TestExternalDownloadLabels_RejectsOversizeBatch(t *testing.T) {
	// P-03: must not load 10k passports when batch exceeds maxDownloadLimit.
	batchID := uuid.New()
	tenantID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).
		Return(&models.Batch{ID: batchID, TenantID: tenantID, BatchName: "BIG-BATCH", Status: models.BatchStatusActive}, nil)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(&models.Tenant{ID: tenantID, CompanyName: "Acme"}, nil)
	// Over the sync limit
	repo.On("CountPassportsByBatch", mock.Anything, batchID).
		Return(maxDownloadLimit+1, nil)
	// Must NOT call GetPassportsByBatch when over limit

	h := &Handler{repo: repo}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/external/batches/"+batchID.String()+"/labels", nil)
	req.SetPathValue("id", batchID.String())
	req = withAPIKeyTenant(req, tenantID)

	rr := httptest.NewRecorder()
	h.ExternalDownloadLabels(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for oversize batch, got %d: %s", rr.Code, rr.Body.String())
	}
	var body map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	errMsg, _ := body["error"].(string)
	if errMsg == "" {
		t.Fatalf("expected error message, body=%v", body)
	}
	repo.AssertNotCalled(t, "GetPassportsByBatch", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	repo.AssertExpectations(t)
}

func TestExternalDownloadLabels_EmptyBatch(t *testing.T) {
	batchID := uuid.New()
	tenantID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).
		Return(&models.Batch{ID: batchID, TenantID: tenantID, BatchName: "EMPTY", Status: models.BatchStatusActive}, nil)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(&models.Tenant{ID: tenantID}, nil)
	repo.On("CountPassportsByBatch", mock.Anything, batchID).Return(0, nil)

	h := &Handler{repo: repo}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/external/batches/"+batchID.String()+"/labels", nil)
	req.SetPathValue("id", batchID.String())
	req = withAPIKeyTenant(req, tenantID)

	rr := httptest.NewRecorder()
	h.ExternalDownloadLabels(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 empty batch, got %d", rr.Code)
	}
	repo.AssertNotCalled(t, "GetPassportsByBatch", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestExternalDownloadLabels_CountError(t *testing.T) {
	batchID := uuid.New()
	tenantID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).
		Return(&models.Batch{ID: batchID, TenantID: tenantID, BatchName: "X", Status: models.BatchStatusActive}, nil)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(&models.Tenant{ID: tenantID}, nil)
	repo.On("CountPassportsByBatch", mock.Anything, batchID).
		Return(0, errors.New("db down"))

	h := &Handler{repo: repo}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/external/batches/"+batchID.String()+"/labels", nil)
	req.SetPathValue("id", batchID.String())
	req = withAPIKeyTenant(req, tenantID)

	rr := httptest.NewRecorder()
	h.ExternalDownloadLabels(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

func TestMaxDownloadLimit_SharedWithJWTPath(t *testing.T) {
	// External and JWT label downloads must share the same cap (P-03).
	if maxDownloadLimit != 500 {
		t.Fatalf("maxDownloadLimit=%d; expected 500", maxDownloadLimit)
	}
}
