package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
)

// ============================================================================
// TEAM HANDLERS
// ============================================================================

// parseTenantID is a helper that gets and parses tenant ID from context
func parseTenantID(r *http.Request) (uuid.UUID, error) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	return uuid.Parse(tenantIDStr)
}

// ListTeamMembers returns all team members for the tenant
// GET /api/v1/team
func (h *Handler) ListTeamMembers(w http.ResponseWriter, r *http.Request) {
	tenantID, err := parseTenantID(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant")
		return
	}

	members, err := h.repo.GetTeamMembers(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch team members")
		return
	}

	// Get tenant for plan info
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch tenant")
		return
	}

	// Count active members (excluding revoked)
	activeCount := 0
	for _, m := range members {
		if m.Status != models.TeamStatusRevoked {
			activeCount++
		}
	}

	// Build response
	response := map[string]interface{}{
		"members":    members,
		"seat_count": activeCount,
		"seat_limit": models.GetSeatLimit(tenant.PlanType),
		"plan_type":  tenant.PlanType,
	}

	respondJSON(w, http.StatusOK, response)
}

// InviteUser creates a new team member invite
// POST /api/v1/team/invite
func (h *Handler) InviteUser(w http.ResponseWriter, r *http.Request) {
	tenantID, err := parseTenantID(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant")
		return
	}

	// Parse request
	var req models.InviteUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "Valid email is required")
		return
	}

	// Validate role (cannot assign OWNER role)
	if !models.IsValidTeamRole(req.Role) {
		respondError(w, http.StatusBadRequest, "Invalid role. Must be ADMIN, MEMBER, or VIEWER")
		return
	}

	// Get tenant for plan check
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch tenant")
		return
	}

	// SEAT LIMIT CHECK (P0 Feature)
	currentCount, err := h.repo.CountTeamMembers(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to count team members")
		return
	}

	seatLimit := models.GetSeatLimit(tenant.PlanType)
	if currentCount >= seatLimit {
		// Return structured 403 error for frontend handling
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(models.SeatLimitError{
			Error:      "seat_limit_reached",
			Message:    fmt.Sprintf("You have reached the %d-user limit for the %s plan. Please upgrade to invite more staff.", seatLimit, tenant.PlanType),
			UpgradeURL: "/billing",
		})
		return
	}

	// Check if email already exists in team
	existing, _ := h.repo.GetTeamMemberByEmail(r.Context(), tenantID, req.Email)
	if existing != nil {
		if existing.Status == models.TeamStatusRevoked {
			respondError(w, http.StatusConflict, "This email was previously revoked. Please contact support.")
			return
		}
		respondError(w, http.StatusConflict, "This email is already a team member")
		return
	}

	// Generate secure invite token
	token, err := generateSecureToken(32)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate invite token")
		return
	}

	// Create team member record
	expires := time.Now().Add(7 * 24 * time.Hour) // 7 days
	member := &models.TeamMember{
		ID:              uuid.New(),
		TenantID:        tenantID,
		Email:           req.Email,
		Role:            req.Role,
		Status:          models.TeamStatusPending,
		InviteToken:     token,
		InviteExpiresAt: &expires,
		CreatedAt:       time.Now(),
	}

	if err := h.repo.CreateTeamMember(r.Context(), member); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create invite")
		return
	}

	// TODO: Send invite email with token
	// For now, return the invite URL (dev mode)
	inviteURL := fmt.Sprintf("/invite?token=%s", token)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"message":    "Invitation sent successfully",
		"invite_url": inviteURL,
		"member":     member,
	})
}

// RemoveTeamMember removes a member from the team
// DELETE /api/v1/team/{id}
func (h *Handler) RemoveTeamMember(w http.ResponseWriter, r *http.Request) {
	tenantID, err := parseTenantID(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant")
		return
	}

	memberID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid member ID")
		return
	}

	// Verify member belongs to tenant
	member, err := h.repo.GetTeamMemberByID(r.Context(), memberID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Team member not found")
		return
	}

	if member.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Cannot remove owner
	if member.Role == models.TeamRoleOwner {
		respondError(w, http.StatusForbidden, "Cannot remove the organization owner")
		return
	}

	// Revoke access (soft delete)
	if err := h.repo.DeleteTeamMember(r.Context(), memberID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to remove team member")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Team member removed successfully",
	})
}

// AcceptInvite accepts a team invitation
// POST /api/v1/team/accept
func (h *Handler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
	var req models.AcceptInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" {
		respondError(w, http.StatusBadRequest, "Invite token is required")
		return
	}

	// Get invite by token
	member, err := h.repo.GetTeamMemberByToken(r.Context(), req.Token)
	if err != nil {
		respondError(w, http.StatusNotFound, "Invalid or expired invitation")
		return
	}

	// Check if already accepted
	if member.Status == models.TeamStatusActive {
		respondError(w, http.StatusConflict, "This invitation has already been accepted")
		return
	}

	// Check expiration
	if member.InviteExpiresAt != nil && time.Now().After(*member.InviteExpiresAt) {
		respondError(w, http.StatusGone, "This invitation has expired")
		return
	}

	// Check if tenant (user) with this email already exists
	// We use QueryRow inside repository but expose via GetTenantByEmail
	existingUser, _ := h.repo.GetTenantByEmail(r.Context(), member.Email)

	var userID uuid.UUID
	if existingUser != nil {
		// User exists - link them to the team
		userID = existingUser.ID
		// Activate the team member
		if err := h.repo.UpdateTeamMemberStatus(r.Context(), member.ID, models.TeamStatusActive, &userID); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to accept invitation")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "Invitation accepted successfully",
		})
	} else {
		// New user - they need to register first
		// For now, return a message directing them to register
		respondJSON(w, http.StatusAccepted, map[string]interface{}{
			"status":       "registration_required",
			"message":      "Please complete registration to accept this invitation",
			"email":        member.Email,
			"register_url": fmt.Sprintf("/register?email=%s&invite=%s", member.Email, req.Token),
		})
	}
}

// UpdateTeamMemberRole updates a member's role
// PUT /api/v1/team/{id}/role
func (h *Handler) UpdateTeamMemberRole(w http.ResponseWriter, r *http.Request) {
	tenantID, err := parseTenantID(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant")
		return
	}

	memberID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid member ID")
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if !models.IsValidTeamRole(req.Role) {
		respondError(w, http.StatusBadRequest, "Invalid role")
		return
	}

	// Verify member belongs to tenant
	member, err := h.repo.GetTeamMemberByID(r.Context(), memberID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Team member not found")
		return
	}

	if member.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if member.Role == models.TeamRoleOwner {
		respondError(w, http.StatusForbidden, "Cannot change owner role")
		return
	}

	if err := h.repo.UpdateTeamMemberRole(r.Context(), memberID, req.Role); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update role")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Role updated successfully",
	})
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
