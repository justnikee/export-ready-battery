package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

// ============================================================================
// BULK OPERATIONS HANDLERS
// ============================================================================

// BulkUpdateStatusRequest is the request body for bulk status update
type BulkUpdateStatusRequest struct {
	PassportIDs []string `json:"passport_ids"`
	Status      string   `json:"status"`
}

// BulkDeleteRequest is the request body for bulk delete
type BulkDeleteRequest struct {
	PassportIDs []string `json:"passport_ids"`
}

// BulkUpdateStatus handles POST /api/v1/passports/bulk/status
//
// COMPLIANCE LOCK: Direct status mutation is permanently disabled.
// All passport state changes must go through POST /passports/bulk/transition,
// which enforces: actor authentication, state-machine validation, evidence
// capture, and an immutable hash-chained audit event per passport.
// Bypassing this via a raw status write would corrupt the audit chain.
func (h *Handler) BulkUpdateStatus(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Bulk status updates are disabled. Use POST /passports/bulk/transition to preserve audit events.")
}

// BulkDeletePassports handles POST /api/v1/passports/bulk/delete
//
// COMPLIANCE LOCK: Passport deletion is permanently disabled.
// Passports are immutable compliance records. To correct data:
//   - Use PATCH /passports/{id} for metadata corrections.
//   - Use POST /batches/{id}/archive to retire an erroneous batch.
//   - Use POST /passports/{id}/transition action=recall to remove from service.
func (h *Handler) BulkDeletePassports(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Passport deletion is not permitted. Passports are immutable compliance records.")
}

// DeleteBatch handles DELETE /api/v1/batches/{id}
//
// COMPLIANCE LOCK: Batch deletion is permanently disabled.
// Use POST /batches/{id}/archive to retire a batch while preserving passport records.
func (h *Handler) DeleteBatch(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusForbidden,
		"Batch deletion is not permitted. Use POST /batches/{id}/archive instead.")
}

// formatMessage creates a message like "500 passports updated"
func formatMessage(count int, noun string, verb string) string {
	suffix := "s"
	if count == 1 {
		suffix = ""
	}

	if verb == "" {
		return strconv.Itoa(count) + " " + noun + suffix
	}
	return strconv.Itoa(count) + " " + noun + suffix + " " + verb
}

// ArchiveBatch handles POST /api/v1/batches/{id}/archive
// Archives an ACTIVE batch - compliance-safe alternative to deletion
func (h *Handler) ArchiveBatch(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Get tenant ID for authorization
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Verify batch belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Only ACTIVE batches can be archived
	if batch.Status != "ACTIVE" {
		respondError(w, http.StatusBadRequest, "Only ACTIVE batches can be archived. Current status: "+batch.Status)
		return
	}

	// Set batch status to ARCHIVED
	err = h.repo.SetBatchStatus(r.Context(), batchID, "ARCHIVED")
	if err != nil {
		slog.Error("Failed to archive batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to archive batch")
		return
	}

	slog.Info("Archived batch", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"batch_name": batch.BatchName,
		"status":     "ARCHIVED",
		"message":    "Batch archived successfully. It remains available for audit and compliance purposes.",
	})
}

// DeleteDraftBatch handles DELETE /api/v1/batches/{id}/draft
// Only allows deletion of DRAFT batches with no passports
func (h *Handler) DeleteDraftBatch(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Get tenant ID for authorization
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Verify batch belongs to tenant
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Only DRAFT batches can be deleted
	if batch.Status != "DRAFT" {
		respondError(w, http.StatusForbidden, "Only DRAFT batches can be deleted. Use archive for ACTIVE batches.")
		return
	}

	// Check if batch has any passports
	if batch.TotalPassports > 0 {
		respondError(w, http.StatusForbidden, "Cannot delete batch with existing passports. Remove passports first or archive the batch.")
		return
	}

	// Safe to hard delete - no legal artifacts created
	_, err = h.repo.DeleteBatchWithPassports(r.Context(), batchID)
	if err != nil {
		slog.Error("Failed to delete draft batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete draft batch")
		return
	}

	slog.Info("Deleted draft batch", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"batch_name": batch.BatchName,
		"message":    "Draft batch deleted successfully.",
	})
}

