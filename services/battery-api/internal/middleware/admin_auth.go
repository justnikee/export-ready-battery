package middleware

import (
	"crypto/subtle"
	"net/http"
)

// AdminAPIKeyHeader is the request header carrying the platform admin secret.
// Matches the planned ADMIN_API_KEY model in docs/DEPLOYMENT_PLAN.md.
const AdminAPIKeyHeader = "X-Admin-API-Key"

// AdminAPIKey protects platform-operator endpoints that act across tenants
// (document verification, future platform admin surfaces).
//
// This is intentionally NOT tenant JWT / OWNER role auth:
// any tenant OWNER holding a JWT must not be able to mutate another tenant's
// compliance document status.
//
// Fail-closed: if the configured key is empty, every request is rejected so a
// misconfigured production deploy cannot leave the endpoint open.
type AdminAPIKey struct {
	key string
}

// NewAdminAPIKey creates middleware that requires a matching X-Admin-API-Key.
func NewAdminAPIKey(key string) *AdminAPIKey {
	return &AdminAPIKey{key: key}
}

// Protect rejects requests that lack a valid platform admin key.
func (a *AdminAPIKey) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if a.key == "" {
			http.Error(w, `{"error":"platform admin access is not configured"}`, http.StatusServiceUnavailable)
			return
		}

		provided := r.Header.Get(AdminAPIKeyHeader)
		if provided == "" {
			http.Error(w, `{"error":"missing X-Admin-API-Key header"}`, http.StatusUnauthorized)
			return
		}

		// Constant-time compare only when lengths match; unequal lengths are
		// always a miss (subtle.ConstantTimeCompare returns 0 for length mismatch).
		if subtle.ConstantTimeCompare([]byte(provided), []byte(a.key)) != 1 {
			http.Error(w, `{"error":"invalid admin API key"}`, http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
