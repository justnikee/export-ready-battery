package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// ============================================================================
// EXTERNAL API HANDLERS (API Key Authenticated)
// ============================================================================

// ExternalCreateBatchRequest is the request for creating a batch via external API
type ExternalCreateBatchRequest struct {
	BatchName        string           `json:"batch_name"`
	MarketRegion     string           `json:"market_region"`
	Specs            models.BatchSpec `json:"specs"`
	PLICompliant     bool             `json:"pli_compliant,omitempty"`
	DomesticValueAdd float64          `json:"domestic_value_add,omitempty"`
	CellSource       string           `json:"cell_source,omitempty"`
	BillOfEntryNo    string           `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin  string           `json:"country_of_origin,omitempty"`
	CustomsDate      string           `json:"customs_date,omitempty"`
}

// ExternalCreatePassportsRequest is the request for adding passports via external API
type ExternalCreatePassportsRequest struct {
	Passports []ExternalPassportEntry `json:"passports"`
}

// ExternalPassportEntry represents a single passport entry from external API
type ExternalPassportEntry struct {
	SerialNumber    string `json:"serial_number"`
	ManufactureDate string `json:"manufacture_date"` // YYYY-MM-DD
}

// ExternalCreateBatch handles POST /api/v1/external/batches
// Creates a new batch for ERP integrations
func (h *Handler) ExternalCreateBatch(w http.ResponseWriter, r *http.Request) {
	var req ExternalCreateBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.BatchName == "" {
		respondError(w, http.StatusBadRequest, "batch_name is required")
		return
	}

	// Get tenant ID from API key context
	tenantIDStr := middleware.GetAPIKeyTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Validate market region
	marketRegion := models.MarketRegion(req.MarketRegion)
	if req.MarketRegion == "" {
		marketRegion = models.MarketRegionGlobal
	}
	if !marketRegion.IsValid() {
		respondError(w, http.StatusBadRequest, "Invalid market_region. Must be INDIA, EU, or GLOBAL")
		return
	}

	// Parse customs date if provided
	var customsDate *time.Time
	if req.CustomsDate != "" {
		parsed, err := time.Parse("2006-01-02", req.CustomsDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid customs_date format. Use YYYY-MM-DD")
			return
		}
		customsDate = &parsed
	}

	// Create batch using repository request struct
	createReq := repository.CreateBatchRequest{
		TenantID:         tenantID,
		BatchName:        req.BatchName,
		Specs:            req.Specs,
		MarketRegion:     marketRegion,
		PLICompliant:     req.PLICompliant,
		DomesticValueAdd: req.DomesticValueAdd,
		CellSource:       req.CellSource,
		BillOfEntryNo:    req.BillOfEntryNo,
		CountryOfOrigin:  req.CountryOfOrigin,
		CustomsDate:      customsDate,
	}

	batch, err := h.repo.CreateBatch(r.Context(), createReq)
	if err != nil {
		log.Printf("External API: Failed to create batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create batch")
		return
	}

	log.Printf("🔗 External API: Batch created - %s (tenant: %s)", batch.BatchName, tenantIDStr[:8])

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":         batch.ID.String(),
		"batch_name": batch.BatchName,
		"message":    "Batch created successfully",
	})
}

// ExternalCreatePassports handles POST /api/v1/external/batches/{id}/passports
// Adds passports to a batch via JSON (ERP integration)
func (h *Handler) ExternalCreatePassports(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	var req ExternalCreatePassportsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate
	if len(req.Passports) == 0 {
		respondError(w, http.StatusBadRequest, "passports array is required")
		return
	}

	if len(req.Passports) > 500 {
		respondError(w, http.StatusBadRequest, "Maximum 500 passports per request")
		return
	}

	// Get tenant ID from API key context
	tenantIDStr := middleware.GetAPIKeyTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Verify batch ownership
	batch, err := h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}
	if batch.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Check for duplicate serial numbers in request
	serialNumbers := make([]string, len(req.Passports))
	seen := make(map[string]bool)
	for i, p := range req.Passports {
		if p.SerialNumber == "" {
			respondError(w, http.StatusBadRequest, fmt.Sprintf("Passport at index %d missing serial_number", i))
			return
		}
		if seen[p.SerialNumber] {
			respondError(w, http.StatusBadRequest, fmt.Sprintf("Duplicate serial_number in request: %s", p.SerialNumber))
			return
		}
		seen[p.SerialNumber] = true
		serialNumbers[i] = p.SerialNumber
	}

	// Check for existing duplicates in database
	duplicates, err := h.repo.FindDuplicateSerials(r.Context(), serialNumbers)
	if err != nil {
		log.Printf("Failed to check duplicates: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to validate serial numbers")
		return
	}
	if len(duplicates) > 0 {
		respondJSON(w, http.StatusConflict, map[string]interface{}{
			"error":      "Duplicate serial numbers found",
			"duplicates": duplicates,
		})
		return
	}

	// Create passports
	passports := make([]*models.Passport, len(req.Passports))
	for i, p := range req.Passports {
		manufDate, err := time.Parse("2006-01-02", p.ManufactureDate)
		if err != nil {
			// Default to today
			manufDate = time.Now()
		}

		passports[i] = &models.Passport{
			UUID:            uuid.New(),
			BatchID:         batchID,
			SerialNumber:    p.SerialNumber,
			ManufactureDate: manufDate,
			Status:          "ACTIVE",
			CreatedAt:       time.Now(),
		}
	}

	created, err := h.repo.CreatePassportsBatch(r.Context(), passports)
	if err != nil {
		log.Printf("External API: Failed to create passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create passports")
		return
	}

	log.Printf("🔗 External API: %d passports created for batch %s (tenant: %s)", created, batch.BatchName, tenantIDStr[:8])

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"created":    created,
		"batch_id":   batchID.String(),
		"batch_name": batch.BatchName,
		"message":    fmt.Sprintf("%d passports created successfully", created),
	})
}

// ExternalGetPassport handles GET /api/v1/external/passports/{uuid}
// Returns passport data for verification (read-only)
func (h *Handler) ExternalGetPassport(w http.ResponseWriter, r *http.Request) {
	passportIDStr := r.PathValue("uuid")
	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport ID")
		return
	}

	passport, err := h.repo.GetPassportWithSpecs(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Return passport data
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passport": passport,
	})
}

// ExternalDownloadLabels handles GET /api/v1/external/batches/{id}/labels
// Returns PDF labels for a batch (for ERP integration)
func (h *Handler) ExternalDownloadLabels(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Get tenant ID from API key context
	tenantIDStr := middleware.GetAPIKeyTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Verify batch ownership
	batch, err := h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}
	if batch.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Get tenant for label generation
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get tenant info")
		return
	}

	// Get all passports for the batch
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, 10000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get passports")
		return
	}

	if len(passports) == 0 {
		respondError(w, http.StatusBadRequest, "No passports in batch")
		return
	}

	// Generate PDF
	pdfBuffer, err := h.pdfService.GenerateLabelSheet(batch, passports, tenant)
	if err != nil {
		log.Printf("External API: Failed to generate labels: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate labels")
		return
	}

	// Send PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s-labels.pdf\"", batch.BatchName))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", pdfBuffer.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBuffer.Bytes())

	log.Printf("🔗 External API: Labels downloaded for batch %s (tenant: %s)", batch.BatchName, tenantIDStr[:8])
}
