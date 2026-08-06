package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/time/rate"
)

// RateLimiter implements per-IP rate limiting
type RateLimiter struct {
	visitors map[string]*visitorInfo
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
	cleanup  time.Duration
	stopCh   chan struct{}
}

type visitorInfo struct {
	limiter  *rate.Limiter
	lastSeen atomic.Int64 // UnixNano timestamp stored atomically for thread-safe lock-free reads
}

func newVisitorInfo(limiter *rate.Limiter) *visitorInfo {
	v := &visitorInfo{limiter: limiter}
	v.lastSeen.Store(time.Now().UnixNano())
	return v
}

func (v *visitorInfo) touch() {
	v.lastSeen.Store(time.Now().UnixNano())
}

func (v *visitorInfo) getLastSeen() time.Time {
	return time.Unix(0, v.lastSeen.Load())
}

// NewRateLimiter creates a rate limiter
// - r: requests per second
// - b: burst size (max requests in a burst)
func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitorInfo),
		rate:     r,
		burst:    b,
		cleanup:  time.Minute * 5,
		stopCh:   make(chan struct{}),
	}

	// Start cleanup goroutine
	go rl.cleanupVisitors()

	return rl
}

// getVisitor retrieves or creates a rate limiter for an IP.
// Uses a 2-stage read/write pattern (RLock for existing entries, upgrading to Lock only when missing).
func (rl *RateLimiter) getVisitor(ip string) *rate.Limiter {
	// Fast path: read lock for existing visitor
	rl.mu.RLock()
	v, exists := rl.visitors[ip]
	if exists {
		v.touch()
		rl.mu.RUnlock()
		return v.limiter
	}
	rl.mu.RUnlock()

	// Slow path: write lock for new visitor allocation
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double-check under write lock
	v, exists = rl.visitors[ip]
	if exists {
		v.touch()
		return v.limiter
	}

	limiter := rate.NewLimiter(rl.rate, rl.burst)
	info := newVisitorInfo(limiter)
	rl.visitors[ip] = info
	return limiter
}

// cleanupVisitors removes stale entries; exits when stopCh is closed.
func (rl *RateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(rl.cleanup)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.mu.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.getLastSeen()) > rl.cleanup {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		case <-rl.stopCh:
			return
		}
	}
}

// Stop shuts down the cleanup goroutine. Call during graceful shutdown.
func (rl *RateLimiter) Stop() {
	close(rl.stopCh)
}

