package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"

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

	// P-02: default 50, hard max 200
	limit := ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	offset := ParseQueryOffset(r)

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

// ============================================================================
// CSV SOH BATCH UPLOAD (JWT Auth)
// ============================================================================

// UploadSoHCSV handles POST /api/v1/telemetry/soh-upload
// Accepts a CSV with columns: passport_uuid, soh_pct, cycle_count, measured_at
func (h *TelemetryHandler) UploadSoHCSV(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		http.Error(w, `{"error":"missing tenant context"}`, http.StatusUnauthorized)
		return
	}

	// Limit upload to 5MB
	r.Body = http.MaxBytesReader(w, r.Body, limits.MaxTelemetryCSVBytes)

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error":"missing CSV file in 'file' form field"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		http.Error(w, `{"error":"failed to read CSV header"}`, http.StatusBadRequest)
		return
	}

	// Map column indices
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[col] = i
	}
	requiredCols := []string{"passport_uuid", "soh_pct"}
	for _, col := range requiredCols {
		if _, ok := colMap[col]; !ok {
			http.Error(w, fmt.Sprintf(`{"error":"missing required CSV column: %s"}`, col), http.StatusBadRequest)
			return
		}
	}

	var (
		accepted int
		rejected int
		errors   []string
	)

	// Use a synthetic device token ID for CSV uploads
	syntheticDeviceTokenID := uuid.Nil

	for rowNum := 2; ; rowNum++ {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: parse error: %s", rowNum, err.Error()))
			rejected++
			continue
		}

		passportUUID, err := uuid.Parse(row[colMap["passport_uuid"]])
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: invalid passport_uuid", rowNum))
			rejected++
			continue
		}

		sohPct, err := strconv.ParseFloat(row[colMap["soh_pct"]], 64)
		if err != nil || sohPct < 0 || sohPct > 100 {
			errors = append(errors, fmt.Sprintf("row %d: invalid soh_pct (must be 0-100)", rowNum))
			rejected++
			continue
		}

		// Optional columns
		var cycleCount *int
		if idx, ok := colMap["cycle_count"]; ok && idx < len(row) && row[idx] != "" {
			cc, err := strconv.Atoi(row[idx])
			if err == nil {
				cycleCount = &cc
			}
		}

		measuredAt := time.Now().UTC()
		if idx, ok := colMap["measured_at"]; ok && idx < len(row) && row[idx] != "" {
			if parsed, err := time.Parse(time.RFC3339, row[idx]); err == nil {
				measuredAt = parsed
			} else if parsed, err := time.Parse("2006-01-02", row[idx]); err == nil {
				measuredAt = parsed
			}
		}

		req := services.IngestRequest{
			PassportID:    passportUUID,
			StateOfHealth: &sohPct,
			CycleCount:    cycleCount,
			RecordedAt:    measuredAt,
			Source:        "csv_soh_upload",
		}

		_, err = h.telemetryService.Ingest(r.Context(), req, syntheticDeviceTokenID)
		if err != nil {
			errors = append(errors, fmt.Sprintf("row %d: %s", rowNum, err.Error()))
			rejected++
		} else {
			accepted++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"accepted": accepted,
		"rejected": rejected,
		"errors":   errors,
	})
}
