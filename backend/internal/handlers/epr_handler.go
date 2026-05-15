package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/services"

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

	// EPR obligation is battery-specific (BWM Rules 2022). Default to battery; callers may override.
	productType := models.ProductTypeBattery
	if ptQuery := r.URL.Query().Get("product_type"); ptQuery != "" {
		productType = models.ProductType(ptQuery)
	}
	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, productType, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	// Query actual EPR certificate weight for this year's FY
	fy := services.ToFinancialYear(year)
	certifiedKg, _, err := h.repo.GetEPRCertificateSummary(r.Context(), tenantID, fy)
	if err != nil {
		// Non-fatal: fall back to 0 if table doesn't exist or query fails
		certifiedKg = 0
	}

	result := services.CalculateEPRObligation(tenant, batches, year, certifiedKg)

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

	// EPR obligation is battery-specific (BWM Rules 2022). Default to battery; callers may override.
	productType := models.ProductTypeBattery
	if ptQuery := r.URL.Query().Get("product_type"); ptQuery != "" {
		productType = models.ProductType(ptQuery)
	}
	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, productType, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	// Build multi-year summary with real certificate data per FY
	currentYear := time.Now().Year()
	years := []int{currentYear - 1, currentYear, currentYear + 1}
	results := make([]services.EPRObligation, 0, len(years))

	for _, y := range years {
		fy := services.ToFinancialYear(y)
		certifiedKg, _, err := h.repo.GetEPRCertificateSummary(r.Context(), tenantID, fy)
		if err != nil {
			certifiedKg = 0
		}
		results = append(results, services.CalculateEPRObligation(tenant, batches, y, certifiedKg))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