// Limit is the middleware that applies rate limiting
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// S-09: ClientIP ignores spoofable XFF unless TRUST_PROXY / production.
		ip := ClientIP(r)
		if ip == "" {
			ip = "unknown"
		}

		limiter := rl.getVisitor(ip)
		if !limiter.Allow() {
			slog.Warn("Rate limit exceeded", "ip", ip, "path", r.URL.Path)
			http.Error(w, `{"error":"Too many requests. Please try again later."}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// AuthRateLimiter creates a rate limiter specifically for auth routes
// More strict: 5 requests per minute with burst of 10
func NewAuthRateLimiter() *RateLimiter {
	return NewRateLimiter(rate.Every(time.Second*12), 10) // ~5 req/min
}

// APIRateLimiter creates a rate limiter for general public API routes
// (passport GET, scan record). ~100 requests per minute with burst of 50.
func NewAPIRateLimiter() *RateLimiter {
	return NewRateLimiter(rate.Every(time.Millisecond*600), 50) // ~100 req/min
}

// NewGlobalAPIRateLimiter is a coarse per-IP safety net for all /api/* traffic (P-04).
// Higher than public passport limits so legitimate dashboards are not clipped twice;
// still blocks single-IP floods. ~600 req/min, burst 150.
func NewGlobalAPIRateLimiter() *RateLimiter {
	return NewRateLimiter(rate.Every(100*time.Millisecond), 150)
}

// LimitAPIPaths rate-limits paths under /api/ (and /docs) by client IP.
// Skips health probes so orchestrators are never 429'd.
func (rl *RateLimiter) LimitAPIPaths(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/health" || path == "/api/v1/health" || path == "/" {
			next.ServeHTTP(w, r)
			return
		}
		// Only meter API + docs; leave static/misc alone if any.
		if !strings.HasPrefix(path, "/api/") && !strings.HasPrefix(path, "/docs") {
			next.ServeHTTP(w, r)
			return
		}

		ip := ClientIP(r)
		if ip == "" {
			ip = "unknown"
		}
		limiter := rl.getVisitor(ip)
		if !limiter.Allow() {
			slog.Warn("Global API rate limit exceeded", "ip", ip, "path", path)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "1")
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte(`{"error":"Too many requests. Please try again later."}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// TenantRateLimiter implements per-tenant rate limiting
type TenantRateLimiter struct {
	visitors    map[string]*visitorInfo
	mu          sync.RWMutex
	rate        rate.Limit
	burst       int
	cleanup     time.Duration
	stopCh      chan struct{}
	exceededMsg string // JSON body for 429; default generic
}

// NewTenantRateLimiter creates a tenant-based rate limiter
func NewTenantRateLimiter(r rate.Limit, b int) *TenantRateLimiter {
	trl := &TenantRateLimiter{
		visitors:    make(map[string]*visitorInfo),
		rate:        r,
		burst:       b,
		cleanup:     time.Minute * 10,
		stopCh:      make(chan struct{}),
		exceededMsg: `{"error":"Rate limit exceeded. Please try again later."}`,
	}

	go trl.cleanupVisitors()

	return trl
}

func (trl *TenantRateLimiter) getVisitor(tenantID string) *rate.Limiter {
	// Fast path: read lock for existing tenant visitor
	trl.mu.RLock()
	v, exists := trl.visitors[tenantID]
	if exists {
		v.touch()
		trl.mu.RUnlock()
		return v.limiter
	}
	trl.mu.RUnlock()

	// Slow path: write lock for new tenant visitor allocation
	trl.mu.Lock()
	defer trl.mu.Unlock()

	v, exists = trl.visitors[tenantID]
	if exists {
		v.touch()
		return v.limiter
	}

	limiter := rate.NewLimiter(trl.rate, trl.burst)
	info := newVisitorInfo(limiter)
	trl.visitors[tenantID] = info
	return limiter
}

func (trl *TenantRateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(trl.cleanup)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			trl.mu.Lock()
			for tenantID, v := range trl.visitors {
				if time.Since(v.getLastSeen()) > trl.cleanup {
					delete(trl.visitors, tenantID)
				}
			}
			trl.mu.Unlock()
		case <-trl.stopCh:
			return
		}
	}
}

// Stop shuts down the cleanup goroutine.
func (trl *TenantRateLimiter) Stop() {
	close(trl.stopCh)
}

// Allow reports whether the keyed visitor may proceed (tenant ID or IP string).
func (trl *TenantRateLimiter) Allow(key string) bool {
	if key == "" {
		key = "unknown"
	}
	return trl.getVisitor(key).Allow()
}

// LimitTenant is the middleware that applies rate limiting per tenant ID.
// Falls back to IP-based rate limiting if tenant ID is not present in context.
// Prefer applying AFTER JWT auth so TenantIDKey is set (P-04).
func (trl *TenantRateLimiter) LimitTenant(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := GetTenantID(r.Context())
		if tenantID == "" {
			// Fallback to client IP (S-09 trusted extraction)
			ip := ClientIP(r)
			if ip == "" {
				ip = "unknown"
			}
			tenantID = ip
		}

		if !trl.Allow(tenantID) {
			slog.Warn("Tenant rate limit exceeded", "tenant_id", tenantID, "path", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "1")
			w.WriteHeader(http.StatusTooManyRequests)
			msg := trl.exceededMsg
			if msg == "" {
				msg = `{"error":"Rate limit exceeded. Please try again later."}`
			}
			_, _ = w.Write([]byte(msg))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// NewTenantAIRateLimiter creates a tenant-based rate limiter specifically for AI endpoints.
// Limits each tenant to ~10 requests per minute with a burst of 5.
func NewTenantAIRateLimiter() *TenantRateLimiter {
	trl := NewTenantRateLimiter(rate.Every(time.Second*6), 5)
	trl.exceededMsg = `{"error":"AI rate limit exceeded. Please try again later."}`
	return trl
}

// NewTenantAPIRateLimiter is the default per-tenant limit for authenticated
// manufacturer/supplier JWT traffic (P-04). ~300 req/min with burst 100 —
// higher than public passport limits; AI routes keep a stricter limiter.
func NewTenantAPIRateLimiter() *TenantRateLimiter {
	return NewTenantRateLimiter(rate.Every(200*time.Millisecond), 100)
}

