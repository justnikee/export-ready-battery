package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
)

// Client IP extraction for rate limiting and abuse controls (S-09).
//
// Default (development): trust only r.RemoteAddr — ignore X-Forwarded-For /
// X-Real-IP so clients cannot rotate spoofed headers to bypass rate limits.
//
// Behind a reverse proxy (Render, nginx, etc.): set TRUST_PROXY=true (or run
// with APP_ENV=production|staging). Then we honor proxy headers, taking the
// *rightmost* X-Forwarded-For entry (the address the trusted proxy observed),
// not the leftmost (client-controlled).

var (
	trustProxyOnce sync.Once
	trustProxyVal  bool
)

// TrustProxyHeaders reports whether reverse-proxy client headers are honored.
// Override with TRUST_PROXY=true|false; otherwise true for production/staging.
func TrustProxyHeaders() bool {
	trustProxyOnce.Do(func() {
		switch strings.ToLower(strings.TrimSpace(os.Getenv("TRUST_PROXY"))) {
		case "1", "true", "yes", "on":
			trustProxyVal = true
		case "0", "false", "no", "off":
			trustProxyVal = false
		default:
			env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
			trustProxyVal = env == "production" || env == "staging"
		}
	})
	return trustProxyVal
}

// ResetTrustProxyForTest clears the TRUST_PROXY cache (tests only).
func ResetTrustProxyForTest() {
	trustProxyOnce = sync.Once{}
	trustProxyVal = false
}

// ClientIP returns the best-effort client address for rate limiting.
func ClientIP(r *http.Request) string {
	if r == nil {
		return ""
	}

	if TrustProxyHeaders() {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			// Rightmost = address added by the nearest trusted proxy hop.
			parts := strings.Split(xff, ",")
			for i := len(parts) - 1; i >= 0; i-- {
				if ip := normalizeIP(parts[i]); ip != "" {
					return ip
				}
			}
		}
		if xri := normalizeIP(r.Header.Get("X-Real-IP")); xri != "" {
			return xri
		}
	}

	return normalizeIP(r.RemoteAddr)
}

// normalizeIP strips brackets/ports and validates the result looks like an IP.
func normalizeIP(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	// host:port or [ipv6]:port
	if host, _, err := net.SplitHostPort(raw); err == nil {
		raw = host
	}
	raw = strings.Trim(raw, "[]")

	if net.ParseIP(raw) == nil {
		return ""
	}
	return raw
}
