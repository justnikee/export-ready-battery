package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// CreateBatch handles POST /api/v1/batches with dual-mode validation
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

	// Default to GLOBAL if not specified
	if req.MarketRegion == "" {
		req.MarketRegion = models.MarketRegionGlobal
	}

	// Validate market region
	if !req.MarketRegion.IsValid() {
		respondError(w, http.StatusBadRequest, "Invalid market_region. Must be INDIA, EU, or GLOBAL")
		return
	}

	// ===== DUAL-MODE VALIDATION =====

	// EU Mode: Carbon Footprint is MANDATORY
	if req.MarketRegion == models.MarketRegionEU {
		if req.Specs.CarbonFootprint == "" {
			respondError(w, http.StatusBadRequest, "EU compliance requires carbon_footprint")
			return
		}
		// EU Mode: Certifications should include CE
		hasCE := false
		for _, cert := range req.Specs.Certifications {
			if cert == "CE" {
				hasCE = true
				break
			}
		}
		if !hasCE {
			log.Printf("Warning: EU batch created without CE certification")
		}
	}

	// India Mode: Validate cell_source if provided
	if req.MarketRegion == models.MarketRegionIndia {
		if req.CellSource != "" && req.CellSource != "IMPORTED" && req.CellSource != "DOMESTIC" {
			respondError(w, http.StatusBadRequest, "cell_source must be IMPORTED or DOMESTIC")
			return
		}
	}

	// Create the batch
	log.Printf("DEBUG Handler CreateBatch: TenantID=%s, BatchName=%s, MarketRegion=%s, Specs=%+v",
		req.TenantID, req.BatchName, req.MarketRegion, req.Specs)

	batch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:         req.TenantID,
		BatchName:        req.BatchName,
		Specs:            req.Specs,
		MarketRegion:     req.MarketRegion,
		PLICompliant:     req.PLICompliant,
		DomesticValueAdd: req.DomesticValueAdd,
		CellSource:       req.CellSource,
		Materials:        req.Materials,
	})
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

	// Get passport count first
	count, _ := h.repo.CountPassportsByBatch(r.Context(), batchID)
	if count == 0 {
		respondError(w, http.StatusNotFound, "No passports found for this batch")
		return
	}

	// Get all passports for this batch (no limit for QR download)
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
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

// GetBatchPassports handles GET /api/v1/batches/{id}/passports?page=1&limit=50
func (h *Handler) GetBatchPassports(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Parse pagination params
	limit := 50 // Default
	page := 1
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := parseInt(limitStr); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if parsed, err := parseInt(pageStr); err == nil && parsed > 0 {
			page = parsed
		}
	}
	offset := (page - 1) * limit

	// Get total count
	totalCount, _ := h.repo.CountPassportsByBatch(r.Context(), batchID)

	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, limit, offset)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	totalPages := (totalCount + limit - 1) / limit

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passports":   passports,
		"count":       len(passports),
		"total":       totalCount,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
		"has_more":    page < totalPages,
	})
}

// parseInt is a helper to parse string to int
func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
