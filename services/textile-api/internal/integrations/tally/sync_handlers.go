package tally

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/anvayalabs/textile-api/internal/middleware"
	"github.com/anvayalabs/textile-api/internal/repository"
	"github.com/google/uuid"
)

// SyncHandler provides REST endpoints for Tally sync config and staging.
type SyncHandler struct {
	repo repository.RepositoryInterface
}

// NewSyncHandler creates a new SyncHandler.
func NewSyncHandler(repo repository.RepositoryInterface) *SyncHandler {
	return &SyncHandler{repo: repo}
}

// GetConfig handles GET /api/v1/integrations/tally/sync-config
func (h *SyncHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	cfg, err := h.repo.GetTallySyncConfig(r.Context(), tenantID)
	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"config":  nil,
			"enabled": false,
		})
		return
	}

	respondJSON(w, http.StatusOK, cfg)
}

// SaveConfig handles POST /api/v1/integrations/tally/sync-config
func (h *SyncHandler) SaveConfig(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req struct {
		TallyHost            string `json:"tally_host"`
		TallyPort            int    `json:"tally_port"`
		SyncFrequencyMinutes int    `json:"sync_frequency_minutes"`
		AutoImport           bool   `json:"auto_import"`
		Enabled              bool   `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TallyHost == "" {
		req.TallyHost = "localhost"
	}
	if req.TallyPort == 0 {
		req.TallyPort = 9000
	}
	if req.SyncFrequencyMinutes < 1 || req.SyncFrequencyMinutes > 60 {
		req.SyncFrequencyMinutes = 5
	}

	cfg := &repository.TallySyncConfig{
		TenantID:             tenantID,
		TallyHost:            req.TallyHost,
		TallyPort:            req.TallyPort,
		SyncFrequencyMinutes: req.SyncFrequencyMinutes,
		AutoImport:           req.AutoImport,
		Enabled:              req.Enabled,
	}

	if err := h.repo.UpsertTallySyncConfig(r.Context(), cfg); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to save config")
		return
	}

	respondJSON(w, http.StatusOK, cfg)
}

// GetStaging handles GET /api/v1/integrations/tally/staging
func (h *SyncHandler) GetStaging(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "pending"
	}
	limit := 20
	offset := 0
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && o >= 0 {
		offset = o
	}

	items, total, err := h.repo.GetTallySyncStagingByTenant(r.Context(), tenantID, status, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch staging")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"items":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ApplyStaging handles POST /api/v1/integrations/tally/staging/{id}/apply
func (h *SyncHandler) ApplyStaging(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid staging id")
		return
	}

	var nilLotID uuid.UUID
	if err := h.repo.ApplyTallySyncStaging(r.Context(), id, tenantID, nilLotID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to apply staging")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "applied"})
}

// DiscardStaging handles POST /api/v1/integrations/tally/staging/{id}/discard
func (h *SyncHandler) DiscardStaging(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid staging id")
		return
	}

	if err := h.repo.DiscardTallySyncStaging(r.Context(), id, tenantID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to discard staging")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "discarded"})
}

// TriggerSync handles POST /api/v1/integrations/tally/sync-trigger
func (h *SyncHandler) TriggerSync(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	cfg, err := h.repo.GetTallySyncConfig(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "no sync config found")
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if err := syncTenant(ctx, h.repo, cfg); err != nil {
			slog.Error("[tally-sync] manual trigger failed", "tenant_id", tenantID, "error", err)
		}
	}()

	respondJSON(w, http.StatusOK, map[string]string{"status": "sync triggered"})
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
