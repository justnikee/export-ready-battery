package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// TeamRoleResolver resolves internal user roles
type TeamRoleResolver interface {
	GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error)
}

// DocumentRepository is the narrow interface the lifecycle handler needs for
// document-to-event linkage and document listing. Satisfied by repository.RepositoryInterface.
type DocumentRepository interface {
	GetPassportDocument(ctx context.Context, id, tenantID uuid.UUID) (*repository.PassportDocument, error)
	LinkDocumentToEvent(ctx context.Context, docID, eventID uuid.UUID) error
	ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*repository.PassportDocument, error)
}

// LifecycleHandler handles passport lifecycle operations
type LifecycleHandler struct {
	service      *services.LifecycleService
	roleResolver TeamRoleResolver
	docRepo      DocumentRepository // optional — nil disables document linking
}

// WithDocRepo attaches a document repository; returns self for chaining.
func (h *LifecycleHandler) WithDocRepo(repo DocumentRepository) *LifecycleHandler {
	h.docRepo = repo
	return h
}

// NewLifecycleHandler creates a new lifecycle handler.
// Panics if roleResolver is nil — misconfiguration must fail at startup,
// not silently at the first authenticated request.
func NewLifecycleHandler(service *services.LifecycleService, roleResolver TeamRoleResolver) *LifecycleHandler {
	if roleResolver == nil {
		panic("NewLifecycleHandler: roleResolver must not be nil — all lifecycle transitions require actor role resolution")
	}
	if service == nil {
		panic("NewLifecycleHandler: service must not be nil")
	}
	return &LifecycleHandler{service: service, roleResolver: roleResolver}
}

// TransitionRequest represents a request to apply a passport lifecycle action
type LifecycleTransitionRequest struct {
	Action     string          `json:"action"`
	Actor      string          `json:"actor,omitempty"` // Who is making this change
	Evidence   models.Evidence `json:"evidence,omitempty"`
	ReasonCode string          `json:"reason_code,omitempty"` // required for ACTIVATE
	AdminNote  string          `json:"admin_note,omitempty"`  // free-text, max 500 chars
	DocumentID string          `json:"document_id,omitempty"` // optional pre-uploaded doc UUID
	// Location is populated by the frontend for INSTALL/SHIP from navigator.geolocation.
	// Best-effort — missing location never blocks a transition.
	Location *models.GeoPoint `json:"location,omitempty"`
}

func mapTeamRoleToActorRole(teamRole string) (models.ActorRole, bool) {
	switch strings.ToUpper(teamRole) {
	case "OWNER", "ADMIN":
		return models.ActorRoleAdmin, true
	case "MEMBER":
		return models.ActorRoleInternalOperator, true
	default:
		return "", false
	}
}

func (h *LifecycleHandler) resolveInternalActorRole(ctx context.Context) (models.ActorRole, int, error) {
	tenantIDStr := middleware.GetTenantID(ctx)
	if tenantIDStr == "" {
		return "", http.StatusUnauthorized, errors.New("missing tenant context")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return "", http.StatusUnauthorized, errors.New("invalid tenant context")
	}

	email := middleware.GetEmail(ctx)
	if email == "" {
		return "", http.StatusUnauthorized, errors.New("missing actor context")
	}

	if h.roleResolver == nil {
		return "", http.StatusInternalServerError, errors.New("role resolver unavailable")
	}

	var roleStr string
	member, err := h.roleResolver.GetTeamMemberByEmail(ctx, tenantID, email)
	if err == nil && member != nil {
		roleStr = member.Role
	} else {
		roleStr = middleware.GetRole(ctx)
		if roleStr == "" {
			return "", http.StatusForbidden, errors.New("role not found")
		}
	}

	internalRole, ok := mapTeamRoleToActorRole(roleStr)
	if !ok {
		return "", http.StatusForbidden, errors.New("role not permitted")
	}

	return internalRole, http.StatusOK, nil
}

func (h *LifecycleHandler) buildActorContext(ctx context.Context, action string) (models.ActorContext, int, error) {
	email := middleware.GetEmail(ctx)
	if email == "" {
		return models.ActorContext{}, http.StatusUnauthorized, errors.New("missing actor context")
	}

	internalRole, status, err := h.resolveInternalActorRole(ctx)
	if err != nil {
		return models.ActorContext{}, status, err
	}

	return models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   email,
		ActorRole: internalRole,
		Source:    models.ActionSourceInternal,
	}, http.StatusOK, nil
}

