package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// ============================================================================
// FAKE SUPPLIER REPO
// ============================================================================

type fakeSupplierRepo struct {
	fakeTeamRepo
	suppliers        map[uuid.UUID]*models.Supplier
	suppliersByEmail map[string]*models.Supplier
	suppliersByToken map[string]*models.Supplier
	docs             map[uuid.UUID]*models.SupplierDocument
}

func newFakeSupplierRepo() *fakeSupplierRepo {
	return &fakeSupplierRepo{
		fakeTeamRepo:     *newFakeTeamRepo(),
		suppliers:        make(map[uuid.UUID]*models.Supplier),
		suppliersByEmail: make(map[string]*models.Supplier),
		suppliersByToken: make(map[string]*models.Supplier),
		docs:             make(map[uuid.UUID]*models.SupplierDocument),
	}
}

func (f *fakeSupplierRepo) seedSupplier(s *models.Supplier) {
	id, _ := uuid.Parse(s.ID)
	f.suppliers[id] = s
	key := s.TenantID + ":" + s.Email
	f.suppliersByEmail[key] = s
	if s.InvitationToken != "" {
		f.suppliersByToken[s.InvitationToken] = s
	}
}

func (f *fakeSupplierRepo) seedDoc(d *models.SupplierDocument) {
	id, _ := uuid.Parse(d.ID)
	f.docs[id] = d
}

func (f *fakeSupplierRepo) CreateSupplier(ctx context.Context, supplier *models.Supplier) error {
	id, _ := uuid.Parse(supplier.ID)
	f.suppliers[id] = supplier
	key := supplier.TenantID + ":" + supplier.Email
	f.suppliersByEmail[key] = supplier
	if supplier.InvitationToken != "" {
		f.suppliersByToken[supplier.InvitationToken] = supplier
	}
	return nil
}

