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

// GetEPRObligation returns the EPR obligation summary for the authenticated tenant.
// GET /api/v1/epr/obligation?year=2026
func (h *Handler) GetEPRObligation(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse optional year parameter (defaults to current year)
	year := time.Now().Year()
	if yearStr := r.URL.Query().Get("year"); yearStr != "" {
		parsed, err := strconv.Atoi(yearStr)
		if err != nil || parsed < 2020 || parsed > 2050 {
			respondError(w, http.StatusBadRequest, "Invalid year parameter")
			return
		}
		year = parsed
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load tenant")
		return
	}

	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	result := services.CalculateEPRObligation(tenant, batches, year)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetEPRMultiYear returns a 3-year EPR obligation summary.
// GET /api/v1/epr/obligation/summary
func (h *Handler) GetEPRMultiYear(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load tenant")
		return
	}

	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	results := services.CalculateEPRMultiYear(tenant, batches)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
