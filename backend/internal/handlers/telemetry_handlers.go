package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// TelemetryHandler handles BMS telemetry and device token HTTP endpoints
type TelemetryHandler struct {
	telemetryService   *services.TelemetryService
	deviceTokenService *services.DeviceTokenService
}

// NewTelemetryHandler creates a new telemetry handler
func NewTelemetryHandler(telemetrySvc *services.TelemetryService, deviceTokenSvc *services.DeviceTokenService) *TelemetryHandler {
	return &TelemetryHandler{
		telemetryService:   telemetrySvc,
		deviceTokenService: deviceTokenSvc,
	}
}

// ============================================================================
// TELEMETRY INGESTION (Device Token Auth)
// ============================================================================

// IngestTelemetry handles POST /api/v1/telemetry
func (h *TelemetryHandler) IngestTelemetry(w http.ResponseWriter, r *http.Request) {
	deviceTokenID := middleware.GetDeviceTokenID(r.Context())
	if deviceTokenID == uuid.Nil {
		http.Error(w, `{"error":"device token context missing"}`, http.StatusUnauthorized)
		return
	}

	var req services.IngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body: `+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	result, err := h.telemetryService.Ingest(r.Context(), req, deviceTokenID)
	if err != nil {
		switch err {
		case services.ErrInvalidTelemetry:
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		case services.ErrPassportNotFound:
			http.Error(w, `{"error":"passport not found"}`, http.StatusNotFound)
		case services.ErrRecordedAtInFuture:
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		default:
			http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// IngestTelemetryBatch handles POST /api/v1/telemetry/batch
func (h *TelemetryHandler) IngestTelemetryBatch(w http.ResponseWriter, r *http.Request) {
	deviceTokenID := middleware.GetDeviceTokenID(r.Context())
	if deviceTokenID == uuid.Nil {
		http.Error(w, `{"error":"device token context missing"}`, http.StatusUnauthorized)
		return
	}

	var req services.BatchIngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body: `+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	if len(req.Readings) == 0 {
		http.Error(w, `{"error":"readings array is empty"}`, http.StatusBadRequest)
		return
	}
	if len(req.Readings) > 100 {
		http.Error(w, `{"error":"batch size exceeds maximum of 100"}`, http.StatusBadRequest)
		return
	}

	result := h.telemetryService.IngestBatch(r.Context(), req, deviceTokenID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// ============================================================================
// TELEMETRY HISTORY (JWT Auth)
// ============================================================================

// GetTelemetryHistory handles GET /api/v1/passports/{uuid}/telemetry
func (h *TelemetryHandler) GetTelemetryHistory(w http.ResponseWriter, r *http.Request) {
	passportIDStr := r.PathValue("uuid")
	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid passport UUID"}`, http.StatusBadRequest)
		return
	}

	// Parse pagination
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 50
	}

	// Parse optional time range
	var from, to *time.Time
	if fromStr := r.URL.Query().Get("from"); fromStr != "" {
		if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
			from = &t
		}
	}
	if toStr := r.URL.Query().Get("to"); toStr != "" {
		if t, err := time.Parse(time.RFC3339, toStr); err == nil {
			to = &t
		}
	}

	readings, total, err := h.telemetryService.GetHistory(r.Context(), passportID, limit, offset, from, to)
	if err != nil {
		http.Error(w, `{"error":"failed to retrieve telemetry history"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"readings": readings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// ============================================================================
// DEVICE TOKEN MANAGEMENT (JWT Auth)
// ============================================================================

type createDeviceTokenRequest struct {
	Name        string     `json:"name"`
	BatchID     *uuid.UUID `json:"batch_id,omitempty"`
	Permissions string     `json:"permissions,omitempty"` // "write" | "read_write"
	RateLimit   int        `json:"rate_limit,omitempty"`  // Default: 60
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

// CreateDeviceToken handles POST /api/v1/device-tokens
func (h *TelemetryHandler) CreateDeviceToken(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		http.Error(w, `{"error":"missing tenant context"}`, http.StatusUnauthorized)
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid tenant ID"}`, http.StatusUnauthorized)
		return
	}

	var req createDeviceTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, `{"error":"name is required"}`, http.StatusBadRequest)
		return
	}

	result, err := h.deviceTokenService.CreateToken(r.Context(), services.CreateTokenRequest{
		TenantID:    tenantID,
		Name:        req.Name,
		BatchID:     req.BatchID,
		Permissions: req.Permissions,
		RateLimit:   req.RateLimit,
		ExpiresAt:   req.ExpiresAt,
	})
	if err != nil {
		http.Error(w, `{"error":"failed to create device token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":     result.Token,
		"raw_token": result.RawToken,
		"message":   "Save this token securely. It will not be shown again.",
	})
}

// ListDeviceTokens handles GET /api/v1/device-tokens
func (h *TelemetryHandler) ListDeviceTokens(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		http.Error(w, `{"error":"missing tenant context"}`, http.StatusUnauthorized)
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid tenant ID"}`, http.StatusUnauthorized)
		return
	}

	tokens, err := h.deviceTokenService.ListTokens(r.Context(), tenantID)
	if err != nil {
		http.Error(w, `{"error":"failed to list device tokens"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tokens": tokens,
	})
}

// RevokeDeviceToken handles DELETE /api/v1/device-tokens/{id}
func (h *TelemetryHandler) RevokeDeviceToken(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		http.Error(w, `{"error":"missing tenant context"}`, http.StatusUnauthorized)
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid tenant ID"}`, http.StatusUnauthorized)
		return
	}

	tokenIDStr := r.PathValue("id")
	tokenID, err := uuid.Parse(tokenIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid token ID"}`, http.StatusBadRequest)
		return
	}

	if err := h.deviceTokenService.RevokeToken(r.Context(), tokenID, tenantID); err != nil {
		http.Error(w, `{"error":"device token not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "device token revoked",
	})
}
