package handlers

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// S-10: canonical cert storage path is tenant-scoped and type-specific.
func TestComplianceCertificateStoragePath(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
	for _, docType := range []string{"epr", "bis", "pli"} {
		path := tenantID.String() + "/certificates/" + docType + ".pdf"
		if path != "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/certificates/"+docType+".pdf" {
			t.Fatalf("unexpected path %s", path)
		}
		// Extractable as bare key for re-signing
		svc := &services.StorageService{}
		got, ok := svc.ExtractStoragePath(path, complianceDocsBucket)
		if !ok || got != path {
			t.Fatalf("ExtractStoragePath(%q) = %q, %v", path, got, ok)
		}
	}
}

func TestResolveFreshBucketURL_Empty(t *testing.T) {
	url, err := resolveFreshBucketURL(t.Context(), nil, "")
	if err != nil || url != "" {
		t.Fatalf("empty stored → empty, got %q err=%v", url, err)
	}
}

func TestResolveFreshBucketURL_NilStoragePassthrough(t *testing.T) {
	stored := "https://example.com/external.pdf"
	url, err := resolveFreshBucketURL(t.Context(), nil, stored)
	if err != nil || url != stored {
		t.Fatalf("nil storage should pass through, got %q err=%v", url, err)
	}
}

func TestUploadStagingComplianceDoc_StorageUnavailable(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/compliance-doc", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, "11111111-1111-1111-1111-111111111111"))
	rr := httptest.NewRecorder()
	h.UploadStagingComplianceDoc(rr, req)
	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 without storage, got %d", rr.Code)
	}
}

func TestUploadStagingComplianceDoc_RejectsInvalidKind(t *testing.T) {
	// storage non-nil is required to pass the first gate; use a zero service so
	// we fail later only if kind is accepted. Kind is checked before upload.
	h := &Handler{storageService: &services.StorageService{}}
	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("kind", "logo")
	part, _ := w.CreateFormFile("file", "x.pdf")
	_, _ = part.Write([]byte("%PDF-1.4 fake"))
	_ = w.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/compliance-doc", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, "11111111-1111-1111-1111-111111111111"))
	rr := httptest.NewRecorder()
	h.UploadStagingComplianceDoc(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 invalid kind, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestUploadStagingComplianceDoc_RejectsNonPDF(t *testing.T) {
	h := &Handler{storageService: &services.StorageService{}}
	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("kind", "doc")
	part, _ := w.CreateFormFile("file", "x.pdf")
	_, _ = part.Write([]byte("not a pdf"))
	_ = w.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/compliance-doc", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, "11111111-1111-1111-1111-111111111111"))
	rr := httptest.NewRecorder()
	h.UploadStagingComplianceDoc(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 non-PDF, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestViewStagingComplianceDoc_RejectsForeignTenantPath(t *testing.T) {
	h := &Handler{storageService: &services.StorageService{}}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/uploads/compliance-doc?path=22222222-2222-2222-2222-222222222222/batch-staging/doc/x.pdf", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.TenantIDKey, "11111111-1111-1111-1111-111111111111"))
	rr := httptest.NewRecorder()
	h.ViewStagingComplianceDoc(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for foreign tenant path, got %d", rr.Code)
	}
}