// ListPassports handles GET /api/v1/passports
// Returns a tenant-scoped passport list for the lifecycle dashboard.
// Query params: status, search, batch_id, limit, offset
func (h *Handler) ListPassports(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	q := r.URL.Query()
	status := q.Get("status")
	search := q.Get("search")
	batchID := q.Get("batch_id")

	// P-02: was capped at 500; project max list page size is 200
	limit := ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	offset := ParseQueryOffset(r)

	items, total, err := h.repo.ListPassportsByTenant(r.Context(), tenantID, status, search, batchID, models.ProductType(middleware.GetProductType(r.Context())), limit, offset)
	if err != nil {
		slog.Error("Failed to list passports", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list passports")
		return
	}

	if items == nil {
		items = []*repository.PassportListItem{}
	}

	statusCounts, err := h.repo.GetPassportStatusCounts(r.Context(), tenantID, batchID)
	if err != nil {
		slog.Error("Failed to get passport status counts", "error", err)
		statusCounts = map[string]int{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passports":     items,
		"total":         total,
		"status_counts": statusCounts,
	})
}

// BulkImportBatches handles POST /api/v1/batches/bulk-import
// Accepts multipart/form-data with a CSV file containing batch definitions.
// Returns a summary with created count, failed count, and per-row errors.
func (h *Handler) BulkImportBatches(w http.ResponseWriter, r *http.Request) {
	jwtTenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(jwtTenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	jwtProductType := models.ProductType(middleware.GetProductType(r.Context()))

	// Default market for rows that omit market_region. Derive it from the
	// tenant's primary market (matching the creation wizard) rather than GLOBAL,
	// which is no longer offered for new batches. "both"/unset -> INDIA.
	defaultMarket := models.MarketRegionIndia
	tenant, terr := h.repo.GetTenant(r.Context(), tenantID)
	if terr != nil {
		slog.Error("BulkImport: failed to load tenant", "error", terr)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}
	if len(tenant.DataVisibility) > 0 {
		var dv struct {
			PrimaryMarket string `json:"primary_market"`
		}
		if json.Unmarshal(tenant.DataVisibility, &dv) == nil && dv.PrimaryMarket == "eu" {
			defaultMarket = models.MarketRegionEU
		}
	}

	// P-06: multipart memory ≤ global 10MB body limit (was 32MB)
	if !parseMultipartForm(w, r, limits.MaxCSVUploadBytes) {
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "CSV file required (form field: file)")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		respondError(w, http.StatusBadRequest, "Failed to read CSV header: "+err.Error())
		return
	}
	if len(header) > 0 {
		header[0] = strings.TrimPrefix(header[0], "\ufeff")
	}

	headerMap := make(map[string]int)
	for i, h := range header {
		headerMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// Required columns
	batchNameIdx, hasBatchName := headerMap["batch_name"]
	modelNameIdx, hasModelName := headerMap["model_name"]
	if !hasBatchName || !hasModelName {
		respondError(w, http.StatusBadRequest, "CSV must have 'batch_name' and 'model_name' columns")
		return
	}

	// Optional column indices
	idx := func(name string) (int, bool) {
		i, ok := headerMap[name]
		return i, ok
	}
	chemistryIdx, _ := idx("chemistry")
	voltageIdx, _ := idx("voltage")
	capacityIdx, _ := idx("capacity")
	manufacturerIdx, _ := idx("manufacturer")
	weightIdx, _ := idx("weight")
	countryOfOriginIdx, _ := idx("country_of_origin")
	marketRegionIdx, _ := idx("market_region")
	cellSourceIdx, _ := idx("cell_source")
	lotSizeIdx, _ := idx("lot_size")
	productionStageIdx, _ := idx("production_stage")
	hsnCodeIdx, _ := idx("hsn_code")
	bisNumberIdx, _ := idx("bis_number")
	eprNumberIdx, _ := idx("epr_number")
	billOfEntryIdx, _ := idx("bill_of_entry_no")
	customsDateIdx, _ := idx("customs_date")
	salePriceIdx, _ := idx("sale_price_inr")
	importCostIdx, _ := idx("import_cost_inr")
	cellCostDomesticIdx, _ := idx("cell_cost_domestic_inr")
	cellCostImportedIdx, _ := idx("cell_cost_imported_inr")
	bmsCostDomesticIdx, _ := idx("bms_cost_domestic_inr")
	bmsCostImportedIdx, _ := idx("bms_cost_imported_inr")
	casingCostDomesticIdx, _ := idx("casing_cost_domestic_inr")
	casingCostImportedIdx, _ := idx("casing_cost_imported_inr")
	labourOverheadIdx, _ := idx("labour_overhead_cost_inr")
	pliCompliantIdx, _ := idx("pli_compliant")
	domesticValueAddIdx, _ := idx("domestic_value_add")
	batteryCategoryIdx, _ := idx("battery_category")
	mfgStartIdx, _ := idx("manufacturing_start_date")
	mfgEndIdx, _ := idx("manufacturing_end_date")

	type importError struct {
		Row     int    `json:"row"`
		Field   string `json:"field,omitempty"`
		Message string `json:"message"`
	}

	var (
		created int
		failed  int
		errors  []importError
	)

	const maxRows = 500
	rowNum := 1 // header is row 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			errors = append(errors, importError{Row: rowNum + 1, Message: "CSV parse error: " + err.Error()})
			failed++
			rowNum++
			continue
		}
		rowNum++

		if rowNum > maxRows+1 {
			errors = append(errors, importError{Row: rowNum, Message: fmt.Sprintf("Exceeded maximum row limit (%d)", maxRows)})
			failed++
			break
		}

		batchName := strings.TrimSpace(record[batchNameIdx])
		modelName := strings.TrimSpace(record[modelNameIdx])
		if batchName == "" || modelName == "" {
			errors = append(errors, importError{Row: rowNum, Message: "batch_name and model_name are required"})
			failed++
			continue
		}

		get := func(idx int, has bool) string {
			if !has || idx >= len(record) {
				return ""
			}
			return strings.TrimSpace(record[idx])
		}

		getFloat := func(idx int, has bool) float64 {
			s := get(idx, has)
			if s == "" {
				return 0
			}
			v, _ := strconv.ParseFloat(s, 64)
			return v
		}

		getBool := func(idx int, has bool) bool {
			s := strings.ToLower(get(idx, has))
			return s == "true" || s == "1" || s == "yes"
		}

		marketRegion := models.MarketRegion(get(marketRegionIdx, marketRegionIdx >= 0))
		if marketRegion == "" {
			marketRegion = defaultMarket
		}
		if !marketRegion.IsValid() {
			errors = append(errors, importError{Row: rowNum, Message: fmt.Sprintf("Invalid market_region: %s", marketRegion)})
			failed++
			continue
		}

		var mfgStart, mfgEnd *time.Time
		if s := get(mfgStartIdx, mfgStartIdx >= 0); s != "" {
			if t, err := time.Parse("2006-01-02", s); err == nil {
				mfgStart = &t
			}
		}
		if s := get(mfgEndIdx, mfgEndIdx >= 0); s != "" {
			if t, err := time.Parse("2006-01-02", s); err == nil {
				mfgEnd = &t
			}
		}

		specs := models.BatchSpec{
			Chemistry:             get(chemistryIdx, chemistryIdx >= 0),
			NominalVoltage:        get(voltageIdx, voltageIdx >= 0),
			Capacity:              get(capacityIdx, capacityIdx >= 0),
			Manufacturer:          get(manufacturerIdx, manufacturerIdx >= 0),
			Weight:                get(weightIdx, weightIdx >= 0),
			CountryOfOrigin:       get(countryOfOriginIdx, countryOfOriginIdx >= 0),
			LotSize:               get(lotSizeIdx, lotSizeIdx >= 0),
			ProductionStage:       get(productionStageIdx, productionStageIdx >= 0),
			CellSource:            get(cellSourceIdx, cellSourceIdx >= 0),
			HSNCode:               get(hsnCodeIdx, hsnCodeIdx >= 0),
			BISNumber:             get(bisNumberIdx, bisNumberIdx >= 0),
			EPRNumber:             get(eprNumberIdx, eprNumberIdx >= 0),
			BillOfEntryNo:         get(billOfEntryIdx, billOfEntryIdx >= 0),
			CustomsDate:           get(customsDateIdx, customsDateIdx >= 0),
			SalePriceINR:          getFloat(salePriceIdx, salePriceIdx >= 0),
			ImportCostINR:         getFloat(importCostIdx, importCostIdx >= 0),
			CellCostDomesticINR:   getFloat(cellCostDomesticIdx, cellCostDomesticIdx >= 0),
			CellCostImportedINR:   getFloat(cellCostImportedIdx, cellCostImportedIdx >= 0),
			BMSCostDomesticINR:    getFloat(bmsCostDomesticIdx, bmsCostDomesticIdx >= 0),
			BMSCostImportedINR:    getFloat(bmsCostImportedIdx, bmsCostImportedIdx >= 0),
			CasingCostDomesticINR: getFloat(casingCostDomesticIdx, casingCostDomesticIdx >= 0),
			CasingCostImportedINR: getFloat(casingCostImportedIdx, casingCostImportedIdx >= 0),
			LabourOverheadCostINR: getFloat(labourOverheadIdx, labourOverheadIdx >= 0),
			DomesticValueAdd:      getFloat(domesticValueAddIdx, domesticValueAddIdx >= 0),
			BatteryCategory:       models.BatteryCategory(get(batteryCategoryIdx, batteryCategoryIdx >= 0)),
		}

		createReq := models.CreateBatchRequest{
			TenantID:     tenantID,
			BatchName:    batchName,
			ModelName:    modelName,
			ProductType:  jwtProductType,
			Specs:        specs,
			MarketRegion: marketRegion,
			PLICompliant: getBool(pliCompliantIdx, pliCompliantIdx >= 0),
			// DomesticValueAdd is recomputed server-side for ESTIMATED DVA.
			DomesticValueAdd: 0,
			CellSource:       specs.CellSource,
			HSNCode:          specs.HSNCode,
			BISNumber:        specs.BISNumber,
			EPRNumber:        specs.EPRNumber,
			BillOfEntryNo:    specs.BillOfEntryNo,
			CountryOfOrigin:  specs.CountryOfOrigin,
			CustomsDate:      specs.CustomsDate,
			DVASource:        services.DVASourceEstimated,
		}
		if mfgStart != nil {
			createReq.ManufacturingStartDate = mfgStart.Format("2006-01-02")
		}
		if mfgEnd != nil {
			createReq.ManufacturingEndDate = mfgEnd.Format("2006-01-02")
		}

		// Same rules as POST /batches — never bypass BatchCreationValidator.
		validator := h.batchCreationValidator
		if validator == nil {
			validator = services.NewBatchCreationValidator(h.batchService, h.validationService, h.repo)
		}
		validation := validator.Validate(r.Context(), createReq, tenant)
		if !validation.Valid {
			if len(validation.Errors) == 0 {
				errors = append(errors, importError{Row: rowNum, Message: "validation failed"})
			} else {
				for _, ve := range validation.Errors {
					errors = append(errors, importError{
						Row:     rowNum,
						Field:   ve.Field,
						Message: ve.Message,
					})
				}
			}
			failed++
			continue
		}

		// Mirror CreateBatch India DVA recompute for ESTIMATED mode.
		domesticValueAdd := getFloat(domesticValueAddIdx, domesticValueAddIdx >= 0)
		if marketRegion == models.MarketRegionIndia && jwtProductType == models.ProductTypeBattery {
			domesticValueAdd = services.CalculateEstimatedDVA(specs)
			if createReq.CellSource == "IMPORTED" {
				domesticValueAdd = 0
				createReq.PLICompliant = false
			}
		}

		_, err = h.repo.CreateBatch(r.Context(), repository.CreateBatchRequest{
			TenantID:               tenantID,
			BatchName:              batchName,
			ModelName:              modelName,
			ProductType:            jwtProductType,
			Specs:                  specs,
			MarketRegion:           marketRegion,
			PLICompliant:           createReq.PLICompliant,
			DomesticValueAdd:       domesticValueAdd,
			ManufacturingStartDate: mfgStart,
			ManufacturingEndDate:   mfgEnd,
		})
		if err != nil {
			errors = append(errors, importError{Row: rowNum, Message: "DB error: " + err.Error()})
			failed++
			continue
		}

		created++
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"total":   created + failed,
		"created": created,
		"failed":  failed,
		"errors":  errors,
	})
}
