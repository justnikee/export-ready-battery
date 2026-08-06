package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"
)

// S-06: session JWT must not be accepted from ?token= (log/Referer/history leak).
func TestAuthProtect_RejectsQueryStringJWT(t *testing.T) {
	secret := "s06-query-token-test-secret"
	authSvc := services.NewAuthService(secret, time.Hour, 24*time.Hour)
	token, err := authSvc.GenerateToken(
		"11111111-1111-1111-1111-111111111111",
		"22222222-2222-2222-2222-222222222222",
		"owner@example.com",
		"OWNER",
		"BATTERY",
	)
	if err != nil {
		t.Fatalf("token: %v", err)
	}

	auth := NewAuth(authSvc)
	h := auth.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches?token="+token, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 when JWT only in query string, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestAuthProtect_AcceptsBearerJWT(t *testing.T) {
	secret := "s06-bearer-test-secret"
	authSvc := services.NewAuthService(secret, time.Hour, 24*time.Hour)
	token, err := authSvc.GenerateToken(
		"11111111-1111-1111-1111-111111111111",
		"22222222-2222-2222-2222-222222222222",
		"owner@example.com",
		"OWNER",
		"BATTERY",
	)
	if err != nil {
		t.Fatalf("token: %v", err)
	}

	auth := NewAuth(authSvc)
	h := auth.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if GetEmail(r.Context()) != "owner@example.com" {
			t.Errorf("unexpected email %q", GetEmail(r.Context()))
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 with Bearer, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestAuthProtect_AcceptsAuthTokenCookie(t *testing.T) {
	secret := "s06-auth-cookie-test-secret"
	authSvc := services.NewAuthService(secret, time.Hour, 24*time.Hour)
	token, err := authSvc.GenerateToken(
		"11111111-1111-1111-1111-111111111111",
		"22222222-2222-2222-2222-222222222222",
		"owner@example.com",
		"OWNER",
		"BATTERY",
	)
	if err != nil {
		t.Fatalf("token: %v", err)
	}

	auth := NewAuth(authSvc)
	h := auth.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/export-jobs/x/download", nil)
	req.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 with auth_token cookie, got %d: %s", rr.Code, rr.Body.String())
	}
}
