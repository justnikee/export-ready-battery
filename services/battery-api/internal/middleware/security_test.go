package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestSecurityHeaders_APIRoute(t *testing.T) {
	handler := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Baseline headers
	checkHeader(t, rr, "X-Content-Type-Options", "nosniff")
	checkHeader(t, rr, "X-Frame-Options", "DENY")
	checkHeader(t, rr, "Referrer-Policy", "strict-origin-when-cross-origin")
	checkHeader(t, rr, "Cross-Origin-Opener-Policy", "same-origin")
	checkHeader(t, rr, "Cross-Origin-Resource-Policy", "same-origin")

	// Permissions-Policy should restrict all powerful features
	pp := rr.Header().Get("Permissions-Policy")
	if pp == "" {
		t.Error("missing Permissions-Policy header")
	}
	for _, feature := range []string{"camera=()", "microphone=()", "geolocation=()", "payment=()"} {
		if !contains(pp, feature) {
			t.Errorf("Permissions-Policy missing %s, got: %s", feature, pp)
		}
	}

	// API routes get restrictive CSP
	csp := rr.Header().Get("Content-Security-Policy")
	if csp == "" {
		t.Error("missing Content-Security-Policy header")
	}
	for _, directive := range []string{"default-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'"} {
		if !contains(csp, directive) {
			t.Errorf("API CSP missing %s, got: %s", directive, csp)
		}
	}

	// X-XSS-Protection should NOT be present (deprecated)
	if rr.Header().Get("X-XSS-Protection") != "" {
		t.Error("X-XSS-Protection should not be set (deprecated header)")
	}

	// HSTS should NOT be present when APP_ENV is not production
	if rr.Header().Get("Strict-Transport-Security") != "" {
		t.Error("HSTS should not be set outside production")
	}
}

func TestSecurityHeaders_DocsRoute(t *testing.T) {
	handler := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/docs", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	csp := rr.Header().Get("Content-Security-Policy")
	if csp == "" {
		t.Fatal("missing Content-Security-Policy header")
	}

	// Docs CSP should allow CDN resources
	for _, directive := range []string{
		"script-src 'self' 'unsafe-inline' https://unpkg.com",
		"style-src 'self' 'unsafe-inline' https://unpkg.com",
		"img-src 'self' data:",
	} {
		if !contains(csp, directive) {
			t.Errorf("Docs CSP missing %s, got: %s", directive, csp)
		}
	}

	// Docs should still have baseline headers
	checkHeader(t, rr, "X-Frame-Options", "DENY")
	checkHeader(t, rr, "Cross-Origin-Opener-Policy", "same-origin")
}

func TestSecurityHeaders_HSTSInProduction(t *testing.T) {
	origEnv := os.Getenv("APP_ENV")
	os.Setenv("APP_ENV", "production")
	defer os.Setenv("APP_ENV", origEnv)

	handler := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	hsts := rr.Header().Get("Strict-Transport-Security")
	if hsts == "" {
		t.Fatal("missing Strict-Transport-Security in production")
	}
	if !contains(hsts, "max-age=63072000") {
		t.Errorf("HSTS max-age too short, got: %s", hsts)
	}
	if !contains(hsts, "includeSubDomains") {
		t.Errorf("HSTS missing includeSubDomains, got: %s", hsts)
	}
	if !contains(hsts, "preload") {
		t.Errorf("HSTS missing preload, got: %s", hsts)
	}
}

func TestSecurityHeaders_PreservesOnError(t *testing.T) {
	handler := SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
	checkHeader(t, rr, "X-Content-Type-Options", "nosniff")
	checkHeader(t, rr, "X-Frame-Options", "DENY")
}

func checkHeader(t *testing.T, rr *httptest.ResponseRecorder, key, expected string) {
	t.Helper()
	got := rr.Header().Get(key)
	if got != expected {
		t.Errorf("header %q = %q, want %q", key, got, expected)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsInternal(s, substr))
}

func containsInternal(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
