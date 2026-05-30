package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// ============================================================================
// FAKE DGFT REPO
// ============================================================================

type fakeDGFTRepo struct {
	fakeTeamRepo
	claims  map[uuid.UUID]*models.DGFTClaim
	schemes []models.DGFTSchemeConfig
}

func newFakeDGFTRepo() *fakeDGFTRepo {
	return &fakeDGFTRepo{
		fakeTeamRepo: *newFakeTeamRepo(),
		claims:       make(map[uuid.UUID]*models.DGFTClaim),
		schemes: []models.DGFTSchemeConfig{
			{SchemeType: "RODTEP", Name: "RoDTEP", DefaultRate: 1.5, RequiredDocuments: []string{"shipping_bill"}},
		},
	}
}

func (f *fakeDGFTRepo) ListDGFTSchemeConfigs(ctx context.Context) ([]models.DGFTSchemeConfig, error) {
	return f.schemes, nil
}
func (f *fakeDGFTRepo) CreateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error { return nil }
func (f *fakeDGFTRepo) GetDGFTClaimByID(ctx context.Context, id, tenantID uuid.UUID) (*models.DGFTClaim, error) {
	if c, ok := f.claims[id]; ok {
		return c, nil
	}
	return nil, errors.New("claim not found")
}
func (f *fakeDGFTRepo) UpdateDGFTClaim(ctx context.Context, claim *models.DGFTClaim) error { return nil }
func (f *fakeDGFTRepo) DeleteDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeDGFTRepo) ListDGFTClaimsByTenant(ctx context.Context, tenantID uuid.UUID, schemeType, status string, page, pageSize int) ([]models.DGFTClaim, int, error) {
	return nil, 0, nil
}
func (f *fakeDGFTRepo) SubmitDGFTClaim(ctx context.Context, id, tenantID uuid.UUID) error { return nil }
func (f *fakeDGFTRepo) AddDGFTClaimDocument(ctx context.Context, id, tenantID uuid.UUID, doc models.DGFTClaimDocument) error {
	if c, ok := f.claims[id]; ok {
		c.Documents = append(c.Documents, doc)
	}
	return nil
}

// seedClaim adds a claim to the fake repo for testing.
func (f *fakeDGFTRepo) seedClaim(c *models.DGFTClaim) {
	uid, _ := uuid.Parse(c.ID)
	f.claims[uid] = c
}

// ============================================================================
// TESTS
// ============================================================================

