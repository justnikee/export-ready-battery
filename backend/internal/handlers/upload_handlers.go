package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

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

	// Enforce activation before passport creation
	if batch.Status != models.BatchStatusActive {
		respondError(w, http.StatusForbidden, "Batch must be ACTIVE before creating passports")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
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
	parseResult, err := h.csvService.ParseCSV(file, batchID, header.Filename)
	if err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("CSV parsing error: %v", err))
		return
	}

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

	// UPDATE BATCH METADATA IF DETECTED FROM CSV
	// Note: Once a batch is ACTIVE, it's considered immutable per design_system.md
	// We log a warning but allow updates to import fields from CSV for data enrichment
	if parseResult.DetectedCellSource != "" || parseResult.DetectedBillOfEntry != "" || parseResult.DetectedCountryOfOrigin != "" || parseResult.DetectedDomesticValue != nil {
		var cellSource, billOfEntry, countryOrigin *string
		if parseResult.DetectedCellSource != "" {
			val := parseResult.DetectedCellSource
			cellSource = &val
		}
		if parseResult.DetectedBillOfEntry != "" {
			val := parseResult.DetectedBillOfEntry
			billOfEntry = &val
		}
		if parseResult.DetectedCountryOfOrigin != "" {
			val := parseResult.DetectedCountryOfOrigin
			countryOrigin = &val
		}

		log.Printf("Detected metadata from CSV: Source=%v, Origin=%v, DVA=%v",
			parseResult.DetectedCellSource, parseResult.DetectedCountryOfOrigin, parseResult.DetectedDomesticValue)

		if err := h.repo.UpdateBatchMetadata(r.Context(), batchID, cellSource, billOfEntry, countryOrigin, parseResult.DetectedDomesticValue); err != nil {
			log.Printf("Warning: Failed to update batch metadata from CSV: %v", err)
			// Proceed with passport creation even if metadata update fails
		}
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
		log.Printf("Failed to build genesis events: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create audit events")
		return
	}

	// Bulk insert passports and genesis events atomically
	insertedCount, err := h.repo.CreatePassportsWithEvents(r.Context(), parseResult.Passports, events)
	if err != nil {
		log.Printf("Failed to insert passports with audit events: %v", err)
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

	// Get tenant details for batch snapshot and manufacturer code
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
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

	// Build batch snapshot for auditability
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

	// ================================================================
	// BPAN V2: Build prefix from batch region + tenant + chemistry
	// ================================================================
	regionPrefix := services.MapRegionPrefix(batch.MarketRegion)
	chemCode := services.MapChemistryCode(batch.Specs.Chemistry)
	year := time.Now().Year()

	// Get or derive manufacturer code from tenant
	mfrCode, err := h.repo.GetOrCreateManufacturerCode(r.Context(), tenantID, tenant.CompanyName)
	if err != nil {
		log.Printf("Warning: Failed to get manufacturer code, using fallback: %v", err)
		mfrCode = services.DeriveManufacturerCode(tenant.CompanyName)
	}

	bpanPrefix := services.BuildBPANPrefix(regionPrefix, mfrCode, chemCode, year)

	// Atomically reserve a batch of sequence numbers
	startSeq, err := h.repo.NextSequenceBatch(r.Context(), bpanPrefix, req.Count)
	if err != nil {
		log.Printf("Failed to reserve BPAN sequences: %v", err)
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
		log.Printf("Failed to build genesis events: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create audit events")
		return
	}

	// Bulk insert passports and genesis events atomically
	insertedCount, err := h.repo.CreatePassportsWithEvents(r.Context(), passports, events)
	if err != nil {
		log.Printf("Failed to insert auto-generated passports with audit events: %v", err)
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