func (f *fakeSupplierRepo) GetSupplierByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	if s, ok := f.suppliers[id]; ok {
		return s, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeSupplierRepo) GetSupplierByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.Supplier, error) {
	key := tenantID.String() + ":" + email
	if s, ok := f.suppliersByEmail[key]; ok {
		return s, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeSupplierRepo) GetSupplierByInvitationToken(ctx context.Context, token string) (*models.Supplier, error) {
	if s, ok := f.suppliersByToken[token]; ok {
		return s, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeSupplierRepo) ListSuppliersByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.Supplier, error) {
	var out []models.Supplier
	for _, s := range f.suppliers {
		if s.TenantID == tenantID.String() {
			if status == "" || s.Status == status {
				out = append(out, *s)
			}
		}
	}
	return out, nil
}

func (f *fakeSupplierRepo) UpdateSupplierStatus(ctx context.Context, id uuid.UUID, status string) error {
	if s, ok := f.suppliers[id]; ok {
		s.Status = status
		return nil
	}
	return errors.New("not found")
}

func (f *fakeSupplierRepo) UpdateSupplierAcceptance(ctx context.Context, id uuid.UUID, passwordHash string) error {
	if s, ok := f.suppliers[id]; ok {
		s.Status = "active"
		s.PasswordHash = passwordHash
		s.InvitationToken = ""
		now := time.Now()
		s.AcceptedAt = &now
		return nil
	}
	return errors.New("not found")
}

func (f *fakeSupplierRepo) UpdateSupplierLastLogin(ctx context.Context, id uuid.UUID) error {
	return nil
}

func (f *fakeSupplierRepo) CreateSupplierDocument(ctx context.Context, doc *models.SupplierDocument) error {
	id, _ := uuid.Parse(doc.ID)
	f.docs[id] = doc
	return nil
}

func (f *fakeSupplierRepo) GetSupplierDocumentByID(ctx context.Context, id uuid.UUID) (*models.SupplierDocument, error) {
	if d, ok := f.docs[id]; ok {
		return d, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeSupplierRepo) ListSupplierDocuments(ctx context.Context, supplierID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	var out []models.SupplierDocument
	for _, d := range f.docs {
		if d.SupplierID == supplierID.String() {
			if status == "" || d.Status == status {
				out = append(out, *d)
			}
		}
	}
	return out, nil
}

func (f *fakeSupplierRepo) ListTenantSupplierDocuments(ctx context.Context, tenantID uuid.UUID, status string) ([]models.SupplierDocument, error) {
	var out []models.SupplierDocument
	for _, d := range f.docs {
		if d.TenantID == tenantID.String() {
			if status == "" || d.Status == status {
				out = append(out, *d)
			}
		}
	}
	return out, nil
}

func (f *fakeSupplierRepo) UpdateSupplierDocumentStatus(ctx context.Context, id uuid.UUID, status, reviewerNotes string, reviewedBy uuid.UUID) error {
	if d, ok := f.docs[id]; ok {
		d.Status = status
		d.ReviewerNotes = reviewerNotes
		return nil
	}
	return errors.New("not found")
}
func (f *fakeSupplierRepo) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error { return nil }
func (f *fakeSupplierRepo) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) { return nil, nil }
func (f *fakeSupplierRepo) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) { return nil, nil }
func (f *fakeSupplierRepo) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) { return 0, nil }
func (f *fakeSupplierRepo) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error { return nil }
func (f *fakeSupplierRepo) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeSupplierRepo) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) { return nil, nil }
func (f *fakeSupplierRepo) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeSupplierRepo) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error { return nil }
func (f *fakeSupplierRepo) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error { return nil }
func (f *fakeSupplierRepo) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeSupplierRepo) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeSupplierRepo) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) { return nil, nil }
func (f *fakeSupplierRepo) CreateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeSupplierRepo) GetSupplierRiskProfileBySupplier(ctx context.Context, supplierID uuid.UUID) (*models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeSupplierRepo) UpdateSupplierRiskProfile(ctx context.Context, p *models.SupplierRiskProfile) error { return nil }
func (f *fakeSupplierRepo) ListSupplierRiskProfilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }
func (f *fakeSupplierRepo) CreateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeSupplierRepo) GetDueDiligenceAssessmentsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeSupplierRepo) GetDueDiligenceAssessmentByID(ctx context.Context, id uuid.UUID) (*models.DueDiligenceAssessment, error) { return nil, nil }
func (f *fakeSupplierRepo) UpdateDueDiligenceAssessment(ctx context.Context, a *models.DueDiligenceAssessment) error { return nil }
func (f *fakeSupplierRepo) CreateSupplierCMRTReport(ctx context.Context, rep *models.SupplierCMRTReport) error { return nil }
func (f *fakeSupplierRepo) GetSupplierCMRTReports(ctx context.Context, supplierID uuid.UUID) ([]models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeSupplierRepo) GetLatestSupplierCMRTReport(ctx context.Context, supplierID uuid.UUID) (*models.SupplierCMRTReport, error) { return nil, nil }
func (f *fakeSupplierRepo) CreateCorrectiveAction(ctx context.Context, ca *models.CorrectiveAction) error { return nil }
func (f *fakeSupplierRepo) GetCorrectiveActionByID(ctx context.Context, id uuid.UUID) (*models.CorrectiveAction, error) { return nil, nil }
func (f *fakeSupplierRepo) ListCorrectiveActionsByTenant(ctx context.Context, tenantID uuid.UUID, status string) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeSupplierRepo) ListCorrectiveActionsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]models.CorrectiveAction, error) { return nil, nil }
func (f *fakeSupplierRepo) UpdateCorrectiveActionStatus(ctx context.Context, id uuid.UUID, status string, remediatedAt interface{}, verifiedBy interface{}) error { return nil }
func (f *fakeSupplierRepo) GetSupplierRiskProfilesBySuppliers(ctx context.Context, tenantID uuid.UUID, supplierIDs []uuid.UUID) ([]models.SupplierRiskProfile, error) { return nil, nil }

