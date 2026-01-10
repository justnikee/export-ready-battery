package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// UploadCSV handles POST /api/v1/batches/{id}/upload
func (h *Handler) UploadCSV(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify batch exists
	_, err = h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Parse multipart form (max 32MB)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	log.Printf("Received file: %s (%d bytes)", header.Filename, header.Size)

	// Parse CSV
	parseResult, err := h.csvService.ParseCSV(file, batchID)
	if err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("CSV parsing error: %v", err))
		return
	}

	// Check for parsing errors
	if len(parseResult.Errors) > 0 && len(parseResult.Passports) == 0 {
		respondJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":  "All rows failed validation",
			"errors": parseResult.Errors,
		})
		return
	}

	// Bulk insert passports
	insertedCount, err := h.repo.CreatePassportsBatch(r.Context(), parseResult.Passports)
	if err != nil {
		log.Printf("Failed to insert passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save passports to database")
		return
	}

	processingTime := time.Since(startTime)

	response := models.UploadCSVResponse{
		BatchID:        batchID,
		PassportsCount: insertedCount,
		ProcessingTime: processingTime.String(),
		QRCodesReady:   true,
	}

	// Include warnings if some rows failed
	if len(parseResult.Errors) > 0 {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"result":   response,
			"warnings": parseResult.Errors,
		})
		return
	}

	respondJSON(w, http.StatusOK, response)
}
