package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/services"
)

// ContextKey type for context values
type ContextKey string

const (
	// TenantIDKey is the context key for tenant ID
	TenantIDKey ContextKey = "tenant_id"
	// UserIDKey is the context key for the authenticated user (identity) ID
	UserIDKey ContextKey = "user_id"
	// SupplierIDKey is the context key for supplier ID
	SupplierIDKey ContextKey = "supplier_id"
	// EmailKey is the context key for email
	EmailKey ContextKey = "email"
	// RoleKey is the context key for RBAC role
	RoleKey ContextKey = "role"
	// ProductTypeKey is the context key for tenant product type
	ProductTypeKey ContextKey = "product_type"
)

// Auth middleware for JWT authentication
type Auth struct {
	authService *services.AuthService
	// tenantRL optional per-tenant limiter applied after successful auth (P-04).
	tenantRL *TenantRateLimiter
}

// NewAuth creates a new auth middleware
func NewAuth(authService *services.AuthService) *Auth {
	return &Auth{authService: authService}
}

// WithTenantRateLimit attaches a per-tenant rate limiter applied after JWT
// validation so all Protect()-wrapped routes are covered without per-route wiring.
func (a *Auth) WithTenantRateLimit(trl *TenantRateLimiter) *Auth {
	a.tenantRL = trl
	return a
}

// Protect returns a middleware that requires valid JWT authentication.
//
// Token sources (in order) — S-06: session JWTs are never taken from ?token=
// (leaks via logs, Referer, browser history). One-time email tokens (magic link,
// verify-email, invites) use dedicated handlers, not this middleware.
//
//  1. Authorization: Bearer <access_token>  (in-memory SPA token)
//  2. Cookie supplier_token                 (supplier portal HttpOnly, S-05)
//  3. Cookie auth_token                     (manufacturer HttpOnly from login/refresh)
func (a *Auth) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenString string
		authHeader := r.Header.Get("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			if c, err := r.Cookie("supplier_token"); err == nil && c.Value != "" {
				tokenString = c.Value
			}
		}

		if tokenString == "" {
			if c, err := r.Cookie("auth_token"); err == nil && c.Value != "" {
				tokenString = c.Value
			}
		}

		if tokenString == "" {
			http.Error(w, `{"error":"missing authorization header or cookie"}`, http.StatusUnauthorized)
			return
		}

		// Validate token
		claims, err := a.authService.ValidateToken(tokenString)
		if err != nil {
			if err == services.ErrTokenExpired {
				http.Error(w, `{"error":"token expired"}`, http.StatusUnauthorized)
				return
			}
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}

		// Add claims to request context (including role for RBAC)
		ctx := context.WithValue(r.Context(), TenantIDKey, claims.TenantID)
		ctx = context.WithValue(ctx, EmailKey, claims.Email)
		ctx = context.WithValue(ctx, RoleKey, claims.Role)
		ctx = context.WithValue(ctx, ProductTypeKey, string(claims.ProductType))
		if claims.UserID != "" {
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		}
		if claims.SupplierID != "" {
			ctx = context.WithValue(ctx, SupplierIDKey, claims.SupplierID)
		}

		// P-04: per-tenant (or IP fallback) rate limit after auth succeeds.
		if a.tenantRL != nil {
			key := claims.TenantID
			if key == "" {
				key = ClientIP(r)
				if key == "" {
					key = "unknown"
				}
			}
			if !a.tenantRL.Allow(key) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "1")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error":"Rate limit exceeded. Please try again later."}`))
				return
			}
		}

		// Call next handler with enriched context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns a middleware that enforces role-based access control.
// Call this AFTER Protect. Allowed roles are checked in order; any match grants access.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r.Context())
			if !allowed[role] {
				http.Error(w, `{"error":"forbidden: insufficient role"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// Tenant write roles (manufacturer team). Matches apps/battery-web lib/rbac canWrite.
// VIEWER is intentionally excluded. Supplier portal uses role "supplier" and must
// not use this middleware on general tenant routes (would escalate suppliers).
const (
	RoleOwner  = "OWNER"
	RoleAdmin  = "ADMIN"
	RoleMember = "MEMBER"
	RoleViewer = "VIEWER"
	RoleSupplier = "supplier"
)

// CanWriteRole reports whether a JWT role may call tenant mutating APIs.
// Empty/unknown roles are denied (fail-closed).
func CanWriteRole(role string) bool {
	switch role {
	case RoleOwner, RoleAdmin, RoleMember:
		return true
	default:
		return false
	}
}

// RequireWrite denies read-only roles (VIEWER) and unknown/empty roles on
// mutating endpoints. Call AFTER Protect (needs RoleKey in context).
//
// Do NOT apply to: logout, mark-alert-read, pure compute GETs, supplier portal
// routes (use RequireRole("supplier")), device/API-key/admin-key auth.
func RequireWrite(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := GetRole(r.Context())
		if !CanWriteRole(role) {
			http.Error(w, `{"error":"forbidden: read-only role"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// GetTenantID extracts tenant ID from context
func GetTenantID(ctx context.Context) string {
	if id, ok := ctx.Value(TenantIDKey).(string); ok {
		return id
	}
	return ""
}

// GetEmail extracts email from context
func GetEmail(ctx context.Context) string {
	if email, ok := ctx.Value(EmailKey).(string); ok {
		return email
	}
	return ""
}

// GetRole extracts the RBAC role from context
func GetRole(ctx context.Context) string {
	if role, ok := ctx.Value(RoleKey).(string); ok {
		return role
	}
	return ""
}

// GetUserID extracts the authenticated user (identity) ID from context.
func GetUserID(ctx context.Context) string {
	if id, ok := ctx.Value(UserIDKey).(string); ok {
		return id
	}
	return ""
}

// GetProductType extracts the tenant product type from context.
func GetProductType(ctx context.Context) string {
	if productType, ok := ctx.Value(ProductTypeKey).(string); ok {
		return productType
	}
	return ""
}

// GetSupplierID extracts supplier ID from context
func GetSupplierID(ctx context.Context) string {
	if id, ok := ctx.Value(SupplierIDKey).(string); ok {
		return id
	}
	return ""
}
