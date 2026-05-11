package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// sanitizeBatchName removes unsafe characters from batch names used in filenames
var unsafeCharsRe = regexp.MustCompile(`[^a-zA-Z0-9_\-\. ]`)

func sanitizeBatchName(name string) string {
	safe := unsafeCharsRe.ReplaceAllString(name, "_")
	safe = strings.TrimSpace(safe)
	if safe == "" {
		safe = "batch"
	}
	return safe
}

// Maximum passports allowed in a single PDF/QR download to prevent memory exhaustion
const maxDownloadLimit = 500

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

	// ===== PHASE 3: SCHEMA VALIDATION =====
	// Validate specs JSON against the active product schema before any further processing.
	// Returns HTTP 422 with structured field errors when required spec fields are missing.
	if h.batchService != nil {
		specsJSON, marshalErr := json.Marshal(req.Specs)
		if marshalErr != nil {
			slog.Error("Failed to marshal specs for schema validation", "error", marshalErr)
			respondError(w, http.StatusBadRequest, "Invalid specs format")
			return
		}
		// ProductType defaults to BATTERY if not set on the request
		pt := models.ProductType(req.ProductType)
		if !pt.IsValid() {
			pt = models.DefaultProductType()
		}
		validationResult, validationErr := h.batchService.ValidateSpecs(r.Context(), pt, specsJSON)
		if validationErr != nil {
			// Infrastructure failure (schema unreachable) — log and continue.
			slog.Warn("Schema validation unavailable, skipping", "error", validationErr)
		} else if !validationResult.Valid {
			respondJSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
				"error":  "Spec validation failed: required fields are missing or invalid",
				"fields": validationResult.Errors,
			})
			return
		}
	}

	// ===== DUAL-MODE VALIDATION =====

	// EU Mode: allow draft creation without full compliance (hard-block at activation)
	if req.MarketRegion == models.MarketRegionEU {
		// EU Mode: Certifications should include CE (soft warning only)
		hasCE := false
		for _, cert := range req.Specs.Certifications {
			if cert == "CE" {
				hasCE = true
				break
			}
		}
		if !hasCE {
			slog.Warn("EU batch created without CE certification")
		}
	}

	// India Mode: Validate cell_source if provided
	if req.MarketRegion == models.MarketRegionIndia {
		if req.CellSource != "" && req.CellSource != "IMPORTED" && req.CellSource != "DOMESTIC" {
			respondError(w, http.StatusBadRequest, "cell_source must be IMPORTED or DOMESTIC")
			return
		}

		// ===== SECURITY: FORCE OVERRIDES FOR IMPORTED CELLS =====
		// Prevent API manipulation of PLI flags for imported battery cells
		if req.CellSource == "IMPORTED" {
			// Force all imported cells to be PLI ineligible
			if req.PLICompliant {
				slog.Warn("SECURITY OVERRIDE: Forced PLICompliant=false for IMPORTED cells", "tenant_id", req.TenantID, "batch_name", req.BatchName)
				req.PLICompliant = false
			}

			// Force DVA to zero for imports (no domestic value addition)
			if req.DomesticValueAdd > 0 {
				slog.Warn("SECURITY OVERRIDE: Forced DomesticValueAdd=0 for IMPORTED cells", "was", req.DomesticValueAdd, "tenant_id", req.TenantID)
				req.DomesticValueAdd = 0
			}

			// Block audited DVA certificates for imported cells
			if req.AuditedDomesticValueAdd != nil {
				slog.Warn("SECURITY OVERRIDE: Blocked AuditedDVA upload for IMPORTED cells", "tenant_id", req.TenantID)
				req.AuditedDomesticValueAdd = nil
			}

			// Force DVA source to ESTIMATED (no CA audits for imports)
			if req.DVASource != "" && req.DVASource != services.DVASourceEstimated {
				slog.Warn("SECURITY OVERRIDE: Forced DVASource=ESTIMATED for IMPORTED cells", "was", req.DVASource, "tenant_id", req.TenantID)
			}
			req.DVASource = services.DVASourceEstimated
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
			slog.Info("DVA AUDITED Mode", "audited_dva", calculatedDVA)
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
			slog.Info("DVA ESTIMATED Mode", "sale_price", req.Specs.SalePriceINR, "import_cost", req.Specs.ImportCostINR, "calculated_dva", calculatedDVA)
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

			// ===== SECURITY: STRICT PLI VALIDATION FOR DOMESTIC CELLS =====
			// Enforce PLI scheme minimum DVA requirement (checked AFTER calculation)
			if req.PLICompliant {
				// PLI Scheme requires minimum 50% DVA
				if req.DomesticValueAdd < 50.0 {
					respondError(w, http.StatusBadRequest,
						fmt.Sprintf("PLI Scheme requires minimum 50%% Domestic Value Add. Calculated DVA: %.2f%%. Minimum 50%% required for PLI Benefits.", req.DomesticValueAdd))
					return
				}
				slog.Info("PLI Eligibility Check Passed", "dva", req.DomesticValueAdd, "tenant_id", req.TenantID)
			}
		}

		// PLI Compliance Validation using validation service
		if err := h.validationService.ValidatePLICompliance(req.DVASource, req.AuditedDomesticValueAdd, req.DomesticValueAdd, req.PLICompliant); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
	}

	// Fetch tenant details for validation
	tenantID := req.TenantID
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to retrieve tenant details", "tenant_id", tenantID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	// Validate IEC Code format if provided (India: 10 digits)
	if tenant.IECCode != "" {
		iecResult := h.validationService.ValidateIECCode(tenant.IECCode)
		if !iecResult.Valid {
			slog.Warn("Invalid IEC Code format", "company", tenant.CompanyName, "iec_code", tenant.IECCode, "message", iecResult.Message)
		}
	}

	// For IMPORTED cells, ensure tenant has valid IEC
	if req.MarketRegion == models.MarketRegionIndia && req.CellSource == "IMPORTED" {
		if tenant.IECCode == "" {
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

	// Parse manufacturing window if provided
	var manufacturingStart *time.Time
	var manufacturingEnd *time.Time
	if req.ManufacturingStartDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.ManufacturingStartDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid manufacturing_start_date format. Use YYYY-MM-DD")
			return
		}
		manufacturingStart = &parsedDate
	}
	if req.ManufacturingEndDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.ManufacturingEndDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid manufacturing_end_date format. Use YYYY-MM-DD")
			return
		}
		manufacturingEnd = &parsedDate
	}
	if manufacturingStart != nil && manufacturingEnd != nil && manufacturingEnd.Before(*manufacturingStart) {
		respondError(w, http.StatusBadRequest, "manufacturing_end_date must be on or after manufacturing_start_date")
		return
	}

	// Create the batch
	slog.Debug("CreateBatch", "tenant_id", req.TenantID, "batch_name", req.BatchName, "market_region", req.MarketRegion)

	batch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:               req.TenantID,
		BatchName:              req.BatchName,
		ModelName:              req.ModelName,
		Specs:                  req.Specs,
		MarketRegion:           req.MarketRegion,
		PLICompliant:           req.PLICompliant,
		DomesticValueAdd:       req.DomesticValueAdd,
		CellSource:             req.CellSource,
		ManufacturingStartDate: manufacturingStart,
		ManufacturingEndDate:   manufacturingEnd,
		BillOfEntryNo:          req.BillOfEntryNo,
		CountryOfOrigin:        req.CountryOfOrigin,
		CustomsDate:            customsDate,
		HSNCode:                req.HSNCode,
		DVASource:              req.DVASource,
		PLICertificateURL:      req.PLICertificateURL,
		BISNumber:              req.BISNumber,
		EPRNumber:              req.EPRNumber,
	})
	if err != nil {
		slog.Error("Failed to create batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create batch")
		return
	}

	respondJSON(w, http.StatusCreated, models.CreateBatchResponse{Batch: batch})
}

