package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// ============================================================================
// EXTERNAL API HANDLERS (API Key Authenticated)
// ============================================================================

// ExternalCreateBatchRequest is the request for creating a batch via external API
type ExternalCreateBatchRequest struct {
	BatchName              string           `json:"batch_name"`
	ModelName              string           `json:"model_name,omitempty"`
	MarketRegion           string           `json:"market_region"`
	Specs                  models.BatchSpec `json:"specs"`
	PLICompliant           bool             `json:"pli_compliant,omitempty"`
	DomesticValueAdd       float64          `json:"domestic_value_add,omitempty"`
	CellSource             string           `json:"cell_source,omitempty"`
	BillOfEntryNo          string           `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin        string           `json:"country_of_origin,omitempty"`
	CustomsDate            string           `json:"customs_date,omitempty"`
	ManufacturingStartDate string           `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   string           `json:"manufacturing_end_date,omitempty"`
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

	// Parse manufacturing window if provided
	var manufacturingStart *time.Time
	var manufacturingEnd *time.Time
	if req.ManufacturingStartDate != "" {
		parsed, err := time.Parse("2006-01-02", req.ManufacturingStartDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid manufacturing_start_date format. Use YYYY-MM-DD")
			return
		}
		manufacturingStart = &parsed
	}
	if req.ManufacturingEndDate != "" {
		parsed, err := time.Parse("2006-01-02", req.ManufacturingEndDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid manufacturing_end_date format. Use YYYY-MM-DD")
			return
		}
		manufacturingEnd = &parsed
	}
	if manufacturingStart != nil && manufacturingEnd != nil && manufacturingEnd.Before(*manufacturingStart) {
		respondError(w, http.StatusBadRequest, "manufacturing_end_date must be on or after manufacturing_start_date")
		return
	}

	// Create batch using repository request struct
	createReq := repository.CreateBatchRequest{
		TenantID:               tenantID,
		BatchName:              req.BatchName,
		ModelName:              req.ModelName,
		Specs:                  req.Specs,
		MarketRegion:           marketRegion,
		PLICompliant:           req.PLICompliant,
		DomesticValueAdd:       req.DomesticValueAdd,
		CellSource:             req.CellSource,
		ManufacturingStartDate: manufacturingStart,
		ManufacturingEndDate:   manufacturingEnd,
		BillOfEntryNo:          req.BillOfEntryNo,
		CountryOfOrigin:        req.CountryOfOrigin,
		CustomsDate:            customsDate,
	}

	batch, err := h.repo.CreateBatch(r.Context(), createReq)
	if err != nil {
		slog.Error("External API: Failed to create batch", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create batch")
		return
	}

	slog.Info("External API: Batch created", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

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

	// Verify batch ownership (enforced at DB level)
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

	snapshot, err := services.BuildBatchSnapshot(batch, tenant)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to build batch snapshot")
		return
	}

	actor := "api"
	actorType := "SYSTEM"
	ownerIdentifier := resolveOwnerIdentifier(tenant)

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
		slog.Error("Failed to check duplicates", "error", err)
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
		if p.ManufactureDate == "" {
			respondError(w, http.StatusBadRequest, fmt.Sprintf("Passport at index %d missing manufacture_date", i))
			return
		}
		manufDate, err := time.Parse("2006-01-02", p.ManufactureDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, fmt.Sprintf("Invalid manufacture_date at index %d (expected YYYY-MM-DD)", i))
			return
		}

		now := time.Now()
		initialSoH := 100.0

		passports[i] = &models.Passport{
			UUID:                   uuid.New(),
			BatchID:                batchID,
			SerialNumber:           p.SerialNumber,
			ManufactureDate:        manufDate,
			Status:                 models.PassportStatusCreated,
			CreatedAt:              now,
			StateOfHealth:          &initialSoH,
			LastSOHUpdateTimestamp: &now,
			BatchSnapshot:          snapshot,
			CurrentOwnerIdentifier: ownerIdentifier,
		}
		if history, err := services.BuildInitialOwnershipHistory(ownerIdentifier, actor, "API", passports[i].CreatedAt); err == nil {
			passports[i].OwnershipHistory = history
		}
	}

	events, err := h.lifecycleService.BuildLifecycleEvents(passports, models.PassportEventCreated, actor, actorType, "API")
	if err != nil {
		slog.Error("External API: Failed to build genesis events", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create audit events")
		return
	}

	created, err := h.repo.CreatePassportsWithEvents(r.Context(), passports, events)
	if err != nil {
		slog.Error("External API: Failed to create passports with audit events", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create passports")
		return
	}

	slog.Info("External API: Passports created", "count", created, "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])

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

	// Verify batch ownership (enforced at DB level)
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
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

	// Parse optional language for label translations
	lang := services.NormalizeLang(r.URL.Query().Get("lang"))

	// Generate PDF
	pdfBuffer, err := h.pdfService.GenerateLabelSheet(batch, passports, tenant, lang)
	if err != nil {
		slog.Error("External API: Failed to generate labels", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate labels")
		return
	}

	// Send PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s-labels.pdf\"", batch.BatchName))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", pdfBuffer.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBuffer.Bytes())

	slog.Info("External API: Labels downloaded", "batch_name", batch.BatchName, "tenant", tenantIDStr[:8])
}

// ExternalTransitionPassportRequest is the body for an API-key-authenticated transition
type ExternalTransitionPassportRequest struct {
	Action   string          `json:"action"`
	Evidence models.Evidence `json:"evidence,omitempty"`
}

// ExternalTransitionPassport handles POST /api/v1/external/passports/{uuid}/transition
// Allows supply-chain partners (logistics, technicians, recyclers) to perform lifecycle
// transitions using their write-scoped API key. The role on the API key determines which
// actions the key is permitted to execute — matching the same AllowedRolesByAction matrix
// used by magic-link and JWT-authenticated transitions.
func (h *Handler) ExternalTransitionPassport(w http.ResponseWriter, r *http.Request) {
	passportIDStr := r.PathValue("uuid")
	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		return
	}

	// Resolve tenant from API key context
	tenantIDStr := middleware.GetAPIKeyTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	// Resolve role from API key context
	roleStr := middleware.GetAPIKeyRole(r.Context())
	if roleStr == "" {
		respondError(w, http.StatusForbidden, "This API key has no lifecycle role assigned. Set role=LOGISTICS|TECHNICIAN|RECYCLER when creating the key.")
		return
	}
	actorRole := models.ActorRole(roleStr)
	if !models.IsValidActorRole(actorRole) {
		respondError(w, http.StatusForbidden, "API key role is not a valid lifecycle role")
		return
	}

	var req ExternalTransitionPassportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}

	// Verify the passport belongs to this tenant
	if err := h.lifecycleService.VerifyPassportTenantOwnership(r.Context(), passportID, tenantID); err != nil {
		respondError(w, http.StatusForbidden, "Passport not found")
		return
	}

	actorContext := models.ActorContext{
		ActorType: models.ActorTypeExternal,
		ActorID:   middleware.GetAPIKeyTenantID(r.Context()), // tenant as actor ID for API key calls
		ActorRole: actorRole,
		Source:    models.ActionSourceAPIKey,
	}

	result, err := h.lifecycleService.ApplyTransition(r.Context(), services.TransitionRequest{
		PassportID:   passportID,
		Action:       req.Action,
		ActorContext: actorContext,
		IPAddress:    getRequestIP(r),
		Evidence:     req.Evidence,
	})
	if err != nil {
		switch {
		case isNotFoundErr(err):
			respondError(w, http.StatusNotFound, result.Error)
		case isConflictErr(err):
			respondError(w, http.StatusConflict, result.Error)
		case isForbiddenErr(err):
			respondError(w, http.StatusForbidden, result.Error)
		default:
			respondError(w, http.StatusBadRequest, result.Error)
		}
		return
	}

	slog.Info("External API: passport transitioned",
		"passport_id", passportID,
		"action", req.Action,
		"role", roleStr,
		"tenant", tenantIDStr[:8],
	)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"passport_id":     passportID,
		"action":          result.Action,
		"previous_status": result.PreviousStatus,
		"new_status":      result.NewStatus,
		"event_id":        result.EventID,
	})
}
