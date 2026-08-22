package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func withTenant(req *http.Request, tenantID uuid.UUID) *http.Request {
	return req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String()))
}

func TestIsProductionArtifactJob(t *testing.T) {
	if !isProductionArtifactJob(models.ExportJobTypeQRZip) || !isProductionArtifactJob(models.ExportJobTypeLabelPDF) {
		t.Fatal("QR_ZIP and LABELS_PDF must be gated")
	}
	if isProductionArtifactJob(models.ExportJobTypeCSV) {
		t.Fatal("CSV is not a production identifier artifact")
	}
}

func TestDownloadQRCodes_RejectsDraft(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	batchID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
		Status:   models.BatchStatusDraft,
	}, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/batches/{id}/download", http.HandlerFunc(h.DownloadQRCodes))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+batchID.String()+"/download", nil)
	req = withTenant(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for DRAFT QR, got %d body=%s", rr.Code, rr.Body.String())
	}
	assertDraftArtifactError(t, rr)
	repo.AssertNotCalled(t, "CountPassportsByBatch", mock.Anything, mock.Anything)
}

func TestDownloadLabels_AllowsArchived(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	batchID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
		Status:   models.BatchStatusArchived,
	}, nil)
	repo.On("GetTenant", mock.Anything, tenantID).Return(&models.Tenant{ID: tenantID}, nil)
	repo.On("CountPassportsByBatch", mock.Anything, batchID).Return(0, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/batches/{id}/labels", http.HandlerFunc(h.DownloadLabels))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+batchID.String()+"/labels", nil)
	req = withTenant(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("ARCHIVED should pass the status gate (then 404 no passports), got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestDownloadLabels_RejectsDraft(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	batchID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
		Status:   models.BatchStatusDraft,
	}, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/batches/{id}/labels", http.HandlerFunc(h.DownloadLabels))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+batchID.String()+"/labels", nil)
	req = withTenant(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for DRAFT labels, got %d body=%s", rr.Code, rr.Body.String())
	}
	assertDraftArtifactError(t, rr)
}

func TestExternalDownloadLabels_RejectsDraft(t *testing.T) {
	tenantID := uuid.New()
	batchID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
		Status:   models.BatchStatusDraft,
		BatchName: "DRAFT-BATCH",
	}, nil)

	h := &Handler{repo: repo}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/external/batches/"+batchID.String()+"/labels", nil)
	req.SetPathValue("id", batchID.String())
	req = withAPIKeyTenant(req, tenantID)
	rr := httptest.NewRecorder()
	h.ExternalDownloadLabels(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for DRAFT external labels, got %d body=%s", rr.Code, rr.Body.String())
	}
	assertDraftArtifactError(t, rr)
	repo.AssertNotCalled(t, "CountPassportsByBatch", mock.Anything, mock.Anything)
}

func assertDraftArtifactError(t *testing.T, rr *httptest.ResponseRecorder) {
	t.Helper()
	var body map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["error"] != models.ProductionArtifactsDraftMessage {
		t.Fatalf("error=%q", body["error"])
	}
}
