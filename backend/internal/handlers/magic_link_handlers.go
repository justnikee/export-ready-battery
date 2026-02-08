package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"exportready-battery/internal/auth"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// MagicLinkRepository defines the data access required for magic link operations.
type MagicLinkRepository interface {
	GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error)
	VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*repository.VerificationResult, error)
	ValidatePartnerCode(ctx context.Context, code string) (*repository.PartnerCode, error)
	IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error
	CreateMagicLinkToken(ctx context.Context, req repository.CreateMagicLinkTokenRequest) error
	GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*repository.MagicLinkTokenRecord, error)
}

// MagicLinkHandler handles magic link authentication
type MagicLinkHandler struct {
	repo             MagicLinkRepository
	lifecycleService *services.LifecycleService
	rewardService    *services.RewardService
	emailService     *services.EmailService
	jwtSecret        string
	baseURL          string
}

// NewMagicLinkHandler creates a new magic link handler
func NewMagicLinkHandler(repo MagicLinkRepository, lifecycleService *services.LifecycleService, rewardService *services.RewardService, emailService *services.EmailService, jwtSecret, baseURL string) *MagicLinkHandler {
	return &MagicLinkHandler{
		repo:             repo,
		lifecycleService: lifecycleService,
		rewardService:    rewardService,
		emailService:     emailService,
		jwtSecret:        jwtSecret,
		baseURL:          baseURL,
	}
}

// RequestMagicLinkRequest is the request body for requesting a magic link
type RequestMagicLinkRequest struct {
	PassportID  string `json:"passport_id"`
	Email       string `json:"email"`
	Role        string `json:"role"`         // TECHNICIAN, RECYCLER, LOGISTICS
	PartnerCode string `json:"partner_code"` // Optional: Required for unknown email domains (Tier B)
	Action      string `json:"action"`       // Canonical action (ACTIVATE, SHIP, INSTALL, RECYCLE, CLOSE, RECALL)
}

// RequestMagicLink handles POST /api/v1/auth/magic-link
// Generates a magic link token for external users to authenticate
// Uses tiered verification:
//   - Tier A: Email domain matches trusted partner → Auto-approve
//   - Tier B: Unknown email + valid partner code → Approve
//   - Rejected: Unknown email + no/invalid code → Reject
func (h *MagicLinkHandler) RequestMagicLink(w http.ResponseWriter, r *http.Request) {
	var req RequestMagicLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate passport_id
	if req.PassportID == "" {
		respondError(w, http.StatusBadRequest, "passport_id is required")
		return
	}

	passportUUID, err := uuid.Parse(req.PassportID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport_id format")
		return
	}

	// Validate email
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "Valid email is required")
		return
	}

	// Validate action
	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}
	if !models.IsValidAction(req.Action) {
		respondError(w, http.StatusBadRequest, "Invalid action")
		return
	}

	// Verify passport exists
	passport, err := h.repo.GetPassportByUUID(r.Context(), passportUUID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Ensure action is valid for current state (intent validation before persistence)
	if !models.IsActionAllowedFrom(models.TransitionAction(req.Action), passport.Status) {
		respondError(w, http.StatusConflict, "Action not allowed from current status")
		return
	}

	// ===== TIERED PARTNER VERIFICATION =====
	verification, err := h.repo.VerifyPartnerAccess(r.Context(), req.Email, req.PartnerCode)
	if err != nil {
		log.Printf("Partner verification error: %v", err)
		respondError(w, http.StatusInternalServerError, "Verification failed")
		return
	}

	if !verification.Allowed {
		respondJSON(w, http.StatusForbidden, map[string]interface{}{
			"success":       false,
			"error":         verification.RejectReason,
			"requires_code": true,
			"hint":          "Your email domain is not pre-registered. Please provide a valid partner code from the manufacturer.",
		})
		return
	}

	// Role must be derived from verification (trusted partner or partner code)
	role := verification.Role
	if role == "" {
		respondError(w, http.StatusForbidden, "Role not authorized for this partner")
		return
	}
	if !models.IsValidPartnerRole(role) {
		respondError(w, http.StatusForbidden, "Invalid partner role")
		return
	}

	// Log verification tier
	log.Printf("✅ Partner verified: %s (Tier %s, Company: %s, Role: %s)",
		req.Email, verification.Tier, verification.CompanyName, role)

	// If Tier B, increment code usage
	if verification.Tier == "B" && req.PartnerCode != "" {
		code, _ := h.repo.ValidatePartnerCode(r.Context(), req.PartnerCode)
		if code != nil {
			_ = h.repo.IncrementPartnerCodeUsage(r.Context(), code.ID, req.Email, &passportUUID)
		}
	}

	// Generate magic link token
	token, err := auth.GenerateMagicToken(req.PassportID, req.Email, role, req.Action, h.jwtSecret)
	if err != nil {
		log.Printf("Failed to generate magic token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate magic link")
		return
	}

	// Store token in database for tracking/revocation
	err = h.repo.CreateMagicLinkToken(r.Context(), repository.CreateMagicLinkTokenRequest{
		PassportID: passportUUID,
		Email:      req.Email,
		Role:       role,
		Action:     req.Action,
		TokenHash:  token.TokenHash,
		ExpiresAt:  token.ExpiresAt,
	})
	if err != nil {
		log.Printf("Failed to store magic link token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to store magic link token")
		return
	}

	// Generate the magic link URL
	magicLink := fmt.Sprintf("%s/p/%s/action?token=%s", h.baseURL, req.PassportID, token.Token)

	// Send email with magic link
	if h.emailService != nil && h.emailService.IsEnabled() {
		if err := h.emailService.SendMagicLink(req.Email, req.PassportID, token.Token, role, req.Action); err != nil {
			log.Printf("⚠️ Failed to send magic link email: %v", err)
			// Continue anyway - we'll return the link for testing
		} else {
			log.Printf("📧 Magic link email sent to %s (Tier %s)", req.Email, verification.Tier)
		}
	} else {
		// Fallback: Log to console for development
		log.Printf("🔗 Magic Link Generated for %s (%s, Tier %s):\n%s", req.Email, role, verification.Tier, magicLink)
	}

	response := map[string]interface{}{
		"success":      true,
		"message":      fmt.Sprintf("Magic link sent to %s", req.Email),
		"expires_at":   token.ExpiresAt,
		"verified_via": verification.Tier,
		"company":      verification.CompanyName,
		"role":         role,
	}

	// Include link in response for development/testing (when email is disabled)
	if h.emailService == nil || !h.emailService.IsEnabled() {
		response["link"] = magicLink
		response["dev_mode"] = true
	}

	respondJSON(w, http.StatusOK, response)
}

