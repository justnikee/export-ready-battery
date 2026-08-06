package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"
)

// S-05: Protect must accept supplier_token HttpOnly cookie when Authorization is absent.
func TestAuthProtect_AcceptsSupplierTokenCookie(t *testing.T) {
	secret := "supplier-cookie-test-secret"
	authSvc := services.NewAuthService(secret, time.Hour, 24*time.Hour)
	token, err := authSvc.GenerateSupplierToken(
		"11111111-1111-1111-1111-111111111111",
		"22222222-2222-2222-2222-222222222222",
		"supplier@example.com",
	)
	if err != nil {
		t.Fatalf("token: %v", err)
	}

	auth := NewAuth(authSvc)
	called := false
	h := auth.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		if GetRole(r.Context()) != RoleSupplier {
			t.Errorf("expected supplier role, got %q", GetRole(r.Context()))
		}
		if GetSupplierID(r.Context()) == "" {
			t.Error("expected supplier_id in context")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/supplier/documents", nil)
	req.AddCookie(&http.Cookie{Name: "supplier_token", Value: token})
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	if !called {
		t.Fatal("handler not called")
	}
}

func TestAuthProtect_MissingAuthAndCookie(t *testing.T) {
	auth := NewAuth(services.NewAuthService("x", time.Hour, time.Hour))
	h := auth.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/supplier/documents", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
