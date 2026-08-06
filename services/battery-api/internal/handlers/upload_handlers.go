package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// UploadCSV handles POST /api/v1/batches/{id}/upload
func (h *Handler) UploadCSV(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

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

	// Verify batch exists and belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Enforce draft or active status before passport creation
	if batch.Status != models.BatchStatusActive && batch.Status != models.BatchStatusDraft {
		respondError(w, http.StatusForbidden, "Batch must be DRAFT or ACTIVE before creating passports")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	// P-06: multipart memory cap must not exceed global MaxBytesReader (10MB)
	if !parseMultipartForm(w, r, limits.MaxCSVUploadBytes) {
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	slog.Info("File received", "filename", header.Filename, "size", header.Size)

	// Parse CSV
	parseResult, err := h.csvService.ParseCSV(file, batchID, header.Filename)
	if err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("CSV parsing error: %v", err))
		return
	}

	// Fetch component tree for BOM embedding in passport snapshot (EU Art 77)
	componentTree, _ := h.repo.GetComponentTreeByBatch(r.Context(), batchID, tenantID)
	batch.Specs.Components = convertComponentTree(componentTree)

	// Embed batch snapshot into each passport for auditability
	snapshot, err := services.BuildBatchSnapshot(batch, tenant)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to build batch snapshot")
		return
	}

	actor := middleware.GetEmail(r.Context())
	actorType := "USER"
	if actor == "" {
		actor = "system"
		actorType = "SYSTEM"
	}
	ownerIdentifier := resolveOwnerIdentifier(tenant)

	for _, p := range parseResult.Passports {
		p.BatchSnapshot = snapshot
		p.CurrentOwnerIdentifier = ownerIdentifier
		if history, err := services.BuildInitialOwnershipHistory(ownerIdentifier, actor, "INTERNAL", p.CreatedAt); err == nil {
			p.OwnershipHistory = history
		}
	}

	// Log detected CSV metadata for audit purposes.
	// COMPLIANCE LOCK: Active batches are immutable — CSV metadata fields (DVA,
	// cell_source, country_of_origin) must be set before activation via the batch
	// creation or PATCH /batches/{id} endpoints. Retroactive mutation of an ACTIVE
	// batch would corrupt the PLI/DVA audit chain.
	if parseResult.DetectedCellSource != "" || parseResult.DetectedBillOfEntry != "" || parseResult.DetectedCountryOfOrigin != "" || parseResult.DetectedDomesticValue != nil {
		slog.Info("CSV metadata fields detected but not applied (batch is ACTIVE — immutable)",
			"batch_id", batchID,
			"cell_source", parseResult.DetectedCellSource,
			"country_of_origin", parseResult.DetectedCountryOfOrigin,
			"domestic_value_add", parseResult.DetectedDomesticValue,
		)
	}

	// Check for parsing errors
	if len(parseResult.Errors) > 0 && len(parseResult.Passports) == 0 {
		respondJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":  "All rows failed validation",
			"errors": parseResult.Errors,
		})
		return
	}

	events, err := h.lifecycleService.BuildLifecycleEvents(parseResult.Passports, models.PassportEventImported, actor, actorType, "INTERNAL")
	if err != nil {
		slog.Error("Failed to build genesis events", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create audit events")
		return
	}

	// Deduct quota balance if batch is ACTIVE (draft batches are metered at activation)
	if batch.Status == models.BatchStatusActive {
		balance, err := h.repo.GetQuotaBalance(r.Context(), tenantID)
		if err != nil {
			slog.Error("UploadCSV: failed to get quota balance", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to check quota balance")
			return
		}
		if balance < len(parseResult.Passports) {
			respondError(w, http.StatusPaymentRequired, fmt.Sprintf("Insufficient quota. Upload requires %d slots, but you only have %d remaining.", len(parseResult.Passports), balance))
			return
		}
		if err := h.repo.DeductQuota(r.Context(), tenantID, len(parseResult.Passports)); err != nil {
			slog.Error("UploadCSV: failed to deduct quota", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to process quota deduction")
			return
		}
	}

	// Bulk insert passports and genesis events atomically
	insertedCount, err := h.repo.CreatePassportsWithEvents(r.Context(), parseResult.Passports, events)
	if err != nil {
		slog.Error("Failed to insert passports with audit events", "error", err)
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

	// Verify batch exists and belongs to tenant
	_, err = h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	if !parseMultipartForm(w, r, limits.MaxCSVUploadBytes) {
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	slog.Info("Validating file", "filename", header.Filename, "size", header.Size)

	// Parse CSV (validate only, don't persist)
	parseResult, err := h.csvService.ParseCSV(file, batchID, header.Filename)
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
	// Get market_region from query param to provide appropriate sample
	marketRegion := r.URL.Query().Get("market")

	var sampleCSV string

	if marketRegion == "INDIA" {
		// India-specific sample with BPAN format and optional import fields
		sampleCSV = `serial_number,manufacture_date,cell_source,bill_of_entry_no,country_of_origin,domestic_value_add
IN-MFG-LFP-2026-00001,2026-01-15,DOMESTIC,,,65.5
IN-MFG-LFP-2026-00002,2026-01-15,DOMESTIC,,,65.5
IN-MFG-NMC-2026-00003,2026-01-16,IMPORTED,BOE-2026-1234,China,0
IN-MFG-NMC-2026-00004,2026-01-16,IMPORTED,BOE-2026-1234,South Korea,0
IN-MFG-LFP-2026-00005,2026-01-17,DOMESTIC,,,72.0`
	} else if marketRegion == "EU" {
		// EU-specific sample with BPAN V2 format
		sampleCSV = `serial_number,manufacture_date
EU-MFG-NMC-2026-00001,2026-01-15
EU-MFG-NMC-2026-00002,2026-01-15
EU-MFG-LFP-2026-00003,2026-01-16
EU-MFG-LFP-2026-00004,2026-01-16
EU-MFG-NMC-2026-00005,2026-01-17`
	} else {
		// Generic sample with BPAN V2 format
		sampleCSV = `serial_number,manufacture_date,cell_source,bill_of_entry_no,country_of_origin,domestic_value_add
GL-MFG-LFP-2026-00001,2026-01-15,,,,
GL-MFG-LFP-2026-00002,2026-01-15,,,,
GL-MFG-NMC-2026-00003,2026-01-16,,,,
GL-MFG-NMC-2026-00004,2026-01-16,,,,
GL-MFG-LFP-2026-00005,2026-01-17,,,,`
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"sample_passports.csv\"")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(sampleCSV))
}

// AutoGeneratePassports handles POST /api/v1/batches/{id}/auto-generate
// Generates BPAN V2 serial numbers with region/chemistry encoding and atomic DB sequences.
func (h *Handler) AutoGeneratePassports(w http.ResponseWriter, r *http.Request) {
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

	// Verify batch exists and belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Enforce draft or active status before passport generation
	if batch.Status != models.BatchStatusActive && batch.Status != models.BatchStatusDraft {
		respondError(w, http.StatusForbidden, "Batch must be DRAFT or ACTIVE before generating passports")
		return
	}

	// Get tenant details for batch snapshot and manufacturer code
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		slog.Error("AutoGenerate: failed to retrieve tenant", "tenant_id", tenantID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	// Parse request body
	var req struct {
		Count           int    `json:"count"`
		Prefix          string `json:"prefix"`       // Legacy field, ignored if batch has region
		StartNumber     int    `json:"start_number"` // Legacy field, ignored with V2
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

	// Deduct quota balance if batch is ACTIVE (draft batches are metered at activation)
	if batch.Status == models.BatchStatusActive {
		balance, err := h.repo.GetQuotaBalance(r.Context(), tenantID)
		if err != nil {
			slog.Error("AutoGenerate: failed to get quota balance", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to check quota balance")
			return
		}
		if balance < req.Count {
			respondError(w, http.StatusPaymentRequired, fmt.Sprintf("Insufficient quota. Generation requires %d slots, but you only have %d remaining.", req.Count, balance))
			return
		}
		if err := h.repo.DeductQuota(r.Context(), tenantID, req.Count); err != nil {
			slog.Error("AutoGenerate: failed to deduct quota", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to process quota deduction")
			return
		}
	}

	// Parse manufacture date (required)
	if req.ManufactureDate == "" {
		respondError(w, http.StatusBadRequest, "manufacture_date is required (YYYY-MM-DD)")
		return
	}
	manufactureDate, err := time.Parse("2006-01-02", req.ManufactureDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid manufacture_date format (expected YYYY-MM-DD)")
		return
	}

	// Fetch component tree for BOM embedding in passport snapshot (EU Art 77)
	componentTree, _ := h.repo.GetComponentTreeByBatch(r.Context(), batchID, tenantID)
	batch.Specs.Components = convertComponentTree(componentTree)

	// Build batch snapshot for auditability
	snapshot, err := services.BuildBatchSnapshot(batch, tenant)
	if err != nil {
		slog.Error("AutoGenerate: failed to build batch snapshot", "batch_id", batchID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to build batch snapshot")
		return
	}

	actor := middleware.GetEmail(r.Context())
	actorType := "USER"
	if actor == "" {
		actor = "system"
		actorType = "SYSTEM"
	}
	ownerIdentifier := resolveOwnerIdentifier(tenant)

	// ================================================================
	// BPAN V2: Build prefix from batch region + tenant + chemistry
	// ================================================================
	regionPrefix := services.MapRegionPrefix(batch.MarketRegion)
	year := time.Now().Year()

	// Get or derive manufacturer code from tenant
	mfrCode, err := h.repo.GetOrCreateManufacturerCode(r.Context(), tenantID, tenant.CompanyName)
	if err != nil {
		slog.Warn("Failed to get manufacturer code, using fallback", "error", err)
		mfrCode = services.DeriveManufacturerCode(tenant.CompanyName)
	}

	// Product-aware code segment: chemistry for batteries, generic code for others.
	var productCode string
	if batch.ProductType == models.ProductTypeBattery {
		productCode = services.MapChemistryCode(batch.Specs.Chemistry)

		// Prefer MoRTH-registered manufacturer code when set in profile.
		// Treat "TBC" (and blank) as unset — fall back to the derived code so
		// passports are not stamped with a placeholder manufacturer segment.
		morthCode := strings.TrimSpace(tenant.BatteryProfile.MorthManufacturerCode)
		if morthCode != "" && morthCode != "TBC" {
			mfrCode = morthCode
			slog.Info("Using MoRTH manufacturer code for BPAN", "morth_code", mfrCode)
		}
	} else {
		// Non-battery products use a generic product-type code.
		switch batch.ProductType {
		case models.ProductTypeElectronics:
			productCode = "ELE"
		default:
			productCode = "GEN"
		}
	}

	bpanPrefix := services.BuildBPANPrefix(regionPrefix, mfrCode, productCode, year)

	// Atomically reserve a batch of sequence numbers
	slog.Info("AutoGenerate: reserving sequences", "prefix", bpanPrefix, "count", req.Count)
	startSeq, err := h.repo.NextSequenceBatch(r.Context(), bpanPrefix, req.Count)
	if err != nil {
		slog.Error("AutoGenerate: failed to reserve BPAN sequences", "prefix", bpanPrefix, "count", req.Count, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate serial numbers")
		return
	}

	// Generate passports with BPAN V2 serials
	passports := make([]*models.Passport, req.Count)
	for i := 0; i < req.Count; i++ {
		serialNumber := services.GenerateBPANv2(bpanPrefix, startSeq+i)
		passports[i] = &models.Passport{
			UUID:                   uuid.New(),
			BatchID:                batchID,
			SerialNumber:           serialNumber,
			ManufactureDate:        manufactureDate,
			Status:                 models.PassportStatusCreated,
			CreatedAt:              time.Now(),
			BatchSnapshot:          snapshot,
			CurrentOwnerIdentifier: ownerIdentifier,
		}
		if history, err := services.BuildInitialOwnershipHistory(ownerIdentifier, actor, "INTERNAL", passports[i].CreatedAt); err == nil {
			passports[i].OwnershipHistory = history
		}
	}

	events, err := h.lifecycleService.BuildLifecycleEvents(passports, models.PassportEventCreated, actor, actorType, "INTERNAL")
	if err != nil {
		slog.Error("Failed to build genesis events for auto-generated passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create audit events")
		return
	}

	// Bulk insert passports and genesis events atomically
	slog.Info("AutoGenerate: inserting passports", "count", len(passports), "batch_id", batchID)
	insertedCount, err := h.repo.CreatePassportsWithEvents(r.Context(), passports, events)
	if err != nil {
		slog.Error("AutoGenerate: failed to insert passports", "count", len(passports), "batch_id", batchID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate passports")
		return
	}

	firstSerial := services.GenerateBPANv2(bpanPrefix, startSeq)
	lastSerial := services.GenerateBPANv2(bpanPrefix, startSeq+req.Count-1)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"batch_id":          batchID,
		"batch_name":        batch.BatchName,
		"passports_created": insertedCount,
		"serial_range":      fmt.Sprintf("%s to %s", firstSerial, lastSerial),
		"bpan_version":      "V2",
		"bpan_prefix":       bpanPrefix,
		"qr_codes_ready":    true,
	})
}

func resolveOwnerIdentifier(tenant *models.Tenant) string {
	if tenant == nil {
		return ""
	}
	if tenant.CompanyName != "" {
		return tenant.CompanyName
	}
	if tenant.SupportEmail != "" {
		return tenant.SupportEmail
	}
	return tenant.ID.String()
}
