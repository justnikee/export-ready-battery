package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAdminAPIKey_MissingKey(t *testing.T) {
	mw := NewAdminAPIKey("super-secret-admin-key")
	handler := mw.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 when header missing, got %d", rr.Code)
	}
}

func TestAdminAPIKey_WrongKey(t *testing.T) {
	mw := NewAdminAPIKey("super-secret-admin-key")
	handler := mw.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", nil)
	req.Header.Set(AdminAPIKeyHeader, "wrong-key")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for wrong key, got %d", rr.Code)
	}
}

func TestAdminAPIKey_ValidKey(t *testing.T) {
	const key = "super-secret-admin-key"
	mw := NewAdminAPIKey(key)
	called := false
	handler := mw.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", nil)
	req.Header.Set(AdminAPIKeyHeader, key)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid key, got %d: %s", rr.Code, rr.Body.String())
	}
	if !called {
		t.Fatal("expected next handler to be called")
	}
}

func TestAdminAPIKey_EmptyConfiguredKey_FailClosed(t *testing.T) {
	mw := NewAdminAPIKey("")
	handler := mw.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Even a non-empty provided header must not open the endpoint when unset.
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", nil)
	req.Header.Set(AdminAPIKeyHeader, "anything")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when ADMIN_API_KEY unset, got %d", rr.Code)
	}
}

func TestAdminAPIKey_TenantJWTCannotBypass(t *testing.T) {
	// Document that Authorization Bearer is ignored — only X-Admin-API-Key counts.
	mw := NewAdminAPIKey("platform-key")
	handler := mw.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verify-doc", nil)
	req.Header.Set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.owner-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 when only tenant JWT present, got %d", rr.Code)
	}
}