func passportIDFromPath(path string) (uuid.UUID, error) {
	pathParts := strings.Split(path, "/")
	if len(pathParts) < 5 {
		return uuid.Nil, errors.New("invalid url path")
	}
	return uuid.Parse(pathParts[4])
}

func (h *LifecycleHandler) requireOwnedPassportID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	passportID, err := passportIDFromPath(r.URL.Path)
	if err != nil {
		if strings.Contains(err.Error(), "invalid UUID") {
			respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		} else {
			respondError(w, http.StatusBadRequest, "Invalid URL path")
		}
		return uuid.Nil, false
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Missing tenant context")
		return uuid.Nil, false
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return uuid.Nil, false
	}
	if err := h.service.VerifyPassportTenantOwnership(r.Context(), passportID, tenantID); err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return uuid.Nil, false
	}

	return passportID, true
}

// TransitionPassport handles POST /api/v1/passports/{uuid}/transition
// @Summary Apply a passport lifecycle action
// @Description Apply a lifecycle action with validation and event logging
// @Tags passports
func (h *LifecycleHandler) TransitionPassport(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	// Parse request body (and reject any status-based mutation)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	for key := range raw {
		if strings.Contains(strings.ToLower(key), "status") {
			respondError(w, http.StatusBadRequest, "status fields are not allowed; use action")
			return
		}
		if strings.EqualFold(key, "metadata") {
			respondError(w, http.StatusBadRequest, "metadata is not allowed; use evidence")
			return
		}
	}

	var req LifecycleTransitionRequest
	if err := json.Unmarshal(body, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate action is provided
	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}

	actorContext, status, err := h.buildActorContext(r.Context(), req.Action)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	// --- Document attachment: validate and fetch document metadata ---
	var docID *uuid.UUID
	var docHash, docLabel string
	if req.DocumentID != "" && h.docRepo != nil {
		tenantIDStr := middleware.GetTenantID(r.Context())
		parsedDocID, parseErr := uuid.Parse(req.DocumentID)
		if parseErr != nil {
			respondError(w, http.StatusBadRequest, "invalid document_id format")
			return
		}
		tenantUUID, tenantParseErr := uuid.Parse(tenantIDStr)
		if tenantParseErr != nil {
			respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
			return
		}
		doc, fetchErr := h.docRepo.GetPassportDocument(r.Context(), parsedDocID, tenantUUID)
		if fetchErr != nil || doc == nil {
			respondError(w, http.StatusBadRequest, "document not found or not owned by tenant")
			return
		}
		if doc.PassportID != passportID {
			respondError(w, http.StatusBadRequest, "document does not belong to this passport")
			return
		}
		docID = &parsedDocID
		docHash = doc.SHA256Hash
		docLabel = doc.Label
	}

	// Execute transition
	result, err := h.service.ApplyTransition(r.Context(), services.TransitionRequest{
		PassportID:    passportID,
		Action:        req.Action,
		ActorContext:  actorContext,
		IPAddress:     getRequestIP(r),
		Evidence:      req.Evidence,
		ReasonCode:    req.ReasonCode,
		AdminNote:     req.AdminNote,
		DocumentID:    docID,
		DocumentHash:  docHash,
		DocumentLabel: docLabel,
		Location:      req.Location,
	})

	if err != nil {
		if result == nil {
			respondError(w, http.StatusInternalServerError, "Internal error during transition")
			return
		}
		switch {
		case errors.Is(err, services.ErrMissingActorContext):
			respondError(w, http.StatusUnauthorized, result.Error)
		case errors.Is(err, services.ErrUnknownAction):
			respondError(w, http.StatusBadRequest, result.Error)
		case errors.Is(err, services.ErrRoleNotAllowed), errors.Is(err, services.ErrInvalidActorContext):
			respondError(w, http.StatusForbidden, result.Error)
		case errors.Is(err, services.ErrActionNotAllowed):
			respondError(w, http.StatusConflict, result.Error)
		case errors.Is(err, services.ErrInvalidEvidence):
			respondError(w, http.StatusBadRequest, result.Error)
		case errors.Is(err, services.ErrInvalidReasonCode):
			respondError(w, http.StatusBadRequest, result.Error)
		case errors.Is(err, services.ErrTransitionPersistFailed):
			respondError(w, http.StatusInternalServerError, result.Error)
		default:
			respondError(w, http.StatusBadRequest, result.Error)
		}
		return
	}

	// Link the document to the newly created event (non-fatal — transition is immutable)
	if docID != nil && h.docRepo != nil {
		if linkErr := h.docRepo.LinkDocumentToEvent(r.Context(), *docID, result.EventID); linkErr != nil {
			slog.Warn("failed to link document to event",
				"doc_id", *docID, "event_id", result.EventID, "error", linkErr)
		}
	}

	respondJSON(w, http.StatusOK, result)
}

