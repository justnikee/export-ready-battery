package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

func (h *Handler) fleetTenantAndProductType(r *http.Request) (uuid.UUID, models.ProductType, error) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return uuid.Nil, "", err
	}
	return tenantID, models.ProductType(middleware.GetProductType(r.Context())), nil
}

// GetFleetStats handles GET /api/v1/fleet/stats
func (h *Handler) GetFleetStats(w http.ResponseWriter, r *http.Request) {
	tenantID, productType, err := h.fleetTenantAndProductType(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	stats, err := h.repo.GetFleetStats(r.Context(), tenantID, productType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to compute fleet stats")
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

// GetFleetWorstHealth handles GET /api/v1/fleet/worst-health?limit=20
func (h *Handler) GetFleetWorstHealth(w http.ResponseWriter, r *http.Request) {
	tenantID, productType, err := h.fleetTenantAndProductType(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	items, err := h.repo.GetWorstHealthPassports(r.Context(), tenantID, productType, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load worst-health passports")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"passports": items})
}

// GetFleetEvents handles GET /api/v1/fleet/events?days=30
// Returns RECALLED/RECYCLED passport events across the tenant's fleet.
func (h *Handler) GetFleetEvents(w http.ResponseWriter, r *http.Request) {
	tenantID, productType, err := h.fleetTenantAndProductType(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	days := 30
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}
	since := time.Now().AddDate(0, 0, -days)

	events, err := h.repo.GetFleetLifecycleEvents(r.Context(), tenantID, productType, since, 50)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load fleet lifecycle events")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

// GetFleetThermalEvents handles GET /api/v1/fleet/thermal-events?days=30&limit=20
// Returns individual thermal-event telemetry readings, for the BMS Telemetry
// dashboard's events feed — distinct from /fleet/stats' aggregate count.
func (h *Handler) GetFleetThermalEvents(w http.ResponseWriter, r *http.Request) {
	tenantID, productType, err := h.fleetTenantAndProductType(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	days := 30
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	since := time.Now().AddDate(0, 0, -days)

	events, err := h.repo.GetFleetThermalEvents(r.Context(), tenantID, productType, since, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load fleet thermal events")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

// GetFleetGeo handles GET /api/v1/fleet/geo
// Returns the latest known scan location for each IN_SERVICE passport.
func (h *Handler) GetFleetGeo(w http.ResponseWriter, r *http.Request) {
	tenantID, productType, err := h.fleetTenantAndProductType(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	locations, err := h.repo.GetFleetGeoLocations(r.Context(), tenantID, productType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load fleet geo locations")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"locations": locations})
}
