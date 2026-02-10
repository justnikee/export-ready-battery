package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// TeamRoleResolver resolves internal user roles
type TeamRoleResolver interface {
	GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error)
}

// LifecycleHandler handles passport lifecycle operations
type LifecycleHandler struct {
	service      *services.LifecycleService
	roleResolver TeamRoleResolver
}

// NewLifecycleHandler creates a new lifecycle handler
func NewLifecycleHandler(service *services.LifecycleService, roleResolver TeamRoleResolver) *LifecycleHandler {
	return &LifecycleHandler{service: service, roleResolver: roleResolver}
}

// TransitionRequest represents a request to apply a passport lifecycle action
type LifecycleTransitionRequest struct {
	Action   string          `json:"action"`
	Actor    string          `json:"actor,omitempty"` // Who is making this change
	Evidence models.Evidence `json:"evidence,omitempty"`
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

func (h *LifecycleHandler) buildActorContext(ctx context.Context, action string) (models.ActorContext, int, error) {
	tenantIDStr := middleware.GetTenantID(ctx)
	if tenantIDStr == "" {
		return models.ActorContext{}, http.StatusUnauthorized, errors.New("missing tenant context")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return models.ActorContext{}, http.StatusUnauthorized, errors.New("invalid tenant context")
	}

	email := middleware.GetEmail(ctx)
	if email == "" {
		return models.ActorContext{}, http.StatusUnauthorized, errors.New("missing actor context")
	}

	if h.roleResolver == nil {
		return models.ActorContext{}, http.StatusInternalServerError, errors.New("role resolver unavailable")
	}

	member, err := h.roleResolver.GetTeamMemberByEmail(ctx, tenantID, email)
	if err != nil || member == nil {
		return models.ActorContext{}, http.StatusForbidden, errors.New("role not found")
	}

	internalRole, ok := mapTeamRoleToActorRole(member.Role)
	if !ok {
		return models.ActorContext{}, http.StatusForbidden, errors.New("role not permitted")
	}

	if action == string(models.ActionActivate) || action == string(models.ActionClose) {
		// System actions: performed by system actor
		return models.ActorContext{
			ActorType: models.ActorTypeSystem,
			ActorID:   "system",
			ActorRole: models.ActorRoleSystem,
			Source:    models.ActionSourceInternal,
		}, http.StatusOK, nil
	}

	return models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   email,
		ActorRole: internalRole,
		Source:    models.ActionSourceInternal,
	}, http.StatusOK, nil
}

// TransitionPassport handles POST /api/v1/passports/{uuid}/transition
// @Summary Apply a passport lifecycle action
// @Description Apply a lifecycle action with validation and event logging
// @Tags passports
func (h *LifecycleHandler) TransitionPassport(w http.ResponseWriter, r *http.Request) {
	// Get passport UUID from URL path
	// URL format: /api/v1/passports/{uuid}/transition
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	uuidStr := pathParts[4] // /api/v1/passports/{uuid}/transition
	passportID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
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

	// Execute transition
	result, err := h.service.ApplyTransition(r.Context(), services.TransitionRequest{
		PassportID:   passportID,
		Action:       req.Action,
		ActorContext: actorContext,
		IPAddress:    getRequestIP(r),
		Evidence:     req.Evidence,
	})

	if err != nil {
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
		case errors.Is(err, services.ErrTransitionPersistFailed):
			respondError(w, http.StatusInternalServerError, result.Error)
		default:
			respondError(w, http.StatusBadRequest, result.Error)
		}
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// BulkLifecycleTransitionRequest represents a bulk lifecycle action request
type BulkLifecycleTransitionRequest struct {
	PassportIDs []string        `json:"passport_ids"`
	Action      string          `json:"action"`
	Actor       string          `json:"actor,omitempty"`
	Evidence    models.Evidence `json:"evidence,omitempty"`
}

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

	if len(req.PassportIDs) == 0 {
		respondError(w, http.StatusBadRequest, "passport_ids is required")
		return
	}

	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}

	// Parse UUIDs
	var passportUUIDs []uuid.UUID
	for _, idStr := range req.PassportIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid passport UUID: "+idStr)
			return
		}
		passportUUIDs = append(passportUUIDs, id)
	}

	actorContext, status, err := h.buildActorContext(r.Context(), req.Action)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	result, err := h.service.BulkTransitionPassports(r.Context(), services.BulkTransitionRequest{
		PassportIDs:  passportUUIDs,
		Action:       req.Action,
		ActorContext: actorContext,
		Evidence:     req.Evidence,
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
		if errors.Is(err, services.ErrTransitionPersistFailed) {
			respondError(w, http.StatusInternalServerError, "Failed to persist lifecycle transition")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to process bulk transition")
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetAllowedActions handles GET /api/v1/passports/{uuid}/transitions
// @Summary Get allowed lifecycle actions
// @Description Get list of valid actions for a passport
// @Tags passports
func (h *LifecycleHandler) GetAllowedActions(w http.ResponseWriter, r *http.Request) {
	// Get passport UUID from URL path
	// URL format: /api/v1/passports/{uuid}/transitions
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

	// Get passport to check current status
	passport, err := h.service.GetPassportForTransition(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	allowedActions := models.GetAllowedActions(passport.Status)
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
	Actor         string  `json:"actor,omitempty"`
}

// GenericEventRequest represents a repair/replacement event payload
type GenericEventRequest struct {
	Actor   string                 `json:"actor,omitempty"`
	Payload map[string]interface{} `json:"payload,omitempty"`
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

	// Get actor from context for audit logging
	actor := middleware.GetEmail(r.Context())
	if actor == "" {
		actor = "system"
	}

	// Perform transfer
	if err := h.service.TransferPassport(r.Context(), passportID, req.NewOwnerID, actor); err != nil {
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

// getRequestIP returns the best-effort client IP address.
func getRequestIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		parts := strings.Split(fwd, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return host
	}
	return r.RemoteAddr
}

// VerifyAuditChain handles GET /api/v1/passports/{uuid}/verify-chain
// @Summary Verify passport audit chain integrity
// @Description Verifies that the hash chain of events is intact (no tampering)
// @Tags passports
func (h *LifecycleHandler) VerifyAuditChain(w http.ResponseWriter, r *http.Request) {
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

	var req SOHUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actor := req.Actor
	if actor == "" {
		if userEmail, ok := r.Context().Value("user_email").(string); ok {
			actor = userEmail
		} else {
			actor = "system"
		}
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

// LogRepairEvent handles POST /api/v1/passports/{uuid}/repairs
func (h *LifecycleHandler) LogRepairEvent(w http.ResponseWriter, r *http.Request) {
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

	var req GenericEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actor := req.Actor
	if actor == "" {
		if userEmail, ok := r.Context().Value("user_email").(string); ok {
			actor = userEmail
		} else {
			actor = "system"
		}
	}

	if err := h.service.LogRepairEvent(r.Context(), passportID, req.Payload, actor, "USER", "INTERNAL", getRequestIP(r)); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"passport_id": passportID,
	})
}

// LogReplacementEvent handles POST /api/v1/passports/{uuid}/replacements
func (h *LifecycleHandler) LogReplacementEvent(w http.ResponseWriter, r *http.Request) {
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

	var req GenericEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	actor := req.Actor
	if actor == "" {
		if userEmail, ok := r.Context().Value("user_email").(string); ok {
			actor = userEmail
		} else {
			actor = "system"
		}
	}

	if err := h.service.LogReplacementEvent(r.Context(), passportID, req.Payload, actor, "USER", "INTERNAL", getRequestIP(r)); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"passport_id": passportID,
	})
}