func TestExportClaimPDF_Success(t *testing.T) {
	repo := newFakeDGFTRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Exports",
	})

	claimID := uuid.New()
	repo.seedClaim(&models.DGFTClaim{
		ID:                   claimID.String(),
		TenantID:             tenantID.String(),
		SchemeType:           "RODTEP",
		Status:               "DRAFT",
		ClaimPeriodStart:     "2025-01-01",
		ClaimPeriodEnd:       "2025-03-31",
		HSNCode:              "8507.60",
		DestinationCountry:   "Germany",
		ExportValueINR:       1000000,
		ExportQuantity:       100,
		EstimatedClaimAmount: 15000,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/dgft-claims/"+claimID.String()+"/export/pdf", nil)
	req.SetPathValue("id", claimID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ExportClaimPDF(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	ct := rr.Header().Get("Content-Type")
	if ct != "application/pdf" {
		t.Errorf("expected Content-Type application/pdf, got %s", ct)
	}
	cd := rr.Header().Get("Content-Disposition")
	if !strings.Contains(cd, ".pdf") {
		t.Errorf("expected pdf filename in Content-Disposition, got %s", cd)
	}
	body := rr.Body.Bytes()
	if len(body) < 5 || body[0] != '%' || body[1] != 'P' {
		t.Error("response body does not start with PDF magic number")
	}
}

func TestExportClaimExcel_Success(t *testing.T) {
	repo := newFakeDGFTRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Exports",
	})

	claimID := uuid.New()
	repo.seedClaim(&models.DGFTClaim{
		ID:                   claimID.String(),
		TenantID:             tenantID.String(),
		SchemeType:           "RODTEP",
		Status:               "DRAFT",
		ClaimPeriodStart:     "2025-01-01",
		ClaimPeriodEnd:       "2025-03-31",
		HSNCode:              "8507.60",
		DestinationCountry:   "Germany",
		ExportValueINR:       1000000,
		ExportQuantity:       100,
		EstimatedClaimAmount: 15000,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/dgft-claims/"+claimID.String()+"/export/excel", nil)
	req.SetPathValue("id", claimID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ExportClaimExcel(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	ct := rr.Header().Get("Content-Type")
	if ct != "text/csv" {
		t.Errorf("expected Content-Type text/csv, got %s", ct)
	}
	cd := rr.Header().Get("Content-Disposition")
	if !strings.Contains(cd, ".csv") {
		t.Errorf("expected csv filename in Content-Disposition, got %s", cd)
	}
	body := rr.Body.String()
	if !strings.Contains(body, "DGFT EXPORT INCENTIVE CLAIM") {
		t.Error("CSV missing expected header")
	}
}

func TestExportClaimPDF_ClaimNotFound(t *testing.T) {
	repo := newFakeDGFTRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Exports",
	})

	handler := newTeamHandler(repo)
	unknownID := uuid.New()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/dgft-claims/"+unknownID.String()+"/export/pdf", nil)
	req.SetPathValue("id", unknownID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ExportClaimPDF(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUploadDGFTClaimDocument_Success(t *testing.T) {
	repo := newFakeDGFTRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Exports",
	})

	claimID := uuid.New()
	repo.seedClaim(&models.DGFTClaim{
		ID:         claimID.String(),
		TenantID:   tenantID.String(),
		SchemeType: "RODTEP",
		Status:     "DRAFT",
		Documents:  []models.DGFTClaimDocument{},
	})

	handler := newTeamHandler(repo)

	body := strings.NewReader("--boundary\r\nContent-Disposition: form-data; name=\"document_type\"\r\n\r\nshipping_bill\r\n--boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.pdf\"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 test\r\n--boundary--\r\n")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/dgft-claims/"+claimID.String()+"/documents", body)
	req.Header.Set("Content-Type", "multipart/form-data; boundary=boundary")
	req.SetPathValue("id", claimID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UploadDGFTClaimDocument(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	updated, _ := repo.GetDGFTClaimByID(context.Background(), claimID, tenantID)
	if len(updated.Documents) != 1 {
		t.Fatalf("expected 1 document, got %d", len(updated.Documents))
	}
	if updated.Documents[0].DocType != "shipping_bill" {
		t.Errorf("expected doc type shipping_bill, got %s", updated.Documents[0].DocType)
	}
	if updated.Documents[0].Status != "UPLOADED" {
		t.Errorf("expected status UPLOADED, got %s", updated.Documents[0].Status)
	}
}

func TestUploadDGFTClaimDocument_RejectedStatusForbidden(t *testing.T) {
	repo := newFakeDGFTRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Exports",
	})

	claimID := uuid.New()
	repo.seedClaim(&models.DGFTClaim{
		ID:         claimID.String(),
		TenantID:   tenantID.String(),
		SchemeType: "RODTEP",
		Status:     "REJECTED",
	})

	handler := newTeamHandler(repo)

	body := strings.NewReader("--boundary\r\nContent-Disposition: form-data; name=\"document_type\"\r\n\r\nshipping_bill\r\n--boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.pdf\"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 test\r\n--boundary--\r\n")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/dgft-claims/"+claimID.String()+"/documents", body)
	req.Header.Set("Content-Type", "multipart/form-data; boundary=boundary")
	req.SetPathValue("id", claimID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UploadDGFTClaimDocument(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}
