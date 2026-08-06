package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func newAdminVerifyHandler(repo repository.RepositoryInterface) *Handler {
	return &Handler{repo: repo}
}

func TestAdminVerifyDocument_ApprovesForExistingTenant(t *testing.T) {
	tenantID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(&models.Tenant{ID: tenantID, CompanyName: "Acme Batteries"}, nil)
	repo.On("UpdateDocumentStatus", mock.Anything, tenantID, "epr", "VERIFIED").
		Return(nil)

	h := newAdminVerifyHandler(repo)
	body, _ := json.Marshal(VerifyDocumentRequest{
		TenantID: tenantID.String(),
		DocType:  "epr",
		Action:   "APPROVE",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.AdminVerifyDocument(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp["new_status"] != "VERIFIED" {
		t.Fatalf("expected VERIFIED, got %v", resp["new_status"])
	}
	if resp["tenant_id"] != tenantID.String() {
		t.Fatalf("expected tenant_id %s, got %v", tenantID, resp["tenant_id"])
	}
	repo.AssertExpectations(t)
}

func TestAdminVerifyDocument_RejectsUnknownTenant(t *testing.T) {
	tenantID := uuid.New()
	repo := new(repository.MockRepository)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(nil, errors.New("tenant not found"))

	h := newAdminVerifyHandler(repo)
	body, _ := json.Marshal(VerifyDocumentRequest{
		TenantID: tenantID.String(),
		DocType:  "bis",
		Action:   "REJECT",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.AdminVerifyDocument(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
	// Must not call UpdateDocumentStatus when tenant missing
	repo.AssertNotCalled(t, "UpdateDocumentStatus", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	repo.AssertExpectations(t)
}

func TestAdminCreateRegulatorKey_RequiresService(t *testing.T) {
	h := &Handler{} // no regulatorKeyService
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/regulator-keys", bytes.NewReader([]byte(`{"name":"x"}`)))
	rr := httptest.NewRecorder()
	h.AdminCreateRegulatorKey(rr, req)
	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 without service, got %d", rr.Code)
	}
}

func TestAdminCreateRegulatorKey_Success(t *testing.T) {
	store := &tierTestStore{byHash: map[string]*repository.RegulatorAPIKey{}}
	svc := services.NewRegulatorKeyService(store, "")
	h := &Handler{regulatorKeyService: svc}

	body := []byte(`{"name":"EU MS DE","organization":"BAFA","markets":["EU"],"tenant_ids":[]}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/regulator-keys", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.AdminCreateRegulatorKey(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	key, _ := resp["key"].(string)
	if key == "" || len(key) < 8 {
		t.Fatalf("expected raw key once, got %v", resp["key"])
	}
}

func TestAdminVerifyDocument_InvalidPayload(t *testing.T) {
	repo := new(repository.MockRepository)
	h := newAdminVerifyHandler(repo)

	tests := []struct {
		name string
		body VerifyDocumentRequest
	}{
		{"bad tenant", VerifyDocumentRequest{TenantID: "not-a-uuid", DocType: "epr", Action: "APPROVE"}},
		{"bad doc type", VerifyDocumentRequest{TenantID: uuid.New().String(), DocType: "iso", Action: "APPROVE"}},
		{"bad action", VerifyDocumentRequest{TenantID: uuid.New().String(), DocType: "epr", Action: "MAYBE"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", bytes.NewReader(body))
			rr := httptest.NewRecorder()
			h.AdminVerifyDocument(rr, req)
			if rr.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
			}
		})
	}
	repo.AssertNotCalled(t, "GetTenant", mock.Anything, mock.Anything)
	repo.AssertNotCalled(t, "UpdateDocumentStatus", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

// TestAdminVerifyDocument_RouteRequiresAdminKey is the end-to-end auth contract:
// tenant OWNER JWT alone must not authorize the route; X-Admin-API-Key must.
func TestAdminVerifyDocument_RouteRequiresAdminKey(t *testing.T) {
	const adminKey = "test-platform-admin-key"
	tenantID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetTenant", mock.Anything, tenantID).
		Return(&models.Tenant{ID: tenantID}, nil)
	repo.On("UpdateDocumentStatus", mock.Anything, tenantID, "pli", "REJECTED").
		Return(nil)

	h := newAdminVerifyHandler(repo)
	adminAuth := middleware.NewAdminAPIKey(adminKey)
	route := adminAuth.Protect(http.HandlerFunc(h.AdminVerifyDocument))

	body, _ := json.Marshal(VerifyDocumentRequest{
		TenantID: tenantID.String(),
		DocType:  "pli",
		Action:   "REJECT",
	})

	t.Run("owner JWT without admin key is rejected", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer fake-owner-jwt")
		// Simulate what Protect would put in context — still must not help.
		req = req.WithContext(req.Context())
		rr := httptest.NewRecorder()
		route.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("valid admin key succeeds for any tenant_id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", bytes.NewReader(body))
		req.Header.Set(middleware.AdminAPIKeyHeader, adminKey)
		rr := httptest.NewRecorder()
		route.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})
}
