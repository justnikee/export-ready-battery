package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// CreateTemplate handles POST /api/v1/templates
func (h *Handler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.TenantID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	template, err := h.repo.CreateTemplate(r.Context(), req.TenantID, req.Name, req.Specs)
	if err != nil {
		log.Printf("Failed to create template: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create template")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"template": template,
	})
}

// ListTemplates handles GET /api/v1/templates?tenant_id=xxx
func (h *Handler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := r.URL.Query().Get("tenant_id")
	if tenantIDStr == "" {
		respondError(w, http.StatusBadRequest, "tenant_id query parameter is required")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant_id format")
		return
	}

	templates, err := h.repo.ListTemplates(r.Context(), tenantID)
	if err != nil {
		log.Printf("Failed to list templates: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to list templates")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"templates": templates,
		"count":     len(templates),
	})
}

// GetTemplate handles GET /api/v1/templates/{id}
func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid template ID format")
		return
	}

	template, err := h.repo.GetTemplate(r.Context(), id)
	if err != nil {
		if err.Error() == "template not found" {
			respondError(w, http.StatusNotFound, "Template not found")
			return
		}
		log.Printf("Failed to get template: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get template")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"template": template,
	})
}

// DeleteTemplate handles DELETE /api/v1/templates/{id}
func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid template ID format")
		return
	}

	err = h.repo.DeleteTemplate(r.Context(), id)
	if err != nil {
		if err.Error() == "template not found" {
			respondError(w, http.StatusNotFound, "Template not found")
			return
		}
		log.Printf("Failed to delete template: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete template")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Template deleted successfully",
	})
}
