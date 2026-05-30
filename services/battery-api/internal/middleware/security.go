package middleware

import (
	"net/http"
	"os"
	"strings"
)

// SecurityHeaders adds OWASP baseline security headers to every response.
// It should be wrapped as the outermost middleware so headers are present
// even on error responses.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking (belt-and-suspenders alongside CSP frame-ancestors)
		w.Header().Set("X-Frame-Options", "DENY")

		// Control referrer information leakage
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict powerful browser features
		w.Header().Set("Permissions-Policy",
			"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()")

		// Prevent cross-origin window manipulation attacks
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")

		// Restrict cross-origin resource loading
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")

		// HSTS only in production to avoid breaking local HTTP dev
		if os.Getenv("APP_ENV") == "production" {
			w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}

		// Content-Security-Policy: route-aware defaults
		// API routes get a restrictive policy (JSON responses).
		// /docs gets a permissive policy for Swagger UI CDN resources.
		if isDocsRoute(r.URL.Path) {
			w.Header().Set("Content-Security-Policy", docsCSP())
		} else {
			w.Header().Set("Content-Security-Policy", apiCSP())
		}

		next.ServeHTTP(w, r)
	})
}

// isDocsRoute returns true for the Swagger UI path.
func isDocsRoute(path string) bool {
	return path == "/docs" || strings.HasPrefix(path, "/docs/")
}

// apiCSP returns a restrictive CSP suitable for JSON API responses.
func apiCSP() string {
	return strings.Join([]string{
		"default-src 'none'",
		"frame-ancestors 'none'",
		"base-uri 'none'",
		"form-action 'none'",
	}, "; ")
}

// docsCSP returns a permissive CSP for Swagger UI (loads CDN scripts/styles).
func docsCSP() string {
	return strings.Join([]string{
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' https://unpkg.com",
		"style-src 'self' 'unsafe-inline' https://unpkg.com",
		"img-src 'self' data:",
		"connect-src 'self'",
		"font-src 'self'",
		"frame-ancestors 'none'",
		"base-uri 'self'",
	}, "; ")
}
