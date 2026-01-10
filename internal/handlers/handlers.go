package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/db"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	repo       *repository.Repository
	csvService *services.CSVService
	qrService  *services.QRService
}

// New creates a new Handler with the given database connection
func New(database *db.DB, baseURL string) *Handler {
	return &Handler{
		repo:       repository.New(database),
		csvService: services.NewCSVService(),
		qrService:  services.NewQRService(baseURL),
	}
}

// ============================================
// BATCH HANDLERS
// ============================================

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

// ============================================
// CSV UPLOAD HANDLER
// ============================================

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

// ============================================
// PASSPORT HANDLERS
// ============================================

// GetPassport handles GET /api/v1/passports/{uuid}
func (h *Handler) GetPassport(w http.ResponseWriter, r *http.Request) {
	uuidStr := r.PathValue("uuid")
	passportUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID format")
		return
	}

	// Get passport with batch specs (for the public passport page)
	passportWithSpecs, err := h.repo.GetPassportWithSpecs(r.Context(), passportUUID)
	if err != nil {
		if err.Error() == "passport not found" {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		log.Printf("Failed to get passport: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get passport")
		return
	}

	respondJSON(w, http.StatusOK, passportWithSpecs)
}

// ============================================
// QR CODE DOWNLOAD HANDLER
// ============================================

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

// ============================================
// HELPER FUNCTIONS
// ============================================

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}

// respondError sends an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