// UndoTransitionRequest is the body for POST /api/v1/passports/{uuid}/undo-transition
type UndoTransitionRequest struct {
	AdminNote string `json:"admin_note"`
}

// UndoTransition handles POST /api/v1/passports/{uuid}/undo-transition
// @Summary Undo the most recent lifecycle transition
// @Description Admin-only, and only within 30 minutes of the transition being undone.
// @Tags passports
func (h *LifecycleHandler) UndoTransition(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	var req UndoTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	email := middleware.GetEmail(r.Context())
	if email == "" {
		respondError(w, http.StatusUnauthorized, "missing actor context")
		return
	}
	internalRole, status, err := h.resolveInternalActorRole(r.Context())
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	actorContext := models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   email,
		ActorRole: internalRole,
		Source:    models.ActionSourceInternal,
	}

	result, err := h.service.UndoTransition(r.Context(), passportID, actorContext, req.AdminNote)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUndoNotAdmin):
			respondError(w, http.StatusForbidden, err.Error())
		case errors.Is(err, services.ErrUndoNoteRequired):
			respondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrUndoNoTransition):
			respondError(w, http.StatusNotFound, err.Error())
		case errors.Is(err, services.ErrUndoWindowExpired), errors.Is(err, services.ErrUndoStatusChanged):
			respondError(w, http.StatusConflict, err.Error())
		default:
			respondError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// BulkLifecycleTransitionRequest represents a bulk lifecycle action request
type BulkLifecycleTransitionRequest struct {
	// PassportIDs is an explicit list of passport UUIDs to transition.
	// Mutually exclusive with BatchID — provide one or the other, not both.
	PassportIDs []string `json:"passport_ids,omitempty"`
	// SelectAll applies the action to the full tenant-scoped filtered dataset.
	// When true, the backend resolves IDs using StateFilter/SearchQuery/BatchID.
	SelectAll bool `json:"select_all,omitempty"`
	// BatchID triggers a server-side fetch of all non-terminal passport IDs in the batch.
	// Use this instead of fetching all IDs from the frontend when a batch context is known.
	BatchID     *string         `json:"batch_id,omitempty"`
	StateFilter string          `json:"state_filter,omitempty"`
	SearchQuery string          `json:"search_query,omitempty"`
	Strict      bool            `json:"strict,omitempty"`
	Action      string          `json:"action"`
	Actor       string          `json:"actor,omitempty"`
	Evidence    models.Evidence `json:"evidence,omitempty"`
	ReasonCode  string          `json:"reason_code,omitempty"` // required for ACTIVATE
	AdminNote   string          `json:"admin_note,omitempty"`  // free-text, max 500 chars
}

// maxBulkTransitionSize caps a single bulk-transition request.
// Without this cap, the per-passport sequential loop in BulkTransitionPassports
// can exhaust memory and hold the DB connection indefinitely.
const maxBulkTransitionSize = 500

