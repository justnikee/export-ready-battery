package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
)

// APIKeyContextKey is the context key for API key data
type APIKeyContextKey string

const (
	// APIKeyIDKey is the context key for API key ID
	APIKeyIDKey APIKeyContextKey = "api_key_id"
	// APIKeyScopeKey is the context key for API key scope
	APIKeyScopeKey APIKeyContextKey = "api_key_scope"
	// APIKeyTenantIDKey is the context key for tenant ID from API key
	APIKeyTenantIDKey APIKeyContextKey = "api_key_tenant_id"
)

// APIKeyAuth middleware for API key authentication
type APIKeyAuth struct {
	repo       *repository.Repository
	keyService *services.APIKeyService
}

// NewAPIKeyAuth creates a new API key auth middleware
func NewAPIKeyAuth(repo *repository.Repository, keyService *services.APIKeyService) *APIKeyAuth {
	return &APIKeyAuth{
		repo:       repo,
		keyService: keyService,
	}
}

// Authenticate validates API key for any scope (read or write)
func (a *APIKeyAuth) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key, err := a.validateKey(w, r)
		if err != nil {
			return // Error already written
		}

		// Check rate limit
		if !a.checkRateLimit(w, r, key, "read") {
			return
		}

		// Add key info to context
		ctx := a.enrichContext(r.Context(), key)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AuthenticateWrite validates API key and requires write scope
func (a *APIKeyAuth) AuthenticateWrite(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key, err := a.validateKey(w, r)
		if err != nil {
			return // Error already written
		}

		// Check scope
		if key.Scope != "write" {
			http.Error(w, `{"error":"insufficient scope - write access required"}`, http.StatusForbidden)
			return
		}

		// Check rate limit
		if !a.checkRateLimit(w, r, key, "write") {
			return
		}

		// Add key info to context
		ctx := a.enrichContext(r.Context(), key)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// validateKey extracts and validates the API key from the request
func (a *APIKeyAuth) validateKey(w http.ResponseWriter, r *http.Request) (*models.APIKey, error) {
	// Get key from X-API-Key header
	keyHeader := r.Header.Get("X-API-Key")
	if keyHeader == "" {
		http.Error(w, `{"error":"missing X-API-Key header"}`, http.StatusUnauthorized)
		return nil, http.ErrAbortHandler
	}

	// Validate key format
	if !a.keyService.IsValidKeyFormat(keyHeader) {
		http.Error(w, `{"error":"invalid API key format"}`, http.StatusUnauthorized)
		return nil, http.ErrAbortHandler
	}

	// Get prefix for lookup
	prefix := a.keyService.ExtractPrefix(keyHeader)

	// Get all active keys with this prefix
	keys, err := a.repo.GetAllActiveAPIKeys(r.Context())
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return nil, http.ErrAbortHandler
	}

	// Find matching key by validating hash
	var matchedKey *models.APIKey
	for _, key := range keys {
		if strings.HasPrefix(key.KeyPrefix, prefix[:len(services.KeyPrefix)+4]) {
			if a.keyService.ValidateKey(keyHeader, key.KeyHash) {
				matchedKey = key
				break
			}
		}
	}

	if matchedKey == nil {
		http.Error(w, `{"error":"invalid API key"}`, http.StatusUnauthorized)
		return nil, http.ErrAbortHandler
	}

	// Check expiration
	if matchedKey.ExpiresAt != nil && matchedKey.ExpiresAt.Before(time.Now()) {
		http.Error(w, `{"error":"API key expired"}`, http.StatusUnauthorized)
		return nil, http.ErrAbortHandler
	}

	// Update last used
	go a.repo.UpdateAPIKeyLastUsed(context.Background(), matchedKey.ID)

	return matchedKey, nil
}

// checkRateLimit checks if the request is within rate limits
func (a *APIKeyAuth) checkRateLimit(w http.ResponseWriter, r *http.Request, key *models.APIKey, opType string) bool {
	// Get rate limits for tier
	limits := models.GetRateLimits(key.RateLimitTier)

	var limit int
	if opType == "write" {
		limit = limits.WriteLimit
	} else {
		limit = limits.ReadLimit
	}

	// Get current usage and increment
	count, err := a.repo.IncrementUsage(r.Context(), key.ID, opType)
	if err != nil {
		// Log error but allow request
		return true
	}

	if count > limit {
		w.Header().Set("X-RateLimit-Limit", string(rune(limit)))
		w.Header().Set("X-RateLimit-Remaining", "0")
		http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
		return false
	}

	w.Header().Set("X-RateLimit-Limit", string(rune(limit)))
	w.Header().Set("X-RateLimit-Remaining", string(rune(limit-count)))

	return true
}

// enrichContext adds API key info to the request context
func (a *APIKeyAuth) enrichContext(ctx context.Context, key *models.APIKey) context.Context {
	ctx = context.WithValue(ctx, APIKeyIDKey, key.ID.String())
	ctx = context.WithValue(ctx, APIKeyScopeKey, key.Scope)
	ctx = context.WithValue(ctx, APIKeyTenantIDKey, key.TenantID.String())
	return ctx
}

// GetAPIKeyTenantID extracts tenant ID from API key context
func GetAPIKeyTenantID(ctx context.Context) string {
	if id, ok := ctx.Value(APIKeyTenantIDKey).(string); ok {
		return id
	}
	return ""
}

// GetAPIKeyScope extracts scope from API key context
func GetAPIKeyScope(ctx context.Context) string {
	if scope, ok := ctx.Value(APIKeyScopeKey).(string); ok {
		return scope
	}
	return ""
}
