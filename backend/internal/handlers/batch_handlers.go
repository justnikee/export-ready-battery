package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

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

		// Validate DVA source
		dvaSourceResult := h.validationService.ValidateDVASource(req.DVASource)
		if !dvaSourceResult.Valid {
			respondError(w, http.StatusBadRequest, dvaSourceResult.Message)
			return
		}

		// Default to ESTIMATED if not provided
		if req.DVASource == "" {
			req.DVASource = services.DVASourceEstimated
		}

		// Calculate DVA based on source
		var calculatedDVA float64
		if req.DVASource == services.DVASourceAudited {
			// AUDITED: Use provided audited value, skip calculation
			if req.AuditedDomesticValueAdd != nil {
				calculatedDVA = *req.AuditedDomesticValueAdd
				req.DomesticValueAdd = calculatedDVA
			} else {
				respondError(w, http.StatusBadRequest, "Audited DVA mode requires audited_domestic_value_add value")
				return
			}
			log.Printf("DVA AUDITED Mode: AuditedDVA=%.2f%%", calculatedDVA)
		} else {
			// ESTIMATED: Calculate DVA server-side from specs financial fields
			// Never trust client-provided domestic_value_add to prevent PLI fraud
			if req.Specs.SalePriceINR > 0 {
				calculatedDVA = ((req.Specs.SalePriceINR - req.Specs.ImportCostINR) / req.Specs.SalePriceINR) * 100
				if calculatedDVA < 0 {
					calculatedDVA = 0
				}
			}
			// Override any client-provided DVA with server-calculated value
			req.DomesticValueAdd = calculatedDVA
			log.Printf("DVA ESTIMATED Mode: SalePrice=%.2f, ImportCost=%.2f, Calculated DVA=%.2f%%",
				req.Specs.SalePriceINR, req.Specs.ImportCostINR, calculatedDVA)
		}

		// India Mode + IMPORTED: Require customs declaration fields
		if req.CellSource == "IMPORTED" {
			if req.BillOfEntryNo == "" || req.CountryOfOrigin == "" {
				respondError(w, http.StatusBadRequest,
					"Imported batches must include Bill of Entry and Country of Origin per Customs regulations")
				return
			}
			// For pure imports with no local value add (ESTIMATED mode only)
			if req.DVASource == services.DVASourceEstimated {
				if req.Specs.SalePriceINR == 0 || req.Specs.ImportCostINR >= req.Specs.SalePriceINR {
					req.DomesticValueAdd = 0
				}
			}
		} else if req.CellSource == "DOMESTIC" {
			// India Mode + DOMESTIC: Require value add > 0
			if req.DomesticValueAdd <= 0 {
				respondError(w, http.StatusBadRequest, "Domestic batches must have Domestic Value Add > 0%. Please enter Sale Price and Import Cost.")
				return
			}
		}

		// PLI Compliance Validation using validation service
		if err := h.validationService.ValidatePLICompliance(req.DVASource, req.AuditedDomesticValueAdd, req.DomesticValueAdd, req.PLICompliant); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
	}

	// Validate IEC Code format if provided (India: 10 digits)
	tenantID := req.TenantID
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err == nil && tenant.IECCode != "" {
		iecResult := h.validationService.ValidateIECCode(tenant.IECCode)
		if !iecResult.Valid {
			log.Printf("WARNING: Tenant %s has invalid IEC Code format: %s - %s",
				tenant.CompanyName, tenant.IECCode, iecResult.Message)
		}
	}

	// For IMPORTED cells, ensure tenant has valid IEC
	if req.MarketRegion == models.MarketRegionIndia && req.CellSource == "IMPORTED" {
		if err == nil && tenant.IECCode == "" {
			respondError(w, http.StatusBadRequest, "IEC Code is required in Organization Settings for importing battery cells")
			return
		}
	}

	// Validate HSN Code for India market
	if req.MarketRegion == models.MarketRegionIndia {
		hsnResult := h.validationService.ValidateHSNCode(req.HSNCode)
		if !hsnResult.Valid {
			respondError(w, http.StatusBadRequest, hsnResult.Message)
			return
		}
	}

	// Parse customs date if provided
	var customsDate *time.Time
	if req.CustomsDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.CustomsDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid customs_date format. Use YYYY-MM-DD")
			return
		}
		customsDate = &parsedDate
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
		BillOfEntryNo:    req.BillOfEntryNo,
		CountryOfOrigin:  req.CountryOfOrigin,
		CustomsDate:      customsDate,
		HSNCode:          req.HSNCode,
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