// BulkTransitionPassports handles POST /api/v1/passports/bulk/transition
// @Summary Bulk apply lifecycle actions
// @Description Apply a lifecycle action to multiple passports with validation
// @Tags passports
func (h *LifecycleHandler) BulkTransitionPassports(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	for key := range raw {
		if strings.Contains(strings.ToLower(key), "status") {
			respondError(w, http.StatusBadRequest, "status fields are not allowed; use action")
			return
		}
		if strings.EqualFold(key, "metadata") {
			respondError(w, http.StatusBadRequest, "metadata is not allowed; use evidence")
			return
		}
	}

	var req BulkLifecycleTransitionRequest
	if err := json.Unmarshal(body, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Must provide either explicit passport_ids, a batch_id, or select_all scope.
	hasList := len(req.PassportIDs) > 0
	hasBatch := req.BatchID != nil && *req.BatchID != ""
	if req.SelectAll && hasList {
		respondError(w, http.StatusBadRequest, "passport_ids and select_all are mutually exclusive")
		return
	}
	if !hasList && !hasBatch && !req.SelectAll {
		respondError(w, http.StatusBadRequest, "one of passport_ids, batch_id, or select_all is required")
		return
	}
	if hasList && hasBatch {
		respondError(w, http.StatusBadRequest, "passport_ids and batch_id are mutually exclusive")
		return
	}

	// Hard cap prevents memory exhaustion and indefinite DB connection hold.
	// Callers must split larger batches into ≤500-passport chunks.
	if hasList && len(req.PassportIDs) > maxBulkTransitionSize {
		respondError(w, http.StatusBadRequest,
			fmt.Sprintf("too many passports: %d exceeds the %d-passport limit per request. Split into smaller batches.",
				len(req.PassportIDs), maxBulkTransitionSize))
		return
	}

	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}

	// Parse explicit passport UUIDs (passport_ids path).
	var passportUUIDs []uuid.UUID
	for _, idStr := range req.PassportIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid passport UUID: "+idStr)
			return
		}
		passportUUIDs = append(passportUUIDs, id)
	}

	// Parse batch_id (batch path).
	var batchUUID *uuid.UUID
	if hasBatch {
		parsed, err := uuid.Parse(*req.BatchID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid batch_id UUID")
			return
		}
		batchUUID = &parsed
	}

	// Resolve tenant from JWT for scoped batch fetch.
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantUUID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	actorContext, status, err := h.buildActorContext(r.Context(), req.Action)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	result, err := h.service.BulkTransitionPassports(r.Context(), services.BulkTransitionRequest{
		PassportIDs:  passportUUIDs,
		BatchID:      batchUUID,
		SelectAll:    req.SelectAll,
		StateFilter:  req.StateFilter,
		SearchQuery:  req.SearchQuery,
		Strict:       req.Strict,
		TenantID:     tenantUUID,
		Action:       req.Action,
		ActorContext: actorContext,
		Evidence:     req.Evidence,
		IPAddress:    getRequestIP(r),
		ReasonCode:   req.ReasonCode,
		AdminNote:    req.AdminNote,
	})

	if err != nil {
		if errors.Is(err, services.ErrUnknownAction) {
			respondError(w, http.StatusBadRequest, "Unknown action")
			return
		}
		if errors.Is(err, services.ErrMissingActorContext) {
			respondError(w, http.StatusUnauthorized, "Missing actor context")
			return
		}
		if errors.Is(err, services.ErrInvalidEvidence) {
			respondError(w, http.StatusBadRequest, "Invalid evidence")
			return
		}
		if errors.Is(err, services.ErrRoleNotAllowed) || errors.Is(err, services.ErrInvalidActorContext) {
			respondError(w, http.StatusForbidden, "Role not permitted")
			return
		}
		if errors.Is(err, services.ErrBulkEligibilityFailed) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"partial":               false,
				"prechecked":            true,
				"message":               fmt.Sprintf("Bulk %s blocked before execution. %d/%d passports are not eligible for this action.", req.Action, result.Failed, result.Total),
				"succeeded":             0,
				"failed":                result.Failed,
				"total":                 result.Total,
				"failed_ids":            result.FailedIDs,
				"errors":                result.Errors,
				"error_summary":         result.ErrorSummary,
				"failed_status_summary": result.FailedStatusSummary,
			})
			return
		}
		if errors.Is(err, services.ErrTransitionPersistFailed) {
			respondError(w, http.StatusInternalServerError, "Failed to persist lifecycle transition")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to process bulk transition")
		return
	}

	// 207 Multi-Status: some passports transitioned, some failed.
	// This is not a server error — each failed passport includes its reason.
	// The caller must inspect failed_ids and retry or investigate individually.
	if result.Failed > 0 {
		slog.Warn("Partial bulk transition",
			"action", req.Action,
			"total", result.Total,
			"succeeded", result.Succeeded,
			"failed", result.Failed,
			"failed_ids", result.FailedIDs,
			"errors", result.Errors,
			"error_summary", result.ErrorSummary,
			"failed_status_summary", result.FailedStatusSummary,
		)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMultiStatus)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"partial":               true,
			"message":               fmt.Sprintf("%d/%d passports transitioned. %d failed — check failed_ids.", result.Succeeded, result.Total, result.Failed),
			"succeeded":             result.Succeeded,
			"failed":                result.Failed,
			"total":                 result.Total,
			"failed_ids":            result.FailedIDs,
			"errors":                result.Errors,
			"error_summary":         result.ErrorSummary,
			"failed_status_summary": result.FailedStatusSummary,
		})
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetBulkAllowedActions handles GET /api/v1/passports/bulk/allowed-actions
func (h *LifecycleHandler) GetBulkAllowedActions(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	actorRole, status, err := h.resolveInternalActorRole(r.Context())
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	q := r.URL.Query()
	allowedActions, err := h.service.GetBulkAllowedActionsForFilter(
		r.Context(),
		tenantID,
		q.Get("status"),
		q.Get("search"),
		q.Get("batch_id"),
		actorRole,
	)
	if err != nil {
		slog.Error("Failed to resolve bulk allowed actions", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to resolve bulk allowed actions")
		return
	}

	allowed := make([]string, 0, len(allowedActions))
	for _, action := range allowedActions {
		allowed = append(allowed, string(action))
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"allowed_actions": allowed,
	})
}

