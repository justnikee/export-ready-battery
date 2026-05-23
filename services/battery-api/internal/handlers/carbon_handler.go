package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// CarbonHandler handles carbon footprint calculation requests.
type CarbonHandler struct {
	service *services.CarbonCalculatorService
}

// NewCarbonHandler creates a new carbon handler.
func NewCarbonHandler(service *services.CarbonCalculatorService) *CarbonHandler {
	return &CarbonHandler{service: service}
}

// CalculateCarbon handles POST /api/v1/carbon/calculate
// @Summary Calculate carbon footprint for a battery batch
// @Description Uses JRC-aligned factors to compute carbon footprint from BOM inputs
// @Tags carbon
func (h *CarbonHandler) CalculateCarbon(w http.ResponseWriter, r *http.Request) {
	// Verify auth context
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized - tenant context required")
		return
	}
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse request body
	var input services.CarbonInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if input.Chemistry == "" {
		respondError(w, http.StatusBadRequest, "chemistry is required")
		return
	}
	if input.CapacityKWh <= 0 {
		respondError(w, http.StatusBadRequest, "capacity_kwh must be greater than 0")
		return
	}
	if input.CellSourceCountry == "" {
		respondError(w, http.StatusBadRequest, "cell_source_country is required")
		return
	}
	if input.FactoryCountry == "" {
		respondError(w, http.StatusBadRequest, "factory_country is required")
		return
	}
	if input.TransportMode == "" {
		respondError(w, http.StatusBadRequest, "transport_mode is required")
		return
	}
	if input.BatteryWeightKg <= 0 {
		respondError(w, http.StatusBadRequest, "battery_weight_kg must be greater than 0")
		return
	}

	// Calculate carbon footprint
	result, err := h.service.CalculateCarbon(r.Context(), input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Carbon calculation failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}
