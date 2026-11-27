package handlers

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

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
// Deletes only an empty draft without passport, quota or traceability history.
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

	batchName, err := h.repo.DeleteEmptyDraftBatch(r.Context(), batchID, tenantID)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	case errors.Is(err, repository.ErrBatchHasLotAssignments):
		respondError(w, http.StatusForbidden, "This draft has component lot assignments and cannot be deleted.")
		return
	case errors.Is(err, repository.ErrBatchNotEmptyDraft):
		respondError(w, http.StatusForbidden, "Only draft batches without passport or quota history can be deleted. Reload to see the current batch state.")
		return
	case err != nil:
		slog.Error("Failed to delete draft batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete draft batch")
		return
	}

	slog.Info("Deleted draft batch", "batch_id", batchID, "tenant_id", tenantID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"batch_name": batchName,
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

	type importError struct {
		Row     int    `json:"row"`
		Field   string `json:"field,omitempty"`
		Message string `json:"message"`
	}

	var created, failed int
	rowErrors := []importError{}

	const maxRows = 500
	rowNum := 1 // header is row 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			rowErrors = append(rowErrors, importError{Row: rowNum + 1, Message: "CSV parse error: " + err.Error()})
			failed++
			rowNum++
			continue
		}
		rowNum++

		if rowNum > maxRows+1 {
			rowErrors = append(rowErrors, importError{Row: rowNum, Message: fmt.Sprintf("Exceeded maximum row limit (%d)", maxRows)})
			failed++
			break
		}

		batchName := strings.TrimSpace(record[batchNameIdx])
		modelName := strings.TrimSpace(record[modelNameIdx])
		if batchName == "" || modelName == "" {
			rowErrors = append(rowErrors, importError{Row: rowNum, Message: "batch_name and model_name are required"})
			failed++
			continue
		}

		get := func(column string) string {
			idx, ok := headerMap[column]
			if !ok || idx >= len(record) {
				return ""
			}
			return strings.TrimSpace(record[idx])
		}

		getFloat := func(column string) float64 {
			s := get(column)
			if s == "" {
				return 0
			}
			v, _ := strconv.ParseFloat(s, 64)
			return v
		}

		getBool := func(column string) bool {
			s := strings.ToLower(get(column))
			return s == "true" || s == "1" || s == "yes"
		}

		marketRegion := models.MarketRegion(get("market_region"))
		if marketRegion == "" {
			marketRegion = defaultMarket
		}
		if !marketRegion.IsValid() {
			rowErrors = append(rowErrors, importError{Row: rowNum, Message: fmt.Sprintf("Invalid market_region: %s", marketRegion)})
			failed++
			continue
		}

		var mfgStart, mfgEnd *time.Time
		if s := get("manufacturing_start_date"); s != "" {
			if t, err := time.Parse("2006-01-02", s); err == nil {
				mfgStart = &t
			}
		}
		if s := get("manufacturing_end_date"); s != "" {
			if t, err := time.Parse("2006-01-02", s); err == nil {
				mfgEnd = &t
			}
		}

		specs := models.BatchSpec{
			Chemistry:             get("chemistry"),
			NominalVoltage:        get("voltage"),
			Capacity:              get("capacity"),
			Manufacturer:          get("manufacturer"),
			Weight:                get("weight"),
			CountryOfOrigin:       get("country_of_origin"),
			LotSize:               get("lot_size"),
			ProductionStage:       get("production_stage"),
			CellSource:            get("cell_source"),
			HSNCode:               get("hsn_code"),
			BISNumber:             get("bis_number"),
			EPRNumber:             get("epr_number"),
			BillOfEntryNo:         get("bill_of_entry_no"),
			CustomsDate:           get("customs_date"),
			SalePriceINR:          getFloat("sale_price_inr"),
			ImportCostINR:         getFloat("import_cost_inr"),
			CellCostDomesticINR:   getFloat("cell_cost_domestic_inr"),
			CellCostImportedINR:   getFloat("cell_cost_imported_inr"),
			BMSCostDomesticINR:    getFloat("bms_cost_domestic_inr"),
			BMSCostImportedINR:    getFloat("bms_cost_imported_inr"),
			CasingCostDomesticINR: getFloat("casing_cost_domestic_inr"),
			CasingCostImportedINR: getFloat("casing_cost_imported_inr"),
			LabourOverheadCostINR: getFloat("labour_overhead_cost_inr"),
			DomesticValueAdd:      getFloat("domestic_value_add"),
			BatteryCategory:       models.BatteryCategory(get("battery_category")),
		}

		createReq := models.CreateBatchRequest{
			TenantID:     tenantID,
			BatchName:    batchName,
			ModelName:    modelName,
			ProductType:  jwtProductType,
			Specs:        specs,
			MarketRegion: marketRegion,
			PLICompliant: getBool("pli_compliant"),
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
				rowErrors = append(rowErrors, importError{Row: rowNum, Message: "validation failed"})
			} else {
				for _, ve := range validation.Errors {
					rowErrors = append(rowErrors, importError{
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
		domesticValueAdd := getFloat("domestic_value_add")
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
			rowErrors = append(rowErrors, importError{Row: rowNum, Message: "DB error: " + err.Error()})
			failed++
			continue
		}

		created++
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"total":   created + failed,
		"created": created,
		"failed":  failed,
		"errors":  rowErrors,
	})
}
