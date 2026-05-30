package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// CreateComponent handles POST /api/v1/batches/{batch_id}/components
func (h *Handler) CreateComponent(w http.ResponseWriter, r *http.Request) {
	batchID, err := uuid.Parse(r.PathValue("batch_id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req repository.Component
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.ID = uuid.New()
	req.TenantID = tenantID
	req.BatchID = &batchID
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	if req.ComponentType == "" {
		respondError(w, http.StatusBadRequest, "component_type is required")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	if err := h.repo.CreateComponent(r.Context(), &req); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create component")
		return
	}

	respondJSON(w, http.StatusCreated, req)
}

// GetComponent handles GET /api/v1/components/{id}
func (h *Handler) GetComponent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid component id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	component, err := h.repo.GetComponent(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "component not found")
		return
	}

	respondJSON(w, http.StatusOK, component)
}

// UpdateComponent handles PUT /api/v1/components/{id}
func (h *Handler) UpdateComponent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid component id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req repository.Component
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.ID = id
	req.TenantID = tenantID
	req.UpdatedAt = time.Now()

	if err := h.repo.UpdateComponent(r.Context(), &req); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update component")
		return
	}

	respondJSON(w, http.StatusOK, req)
}

// DeleteComponent handles DELETE /api/v1/components/{id}
func (h *Handler) DeleteComponent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid component id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	if err := h.repo.DeleteComponent(r.Context(), id, tenantID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete component")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ListComponentsByBatch handles GET /api/v1/batches/{batch_id}/components
func (h *Handler) ListComponentsByBatch(w http.ResponseWriter, r *http.Request) {
	batchID, err := uuid.Parse(r.PathValue("batch_id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	components, err := h.repo.ListComponentsByBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list components")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"components": components})
}

// GetComponentTreeByBatch handles GET /api/v1/batches/{batch_id}/components/tree
func (h *Handler) GetComponentTreeByBatch(w http.ResponseWriter, r *http.Request) {
	batchID, err := uuid.Parse(r.PathValue("batch_id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	tree, err := h.repo.GetComponentTreeByBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get component tree")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"tree": tree})
}