// GetAllowedActions handles GET /api/v1/passports/{uuid}/transitions
// @Summary Get allowed lifecycle actions
// @Description Get list of valid actions for a passport
// @Tags passports
func (h *LifecycleHandler) GetAllowedActions(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}
	actorRole, status, err := h.resolveInternalActorRole(r.Context())
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	// Get passport to check current status
	passport, err := h.service.GetPassportForTransition(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	allowedActions := models.GetAllowedActionsForRole(passport.Status, actorRole, passport.ProductType)
	allowed := make([]string, 0, len(allowedActions))
	for _, action := range allowedActions {
		allowed = append(allowed, string(action))
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"current_status":  passport.Status,
		"allowed_actions": allowed,
	})
}

// GetPassportEvents handles GET /api/v1/passports/{uuid}/events
// @Summary Get passport lifecycle events
// @Description Get all lifecycle events for a passport (audit trail)
// @Tags passports
func (h *LifecycleHandler) GetPassportEvents(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	events, err := h.service.GetPassportEvents(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve events")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passport_id": passportID,
		"events":      events,
		"count":       len(events),
	})
}

// TransferPassportRequest represents ownership transfer request
type TransferPassportRequest struct {
	NewOwnerID uuid.UUID `json:"new_owner_id"`
}

// SOHUpdateRequest represents a state-of-health update request
type SOHUpdateRequest struct {
	StateOfHealth float64 `json:"state_of_health"`
}

type RepairEventRequest struct {
	RepairDate        string `json:"repair_date"`
	TechnicianID      string `json:"technician_id"`
	ComponentRepaired string `json:"component_repaired"`
	RepairNotes       string `json:"repair_notes"`
}

type ReplacementEventRequest struct {
	ReplacementDate    string `json:"replacement_date"`
	TechnicianID       string `json:"technician_id"`
	ComponentReplaced  string `json:"component_replaced"`
	ReplacementReason  string `json:"replacement_reason"`
	NewComponentSerial string `json:"new_component_serial,omitempty"`
}

// TransferPassport handles POST /api/v1/passports/{uuid}/transfer
// @Summary Transfer passport ownership
// @Description Transfer ownership of a battery passport to a new owner. Logs immutable TRANSFERRED event.
// @Tags passports
func (h *LifecycleHandler) TransferPassport(w http.ResponseWriter, r *http.Request) {
	// Get passport UUID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	uuidStr := pathParts[4]
	passportID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		return
	}

	// Parse request body
	var req TransferPassportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate new owner ID
	if req.NewOwnerID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "new_owner_id is required and must be a valid UUID")
		return
	}

	// Authorization check: verify the passport belongs to the current user's tenant
	// The lifecycle service will validate ownership when performing the transfer
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized - tenant context required")
		return
	}
	tenantUUID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Get actor from context for audit logging
	actor := middleware.GetEmail(r.Context())
	if actor == "" {
		actor = "system"
	}

	// Perform transfer
	if err := h.service.TransferPassport(r.Context(), passportID, req.NewOwnerID, actor, tenantUUID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to transfer passport")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"passport_id":  passportID,
		"new_owner_id": req.NewOwnerID,
		"message":      "Ownership transfer successful. Audit event logged.",
	})
}