// DownloadLabels handles GET /api/v1/batches/{id}/labels
func (h *Handler) DownloadLabels(w http.ResponseWriter, r *http.Request) {
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

	// SECURITY CHECK: Batch must be ACTIVE to download labels
	if batch.Status != models.BatchStatusActive {
		respondError(w, http.StatusForbidden, "Batch must be activated first. Please activate this batch using your quota to download labels.")
		return
	}

	// Get tenant for compliance fields (EPR, BIS, etc.)
	tenant, err := h.repo.GetTenant(r.Context(), batch.TenantID)
	if err != nil {
		log.Printf("Failed to get tenant: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant info")
		return
	}

	// Get passport count first
	count, _ := h.repo.CountPassportsByBatch(r.Context(), batchID)
	if count == 0 {
		respondError(w, http.StatusNotFound, "No passports found for this batch")
		return
	}

	// Get all passports for this batch (no limit)
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	// Generate PDF with enhanced service
	pdfBuffer, err := h.pdfService.GenerateLabelSheet(batch, passports, tenant)
	if err != nil {
		log.Printf("Failed to generate PDF labels: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate PDF labels")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_labels.pdf", batch.BatchName)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", pdfBuffer.Len()))

	// Write PDF to response
	w.Write(pdfBuffer.Bytes())
}

// ExportBatchCSV handles GET /api/v1/batches/{id}/export
func (h *Handler) ExportBatchCSV(w http.ResponseWriter, r *http.Request) {
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

	// Get passport count
	count, _ := h.repo.CountPassportsByBatch(r.Context(), batchID)
	if count == 0 {
		respondError(w, http.StatusNotFound, "No passports found for this batch")
		return
	}

	// Get all passports
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		log.Printf("Failed to get passports: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	// Generate CSV
	csvBytes, err := h.csvService.ExportPassports(passports)
	if err != nil {
		log.Printf("Failed to generate CSV: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate CSV export")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_serial_export.csv", batch.BatchName)
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(csvBytes)))

	// Write CSV to response
	w.Write(csvBytes)
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

// DuplicateBatch handles POST /api/v1/batches/{id}/duplicate
func (h *Handler) DuplicateBatch(w http.ResponseWriter, r *http.Request) {
	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get original batch
	originalBatch, err := h.repo.GetBatch(r.Context(), batchID)
	if err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		log.Printf("Failed to get batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get batch")
		return
	}

	// Create new batch request with copied fields
	newBatchName := fmt.Sprintf("%s (Copy)", originalBatch.BatchName)

	// Create the batch copy
	newBatch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:         originalBatch.TenantID,
		BatchName:        newBatchName,
		Specs:            originalBatch.Specs,
		MarketRegion:     originalBatch.MarketRegion,
		PLICompliant:     originalBatch.PLICompliant,
		DomesticValueAdd: originalBatch.DomesticValueAdd,
		CellSource:       originalBatch.CellSource,
		BillOfEntryNo:    originalBatch.BillOfEntryNo,
		CountryOfOrigin:  originalBatch.CountryOfOrigin,
		CustomsDate:      originalBatch.CustomsDate,
		HSNCode:          originalBatch.HSNCode,
	})

	if err != nil {
		log.Printf("Failed to duplicate batch: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to duplicate batch")
		return
	}

	log.Printf("Batch %s duplicated to %s", batchID, newBatch.ID)
	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":      true,
		"new_batch_id": newBatch.ID,
		"batch":        newBatch,
	})
}

// parseInt is a helper to parse string to int
func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
