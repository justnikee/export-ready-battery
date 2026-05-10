package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"exportready-battery/internal/middleware"

	"github.com/google/uuid"
)

// GetDashboardStats handles GET /api/v1/dashboard/stats
func (h *Handler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	stats, err := h.repo.GetDashboardStats(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to get dashboard stats", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get dashboard stats")
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// GetRecentBatches handles GET /api/v1/batches/recent
func (h *Handler) GetRecentBatches(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Default to 5, max 20
	limit := 5
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	batches, err := h.repo.GetRecentBatches(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get recent batches", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get recent batches")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches": batches,
		"count":   len(batches),
	})
}

// GetScanFeed handles GET /api/v1/scans/feed
func (h *Handler) GetScanFeed(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Default to 10
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	feed, err := h.repo.GetScanFeed(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get scan feed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get scan feed")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"scans": feed,
		"count": len(feed),
	})
}
