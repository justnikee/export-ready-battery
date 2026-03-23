package handlers

import (
	"net/http"
	"strings"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// ListSchemas handles GET /api/v1/schemas
// Returns all registered product schemas (metadata only — schema_json is included
// so the frontend can render dynamic forms).
func (h *Handler) ListSchemas(w http.ResponseWriter, r *http.Request) {
	// Auth check
	tenantIDStr := middleware.GetTenantID(r.Context())
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	schemas, err := h.repo.ListProductSchemas(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list schemas")
		return
	}

	// If no DB schemas exist but we have a seeded schema via batchService, still
	// return a useful response so the frontend works before the DB is populated.
	if len(schemas) == 0 && h.batchService != nil {
		if s, sErr := h.batchService.GetActiveSchema(r.Context(), models.DefaultProductType()); sErr == nil {
			schemas = append(schemas, s)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"schemas": schemas,
		"count":   len(schemas),
	})
}

// GetSchema handles GET /api/v1/schemas/{product_type}
// Returns the active (latest version) schema for the given product type.
// The frontend calls this when a user starts creating a batch to build the
// dynamic spec form.
func (h *Handler) GetSchema(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ptStr := strings.ToUpper(r.PathValue("product_type"))
	pt := models.ProductType(ptStr)
	if !pt.IsValid() {
		respondError(w, http.StatusBadRequest, "Invalid product_type. Must be BATTERY, TEXTILE, or ELECTRONICS")
		return
	}

	// Prefer the registry (which has caching + seed fallback) over raw DB query.
	if h.batchService != nil {
		schema, err := h.batchService.GetActiveSchema(r.Context(), pt)
		if err == nil {
			respondJSON(w, http.StatusOK, schema)
			return
		}
	}

	// Fallback to direct DB query if batchService is not wired.
	schema, err := h.repo.GetActiveSchema(r.Context(), pt)
	if err != nil {
		respondError(w, http.StatusNotFound, "No schema found for product type "+ptStr)
		return
	}
	respondJSON(w, http.StatusOK, schema)
}
