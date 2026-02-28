package middleware

import (
	"context"
	"net/http"
	"strings"

	"exportready-battery/internal/services"
)

// ContextKey type for context values
type ContextKey string

const (
	// TenantIDKey is the context key for tenant ID
	TenantIDKey ContextKey = "tenant_id"
	// EmailKey is the context key for email
	EmailKey ContextKey = "email"
	// RoleKey is the context key for RBAC role
	RoleKey ContextKey = "role"
)

// Auth middleware for JWT authentication
type Auth struct {
	authService *services.AuthService
}

// NewAuth creates a new auth middleware
func NewAuth(authService *services.AuthService) *Auth {
	return &Auth{authService: authService}
}

// Protect returns a middleware that requires valid JWT authentication
func (a *Auth) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header or Query Param
		var tokenString string
		authHeader := r.Header.Get("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback to query parameter (needed for window.open / pdf viewing)
		if tokenString == "" {
			tokenString = r.URL.Query().Get("token")
		}

		if tokenString == "" {
			http.Error(w, `{"error":"missing authorization header or token"}`, http.StatusUnauthorized)
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