// ListBatches handles GET /api/v1/batches?tenant_id=xxx&page=1&limit=50
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

	// Parse pagination params
	limit := 50 // Default
	page := 1
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := parseInt(limitStr); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if parsed, err := parseInt(pageStr); err == nil && parsed > 0 {
			page = parsed
		}
	}
	offset := (page - 1) * limit

	batches, totalCount, err := h.repo.ListBatches(r.Context(), tenantID, limit, offset)
	if err != nil {
		slog.Error("Failed to list batches", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list batches")
		return
	}

	totalPages := (totalCount + limit - 1) / limit

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches":     batches,
		"count":       len(batches),
		"total":       totalCount,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
		"has_more":    page < totalPages,
	})
}

// GetBatch handles GET /api/v1/batches/{id}
func (h *Handler) GetBatch(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), id, tenantID)
	if err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		slog.Error("Failed to get batch", "error", err)
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
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get batch info for filename
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
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

	// Enforce max limit to prevent memory exhaustion
	if count > maxDownloadLimit {
		respondError(w, http.StatusBadRequest, fmt.Sprintf(
			"Batch too large for download (%d passports). Maximum is %d. Please contact support for bulk exports.",
			count, maxDownloadLimit))
		return
	}

	// Get all passports for this batch (no limit for QR download)
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		slog.Error("Failed to get passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	slog.Info("Generating QR codes", "count", len(passports), "batch_name", batch.BatchName)

	// Generate QR codes and create ZIP
	zipReader, zipSize, err := h.qrService.GenerateAndZip(passports)
	if err != nil {
		slog.Error("Failed to generate QR codes", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate QR codes")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_qrcodes.zip", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", zipSize))

	// Stream the ZIP to the response
	if _, err := io.Copy(w, zipReader); err != nil {
		slog.Error("Failed to send ZIP", "error", err)
	}
}

// DownloadLabels handles GET /api/v1/batches/{id}/labels
func (h *Handler) DownloadLabels(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get batch info for filename
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
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
		slog.Error("Failed to get tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant info")
		return
	}

	// Get passport count first
	count, _ := h.repo.CountPassportsByBatch(r.Context(), batchID)
	if count == 0 {
		respondError(w, http.StatusNotFound, "No passports found for this batch")
		return
	}

	// Enforce max limit to prevent memory exhaustion
	if count > maxDownloadLimit {
		respondError(w, http.StatusBadRequest, fmt.Sprintf(
			"Batch too large for label download (%d passports). Maximum is %d. Please contact support for bulk exports.",
			count, maxDownloadLimit))
		return
	}

	// Get all passports for this batch (no limit)
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		slog.Error("Failed to get passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	// Parse optional language parameter for label translations
	lang := services.NormalizeLang(r.URL.Query().Get("lang"))

	// Generate PDF with enhanced service
	pdfBuffer, err := h.pdfService.GenerateLabelSheet(batch, passports, tenant, lang)
	if err != nil {
		slog.Error("Failed to generate PDF labels", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate PDF labels")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_labels.pdf", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", pdfBuffer.Len()))

	// Write PDF to response
	w.Write(pdfBuffer.Bytes())
}

// ExportBatchCSV handles GET /api/v1/batches/{id}/export
func (h *Handler) ExportBatchCSV(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get batch info for filename
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
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

	// Hard block export if SHIPPED event missing (compliance)
	missingShipped, err := h.repo.CountPassportsMissingShippedEvent(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to validate shipped status")
		return
	}
	if missingShipped > 0 {
		respondError(w, http.StatusForbidden, "Export blocked: one or more passports are missing SHIPPED events")
		return
	}

	// Get all passports
	passports, err := h.repo.GetPassportsByBatch(r.Context(), batchID, count, 0)
	if err != nil {
		slog.Error("Failed to get passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve passports")
		return
	}

	// Generate CSV
	csvBytes, err := h.csvService.ExportPassports(passports)
	if err != nil {
		slog.Error("Failed to generate CSV", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate CSV export")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_serial_export.csv", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(csvBytes)))

	// Write CSV to response
	w.Write(csvBytes)
}

// ExportBatchAuditCSV handles GET /api/v1/batches/{id}/audit-export
// Downloads the full audit trail (lifecycle events) for all passports in a batch as CSV.
func (h *Handler) ExportBatchAuditCSV(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify batch ownership
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Get all audit events for this batch
	events, err := h.repo.GetEventsByBatch(r.Context(), batchID)
	if err != nil {
		slog.Error("Failed to get batch events", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve audit events")
		return
	}

	if len(events) == 0 {
		respondError(w, http.StatusNotFound, "No lifecycle events found for this batch")
		return
	}

	// Generate CSV
	csvBytes, err := h.csvService.ExportAuditEvents(events)
	if err != nil {
		slog.Error("Failed to generate audit CSV", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate audit CSV export")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_audit_log.csv", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(csvBytes)))

	w.Write(csvBytes)
}

// DownloadComplianceDeclaration handles GET /api/v1/batches/{id}/compliance-declaration
// Downloads the EU Article 7 carbon footprint declaration PDF for a batch.
func (h *Handler) DownloadComplianceDeclaration(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify batch ownership
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Carbon footprint data is required for this declaration
	if len(batch.CarbonFootprintResult) == 0 {
		respondError(w, http.StatusBadRequest, "No carbon footprint data available. Run the carbon calculator first.")
		return
	}

	// Get tenant for manufacturer details
	tenant, err := h.repo.GetTenant(r.Context(), batch.TenantID)
	if err != nil {
		slog.Error("Failed to get tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant info")
		return
	}

	// Generate PDF
	pdfBytes, err := services.GenerateComplianceDeclaration(batch, tenant)
	if err != nil {
		slog.Error("Failed to generate compliance declaration PDF", "error", err, "batch_id", batchID)
		respondError(w, http.StatusInternalServerError, "Failed to generate compliance declaration PDF")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_compliance_declaration.pdf", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))

	w.Write(pdfBytes)
}

// DownloadDueDiligenceReport handles GET /api/v1/batches/{id}/due-diligence-report
// Downloads the full due diligence report PDF for a batch.
func (h *Handler) DownloadDueDiligenceReport(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify batch ownership
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Batch must be ACTIVE to generate due diligence report
	if batch.Status != models.BatchStatusActive {
		respondError(w, http.StatusForbidden, "Batch must be activated before generating the due diligence report")
		return
	}

	// Get tenant for company details
	tenant, err := h.repo.GetTenant(r.Context(), batch.TenantID)
	if err != nil {
		slog.Error("Failed to get tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant info")
		return
	}

	// Generate PDF
	pdfBytes, err := services.GenerateDueDiligenceReport(batch, tenant)
	if err != nil {
		slog.Error("Failed to generate due diligence report PDF", "error", err, "batch_id", batchID)
		respondError(w, http.StatusInternalServerError, "Failed to generate due diligence report PDF")
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("%s_due_diligence_report.pdf", sanitizeBatchName(batch.BatchName))
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))

	w.Write(pdfBytes)
}

// GetBatchPassports handles GET /api/v1/batches/{id}/passports?page=1&limit=50
func (h *Handler) GetBatchPassports(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Verify the batch belongs to the requesting tenant (prevents IDOR)
	_, err = h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
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
		slog.Error("Failed to get passports", "error", err)
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
	// SECURITY: Extract tenant ID from JWT context to prevent IDOR
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse batch ID
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get original batch
	originalBatch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		slog.Error("Failed to get batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get batch")
		return
	}

	// Create new batch request with copied fields
	newBatchName := fmt.Sprintf("%s (Copy)", originalBatch.BatchName)

	// Create the batch copy
	newBatch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:               originalBatch.TenantID,
		BatchName:              newBatchName,
		ModelName:              originalBatch.ModelName,
		Specs:                  originalBatch.Specs,
		MarketRegion:           originalBatch.MarketRegion,
		PLICompliant:           originalBatch.PLICompliant,
		DomesticValueAdd:       originalBatch.DomesticValueAdd,
		CellSource:             originalBatch.CellSource,
		ManufacturingStartDate: originalBatch.ManufacturingStartDate,
		ManufacturingEndDate:   originalBatch.ManufacturingEndDate,
		BillOfEntryNo:          originalBatch.BillOfEntryNo,
		CountryOfOrigin:        originalBatch.CountryOfOrigin,
		CustomsDate:            originalBatch.CustomsDate,
		HSNCode:                originalBatch.HSNCode,
		DVASource:              originalBatch.DVASource,
		PLICertificateURL:      originalBatch.PLICertificateURL,
		BISNumber:              originalBatch.BISNumber,
		EPRNumber:              originalBatch.EPRNumber,
	})

	if err != nil {
		slog.Error("Failed to duplicate batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to duplicate batch")
		return
	}

	slog.Info("Batch duplicated", "original_id", batchID, "new_id", newBatch.ID)
	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":      true,
		"new_batch_id": newBatch.ID,
		"batch":        newBatch,
	})
}

// PatchBatch handles PATCH /api/v1/batches/{id}
// Allows partial updates to a DRAFT batch (specs merge + metadata fields).
// Returns 409 if the batch is not in DRAFT status.
func (h *Handler) PatchBatch(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	var req models.PatchBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.repo.PatchBatchDraft(r.Context(), batchID, tenantID, req); err != nil {
		if err.Error() == "batch not found or not a DRAFT" {
			respondError(w, http.StatusConflict, "Batch not found or cannot be edited (not a DRAFT)")
			return
		}
		slog.Error("Failed to patch batch", "batch_id", batchID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update batch")
		return
	}

	// Return updated batch
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Patch applied but failed to reload batch")
		return
	}

	slog.Info("Batch patched", "batch_id", batchID, "tenant_id", tenantID)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"batch":   batch,
	})
}

// parseInt is a helper to parse string to int
func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
