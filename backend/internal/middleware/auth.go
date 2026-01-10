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
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

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

		// Add claims to request context
		ctx := context.WithValue(r.Context(), TenantIDKey, claims.TenantID)
		ctx = context.WithValue(ctx, EmailKey, claims.Email)

		// Call next handler with enriched context
		next.ServeHTTP(w, r.WithContext(ctx))
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
