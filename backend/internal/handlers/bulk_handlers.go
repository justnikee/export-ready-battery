package handlers

import (
	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"log/slog"
	"net/http"
	"strconv"

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
//
// COMPLIANCE LOCK: Direct status mutation is permanently disabled.
// All passport state changes must go through POST /passports/bulk/transition,
// which enforces: actor authentication, state-machine validation, evidence
// capture, and an immutable hash-chained audit event per passport.
// Bypassing this via a raw status write would corrupt the audit chain.
func (h *Handler) BulkUpdateStatus(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Bulk status updates are disabled. Use POST /passports/bulk/transition to preserve audit events.")
}

// BulkDeletePassports handles POST /api/v1/passports/bulk/delete
//
// COMPLIANCE LOCK: Passport deletion is permanently disabled.
// Passports are immutable compliance records. To correct data:
//   - Use PATCH /passports/{id} for metadata corrections.
//   - Use POST /batches/{id}/archive to retire an erroneous batch.
//   - Use POST /passports/{id}/transition action=recall to remove from service.
func (h *Handler) BulkDeletePassports(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Passport deletion is not permitted. Passports are immutable compliance records.")
}

// DeleteBatch handles DELETE /api/v1/batches/{id}
//
// COMPLIANCE LOCK: Batch deletion is permanently disabled.
// Use POST /batches/{id}/archive to retire a batch while preserving passport records.
func (h *Handler) DeleteBatch(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Batch deletion is not permitted. Use POST /batches/{id}/archive instead.")
}

// formatMessage creates a message like "500 passports updated"
func formatMessage(count int, noun string, verb string) string {
	suffix := "s"
	if count == 1 {
		suffix = ""
	}

	if verb == "" {
		return strconv.Itoa(count) + " " + noun + suffix
	}
	return strconv.Itoa(count) + " " + noun + suffix + " " + verb
}

// ArchiveBatch handles POST /api/v1/batches/{id}/archive
// Archives an ACTIVE batch - compliance-safe alternative to deletion
func (h *Handler) ArchiveBatch(w http.ResponseWriter, r *http.Request) {
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
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Verify batch belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Only ACTIVE batches can be archived
	if batch.Status != "ACTIVE" {
		respondError(w, http.StatusBadRequest, "Only ACTIVE batches can be archived. Current status: "+batch.Status)
		return
	}

	// Set batch status to ARCHIVED
	err = h.repo.SetBatchStatus(r.Context(), batchID, "ARCHIVED")
	if err != nil {
		slog.Error("Failed to archive batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to archive batch")
		return
	}

	slog.Info("Archived batch", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"batch_name": batch.BatchName,
		"status":     "ARCHIVED",
		"message":    "Batch archived successfully. It remains available for audit and compliance purposes.",
	})
}

// DeleteDraftBatch handles DELETE /api/v1/batches/{id}/draft
// Only allows deletion of DRAFT batches with no passports
func (h *Handler) DeleteDraftBatch(w http.ResponseWriter, r *http.Request) {
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
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Verify batch belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Only DRAFT batches can be deleted
	if batch.Status != "DRAFT" {
		respondError(w, http.StatusForbidden, "Only DRAFT batches can be deleted. Use archive for ACTIVE batches.")
		return
	}

	// Check if batch has any passports
	if batch.TotalPassports > 0 {
		respondError(w, http.StatusForbidden, "Cannot delete batch with existing passports. Remove passports first or archive the batch.")
		return
	}

	// Safe to hard delete - no legal artifacts created
	_, err = h.repo.DeleteBatchWithPassports(r.Context(), batchID)
	if err != nil {
		slog.Error("Failed to delete draft batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete draft batch")
		return
	}

	slog.Info("Deleted draft batch", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"batch_name": batch.BatchName,
		"message":    "Draft batch deleted successfully.",
	})
}

// ListPassports handles GET /api/v1/passports
// Returns a tenant-scoped passport list for the lifecycle dashboard.
// Query params: status, search, batch_id, limit, offset
func (h *Handler) ListPassports(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	q := r.URL.Query()
	status := q.Get("status")
	search := q.Get("search")
	batchID := q.Get("batch_id")

	limit := 50
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 500 {
			limit = v
		}
	}
	offset := 0
	if o := q.Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}

	items, total, err := h.repo.ListPassportsByTenant(r.Context(), tenantID, status, search, batchID, models.ProductType(middleware.GetProductType(r.Context())), limit, offset)
	if err != nil {
		slog.Error("Failed to list passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list passports")
		return
	}

	if items == nil {
		items = []*repository.PassportListItem{}
	}

	statusCounts, err := h.repo.GetPassportStatusCounts(r.Context(), tenantID, batchID)
	if err != nil {
		slog.Error("Failed to get passport status counts", "error", err)
		statusCounts = map[string]int{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passports":     items,
		"total":         total,
		"status_counts": statusCounts,
	})
}
