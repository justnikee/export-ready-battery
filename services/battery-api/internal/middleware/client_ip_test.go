package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestClientIP_IgnoresSpoofedHeadersWhenUntrusted(t *testing.T) {
	t.Setenv("TRUST_PROXY", "false")
	t.Setenv("APP_ENV", "development")
	ResetTrustProxyForTest()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.10:54321"
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 5.6.7.8")
	req.Header.Set("X-Real-IP", "9.9.9.9")

	got := ClientIP(req)
	if got != "203.0.113.10" {
		t.Fatalf("expected RemoteAddr host, got %q", got)
	}
}

func TestClientIP_UsesRightmostXFFWhenTrusted(t *testing.T) {
	t.Setenv("TRUST_PROXY", "true")
	ResetTrustProxyForTest()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.1:443" // proxy
	// Client spoofs leftmost; real peer observed by proxy is rightmost.
	req.Header.Set("X-Forwarded-For", "198.51.100.1, 203.0.113.50")

	got := ClientIP(req)
	if got != "203.0.113.50" {
		t.Fatalf("expected rightmost XFF, got %q", got)
	}
}

func TestClientIP_TrustedFallsBackToXRealIP(t *testing.T) {
	t.Setenv("TRUST_PROXY", "true")
	ResetTrustProxyForTest()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.1:443"
	req.Header.Set("X-Real-IP", "203.0.113.77")

	got := ClientIP(req)
	if got != "203.0.113.77" {
		t.Fatalf("expected X-Real-IP, got %q", got)
	}
}

func TestClientIP_RejectsNonIPHeaderValues(t *testing.T) {
	t.Setenv("TRUST_PROXY", "true")
	ResetTrustProxyForTest()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.9:9999"
	req.Header.Set("X-Forwarded-For", "not-an-ip, also-bad")

	got := ClientIP(req)
	if got != "203.0.113.9" {
		t.Fatalf("expected fallback RemoteAddr, got %q", got)
	}
}

func TestTrustProxyHeaders_DefaultProduction(t *testing.T) {
	_ = os.Unsetenv("TRUST_PROXY")
	t.Setenv("APP_ENV", "production")
	ResetTrustProxyForTest()
	if !TrustProxyHeaders() {
		t.Fatal("expected trust proxy true in production by default")
	}
}

func TestRateLimiter_DoesNotSplitBucketsOnSpoofedXFFWhenUntrusted(t *testing.T) {
	t.Setenv("TRUST_PROXY", "false")
	ResetTrustProxyForTest()

	// Burst 1: second request from same RemoteAddr should 429 even if XFF changes.
	rl := NewRateLimiter(0, 1) // 0 rate, burst 1
	defer rl.Stop()
	h := rl.Limit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	mk := func(xff string) *http.Request {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
		req.RemoteAddr = "198.51.100.20:1234"
		if xff != "" {
			req.Header.Set("X-Forwarded-For", xff)
		}
		return req
	}

	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, mk("1.1.1.1"))
	if rr1.Code != http.StatusOK {
		t.Fatalf("first: expected 200, got %d", rr1.Code)
	}

	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, mk("2.2.2.2")) // spoofed different XFF
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("second with spoofed XFF: expected 429 (same client), got %d", rr2.Code)
	}
}
