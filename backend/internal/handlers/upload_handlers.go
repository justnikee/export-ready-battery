package handlers

import (
	"encoding/json"
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

// ValidateCSV handles POST /api/v1/batches/{id}/validate
// Validates CSV without inserting records - allows user to preview and fix issues
func (h *Handler) ValidateCSV(w http.ResponseWriter, r *http.Request) {
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

	// Parse multipart form
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

	log.Printf("Validating file: %s (%d bytes)", header.Filename, header.Size)

	// Parse CSV (validate only, don't persist)
	parseResult, err := h.csvService.ParseCSV(file, batchID)
	if err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("CSV parsing error: %v", err))
		return
	}

	// Check for duplicates in existing database
	serials := make([]string, 0, len(parseResult.Passports))
	for _, p := range parseResult.Passports {
		serials = append(serials, p.SerialNumber)
	}

	duplicates, _ := h.repo.FindDuplicateSerials(r.Context(), serials)

	// Build validation response
	validCount := len(parseResult.Passports) - len(duplicates)
	readyToImport := len(parseResult.Errors) == 0 && len(duplicates) == 0

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"valid_count":     validCount,
		"total_rows":      parseResult.RowCount,
		"duplicates":      duplicates,
		"duplicate_count": len(duplicates),
		"errors":          parseResult.Errors,
		"error_count":     len(parseResult.Errors),
		"ready_to_import": readyToImport,
	})
}

// DownloadSampleCSV handles GET /api/v1/sample-csv
// Returns a sample CSV file for users to use as a template
func (h *Handler) DownloadSampleCSV(w http.ResponseWriter, r *http.Request) {
	sampleCSV := `serial_number,manufacture_date
BAT-2026-001,2026-01-15
BAT-2026-002,2026-01-15
BAT-2026-003,2026-01-16
BAT-2026-004,2026-01-16
BAT-2026-005,2026-01-17`

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"sample_passports.csv\"")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(sampleCSV))
}

// AutoGeneratePassports handles POST /api/v1/batches/{id}/auto-generate
// Generates sequential passport serial numbers without CSV upload
func (h *Handler) AutoGeneratePassports(w http.ResponseWriter, r *http.Request) {
	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify batch exists
	batch, err := h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Parse request body
	var req struct {
		Count           int    `json:"count"`
		Prefix          string `json:"prefix"`
		StartNumber     int    `json:"start_number"`
		ManufactureDate string `json:"manufacture_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate inputs
	if req.Count <= 0 || req.Count > 10000 {
		respondError(w, http.StatusBadRequest, "Count must be between 1 and 10000")
		return
	}
	if req.Prefix == "" {
		req.Prefix = "BAT-"
	}
	if req.StartNumber <= 0 {
		req.StartNumber = 1
	}

	// Parse manufacture date
	manufactureDate := time.Now()
	if req.ManufactureDate != "" {
		parsed, err := time.Parse("2006-01-02", req.ManufactureDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid manufacture_date format (expected YYYY-MM-DD)")
			return
		}
		manufactureDate = parsed
	}

	// Generate passports
	passports := make([]*models.Passport, req.Count)
	for i := 0; i < req.Count; i++ {
		serialNumber := fmt.Sprintf("%s%03d", req.Prefix, req.StartNumber+i)
		passports[i] = &models.Passport{
			UUID:            uuid.New(),
			BatchID:         batchID,
			SerialNumber:    serialNumber,
			ManufactureDate: manufactureDate,
			Status:          models.PassportStatusActive,
			CreatedAt:       time.Now(),
		}
	}

	// Bulk insert
	insertedCount, err := h.repo.CreatePassportsBatch(r.Context(), passports)
	if err != nil {
		log.Printf("Failed to insert auto-generated passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate passports")
		return
	}

	firstSerial := fmt.Sprintf("%s%03d", req.Prefix, req.StartNumber)
	lastSerial := fmt.Sprintf("%s%03d", req.Prefix, req.StartNumber+req.Count-1)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"batch_id":          batchID,
		"batch_name":        batch.BatchName,
		"passports_created": insertedCount,
		"serial_range":      fmt.Sprintf("%s to %s", firstSerial, lastSerial),
		"qr_codes_ready":    true,
	})
}
