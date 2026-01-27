package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"exportready-battery/internal/auth"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// MagicLinkHandler handles magic link authentication
type MagicLinkHandler struct {
	repo             *repository.Repository
	lifecycleService *services.LifecycleService
	rewardService    *services.RewardService
	emailService     *services.EmailService
	jwtSecret        string
	baseURL          string
}

// NewMagicLinkHandler creates a new magic link handler
func NewMagicLinkHandler(repo *repository.Repository, lifecycleService *services.LifecycleService, rewardService *services.RewardService, emailService *services.EmailService, jwtSecret, baseURL string) *MagicLinkHandler {
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
	Role        string `json:"role"`         // TECHNICIAN, RECYCLER, LOGISTICS, CUSTOMER
	PartnerCode string `json:"partner_code"` // Optional: Required for unknown email domains (Tier B)
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

	// Validate role
	if !auth.IsValidActorRole(req.Role) {
		respondError(w, http.StatusBadRequest, "Invalid role. Must be TECHNICIAN, RECYCLER, LOGISTICS, or CUSTOMER")
		return
	}

	// Verify passport exists
	_, err = h.repo.GetPassportByUUID(r.Context(), passportUUID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
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

	// Use role from verification if not explicitly provided (Tier B codes define role)
	role := req.Role
	if verification.Role != "" && verification.Tier == "B" {
		role = verification.Role // Partner code defines the role
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
	token, err := auth.GenerateMagicToken(req.PassportID, req.Email, role, h.jwtSecret)
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
		TokenHash:  token.TokenHash,
		ExpiresAt:  token.ExpiresAt,
	})
	if err != nil {
		log.Printf("Warning: Failed to store magic link token: %v", err)
	}

	// Generate the magic link URL
	magicLink := fmt.Sprintf("%s/passport/%s/action?token=%s", h.baseURL, req.PassportID, token.Token)

	// Send email with magic link
	if h.emailService != nil && h.emailService.IsEnabled() {
		if err := h.emailService.SendMagicLink(req.Email, req.PassportID, token.Token, role, req.Role); err != nil {
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

// MagicTransitionRequest is the request body for transitioning with a magic link
type MagicTransitionRequest struct {
	ToStatus string                 `json:"to_status"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// TransitionWithMagicLink handles POST /api/v1/passport/{uuid}/transition
// Authenticates via magic link token and performs the status transition
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

	// Parse request body
	var req MagicTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.ToStatus == "" {
		respondError(w, http.StatusBadRequest, "to_status is required")
		return
	}

	// Add actor info to metadata
	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["actor_role"] = claims.Role
	metadata["authenticated_via"] = "magic_link"

	// Perform the transition using lifecycle service
	result, err := h.lifecycleService.TransitionPassport(r.Context(), services.TransitionRequest{
		PassportID: passportID,
		ToStatus:   req.ToStatus,
		Actor:      claims.Email, // Use email from magic link token
		Metadata:   metadata,
	})

	if err != nil {
		respondError(w, http.StatusBadRequest, result.Error)
		return
	}

	// Update current_owner_email if transitioning to certain states
	if req.ToStatus == models.PassportStatusInService || req.ToStatus == models.PassportStatusShipped {
		if err := h.repo.UpdatePassportOwner(r.Context(), passportID, claims.Email); err != nil {
			log.Printf("Warning: Failed to update passport owner: %v", err)
		}
	}

	// Mark token as used (optional - for single-use tokens)
	if err := h.repo.MarkMagicTokenUsed(r.Context(), auth.HashToken(tokenString)); err != nil {
		log.Printf("Warning: Failed to mark token as used: %v", err)
	}

	// ===== REWARD TRIGGER =====
	// Award points based on the transition (non-blocking)
	pointsAwarded := 0
	if h.rewardService != nil {
		var awardResult *services.AwardPointsResult
		var awardErr error

		switch req.ToStatus {
		case models.PassportStatusInService:
			// Installation = 50 points
			awardResult, awardErr = h.rewardService.AwardInstallPoints(r.Context(), uuid.Nil, claims.Email, passportID)
		case models.PassportStatusReturnRequested:
			// Return request = 20 points
			awardResult, awardErr = h.rewardService.AwardReturnPoints(r.Context(), uuid.Nil, claims.Email, passportID)
		case models.PassportStatusRecycled:
			// Recycling = 100 points
			awardResult, awardErr = h.rewardService.AwardRecyclePoints(r.Context(), uuid.Nil, claims.Email, passportID)
		}

		if awardErr != nil {
			// Log error but don't fail the transition
			log.Printf("Warning: Failed to award points: %v", awardErr)
		} else if awardResult != nil && awardResult.Success {
			pointsAwarded = awardResult.PointsEarned
			log.Printf("🏆 Awarded %d points to %s for %s (Total: %d, Level: %s)",
				awardResult.PointsEarned, claims.Email, req.ToStatus,
				awardResult.TotalPoints, awardResult.LoyaltyLevel)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"previous_status": result.PreviousStatus,
		"new_status":      result.NewStatus,
		"actor":           claims.Email,
		"role":            claims.Role,
		"event_id":        result.EventID,
		"points_awarded":  pointsAwarded,
	})
}

// GetPassportForAction handles GET /api/v1/passport/{uuid}/action-info
// Returns passport info and allowed transitions for the action page
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

	// Get passport details
	passport, err := h.repo.GetPassportByUUID(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// Get allowed transitions
	allowed := models.GetAllowedTransitions(passport.Status)

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
		"allowed_transitions": allowed,
	})
}
