package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// LifecycleHandler handles passport lifecycle operations
type LifecycleHandler struct {
	service *services.LifecycleService
}

// NewLifecycleHandler creates a new lifecycle handler
func NewLifecycleHandler(service *services.LifecycleService) *LifecycleHandler {
	return &LifecycleHandler{service: service}
}

// TransitionRequest represents a request to change passport status
type LifecycleTransitionRequest struct {
	ToStatus string                 `json:"to_status"`
	Actor    string                 `json:"actor,omitempty"`    // Who is making this change
	Metadata map[string]interface{} `json:"metadata,omitempty"` // e.g., {"carrier": "FedEx", "tracking": "1234"}
}

// TransitionPassport handles POST /api/v1/passports/{uuid}/transition
// @Summary Transition a passport's status
// @Description Change a passport's lifecycle status with validation and event logging
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

	// Parse request body
	var req LifecycleTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate to_status is provided
	if req.ToStatus == "" {
		respondError(w, http.StatusBadRequest, "to_status is required")
		return
	}

	// Get actor from context or request
	actor := req.Actor
	if actor == "" {
		// Try to get from context (authenticated user)
		if userEmail, ok := r.Context().Value("user_email").(string); ok {
			actor = userEmail
		} else {
			actor = "system"
		}
	}

	// Execute transition
	result, err := h.service.TransitionPassport(r.Context(), services.TransitionRequest{
		PassportID: passportID,
		ToStatus:   req.ToStatus,
		Actor:      actor,
		Metadata:   req.Metadata,
	})

	if err != nil {
		respondError(w, http.StatusBadRequest, result.Error)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// BulkLifecycleTransitionRequest represents a bulk status change request
type BulkLifecycleTransitionRequest struct {
	PassportIDs []string               `json:"passport_ids"`
	ToStatus    string                 `json:"to_status"`
	Actor       string                 `json:"actor,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// BulkTransitionPassports handles POST /api/v1/passports/bulk/transition
// @Summary Bulk transition passport statuses
// @Description Change multiple passport statuses with validation
// @Tags passports
func (h *LifecycleHandler) BulkTransitionPassports(w http.ResponseWriter, r *http.Request) {
	var req BulkLifecycleTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.PassportIDs) == 0 {
		respondError(w, http.StatusBadRequest, "passport_ids is required")
		return
	}

	if req.ToStatus == "" {
		respondError(w, http.StatusBadRequest, "to_status is required")
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

	// Get actor
	actor := req.Actor
	if actor == "" {
		if userEmail, ok := r.Context().Value("user_email").(string); ok {
			actor = userEmail
		} else {
			actor = "system"
		}
	}

	result, err := h.service.BulkTransitionPassports(r.Context(), services.BulkTransitionRequest{
		PassportIDs: passportUUIDs,
		ToStatus:    req.ToStatus,
		Actor:       actor,
		Metadata:    req.Metadata,
	})

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process bulk transition")
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetAllowedTransitions handles GET /api/v1/passports/{uuid}/transitions
// @Summary Get allowed status transitions
// @Description Get list of valid next statuses for a passport
// @Tags passports
func (h *LifecycleHandler) GetAllowedTransitions(w http.ResponseWriter, r *http.Request) {
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

	allowed := models.GetAllowedTransitions(passport.Status)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"current_status":      passport.Status,
		"allowed_transitions": allowed,
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

	// TODO: Add authorization check - only current owner or tenant admin should be able to transfer
	// For now, we allow any authenticated user

	// Get actor from context (assuming middleware sets this)
	actor := "system" // Default if not set

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
