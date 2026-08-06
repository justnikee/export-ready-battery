package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// scanRateLimiter caps how many scans a single IP can record against a single
// passport per hour, independent of the generic per-IP API rate limit, to stop
// scan-count inflation attacks against one passport without tripping global
// abuse thresholds.
type scanRateLimiter struct {
	mu        sync.Mutex
	hits      map[string][]time.Time
	lastSweep time.Time
}

func newScanRateLimiter() *scanRateLimiter {
	return &scanRateLimiter{hits: make(map[string][]time.Time), lastSweep: time.Now()}
}

// allow reports whether another scan is allowed for key (IP:passportID),
// recording it if so.
func (l *scanRateLimiter) allow(key string, maxPerHour int) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-time.Hour)

	recent := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}

	allowed := len(recent) < maxPerHour
	if allowed {
		recent = append(recent, now)
	}
	l.hits[key] = recent

	if now.Sub(l.lastSweep) > 10*time.Minute {
		for k, times := range l.hits {
			if len(times) == 0 {
				delete(l.hits, k)
			}
		}
		l.lastSweep = now
	}

	return allowed
}

// RecordScanRequest is the request body for recording a scan
type RecordScanRequest struct {
	PassportID string `json:"passport_id"`
}

// RecordScan handles POST /api/v1/scans/record
// Called from the public passport page when a QR code is scanned
func (h *Handler) RecordScan(w http.ResponseWriter, r *http.Request) {
	var req RecordScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	passportID, err := uuid.Parse(req.PassportID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport_id format")
		return
	}

	clientIP := services.GetClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
		middleware.TrustProxyHeaders(),
	)
	if clientIP == "" {
		clientIP = "unknown"
	}
	if !h.scanRateLimiter.allow(clientIP+":"+passportID.String(), 10) {
		respondError(w, http.StatusTooManyRequests, "Too many scans recorded for this item. Please try again later.")
		return
	}

	// Verify passport exists
	_, err = h.repo.GetPassport(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Spam protection: Check if scanned within last 10 seconds
	lastScan, _ := h.repo.GetLastScanTime(r.Context(), passportID)
	if lastScan != nil && time.Since(*lastScan) < 10*time.Second {
		// Silently ignore duplicate scans (don't error, just acknowledge)
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":  "ignored",
			"message": "Duplicate scan ignored",
		})
		return
	}

	// GeoIP lookup
	geoResult := h.geoService.Lookup(clientIP)

	// Parse device type from User-Agent
	deviceType := services.ParseDeviceType(r.UserAgent())

	// Create scan event
	scanEvent := &models.ScanEvent{
		ID:         uuid.New(),
		PassportID: passportID,
		IPAddress:  clientIP,
		City:       geoResult.City,
		Country:    geoResult.Country,
		DeviceType: deviceType,
		UserAgent:  r.UserAgent(),
		ScannedAt:  time.Now(),
	}

	if err := h.repo.CreateScanEvent(r.Context(), scanEvent); err != nil {
		slog.Error("Failed to record scan", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to record scan")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"status":  "recorded",
		"city":    geoResult.City,
		"country": geoResult.Country,
		"device":  deviceType,
	})
}