// getRequestIP returns the best-effort client IP address (S-09 trusted extraction).
func getRequestIP(r *http.Request) string {
	ip := middleware.ClientIP(r)
	if ip == "" {
		return "unknown"
	}
	return ip
}

func (h *LifecycleHandler) buildInternalEventActorContext(ctx context.Context) (models.ActorContext, int, error) {
	email := middleware.GetEmail(ctx)
	if email == "" {
		return models.ActorContext{}, http.StatusUnauthorized, errors.New("missing actor context")
	}

	internalRole, status, err := h.resolveInternalActorRole(ctx)
	if err != nil {
		return models.ActorContext{}, status, err
	}

	return models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   email,
		ActorRole: internalRole,
		Source:    models.ActionSourceInternal,
	}, http.StatusOK, nil
}

// isNotFoundErr classifies a lifecycle error as a not-found condition.
func isNotFoundErr(err error) bool {
	return errors.Is(err, services.ErrUnknownAction)
}

// isConflictErr classifies a lifecycle error as a state-conflict condition.
func isConflictErr(err error) bool {
	return errors.Is(err, services.ErrActionNotAllowed)
}

// isForbiddenErr classifies a lifecycle error as a permission denial.
func isForbiddenErr(err error) bool {
	return errors.Is(err, services.ErrRoleNotAllowed) ||
		errors.Is(err, services.ErrMissingActorContext) ||
		errors.Is(err, services.ErrInvalidActorContext)
}

// VerifyAuditChain handles GET /api/v1/passports/{uuid}/verify-chain
// @Summary Verify passport audit chain integrity
// @Description Verifies that the hash chain of events is intact (no tampering)
// @Tags passports
func (h *LifecycleHandler) VerifyAuditChain(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	// Verify chain integrity
	valid, failedAtIndex, err := h.service.VerifyPassportAuditChain(r.Context(), passportID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to verify audit chain")
		return
	}

	// Get event count for response
	events, _ := h.service.GetPassportEvents(r.Context(), passportID)
	eventCount := len(events)

	if valid {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"valid":           true,
			"passport_id":     passportID,
			"event_count":     eventCount,
			"failed_at_index": -1,
			"message":         "Audit chain verified - no tampering detected",
		})
	} else {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"valid":           false,
			"passport_id":     passportID,
			"event_count":     eventCount,
			"failed_at_index": failedAtIndex,
			"message":         "CHAIN BROKEN - possible tampering detected",
		})
	}
}

// UpdateStateOfHealth handles POST /api/v1/passports/{uuid}/soh
func (h *LifecycleHandler) UpdateStateOfHealth(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	var req SOHUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actor := middleware.GetEmail(r.Context())
	if actor == "" {
		actor = "system"
	}

	if err := h.service.UpdateStateOfHealth(r.Context(), passportID, req.StateOfHealth, actor, "USER", "INTERNAL", getRequestIP(r)); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"passport_id":     passportID,
		"state_of_health": req.StateOfHealth,
	})
}

// GetSoHHistory handles GET /api/v1/passports/{uuid}/soh/history
func (h *LifecycleHandler) GetSoHHistory(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	entries, err := h.service.GetSoHHistory(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve SoH history")
		return
	}
	if entries == nil {
		entries = []models.SoHHistoryEntry{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passport_id": passportID,
		"history":     entries,
		"count":       len(entries),
	})
}

// ============================================================================
// Phase 4 — GS1 EPCIS 2.0 Export
// ============================================================================

// EPCISRepository is the narrow interface the EPCIS handler needs.
// Satisfied by repository.RepositoryInterface.
type EPCISRepository interface {
	GetPassportByUUID(ctx context.Context, id uuid.UUID) (*models.Passport, error)
	GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error)
}

