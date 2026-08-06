package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/regulatory"
	"github.com/anvayalabs/battery-api/internal/regulatory/fetchers"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// ListRegulatorySources returns all configured sources.
func (h *Handler) ListRegulatorySources(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active_only") == "true"
	sources, err := h.repo.ListRegulatorySources(r.Context(), activeOnly)
	if err != nil {
		slog.Error("failed to list regulatory sources", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list sources")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"sources": sources})
}

// CreateRegulatorySource adds a new source.
func (h *Handler) CreateRegulatorySource(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name          string            `json:"name"`
		SourceType    string            `json:"source_type"`
		URL           string            `json:"url"`
		Config        map[string]string `json:"config,omitempty"`
		FetchInterval string            `json:"fetch_interval"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Name == "" || req.URL == "" || req.SourceType == "" {
		respondError(w, http.StatusBadRequest, "name, url, and source_type are required")
		return
	}

	now := time.Now()
	source := &models.RegulatorySource{
		ID:            uuid.New(),
		Name:          req.Name,
		SourceType:    models.RegulatorySourceType(req.SourceType),
		URL:           req.URL,
		Config:        req.Config,
		FetchInterval: req.FetchInterval,
		IsActive:      true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	if source.FetchInterval == "" {
		source.FetchInterval = "6h"
	}

	if err := h.repo.CreateRegulatorySource(r.Context(), source); err != nil {
		slog.Error("failed to create regulatory source", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create source")
		return
	}
	respondJSON(w, http.StatusCreated, source)
}

// UpdateRegulatorySource modifies an existing source.
func (h *Handler) UpdateRegulatorySource(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req struct {
		Name          string            `json:"name"`
		SourceType    string            `json:"source_type"`
		URL           string            `json:"url"`
		Config        map[string]string `json:"config,omitempty"`
		FetchInterval string            `json:"fetch_interval"`
		IsActive      *bool             `json:"is_active,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	source, err := h.repo.GetRegulatorySourceByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "source not found")
		return
	}

	if req.Name != "" {
		source.Name = req.Name
	}
	if req.SourceType != "" {
		source.SourceType = models.RegulatorySourceType(req.SourceType)
	}
	if req.URL != "" {
		source.URL = req.URL
	}
	if req.Config != nil {
		source.Config = req.Config
	}
	if req.FetchInterval != "" {
		source.FetchInterval = req.FetchInterval
	}
	if req.IsActive != nil {
		source.IsActive = *req.IsActive
	}

	if err := h.repo.UpdateRegulatorySource(r.Context(), source); err != nil {
		slog.Error("failed to update regulatory source", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update source")
		return
	}
	respondJSON(w, http.StatusOK, source)
}

// ForceFetchRegulatorySource triggers an immediate fetch for a source.
func (h *Handler) ForceFetchRegulatorySource(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	ing := regulatory.NewIngester(h.repo)
	ing.RegisterFetcher("rss", fetchers.NewRSSFetcher())
	ing.RegisterFetcher("api", fetchers.NewRSSFetcher())
	ing.RegisterFetcher("scraper", fetchers.NewScraperFetcher())

	go func() {
		if err := ing.RunSource(context.Background(), id); err != nil {
			slog.Error("force fetch failed", "source_id", id, "error", err)
		}
	}()

	respondJSON(w, http.StatusAccepted, map[string]string{"status": "fetching"})
}

// ListRegulatoryItems returns all classified items.
func (h *Handler) ListRegulatoryItems(w http.ResponseWriter, r *http.Request) {
	filter := repository.ListRegulatoryItemsFilter{
		ProductType:  r.URL.Query().Get("product_type"),
		MarketRegion: r.URL.Query().Get("market_region"),
		Urgency:      r.URL.Query().Get("urgency"),
	}
	filter.Limit = ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	filter.Offset = ParseQueryOffset(r)

	items, total, err := h.repo.ListRegulatoryItems(r.Context(), filter)
	if err != nil {
		slog.Error("failed to list regulatory items", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list items")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"items": items, "total": total})
}

// GetRegulatoryAlerts returns personalized alerts for the authenticated tenant.
func (h *Handler) GetRegulatoryAlerts(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "missing tenant")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	unreadOnly := r.URL.Query().Get("unread_only") == "true"
	limit := ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	offset := ParseQueryOffset(r)

	alerts, total, err := h.repo.GetTenantRegulatoryAlerts(r.Context(), tenantID, unreadOnly, limit, offset)
	if err != nil {
		slog.Error("failed to get regulatory alerts", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to get alerts")
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"alerts": alerts, "total": total})
}

// GetRegulatoryAlertUnreadCount returns the unread count for the bell badge.
func (h *Handler) GetRegulatoryAlertUnreadCount(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "missing tenant")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	count, err := h.repo.GetTenantRegulatoryAlertUnreadCount(r.Context(), tenantID)
	if err != nil {
		slog.Error("failed to get unread count", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to get count")
		return
	}
	respondJSON(w, http.StatusOK, map[string]int{"count": count})
}

// MarkRegulatoryAlertRead marks a single alert as read.
func (h *Handler) MarkRegulatoryAlertRead(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	// S-07: tenant-scoped so one org cannot mutate another's regulatory alerts.
	if err := h.repo.MarkTenantRegulatoryAlertRead(r.Context(), id, tenantID); err != nil {
		if strings.Contains(err.Error(), "alert not found") {
			respondError(w, http.StatusNotFound, "alert not found")
			return
		}
		slog.Error("failed to mark alert read", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to mark read")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "read"})
}

// DismissRegulatoryAlert marks a single alert as dismissed.
func (h *Handler) DismissRegulatoryAlert(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.repo.MarkTenantRegulatoryAlertDismissed(r.Context(), id, tenantID); err != nil {
		if strings.Contains(err.Error(), "alert not found") {
			respondError(w, http.StatusNotFound, "alert not found")
			return
		}
		slog.Error("failed to dismiss alert", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to dismiss")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "dismissed"})
}
