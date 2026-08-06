package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

func TestGlobalAPIRateLimiter_LimitAPIPaths(t *testing.T) {
	// Burst 1, zero refill → second API call is 429; health is never limited.
	rl := NewRateLimiter(0, 1)
	defer rl.Stop()

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := rl.LimitAPIPaths(inner)

	// Health always allowed
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("health should never 429, got %d", rr.Code)
		}
	}

	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	req1.RemoteAddr = "10.0.0.9:1234"
	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("first api call: got %d", rr1.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/batches", nil)
	req2.RemoteAddr = "10.0.0.9:1234"
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("second api call should 429, got %d", rr2.Code)
	}
}

func TestNewTenantAPIRateLimiter_Defaults(t *testing.T) {
	trl := NewTenantAPIRateLimiter()
	defer trl.Stop()
	if !trl.Allow("tenant-a") {
		t.Fatal("first allow should succeed")
	}
}

func TestTenantRateLimiter(t *testing.T) {
	// Limiter allowing 1 request per second with a burst of 1
	trl := NewTenantRateLimiter(rate.Every(time.Second), 1)
	defer trl.Stop()

	handler := trl.LimitTenant(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	tenantID := uuid.New().String()

	// 1st request should succeed
	req1 := httptest.NewRequest("POST", "/api/v1/ai/parse", nil)
	ctx1 := context.WithValue(req1.Context(), TenantIDKey, tenantID)
	req1 = req1.WithContext(ctx1)
	rr1 := httptest.NewRecorder()

	handler.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr1.Code)
	}

	// 2nd request immediately after should fail with 429
	req2 := httptest.NewRequest("POST", "/api/v1/ai/parse", nil)
	ctx2 := context.WithValue(req2.Context(), TenantIDKey, tenantID)
	req2 = req2.WithContext(ctx2)
	rr2 := httptest.NewRecorder()

	handler.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Errorf("expected status 429, got %d", rr2.Code)
	}

	// Request with a different tenant should succeed
	req3 := httptest.NewRequest("POST", "/api/v1/ai/parse", nil)
	ctx3 := context.WithValue(req3.Context(), TenantIDKey, uuid.New().String())
	req3 = req3.WithContext(ctx3)
	rr3 := httptest.NewRecorder()

	handler.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusOK {
		t.Errorf("expected status 200 for different tenant, got %d", rr3.Code)
	}
}