// ExportEPCIS handles GET /api/v1/passports/{uuid}/epcis
// Returns a GS1 EPCIS 2.0 JSON-LD document for the passport's event history.
func (h *LifecycleHandler) ExportEPCIS(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	passport, err := h.service.GetPassportForTransition(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	events, err := h.service.GetPassportEvents(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve events")
		return
	}

	doc := services.BuildEPCISDocument(passportID, passport, events)

	w.Header().Set("Content-Type", "application/ld+json")
	w.Header().Set(
		"Content-Disposition",
		fmt.Sprintf(`attachment; filename="passport_%s_epcis.jsonld"`, passportID.String()),
	)
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(doc); err != nil {
		slog.Error("epcis encode failed", "error", err)
	}
}

// ============================================================================
// Phase 6 — Proof Viewer: list documents attached to a passport
// ============================================================================

// PassportDocumentsRepository is the narrow interface for document listing.
type PassportDocumentsRepository interface {
	ListPassportDocuments(ctx context.Context, passportID, tenantID uuid.UUID) ([]*repository.PassportDocument, error)
}

// GetPassportDocuments handles GET /api/v1/passports/{uuid}/documents
// Returns documents uploaded and linked to a passport's events.
func (h *LifecycleHandler) GetPassportDocuments(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	passportID, err := uuid.Parse(pathParts[4])
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Missing tenant context")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	if h.docRepo == nil {
		respondError(w, http.StatusInternalServerError, "Document repository unavailable")
		return
	}

	docs, err := h.docRepo.ListPassportDocuments(r.Context(), passportID, tenantID)
	if err != nil {
		slog.Error("list passport documents failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve documents")
		return
	}
	if docs == nil {
		docs = []*repository.PassportDocument{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passport_id": passportID,
		"documents":   docs,
		"count":       len(docs),
	})
}

// LogRepairEvent handles POST /api/v1/passports/{uuid}/repairs
func (h *LifecycleHandler) LogRepairEvent(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	var req RepairEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actorContext, status, err := h.buildInternalEventActorContext(r.Context())
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	if err := h.service.LogRepairEvent(r.Context(), passportID, services.RepairEventInput{
		RepairDate:        req.RepairDate,
		TechnicianID:      req.TechnicianID,
		ComponentRepaired: req.ComponentRepaired,
		RepairNotes:       req.RepairNotes,
	}, actorContext, getRequestIP(r)); err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidMaintenanceEvent):
			respondError(w, http.StatusBadRequest, err.Error())
		case isForbiddenErr(err):
			respondError(w, http.StatusForbidden, err.Error())
		case isConflictErr(err):
			respondError(w, http.StatusConflict, err.Error())
		case strings.Contains(err.Error(), "not found"):
			respondError(w, http.StatusNotFound, "Passport not found")
		default:
			respondError(w, http.StatusBadRequest, err.Error())
		}
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"passport_id": passportID,
	})
}

// LogReplacementEvent handles POST /api/v1/passports/{uuid}/replacements
func (h *LifecycleHandler) LogReplacementEvent(w http.ResponseWriter, r *http.Request) {
	passportID, ok := h.requireOwnedPassportID(w, r)
	if !ok {
		return
	}

	var req ReplacementEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actorContext, status, err := h.buildInternalEventActorContext(r.Context())
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	if err := h.service.LogReplacementEvent(r.Context(), passportID, services.ReplacementEventInput{
		ReplacementDate:    req.ReplacementDate,
		TechnicianID:       req.TechnicianID,
		ComponentReplaced:  req.ComponentReplaced,
		ReplacementReason:  req.ReplacementReason,
		NewComponentSerial: req.NewComponentSerial,
	}, actorContext, getRequestIP(r)); err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidMaintenanceEvent):
			respondError(w, http.StatusBadRequest, err.Error())
		case isForbiddenErr(err):
			respondError(w, http.StatusForbidden, err.Error())
		case isConflictErr(err):
			respondError(w, http.StatusConflict, err.Error())
		case strings.Contains(err.Error(), "not found"):
			respondError(w, http.StatusNotFound, "Passport not found")
		default:
			respondError(w, http.StatusBadRequest, err.Error())
		}
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"passport_id": passportID,
	})
}
