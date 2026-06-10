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

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

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

	// SECURITY: Enforce JWT tenant_id matches request body tenant_id
	jwtTenantIDStr := middleware.GetTenantID(r.Context())
	jwtTenantID, err := uuid.Parse(jwtTenantIDStr)
	if err != nil || jwtTenantID != req.TenantID {
		respondError(w, http.StatusForbidden, "tenant_id mismatch")
		return
	}

	// SECURITY: Enforce JWT product_type matches request body product_type
	jwtProductType := models.ProductType(middleware.GetProductType(r.Context()))

	// Validate product_type is supported before any other checks
	if req.ProductType != "" && !models.ProductType(req.ProductType).IsValid() {
		respondError(w, http.StatusBadRequest, "unknown or unsupported product_type")
		return
	}

	if req.ProductType != "" && models.ProductType(req.ProductType) != jwtProductType {
		respondError(w, http.StatusForbidden, "product_type mismatch")
		return
	}
	// Default to JWT product_type if not specified
	if req.ProductType == "" {
		req.ProductType = jwtProductType
	}

	// SECURITY: Enforce onboarding completion before batch creation
	if !h.checkIfOnboardingCompleted(w, r) {
		return
	}

	// Default to GLOBAL if not specified
	if req.MarketRegion == "" {
		req.MarketRegion = models.MarketRegionGlobal
	}

	// ===== BATCH CREATION VALIDATION =====
	// Run all business-rule validations through the shared validator.
	// This ensures CreateBatch and ValidateBatchCreation are always in sync.
	tenant, err := h.repo.GetTenant(r.Context(), req.TenantID)
	if err != nil {
		slog.Error("Failed to retrieve tenant details", "tenant_id", req.TenantID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	validator := h.batchCreationValidator
	if validator == nil {
		validator = services.NewBatchCreationValidator(h.batchService, h.validationService, h.repo)
	}
	validationResult := validator.Validate(r.Context(), req, tenant)
	if !validationResult.Valid {
		respondJSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"error":  "Validation failed",
			"fields": validationResult.Errors,
		})
		return
	}

	// ===== SECURITY OVERRIDES =====
	// These are server-side enforcement measures, not validation failures.
	if req.MarketRegion == models.MarketRegionIndia && req.ProductType == models.ProductTypeBattery {
		if req.CellSource == "IMPORTED" {
			if req.PLICompliant {
				slog.Warn("SECURITY OVERRIDE: Forced PLICompliant=false for IMPORTED cells", "tenant_id", req.TenantID, "batch_name", req.BatchName)
				req.PLICompliant = false
			}
			if req.DomesticValueAdd > 0 {
				slog.Warn("SECURITY OVERRIDE: Forced DomesticValueAdd=0 for IMPORTED cells", "was", req.DomesticValueAdd, "tenant_id", req.TenantID)
				req.DomesticValueAdd = 0
			}
			if req.AuditedDomesticValueAdd != nil {
				slog.Warn("SECURITY OVERRIDE: Blocked AuditedDVA upload for IMPORTED cells", "tenant_id", req.TenantID)
				req.AuditedDomesticValueAdd = nil
			}
			if req.DVASource != "" && req.DVASource != services.DVASourceEstimated {
				slog.Warn("SECURITY OVERRIDE: Forced DVASource=ESTIMATED for IMPORTED cells", "was", req.DVASource, "tenant_id", req.TenantID)
			}
			req.DVASource = services.DVASourceEstimated
		}

		// DVA calculation
		var calculatedDVA float64
		if req.DVASource == services.DVASourceAudited {
			if req.AuditedDomesticValueAdd != nil {
				calculatedDVA = *req.AuditedDomesticValueAdd
				req.DomesticValueAdd = calculatedDVA
			}
		} else {
			if req.Specs.SalePriceINR > 0 {
				calculatedDVA = ((req.Specs.SalePriceINR - req.Specs.ImportCostINR) / req.Specs.SalePriceINR) * 100
				if calculatedDVA < 0 {
					calculatedDVA = 0
				}
			}
			req.DomesticValueAdd = calculatedDVA
		}

		if req.CellSource == "IMPORTED" && req.DVASource == services.DVASourceEstimated {
			if req.Specs.SalePriceINR == 0 || req.Specs.ImportCostINR >= req.Specs.SalePriceINR {
				req.DomesticValueAdd = 0
			}
		}
	}

	// Parse dates
	var customsDate *time.Time
	if req.CustomsDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", req.CustomsDate)
		customsDate = &parsedDate
	}
	var manufacturingStart *time.Time
	var manufacturingEnd *time.Time
	if req.ManufacturingStartDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", req.ManufacturingStartDate)
		manufacturingStart = &parsedDate
	}
	if req.ManufacturingEndDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", req.ManufacturingEndDate)
		manufacturingEnd = &parsedDate
	}

	// v2: Copy battery-specific top-level fields into Specs JSONB so the
	// repository stores everything product-agnostically in one jsonb column.
	req.Specs.CellSource = req.CellSource
	req.Specs.BillOfEntryNo = req.BillOfEntryNo
	req.Specs.CountryOfOrigin = req.CountryOfOrigin
	if customsDate != nil {
		req.Specs.CustomsDate = customsDate.Format("2006-01-02")
	}
	req.Specs.HSNCode = req.HSNCode
	req.Specs.DVASource = req.DVASource
	req.Specs.AuditedDomesticValueAdd = req.AuditedDomesticValueAdd
	req.Specs.PLICertificateURL = req.PLICertificateURL
	req.Specs.BISNumber = req.BISNumber
	req.Specs.EPRNumber = req.EPRNumber

	// Create the batch
	slog.Debug("CreateBatch", "tenant_id", req.TenantID, "batch_name", req.BatchName, "market_region", req.MarketRegion)

	batch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:                    req.TenantID,
		BatchName:                   req.BatchName,
		ModelName:                   req.ModelName,
		ProductType:                 req.ProductType,
		Specs:                       req.Specs,
		MarketRegion:                req.MarketRegion,
		PLICompliant:                req.PLICompliant,
		DomesticValueAdd:            req.DomesticValueAdd,
		ManufacturingStartDate:      manufacturingStart,
		ManufacturingEndDate:        manufacturingEnd,
		CEMarking:                   req.CEMarking,
		CarbonPerformanceClass:      req.CarbonPerformanceClass,
		RemovableAndReplaceable:     req.RemovableAndReplaceable,
		NotifiedBodyNumber:          req.NotifiedBodyNumber,
		DeclarationOfConformityPath: req.DeclarationOfConformityPath,
		GTIN:                        req.Specs.GTIN,
	})
	if err != nil {
		slog.Error("Failed to create batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create batch: "+sanitizeDBError(err))
		return
	}

	respondJSON(w, http.StatusCreated, models.CreateBatchResponse{Batch: batch})
}

