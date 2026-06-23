package middleware

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// Device token context keys
const (
	DeviceTokenIDKey  ContextKey = "device_token_id"
	DeviceTenantIDKey ContextKey = "device_tenant_id"
	DeviceBatchIDKey  ContextKey = "device_batch_id"
)

// DeviceAuth middleware for BMS/IoT device token authentication
type DeviceAuth struct {
	tokenService *services.DeviceTokenService
	limiter      *tokenBucketLimiter
}

// NewDeviceAuth creates a new device auth middleware
func NewDeviceAuth(tokenService *services.DeviceTokenService) *DeviceAuth {
	return &DeviceAuth{
		tokenService: tokenService,
		limiter:      newTokenBucketLimiter(),
	}
}

// Authenticate returns a middleware that requires valid device token authentication
func (d *DeviceAuth) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Read X-Device-Token header
		rawToken := r.Header.Get("X-Device-Token")
		if rawToken == "" {
			// Also check Authorization header with "DeviceToken" scheme
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.EqualFold(parts[0], "DeviceToken") {
					rawToken = parts[1]
				}
			}
		}

		if rawToken == "" {
			http.Error(w, `{"error":"missing device token (X-Device-Token header)"}`, http.StatusUnauthorized)
			return
		}

		// Validate token
		token, err := d.tokenService.ValidateToken(r.Context(), rawToken)
		if err != nil {
			if err == services.ErrDeviceTokenNotFound {
				http.Error(w, `{"error":"invalid device token"}`, http.StatusUnauthorized)
				return
			}
			if err == services.ErrDeviceTokenExpired {
				http.Error(w, `{"error":"device token has expired"}`, http.StatusUnauthorized)
				return
			}
			http.Error(w, `{"error":"token validation failed"}`, http.StatusInternalServerError)
			return
		}

		// Rate limiting (per token)
		if !d.limiter.allow(token.ID.String(), token.RateLimit) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error":"rate limit exceeded","retry_after":60}`, http.StatusTooManyRequests)
			return
		}

		// Set context values
		ctx := context.WithValue(r.Context(), DeviceTokenIDKey, token.ID)
		ctx = context.WithValue(ctx, DeviceTenantIDKey, token.TenantID)
		if token.BatchID != nil {
			ctx = context.WithValue(ctx, DeviceBatchIDKey, *token.BatchID)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetDeviceTokenID extracts device token ID from context
func GetDeviceTokenID(ctx context.Context) uuid.UUID {
	if id, ok := ctx.Value(DeviceTokenIDKey).(uuid.UUID); ok {
		return id
	}
	return uuid.Nil
}

// GetDeviceTenantID extracts tenant ID from device token context
func GetDeviceTenantID(ctx context.Context) uuid.UUID {
	if id, ok := ctx.Value(DeviceTenantIDKey).(uuid.UUID); ok {
		return id
	}
	return uuid.Nil
}

// GetDeviceBatchID extracts batch ID from device token context (may be Nil)
func GetDeviceBatchID(ctx context.Context) uuid.UUID {
	if id, ok := ctx.Value(DeviceBatchIDKey).(uuid.UUID); ok {
		return id
	}
	return uuid.Nil
}

// ============================================================================
// In-memory token bucket rate limiter
// ============================================================================

type tokenBucket struct {
	tokens    float64
	maxTokens float64
	lastFill  time.Time
}

type tokenBucketLimiter struct {
	mu      sync.Mutex
	buckets map[string]*tokenBucket
}

func newTokenBucketLimiter() *tokenBucketLimiter {
	tbl := &tokenBucketLimiter{
		buckets: make(map[string]*tokenBucket),
	}
	// Cleanup goroutine: remove stale buckets every 10 minutes
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		for range ticker.C {
			tbl.cleanup()
		}
	}()
	return tbl
}

func (tbl *tokenBucketLimiter) allow(key string, ratePerMinute int) bool {
	tbl.mu.Lock()
	defer tbl.mu.Unlock()

	now := time.Now()
	maxTokens := float64(ratePerMinute)
	refillRate := maxTokens / 60.0 // tokens per second

	bucket, exists := tbl.buckets[key]
	if !exists {
		bucket = &tokenBucket{
			tokens:    maxTokens - 1, // consume one token
			maxTokens: maxTokens,
			lastFill:  now,
		}
		tbl.buckets[key] = bucket
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(bucket.lastFill).Seconds()
	bucket.tokens += elapsed * refillRate
	if bucket.tokens > maxTokens {
		bucket.tokens = maxTokens
	}
	bucket.lastFill = now

	// Try to consume a token
	if bucket.tokens >= 1 {
		bucket.tokens--
		return true
	}
	return false
}

func (tbl *tokenBucketLimiter) cleanup() {
	tbl.mu.Lock()
	defer tbl.mu.Unlock()

	cutoff := time.Now().Add(-30 * time.Minute)
	for key, bucket := range tbl.buckets {
		if bucket.lastFill.Before(cutoff) {
			delete(tbl.buckets, key)
		}
	}
}