// ============================================================================
// TEST HELPERS
// ============================================================================

func newSupplierHandler(repo repository.RepositoryInterface) *Handler {
	authService := services.NewAuthService("test-secret", 24*time.Hour, 7*24*time.Hour)
	return New(nil, "http://localhost:3000", "", "", "", nil, nil, "", WithAuthService(authService))
}

func setSupplierContext(req *http.Request, tenantID, supplierID, email string) *http.Request {
	ctx := req.Context()
	ctx = context.WithValue(ctx, middleware.TenantIDKey, tenantID)
	ctx = context.WithValue(ctx, middleware.SupplierIDKey, supplierID)
	ctx = context.WithValue(ctx, middleware.EmailKey, email)
	ctx = context.WithValue(ctx, middleware.RoleKey, "supplier")
	return req.WithContext(ctx)
}

// ============================================================================
// TESTS
// ============================================================================

func TestInviteSupplier_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"email":"supplier@example.com","company_name":"Supplier Inc","country":"India"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suppliers/invitations", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteSupplier(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["status"] != "invited" {
		t.Errorf("unexpected status: %v", resp["status"])
	}
	if resp["invitation_token"] == "" {
		t.Errorf("expected invitation_token to be set")
	}
}

func TestInviteSupplier_DuplicateEmail(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
	})
	repo.seedSupplier(&models.Supplier{
		ID:       uuid.New().String(),
		TenantID: tenantID.String(),
		Email:    "supplier@example.com",
		Status:   "invited",
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"email":"supplier@example.com","company_name":"Supplier Inc"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suppliers/invitations", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteSupplier(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestAcceptSupplierInvitation_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	token := "valid-token-123"
	supplierID := uuid.New()
	repo.seedSupplier(&models.Supplier{
		ID:              supplierID.String(),
		TenantID:        tenantID.String(),
		Email:           "supplier@example.com",
		Status:          "invited",
		InvitationToken: token,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"token":"valid-token-123","password":"securepass123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suppliers/accept", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler.AcceptSupplierInvitation(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["status"] != "active" {
		t.Errorf("unexpected status: %v", resp["status"])
	}
}

func TestAcceptSupplierInvitation_InvalidToken(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"token":"invalid-token","password":"securepass123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suppliers/accept", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler.AcceptSupplierInvitation(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestSupplierLogin_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	supplierID := uuid.New()
	authService := services.NewAuthService("test-secret", 24*time.Hour, 7*24*time.Hour)
	hash, _ := authService.HashPassword("securepass123")
	repo.seedSupplier(&models.Supplier{
		ID:           supplierID.String(),
		TenantID:     tenantID.String(),
		Email:        "supplier@example.com",
		Status:       "active",
		PasswordHash: hash,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo
	handler.authService = authService

	body := `{"email":"supplier@example.com","password":"securepass123","tenant_id":"` + tenantID.String() + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/supplier/login", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler.SupplierLogin(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.SupplierLoginResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp.Token == "" {
		t.Errorf("expected token to be set")
	}
	if resp.SupplierID != supplierID.String() {
		t.Errorf("unexpected supplier_id: %v", resp.SupplierID)
	}
}

func TestSupplierLogin_InvalidPassword(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	supplierID := uuid.New()
	authService := services.NewAuthService("test-secret", 24*time.Hour, 7*24*time.Hour)
	hash, _ := authService.HashPassword("securepass123")
	repo.seedSupplier(&models.Supplier{
		ID:           supplierID.String(),
		TenantID:     tenantID.String(),
		Email:        "supplier@example.com",
		Status:       "active",
		PasswordHash: hash,
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo
	handler.authService = authService

	body := `{"email":"supplier@example.com","password":"wrongpass","tenant_id":"` + tenantID.String() + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/supplier/login", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler.SupplierLogin(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListSupplierBatches_Unauthorized(t *testing.T) {
	repo := newFakeSupplierRepo()
	handler := newSupplierHandler(repo)
	handler.repo = repo

	req := httptest.NewRequest(http.MethodGet, "/api/v1/supplier/batches", nil)
	// No supplier context
	req = setAuthContext(req, uuid.New(), "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListSupplierBatches(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestReviewSupplierDocument_Success(t *testing.T) {
	repo := newFakeSupplierRepo()
	tenantID := uuid.New()
	supplierID := uuid.New()
	docID := uuid.New()
	repo.seedSupplier(&models.Supplier{
		ID:       supplierID.String(),
		TenantID: tenantID.String(),
		Email:    "supplier@example.com",
		Status:   "active",
	})
	repo.seedDoc(&models.SupplierDocument{
		ID:         docID.String(),
		SupplierID: supplierID.String(),
		TenantID:   tenantID.String(),
		DocType:    "coc",
		Status:     "pending",
	})

	handler := newSupplierHandler(repo)
	handler.repo = repo

	body := `{"status":"approved","reviewer_notes":"Looks good"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/supplier-documents/"+docID.String()+"/status", bytes.NewReader([]byte(body)))
	req.SetPathValue("id", docID.String())
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ReviewSupplierDocument(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["status"] != "approved" {
		t.Errorf("unexpected status: %v", resp["status"])
	}
}

// Regulatory stubs
func (f *fakeSupplierRepo) CreateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeSupplierRepo) ListRegulatorySources(ctx context.Context, activeOnly bool) ([]*models.RegulatorySource, error) { return nil, nil }
func (f *fakeSupplierRepo) GetRegulatorySourceByID(ctx context.Context, id uuid.UUID) (*models.RegulatorySource, error) { return nil, nil }
func (f *fakeSupplierRepo) UpdateRegulatorySource(ctx context.Context, s *models.RegulatorySource) error { return nil }
func (f *fakeSupplierRepo) UpdateRegulatorySourceFetchMeta(ctx context.Context, id uuid.UUID, fetchedAt time.Time, etag string) error { return nil }
func (f *fakeSupplierRepo) DeleteRegulatorySource(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeSupplierRepo) UpsertRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) error { return nil }
func (f *fakeSupplierRepo) GetRegulatoryItemBySourceAndExternalID(ctx context.Context, sourceID uuid.UUID, externalID string) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeSupplierRepo) ListRegulatoryItems(ctx context.Context, f2 repository.ListRegulatoryItemsFilter) ([]*models.RegulatoryItem, int, error) { return nil, 0, nil }
func (f *fakeSupplierRepo) GetRegulatoryItemByID(ctx context.Context, id uuid.UUID) (*models.RegulatoryItem, error) { return nil, nil }
func (f *fakeSupplierRepo) CreateTenantRegulatoryAlert(ctx context.Context, alert *models.TenantRegulatoryAlert) error { return nil }
func (f *fakeSupplierRepo) GetTenantRegulatoryAlerts(ctx context.Context, tenantID uuid.UUID, unreadOnly bool, limit, offset int) ([]*models.TenantRegulatoryAlert, int, error) { return nil, 0, nil }
func (f *fakeSupplierRepo) GetTenantRegulatoryAlertUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeSupplierRepo) MarkTenantRegulatoryAlertRead(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeSupplierRepo) MarkTenantRegulatoryAlertDismissed(ctx context.Context, alertID uuid.UUID) error { return nil }
func (f *fakeSupplierRepo) ListTenantsForRegulatoryItem(ctx context.Context, item *models.RegulatoryItem) ([]uuid.UUID, error) { return nil, nil }
func (f *fakeSupplierRepo) CreateTeamAuditLog(ctx context.Context, log *models.TeamAuditLog) error { return nil }
