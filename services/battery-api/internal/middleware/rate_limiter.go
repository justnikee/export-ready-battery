package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"sync"
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
	lastSeen time.Time
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

// getVisitor retrieves or creates a rate limiter for an IP
func (rl *RateLimiter) getVisitor(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(rl.rate, rl.burst)
		rl.visitors[ip] = &visitorInfo{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
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
				if time.Since(v.lastSeen) > rl.cleanup {
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
		// Get real IP (support for proxies). Take only the first (leftmost) IP from
		// X-Forwarded-For to prevent header injection attacks.
		ip := r.Header.Get("X-Forwarded-For")
		if ip != "" {
			if idx := strings.Index(ip, ","); idx != -1 {
				ip = strings.TrimSpace(ip[:idx])
			}
		}
		if ip == "" {
			ip = r.Header.Get("X-Real-IP")
		}
		if ip == "" {
			ip = r.RemoteAddr
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

// APIRateLimiter creates a rate limiter for general API routes
// Less strict: 100 requests per minute with burst of 50
func NewAPIRateLimiter() *RateLimiter {
	return NewRateLimiter(rate.Every(time.Millisecond*600), 50) // ~100 req/min
}

// TenantRateLimiter implements per-tenant rate limiting
type TenantRateLimiter struct {
	visitors map[string]*visitorInfo
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
	cleanup  time.Duration
	stopCh   chan struct{}
}

// NewTenantRateLimiter creates a tenant-based rate limiter
func NewTenantRateLimiter(r rate.Limit, b int) *TenantRateLimiter {
	trl := &TenantRateLimiter{
		visitors: make(map[string]*visitorInfo),
		rate:     r,
		burst:    b,
		cleanup:  time.Minute * 10,
		stopCh:   make(chan struct{}),
	}

	go trl.cleanupVisitors()

	return trl
}

func (trl *TenantRateLimiter) getVisitor(tenantID string) *rate.Limiter {
	trl.mu.Lock()
	defer trl.mu.Unlock()

	v, exists := trl.visitors[tenantID]
	if !exists {
		limiter := rate.NewLimiter(trl.rate, trl.burst)
		trl.visitors[tenantID] = &visitorInfo{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func (trl *TenantRateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(trl.cleanup)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			trl.mu.Lock()
			for tenantID, v := range trl.visitors {
				if time.Since(v.lastSeen) > trl.cleanup {
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

// LimitTenant is the middleware that applies rate limiting per tenant ID.
// Falls back to IP-based rate limiting if tenant ID is not present in context.
func (trl *TenantRateLimiter) LimitTenant(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := GetTenantID(r.Context())
		if tenantID == "" {
			// Fallback to IP
			ip := r.Header.Get("X-Forwarded-For")
			if ip != "" {
				if idx := strings.Index(ip, ","); idx != -1 {
					ip = strings.TrimSpace(ip[:idx])
				}
			}
			if ip == "" {
				ip = r.Header.Get("X-Real-IP")
			}
			if ip == "" {
				ip = r.RemoteAddr
			}
			tenantID = ip
		}

		limiter := trl.getVisitor(tenantID)
		if !limiter.Allow() {
			slog.Warn("Tenant rate limit exceeded", "tenant_id", tenantID, "path", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"AI rate limit exceeded. Please try again later."}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// NewTenantAIRateLimiter creates a tenant-based rate limiter specifically for AI endpoints.
// Limits each tenant to ~10 requests per minute with a burst of 5.
func NewTenantAIRateLimiter() *TenantRateLimiter {
	return NewTenantRateLimiter(rate.Every(time.Second*6), 5)
}

