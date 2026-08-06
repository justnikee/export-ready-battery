package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
)

// S-03: global job routes must require platform admin key, not tenant JWT.
func TestPlatformJobs_RequireAdminAPIKey(t *testing.T) {
	const adminKey = "test-platform-jobs-key"
	adminAuth := middleware.NewAdminAPIKey(adminKey)

	// Handler that would run the job body if auth passes.
	okHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message":"ok"}`))
	})
	route := adminAuth.Protect(okHandler)

	t.Run("tenant JWT alone is rejected", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jobs/daily-alerts", nil)
		req.Header.Set("Authorization", "Bearer fake-member-jwt")
		rr := httptest.NewRecorder()
		route.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 without admin key, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("wrong admin key rejected", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jobs/upgrade-anchors", nil)
		req.Header.Set(middleware.AdminAPIKeyHeader, "wrong")
		rr := httptest.NewRecorder()
		route.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for wrong key, got %d", rr.Code)
		}
	})

	t.Run("valid admin key allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jobs/daily-alerts", nil)
		req.Header.Set(middleware.AdminAPIKeyHeader, adminKey)
		rr := httptest.NewRecorder()
		route.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 with admin key, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("empty configured key fail-closed", func(t *testing.T) {
		empty := middleware.NewAdminAPIKey("").Protect(okHandler)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jobs/daily-alerts", nil)
		req.Header.Set(middleware.AdminAPIKeyHeader, "anything")
		rr := httptest.NewRecorder()
		empty.ServeHTTP(rr, req)
		if rr.Code != http.StatusServiceUnavailable {
			t.Fatalf("expected 503 when ADMIN_API_KEY unset, got %d", rr.Code)
		}
	})
}
