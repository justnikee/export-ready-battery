package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

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

	// Get client IP
	clientIP := services.GetClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)

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
		log.Printf("Failed to record scan: %v", err)
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
