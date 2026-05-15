package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"anvayalabs-battery/internal/auth"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// sohRateLimiter tracks the last successful SoH push timestamp per token hash.
// Enforces a minimum interval between pushes from the same token to prevent flooding.
// Protected by sohRateLimiterMu to prevent TOCTOU races in concurrent requests.
var (
	sohRateLimiterMu   sync.Mutex
	sohRateLimiterMap  = make(map[string]time.Time)
	sohMinPushInterval = time.Minute // max 1 push per minute per token
)

// MagicLinkRepository defines the data access required for magic link operations.
type MagicLinkRepository interface {
	GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error)
	VerifyPartnerAccess(ctx context.Context, email, partnerCode string) (*repository.VerificationResult, error)
	ValidatePartnerCode(ctx context.Context, code string) (*repository.PartnerCode, error)
	IncrementPartnerCodeUsage(ctx context.Context, codeID uuid.UUID, email string, passportID *uuid.UUID) error
	CreateMagicLinkToken(ctx context.Context, req repository.CreateMagicLinkTokenRequest) error
	GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*repository.MagicLinkTokenRecord, error)
	MarkMagicTokenUsed(ctx context.Context, tokenHash string) error
	// Phase 7: OTP methods
	SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error
	CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error
	GetMagicLinkOTP(ctx context.Context, tokenHash string) (*repository.OTPRecord, error)
	IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error
	MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error
	RecordOTPResend(ctx context.Context, otpID uuid.UUID) error
	ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error
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
	if !models.IsValidMagicLinkAction(req.Action) {
		respondError(w, http.StatusBadRequest, "Invalid action")
		return
	}

	// Verify passport exists
	passport, err := h.repo.GetPassportByUUID(r.Context(), passportUUID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Ensure action is valid for current state (intent validation before persistence).
	// SOH_UPDATE is not a state machine transition, so no status check is needed.
	if req.Action != string(models.ActionSOHUpdate) {
		if !models.IsActionAllowedFrom(models.TransitionAction(req.Action), passport.Status) {
			respondError(w, http.StatusConflict, "Action not allowed from current status")
			return
		}
	}

	// ===== TIERED PARTNER VERIFICATION =====
	verification, err := h.repo.VerifyPartnerAccess(r.Context(), req.Email, req.PartnerCode)
	if err != nil {
		slog.Error("Partner verification error", "error", err)
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
	slog.Info("Partner verified", "email", req.Email, "tier", verification.Tier, "company", verification.CompanyName, "role", role)

	// If Tier B, increment code usage
	if verification.Tier == "B" && req.PartnerCode != "" {
		code, _ := h.repo.ValidatePartnerCode(r.Context(), req.PartnerCode)
		if code != nil {
			_ = h.repo.IncrementPartnerCodeUsage(r.Context(), code.ID, req.Email, &passportUUID)
		}
	}

	// Generate magic link token.
	// SOH_UPDATE tokens are multi-use (not consumed on each push), so they get a longer
	// lifetime to avoid requiring IoT gateways or field apps to re-authenticate frequently.
	// Lifecycle transition tokens remain 1-hour one-time-use.
	tokenTTL := time.Hour
	if req.Action == string(models.ActionSOHUpdate) {
		tokenTTL = 24 * time.Hour
	}
	token, err := auth.GenerateMagicToken(req.PassportID, req.Email, role, req.Action, h.jwtSecret, tokenTTL)
	if err != nil {
		slog.Error("Failed to generate magic token", "error", err)
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
		slog.Error("Failed to store magic link token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to store magic link token")
		return
	}

	// Phase 7: Flag high-risk actions (RECYCLE, RECALL) to require OTP on transition
	action := models.TransitionAction(req.Action)
	if action == models.ActionRecycle || action == models.ActionRecall {
		if otpErr := h.repo.SetRequiresOTP(r.Context(), token.TokenHash, true); otpErr != nil {
			slog.Warn("Failed to set requires_otp flag", "error", otpErr)
		}
	}
	magicLink := fmt.Sprintf("%s/p/%s/action?token=%s", h.baseURL, req.PassportID, token.Token)

	// Send email with magic link
	if h.emailService != nil && h.emailService.IsEnabled() {
		if err := h.emailService.SendMagicLink(req.Email, req.PassportID, token.Token, role, req.Action); err != nil {
			slog.Warn("Failed to send magic link email", "error", err)
			// Continue anyway - we'll return the link for testing
		} else {
			slog.Info("Magic link email sent", "email", req.Email, "tier", verification.Tier)
		}
	} else {
		// Fallback: Log to console for development
		slog.Info("Magic link generated (dev mode)", "email", req.Email, "role", role, "tier", verification.Tier, "link", magicLink)
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
		slog.Error("Magic token validation failed", "error", err)
		respondError(w, http.StatusUnauthorized, "Invalid or expired magic link")
		return
	}

	tokenHash := auth.HashToken(tokenString)
	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil {
		// Enhanced error logging with full context
		tokenPrefix := tokenHash
		if len(tokenHash) > 8 {
			tokenPrefix = tokenHash[:8]
		}
		slog.Error("Failed to fetch magic link token from database",
			"error", err,
			"token_hash_prefix", tokenPrefix,
			"passport_id", passportID,
			"endpoint", "TransitionWithMagicLink",
			"remote_addr", r.RemoteAddr,
		)
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

	// ===== PHASE 7: OTP GATE =====
	// RECYCLE and RECALL actions require a one-time OTP challenge.
	if record.RequiresOTP {
		otp, issued, otpErr := h.ensureActiveOTP(r.Context(), tokenHash, record.Email, record.Action)
		if otpErr != nil {
			slog.Error("OTP issue failed", "error", otpErr)
			respondError(w, http.StatusInternalServerError, "Failed to issue OTP")
			return
		}
		response := map[string]interface{}{
			"status":  "otp_required",
			"message": "A 6-digit OTP has been sent to your email. Please confirm via /confirm-otp.",
		}
		if !issued {
			response["message"] = "An active 6-digit OTP is already pending. Check your email or use resend after the cooldown."
		}
		if (h.emailService == nil || !h.emailService.IsEnabled()) && issued && otp != "" {
			response["otp_dev"] = otp
		}
		respondJSON(w, http.StatusAccepted, response)
		return
	}
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

	// ===== PRIOR-RECYCLE GUARD =====
	// Recyclers can only CLOSE a passport they previously RECYCLED (audit trail check)
	if models.TransitionAction(req.Action) == models.ActionClose &&
		models.ActorRole(claims.Role) == models.ActorRoleRecycler {
		events, err := h.lifecycleService.GetPassportEvents(r.Context(), passportID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to verify prior recycle event")
			return
		}
		hasPriorRecycle := false
		for _, ev := range events {
			if ev.Action == models.ActionRecycle && ev.ActorID == claims.Email {
				hasPriorRecycle = true
				break
			}
		}
		if !hasPriorRecycle {
			respondError(w, http.StatusForbidden,
				"CLOSE requires a prior RECYCLE event by the same recycler")
			return
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
		if result == nil {
			respondError(w, http.StatusInternalServerError, "Internal error during transition")
			return
		}
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
			slog.Warn("Failed to award points", "error", awardErr)
		} else if awardResult != nil && awardResult.Success {
			pointsAwarded = awardResult.PointsEarned
			slog.Info("Points awarded", "points", awardResult.PointsEarned, "email", claims.Email, "action", req.Action, "total", awardResult.TotalPoints, "level", awardResult.LoyaltyLevel)
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
		// Enhanced error logging for diagnostics
		tokenPrefix := tokenHash
		if len(tokenHash) > 8 {
			tokenPrefix = tokenHash[:8]
		}
		slog.Error("Failed to fetch magic link token from database",
			"error", err,
			"token_hash_prefix", tokenPrefix,
			"passport_id", passportID,
			"endpoint", "GetPassportForAction",
			"remote_addr", r.RemoteAddr,
		)
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

	// Build the list of actions the token holder is permitted to perform.
	// SOH_UPDATE is not a state-machine transition, so it does not appear in
	// GetAllowedActions — handle it as a special case so the action page knows
	// to show a SoH input rather than a lifecycle transition button.
	allowedForToken := []string{}
	if claims.Action == string(models.ActionSOHUpdate) {
		allowedForToken = []string{string(models.ActionSOHUpdate)}
	} else {
		for _, action := range models.GetAllowedActionsForRole(passport.Status, models.ActorRole(claims.Role)) {
			if string(action) == claims.Action {
				allowedForToken = append(allowedForToken, string(action))
			}
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

// UpdateSoHWithMagicLink handles POST /api/v1/passport/{uuid}/soh
// Allows external partners (technicians, fleet operators) to push State-of-Health
// readings using a magic link token issued with action="SOH_UPDATE".
// Unlike lifecycle transition tokens, SOH_UPDATE tokens are multi-use (not consumed on use),
// valid until their expiry. This supports IoT gateways and recurring field measurements.
//
// Auth: Bearer <magic_link_token> (action must be "SOH_UPDATE")
// Body: {"state_of_health": 87.5}
func (h *MagicLinkHandler) UpdateSoHWithMagicLink(w http.ResponseWriter, r *http.Request) {
	// Extract passport UUID from path: /api/v1/passport/{uuid}/soh
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

	// Extract Bearer token
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		respondError(w, http.StatusUnauthorized, "Bearer token required")
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Validate JWT is scoped to this passport
	claims, err := auth.ValidateMagicTokenForPassport(tokenString, h.jwtSecret, passportIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid or expired magic link")
		return
	}

	// Only SOH_UPDATE tokens may reach this endpoint
	if claims.Action != string(models.ActionSOHUpdate) {
		respondError(w, http.StatusForbidden, "Token not authorized for SoH push (wrong action)")
		return
	}

	// Validate role is a recognised partner role
	if !models.IsValidPartnerRole(claims.Role) {
		respondError(w, http.StatusForbidden, "Role not permitted for SoH push")
		return
	}

	// Look up DB record — verify token is known, not expired, and scoped to this passport.
	// We intentionally do NOT check UsedAt: SOH_UPDATE tokens are multi-use until expiry.
	tokenHash := auth.HashToken(tokenString)
	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil {
		// Enhanced error logging for SoH endpoint
		tokenPrefix := tokenHash
		if len(tokenHash) > 8 {
			tokenPrefix = tokenHash[:8]
		}
		slog.Error("Failed to fetch magic link token from database",
			"error", err,
			"token_hash_prefix", tokenPrefix,
			"passport_id", passportID,
			"endpoint", "UpdateSoHWithMagicLink",
			"remote_addr", r.RemoteAddr,
		)
		respondError(w, http.StatusInternalServerError, "Failed to validate magic link")
		return
	}
	if record == nil {
		respondError(w, http.StatusUnauthorized, "Magic link not recognised")
		return
	}
	if record.PassportID != passportID {
		respondError(w, http.StatusForbidden, "Magic link not valid for this passport")
		return
	}
	if time.Now().After(record.ExpiresAt) {
		respondError(w, http.StatusUnauthorized, "Magic link expired")
		return
	}
	if !strings.EqualFold(record.Action, string(models.ActionSOHUpdate)) {
		respondError(w, http.StatusForbidden, "Magic link action mismatch")
		return
	}

	// Rate limit: max 1 push per minute per token to prevent flooding.
	now := time.Now()
	sohRateLimiterMu.Lock()
	last, exists := sohRateLimiterMap[tokenHash]
	if exists && now.Sub(last) < sohMinPushInterval {
		remaining := sohMinPushInterval - now.Sub(last)
		sohRateLimiterMu.Unlock()
		respondError(w, http.StatusTooManyRequests,
			fmt.Sprintf("Rate limit: wait %ds before next SoH push", int(remaining.Seconds())+1))
		return
	}
	sohRateLimiterMu.Unlock()

	// Parse request body
	var req SOHUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Delegate to the lifecycle service — pass PARTNER / MAGIC_LINK as actor context
	if err := h.lifecycleService.UpdateStateOfHealth(
		r.Context(),
		passportID,
		req.StateOfHealth,
		claims.Email,
		"PARTNER",
		"MAGIC_LINK",
		getRequestIP(r),
	); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Record timestamp for rate limiting — only update after a successful push
	sohRateLimiterMu.Lock()
	sohRateLimiterMap[tokenHash] = time.Now()
	sohRateLimiterMu.Unlock()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"passport_id":     passportID,
		"state_of_health": req.StateOfHealth,
		"recorded_by":     claims.Email,
		"role":            claims.Role,
	})
}
// ============================================================================
// Phase 7 — OTP helpers and handlers
// ============================================================================

// generateOTPCode returns a random 6-digit string.
func generateOTPCode() (string, error) {
	max := big.NewInt(1_000_000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// hashOTP returns HMAC-SHA256(otp, secret) encoded as hex.
func hashOTP(otp, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(otp))
	return hex.EncodeToString(mac.Sum(nil))
}

// issueOrGetOTP generates a new OTP, stores its hash, and sends it via email.
// It replaces any existing unused OTP for the same tokenHash.
func (h *MagicLinkHandler) issueOrGetOTP(ctx context.Context, tokenHash, email, action string) (string, error) {
	otp, err := generateOTPCode()
	if err != nil {
		return "", fmt.Errorf("generate otp: %w", err)
	}
	otpHash := hashOTP(otp, h.jwtSecret)
	if err := h.repo.ReplaceOTP(ctx, tokenHash, otpHash); err != nil {
		return "", fmt.Errorf("store otp: %w", err)
	}
	if h.emailService != nil {
		if err := h.emailService.SendMagicLinkOTP(email, action, otp); err != nil {
			return "", fmt.Errorf("send otp email: %w", err)
		}
	} else {
		slog.Info("OTP issued (dev mode)", "email", email, "action", action, "otp", otp)
	}
	return otp, nil
}

// ensureActiveOTP reuses an existing active OTP challenge when possible to avoid
// reissuing a fresh OTP on every repeated transition request.
func (h *MagicLinkHandler) ensureActiveOTP(ctx context.Context, tokenHash, email, action string) (string, bool, error) {
	otpRec, err := h.repo.GetMagicLinkOTP(ctx, tokenHash)
	if err != nil {
		return "", false, fmt.Errorf("fetch active otp: %w", err)
	}

	if otpRec != nil && time.Since(otpRec.CreatedAt) <= 10*time.Minute {
		return "", false, nil
	}

	otp, err := h.issueOrGetOTP(ctx, tokenHash, email, action)
	if err != nil {
		return "", false, err
	}

	return otp, true, nil
}

// ConfirmOTPRequest is the body for POST /api/v1/magic-links/{token}/confirm-otp
type ConfirmOTPRequest struct {
	OTP string `json:"otp"`
}

// ConfirmOTP handles POST /api/v1/magic-links/{token}/confirm-otp
// Validates the OTP and, if correct, applies the pending lifecycle transition.
func (h *MagicLinkHandler) ConfirmOTP(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	tokenString := pathParts[4]
	tokenHash := auth.HashToken(tokenString)

	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil || record == nil {
		respondError(w, http.StatusUnauthorized, "Magic link not recognized")
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

	var req ConfirmOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OTP == "" {
		respondError(w, http.StatusBadRequest, "otp is required")
		return
	}

	otpRec, err := h.repo.GetMagicLinkOTP(r.Context(), tokenHash)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch OTP")
		return
	}
	if otpRec == nil {
		respondError(w, http.StatusBadRequest, "No active OTP found. Request a new one.")
		return
	}
	if time.Since(otpRec.CreatedAt) > 10*time.Minute {
		respondError(w, http.StatusUnauthorized, "OTP expired. Request a new one.")
		return
	}
	if otpRec.AttemptCount >= otpRec.MaxAttempts {
		respondJSON(w, http.StatusTooManyRequests, map[string]interface{}{
			"error": "OTP locked due to too many failed attempts",
		})
		return
	}

	expected := hashOTP(req.OTP, h.jwtSecret)
	if !hmac.Equal([]byte(expected), []byte(otpRec.OTPHash)) {
		_ = h.repo.IncrementOTPAttempt(r.Context(), otpRec.ID)
		remaining := otpRec.MaxAttempts - otpRec.AttemptCount - 1
		if remaining <= 0 {
			respondJSON(w, http.StatusTooManyRequests, map[string]interface{}{
				"error": "OTP locked due to too many failed attempts",
			})
			return
		}
		respondJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":              "Invalid OTP",
			"attempts_remaining": remaining,
		})
		return
	}

	if err := h.repo.MarkOTPUsed(r.Context(), otpRec.ID); err != nil {
		slog.Error("Failed to mark OTP used", "error", err)
	}

	passengerContext := models.ActorContext{
		ActorType: models.ActorTypePartner,
		ActorID:   record.Email,
		ActorRole: models.ActorRole(record.Role),
		Source:    models.ActionSourceMagicLink,
	}

	result, err := h.lifecycleService.ApplyTransition(r.Context(), services.TransitionRequest{
		PassportID:         record.PassportID,
		Action:             record.Action,
		ActorContext:       passengerContext,
		IPAddress:          r.RemoteAddr,
		MagicLinkTokenHash: tokenHash,
	})
	if err != nil {
		if result == nil {
			respondError(w, http.StatusInternalServerError, "Internal error during transition")
			return
		}
		switch {
		case errors.Is(err, services.ErrActionNotAllowed):
			respondError(w, http.StatusConflict, result.Error)
		default:
			respondError(w, http.StatusBadRequest, result.Error)
		}
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"passport_id":  record.PassportID,
		"action":       record.Action,
		"new_status":   result.NewStatus,
		"otp_verified": true,
	})
}

// ResendOTP handles POST /api/v1/magic-links/{token}/resend-otp
// Issues a new OTP (within resend limits) and sends it via email.
func (h *MagicLinkHandler) ResendOTP(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	tokenString := pathParts[4]
	tokenHash := auth.HashToken(tokenString)

	record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
	if err != nil || record == nil {
		respondError(w, http.StatusUnauthorized, "Magic link not recognized")
		return
	}
	if record.UsedAt != nil || time.Now().After(record.ExpiresAt) {
		respondError(w, http.StatusUnauthorized, "Magic link invalid or expired")
		return
	}

	otpRec, err := h.repo.GetMagicLinkOTP(r.Context(), tokenHash)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch OTP state")
		return
	}

	if otpRec != nil {
		if otpRec.ResendCount >= otpRec.MaxResends {
			respondJSON(w, http.StatusTooManyRequests, map[string]interface{}{
				"error": "Maximum OTP resend limit reached",
			})
			return
		}
		if otpRec.LastResentAt != nil && time.Since(*otpRec.LastResentAt) < 60*time.Second {
			respondJSON(w, http.StatusTooManyRequests, map[string]interface{}{
				"error": "Please wait 60 seconds before requesting another OTP",
			})
			return
		}
	}

	otp, err := h.issueOrGetOTP(r.Context(), tokenHash, record.Email, record.Action)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate OTP")
		return
	}
	if otpRec != nil {
		_ = h.repo.RecordOTPResend(r.Context(), otpRec.ID)
	}
	if h.emailService == nil || !h.emailService.IsEnabled() {
		slog.Info("OTP resent (dev mode)", "email", record.Email, "otp", otp)
	}

	response := map[string]interface{}{
		"success": true,
		"message": "OTP resent to your email",
	}
	if h.emailService == nil || !h.emailService.IsEnabled() {
		response["otp_dev"] = otp
	}
	respondJSON(w, http.StatusOK, response)
}