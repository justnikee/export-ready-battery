package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// ============================================================================
// BULK OPERATIONS HANDLERS
// ============================================================================

// BulkUpdateStatusRequest is the request body for bulk status update
type BulkUpdateStatusRequest struct {
	PassportIDs []string `json:"passport_ids"`
	Status      string   `json:"status"`
}

// BulkDeleteRequest is the request body for bulk delete
type BulkDeleteRequest struct {
	PassportIDs []string `json:"passport_ids"`
}

// BulkUpdateStatus handles POST /api/v1/passports/bulk/status
func (h *Handler) BulkUpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req BulkUpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if len(req.PassportIDs) == 0 {
		respondError(w, http.StatusBadRequest, "passport_ids is required")
		return
	}

	if len(req.PassportIDs) > 1000 {
		respondError(w, http.StatusBadRequest, "Maximum 1000 passports per request")
		return
	}

	if !repository.IsValidPassportStatus(req.Status) {
		respondError(w, http.StatusBadRequest, "Invalid status. Must be: ACTIVE, RECALLED, RECYCLED, or END_OF_LIFE")
		return
	}

	// Get tenant ID for authorization
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Parse passport IDs
	passportIDs := make([]uuid.UUID, 0, len(req.PassportIDs))
	for _, idStr := range req.PassportIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid passport ID: "+idStr)
			return
		}
		passportIDs = append(passportIDs, id)
	}

	// Verify all passports belong to this tenant's batches
	passports, err := h.repo.GetPassportsByIDs(r.Context(), passportIDs)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to validate passports")
		return
	}

	if len(passports) != len(passportIDs) {
		respondError(w, http.StatusBadRequest, "Some passports not found")
		return
	}

	// Check each passport's batch belongs to tenant (enforced by GetBatch with tenantID)
	for _, p := range passports {
		_, err := h.repo.GetBatch(r.Context(), p.BatchID, tenantID)
		if err != nil {
			respondError(w, http.StatusForbidden, "Access denied to one or more passports")
			return
		}
	}

	// Perform bulk update
	updated, err := h.repo.BulkUpdatePassportStatus(r.Context(), passportIDs, req.Status)
	if err != nil {
		log.Printf("Failed to bulk update passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to update passports")
		return
	}

	log.Printf("✅ Bulk status update: %d passports → %s (tenant: %s)", updated, req.Status, tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"updated": updated,
		"status":  req.Status,
		"message": formatMessage(int(updated), "passport", "updated to "+req.Status),
	})
}

// BulkDeletePassports handles POST /api/v1/passports/bulk/delete
func (h *Handler) BulkDeletePassports(w http.ResponseWriter, r *http.Request) {
	var req BulkDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if len(req.PassportIDs) == 0 {
		respondError(w, http.StatusBadRequest, "passport_ids is required")
		return
	}

	if len(req.PassportIDs) > 1000 {
		respondError(w, http.StatusBadRequest, "Maximum 1000 passports per request")
		return
	}

	// Get tenant ID for authorization
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Parse passport IDs
	passportIDs := make([]uuid.UUID, 0, len(req.PassportIDs))
	for _, idStr := range req.PassportIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid passport ID: "+idStr)
			return
		}
		passportIDs = append(passportIDs, id)
	}

	// Verify all passports belong to this tenant's batches
	passports, err := h.repo.GetPassportsByIDs(r.Context(), passportIDs)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to validate passports")
		return
	}

	for _, p := range passports {
		_, err := h.repo.GetBatch(r.Context(), p.BatchID, tenantID)
		if err != nil {
			respondError(w, http.StatusForbidden, "Access denied to one or more passports")
			return
		}
	}

	// Perform bulk delete
	deleted, err := h.repo.BulkDeletePassports(r.Context(), passportIDs)
	if err != nil {
		log.Printf("Failed to bulk delete passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete passports")
		return
	}

	log.Printf("🗑️ Bulk delete: %d passports (tenant: %s)", deleted, tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"deleted": deleted,
		"message": formatMessage(int(deleted), "passport", "deleted"),
	})
}

// DeleteBatch handles DELETE /api/v1/batches/{id}
func (h *Handler) DeleteBatch(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Get tenant ID for authorization
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Verify batch belongs to tenant (enforced at DB level)
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Delete batch and all passports
	deletedPassports, err := h.repo.DeleteBatchWithPassports(r.Context(), batchID)
	if err != nil {
		log.Printf("Failed to delete batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete batch")
		return
	}

	log.Printf("🗑️ Deleted batch %s with %d passports (tenant: %s)", batch.BatchName, deletedPassports, tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"deleted_passports": deletedPassports,
		"batch_name":        batch.BatchName,
		"message":           "Batch and " + formatMessage(int(deletedPassports), "passport", "") + " deleted",
	})
}

// formatMessage creates a message like "500 passports updated"
func formatMessage(count int, noun string, verb string) string {
	suffix := "s"
	if count == 1 {
		suffix = ""
	}

	if verb == "" {
		return string(rune(count)) + " " + noun + suffix
	}
	return string(rune(count)) + " " + noun + suffix + " " + verb
}
