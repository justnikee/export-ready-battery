package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// CreateBatch handles POST /api/v1/batches
func (h *Handler) CreateBatch(w http.ResponseWriter, r *http.Request) {
	var req models.CreateBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.TenantID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}
	if req.BatchName == "" {
		respondError(w, http.StatusBadRequest, "batch_name is required")
		return
	}

	batch, err := h.repo.CreateBatch(r.Context(), req.TenantID, req.BatchName, req.Specs)
	if err != nil {
		log.Printf("Failed to create batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create batch")
		return
	}

	respondJSON(w, http.StatusCreated, models.CreateBatchResponse{Batch: batch})
}

// ListBatches handles GET /api/v1/batches?tenant_id=xxx
func (h *Handler) ListBatches(w http.ResponseWriter, r *http.Request) {
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

	batches, err := h.repo.ListBatches(r.Context(), tenantID)
	if err != nil {
		log.Printf("Failed to list batches: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to list batches")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches": batches,
		"count":   len(batches),
	})
}

// GetBatch handles GET /api/v1/batches/{id}
func (h *Handler) GetBatch(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), id)
	if err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		log.Printf("Failed to get batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get batch")
		return
	}

	// Get passport count for this batch
	count, _ := h.repo.CountPassportsByBatch(r.Context(), id)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch":          batch,
		"passport_count": count,
	})
}

// DownloadQRCodes handles GET /api/v1/batches/{id}/download
func (h *Handler) DownloadQRCodes(w http.ResponseWriter, r *http.Request) {
	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get batch info for filename
	batch, err := h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Get all passports for this batch
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	if len(passports) == 0 {
		respondError(w, http.StatusNotFound, "No passports found for this batch")
		return
	}

	log.Printf("Generating %d QR codes for batch %s", len(passports), batch.BatchName)

	// Generate QR codes and create ZIP
	zipReader, zipSize, err := h.qrService.GenerateAndZip(passports)
	if err != nil {
		log.Printf("Failed to generate QR codes: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate QR codes")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_qrcodes.zip", batch.BatchName)
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", zipSize))

	// Stream the ZIP to the response
	if _, err := io.Copy(w, zipReader); err != nil {
		log.Printf("Failed to send ZIP: %v", err)
	}
}

// GetBatchPassports handles GET /api/v1/batches/{id}/passports
func (h *Handler) GetBatchPassports(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passports": passports,
		"count":     len(passports),
	})
}