// MagicTransitionRequest is the request body for applying an action with a magic link
type MagicTransitionRequest struct {
	Action   string          `json:"action"`
	Evidence models.Evidence `json:"evidence,omitempty"`
}

// TransitionWithMagicLink handles POST /api/v1/passport/{uuid}/transition
// Authenticates via magic link token and applies a lifecycle action
func (h *MagicLinkHandler) TransitionWithMagicLink(w http.ResponseWriter, r *http.Request) {
	// Extract passport UUID from path
	// URL format: /api/v1/passport/{uuid}/transition
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	passportIDStr := pathParts[4]

	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		return
	}

	// Extract token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		respondError(w, http.StatusUnauthorized, "Authorization header required. Use: Bearer <magic_link_token>")
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate magic link token
	claims, err := auth.ValidateMagicTokenForPassport(tokenString, h.jwtSecret, passportIDStr)
	if err != nil {
		log.Printf("Magic token validation failed: %v", err)
		respondError(w, http.StatusUnauthorized, "Invalid or expired magic link")
		return
	}

	tokenHash := auth.HashToken(tokenString)
	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil {
		log.Printf("Failed to fetch magic link token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
		return
	}
	if record == nil {
		respondError(w, http.StatusUnauthorized, "Magic link not recognized")
		return
	}
	if record.PassportID != passportID {
		respondError(w, http.StatusUnauthorized, "Magic link not valid for this passport")
		return
	}
	if record.UsedAt != nil {
		respondError(w, http.StatusUnauthorized, "Magic link already used")
		return
	}
	if time.Now().After(record.ExpiresAt) {
		respondError(w, http.StatusUnauthorized, "Magic link expired")
		return
	}
	if !strings.EqualFold(record.Role, claims.Role) {
		respondError(w, http.StatusForbidden, "Role not permitted by magic link token")
		return
	}

	// Parse request body
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

	var req MagicTransitionRequest
	if err := json.Unmarshal(body, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Action == "" {
		respondError(w, http.StatusBadRequest, "action is required")
		return
	}

	if claims.Action == "" {
		respondError(w, http.StatusUnauthorized, "Magic link action missing or invalid")
		return
	}
	if record.Action == "" {
		respondError(w, http.StatusUnauthorized, "Magic link action missing or invalid")
		return
	}
	if !models.IsValidPartnerRole(claims.Role) {
		respondError(w, http.StatusForbidden, "Invalid partner role")
		return
	}

	if !strings.EqualFold(record.Action, claims.Action) {
		respondError(w, http.StatusForbidden, "Action not permitted by magic link token")
		return
	}
	if claims.Action != req.Action {
		respondError(w, http.StatusForbidden, "Action not permitted by magic link token")
		return
	}

	// Perform the transition using lifecycle service
	currentOwnerIdentifier := ""
	if definition, ok := models.GetTransitionDefinition(models.TransitionAction(req.Action)); ok {
		if definition.To == models.PassportStatusInService || definition.To == models.PassportStatusShipped {
			currentOwnerIdentifier = claims.Email
		}
	}

	actorContext := models.ActorContext{
		ActorType: models.ActorTypePartner,
		ActorID:   claims.Email,
		ActorRole: models.ActorRole(claims.Role),
		Source:    models.ActionSourceMagicLink,
	}

	result, err := h.lifecycleService.ApplyTransition(r.Context(), services.TransitionRequest{
		PassportID:             passportID,
		Action:                 req.Action,
		ActorContext:           actorContext,
		IPAddress:              r.RemoteAddr,
		CurrentOwnerIdentifier: currentOwnerIdentifier,
		Evidence:               req.Evidence,
		MagicLinkTokenHash:     tokenHash,
	})

	if err != nil {
		switch {
		case errors.Is(err, services.ErrMissingActorContext):
			respondError(w, http.StatusUnauthorized, result.Error)
		case errors.Is(err, services.ErrInvalidActorContext), errors.Is(err, services.ErrRoleNotAllowed):
			respondError(w, http.StatusForbidden, result.Error)
		case errors.Is(err, services.ErrInvalidEvidence):
			respondError(w, http.StatusBadRequest, result.Error)
		case errors.Is(err, services.ErrMagicLinkTokenInvalid):
			respondError(w, http.StatusUnauthorized, result.Error)
		case errors.Is(err, services.ErrUnknownAction):
			respondError(w, http.StatusBadRequest, result.Error)
		case errors.Is(err, services.ErrActionNotAllowed):
			respondError(w, http.StatusConflict, result.Error)
		default:
			respondError(w, http.StatusBadRequest, result.Error)
		}
		return
	}

	// Owner updates are handled inside lifecycle service when CurrentOwnerIdentifier is provided

	// ===== REWARD TRIGGER =====
	// Award points based on the transition (non-blocking)
	pointsAwarded := 0
	if h.rewardService != nil {
		var awardResult *services.AwardPointsResult
		var awardErr error

		switch models.TransitionAction(req.Action) {
		case models.ActionInstall:
			// Installation = 50 points
			awardResult, awardErr = h.rewardService.AwardInstallPoints(r.Context(), uuid.Nil, claims.Email, passportID)
		case models.ActionRecycle:
			// Recycling = 100 points
			awardResult, awardErr = h.rewardService.AwardRecyclePoints(r.Context(), uuid.Nil, claims.Email, passportID)
		}

		if awardErr != nil {
			// Log error but don't fail the transition
			log.Printf("Warning: Failed to award points: %v", awardErr)
		} else if awardResult != nil && awardResult.Success {
			pointsAwarded = awardResult.PointsEarned
			log.Printf("🏆 Awarded %d points to %s for %s (Total: %d, Level: %s)",
				awardResult.PointsEarned, claims.Email, req.Action,
				awardResult.TotalPoints, awardResult.LoyaltyLevel)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"previous_status": result.PreviousStatus,
		"new_status":      result.NewStatus,
		"action":          result.Action,
		"actor":           claims.Email,
		"role":            claims.Role,
		"event_id":        result.EventID,
		"points_awarded":  pointsAwarded,
	})
}

// GetPassportForAction handles GET /api/v1/passport/{uuid}/action-info
// Returns passport info and allowed actions for the action page
func (h *MagicLinkHandler) GetPassportForAction(w http.ResponseWriter, r *http.Request) {
	// Extract passport UUID from path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	passportIDStr := pathParts[4]

	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID")
		return
	}

	// Validate token from query param or header
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		respondError(w, http.StatusUnauthorized, "Token required")
		return
	}

	claims, err := auth.ValidateMagicTokenForPassport(tokenString, h.jwtSecret, passportIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid or expired magic link")
		return
	}
	if claims.Action == "" {
		respondError(w, http.StatusUnauthorized, "Magic link action missing or invalid")
		return
	}

	tokenHash := auth.HashToken(tokenString)
	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
		return
	}
	if record == nil {
		respondError(w, http.StatusUnauthorized, "Magic link not recognized")
		return
	}
	if record.PassportID != passportID {
		respondError(w, http.StatusUnauthorized, "Magic link not valid for this passport")
		return
	}
	if record.UsedAt != nil {
		respondError(w, http.StatusUnauthorized, "Magic link already used")
		return
	}
	if time.Now().After(record.ExpiresAt) {
		respondError(w, http.StatusUnauthorized, "Magic link expired")
		return
	}
	if !strings.EqualFold(record.Role, claims.Role) || !strings.EqualFold(record.Action, claims.Action) {
		respondError(w, http.StatusForbidden, "Magic link scope mismatch")
		return
	}

	// Get passport details
	passport, err := h.repo.GetPassportByUUID(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Get allowed actions from current status (and restrict to token action)
	allowedActions := models.GetAllowedActions(passport.Status)
	allowedForToken := []string{}
	for _, action := range allowedActions {
		if string(action) == claims.Action {
			allowedForToken = append(allowedForToken, string(action))
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"passport": map[string]interface{}{
			"uuid":          passport.UUID,
			"serial_number": passport.SerialNumber,
			"status":        passport.Status,
		},
		"actor": map[string]interface{}{
			"email": claims.Email,
			"role":  claims.Role,
		},
		"allowed_actions": allowedForToken,
	})
}