// ValidateBatchCreation handles POST /api/v1/batches/validate
// Runs all creation validations without touching the database.
func (h *Handler) ValidateBatchCreation(w http.ResponseWriter, r *http.Request) {
	var req models.CreateBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// SECURITY: Enforce JWT tenant_id matches request body tenant_id
	jwtTenantIDStr := middleware.GetTenantID(r.Context())
	jwtTenantID, err := uuid.Parse(jwtTenantIDStr)
	if err != nil || jwtTenantID != req.TenantID {
		respondError(w, http.StatusForbidden, "tenant_id mismatch")
		return
	}

	// SECURITY: Enforce JWT product_type matches request body product_type
	jwtProductType := models.ProductType(middleware.GetProductType(r.Context()))
	if req.ProductType != "" && models.ProductType(req.ProductType).IsValid() {
		if models.ProductType(req.ProductType) != jwtProductType {
			respondError(w, http.StatusForbidden, "product_type mismatch")
			return
		}
	} else {
		req.ProductType = jwtProductType
	}

	// SECURITY: Enforce onboarding completion before batch validation
	if !h.checkIfOnboardingCompleted(w, r) {
		return
	}

	// Fetch tenant for validation
	tenant, err := h.repo.GetTenant(r.Context(), req.TenantID)
	if err != nil {
		slog.Error("Failed to retrieve tenant details", "tenant_id", req.TenantID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	// Run validation
	validator := h.batchCreationValidator
	if validator == nil {
		validator = services.NewBatchCreationValidator(h.batchService, h.validationService, h.repo)
	}
	result := validator.Validate(r.Context(), req, tenant)

	if !result.Valid {
		respondJSON(w, http.StatusUnprocessableEntity, result)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// ListBatches handles GET /api/v1/batches?tenant_id=xxx&page=1&limit=50
func (h *Handler) ListBatches(w http.ResponseWriter, r *http.Request) {
	// SECURITY: Use JWT tenant_id as authoritative source
	jwtTenantIDStr := middleware.GetTenantID(r.Context())
	jwtTenantID, err := uuid.Parse(jwtTenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
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

	// SECURITY: Enforce product_type filter from JWT claim
	jwtProductType := models.ProductType(middleware.GetProductType(r.Context()))
	if !jwtProductType.IsValid() {
		jwtProductType = models.DefaultProductType()
	}

	// Optional filters: ?status=DRAFT|ACTIVE|ARCHIVED and ?search=<text>
	// applied in SQL so they cover all batches, not just the current page.
	status := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	switch status {
	case "DRAFT", "ACTIVE", "ARCHIVED", "":
		// valid
	default:
		respondError(w, http.StatusBadRequest, "Invalid status filter. Must be DRAFT, ACTIVE, or ARCHIVED")
		return
	}
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	if len(search) > 200 {
		search = search[:200]
	}

	batches, totalCount, err := h.repo.ListBatchesFiltered(r.Context(), jwtTenantID, jwtProductType, limit, offset, status, search)
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

	// SECURITY: Cross-product protection — verify batch product_type matches JWT claim
	jwtProductType := models.ProductType(middleware.GetProductType(r.Context()))
	if batch.ProductType != "" && batch.ProductType != jwtProductType {
		respondError(w, http.StatusForbidden, "product_type mismatch")
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

	// Generate QR codes with GS1 Digital Link support when GTIN is available
	qrCtx := &services.QRLabelContext{
		GTIN: batch.Specs.GTIN,
	}
	zipReader, zipSize, err := h.qrService.GenerateAndZipEnriched(passports, qrCtx)
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

	// Carbon footprint check: required for battery, optional for textile
	if batch.ProductType == models.ProductTypeBattery && len(batch.CarbonFootprintResult) == 0 {
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

	// Create the batch copy — preserve product type and all specs
	newBatch, err := h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
		TenantID:                    originalBatch.TenantID,
		BatchName:                   newBatchName,
		ModelName:                   originalBatch.ModelName,
		Specs:                       originalBatch.Specs,
		MarketRegion:                originalBatch.MarketRegion,
		ProductType:                 originalBatch.ProductType,
		PLICompliant:                originalBatch.PLICompliant,
		DomesticValueAdd:            originalBatch.DomesticValueAdd,
		ManufacturingStartDate:      originalBatch.ManufacturingStartDate,
		ManufacturingEndDate:        originalBatch.ManufacturingEndDate,
		CEMarking:                   originalBatch.CEMarking,
		CarbonPerformanceClass:      originalBatch.CarbonPerformanceClass,
		RemovableAndReplaceable:     originalBatch.RemovableAndReplaceable,
		NotifiedBodyNumber:          originalBatch.NotifiedBodyNumber,
		DeclarationOfConformityPath: originalBatch.DeclarationOfConformityPath,
		GTIN:                        originalBatch.GTIN,
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

// SaveCarbonFootprint handles POST /api/v1/batches/{id}/carbon
// Persists the carbon calculator result and auto-populates carbon_performance_class.
func (h *Handler) SaveCarbonFootprint(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Read raw body so we can store it verbatim and also extract carbon_class
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	defer r.Body.Close()

	// Extract carbon_class from the JSON payload
	var payload struct {
		CarbonClass string `json:"carbon_class"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := h.repo.SaveCarbonFootprintResult(r.Context(), batchID, tenantID, body, payload.CarbonClass); err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to save carbon footprint result")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":                  true,
		"carbon_performance_class": payload.CarbonClass,
	})
}

// parseInt is a helper to parse string to int
func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
