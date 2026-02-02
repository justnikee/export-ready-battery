package models

import (
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// PLAN TYPES & SEAT LIMITS
// ============================================================================

const (
	PlanTypeStarter    = "STARTER"
	PlanTypeGrowth     = "GROWTH"
	PlanTypeEnterprise = "ENTERPRISE"
)

// PlanSeatLimits defines the maximum number of team members per plan
var PlanSeatLimits = map[string]int{
	PlanTypeStarter:    2,
	PlanTypeGrowth:     10,
	PlanTypeEnterprise: 100,
}

// GetSeatLimit returns the seat limit for a given plan type
func GetSeatLimit(planType string) int {
	if limit, ok := PlanSeatLimits[planType]; ok {
		return limit
	}
	return PlanSeatLimits[PlanTypeStarter] // Default to starter
}

// ============================================================================
// TEAM MEMBER ROLES
// ============================================================================

const (
	TeamRoleOwner  = "OWNER"  // Full access, can delete org, manage billing
	TeamRoleAdmin  = "ADMIN"  // Manage team, full data access
	TeamRoleMember = "MEMBER" // Create/edit batches, standard access
	TeamRoleViewer = "VIEWER" // Read-only access
)

// ============================================================================
// TEAM MEMBER STATUS
// ============================================================================

const (
	TeamStatusPending = "PENDING" // Invite sent, not yet accepted
	TeamStatusActive  = "ACTIVE"  // Accepted and active
	TeamStatusRevoked = "REVOKED" // Access revoked
)

// ============================================================================
// TEAM MEMBER MODEL
// ============================================================================

// TeamMember represents a user within a tenant organization
type TeamMember struct {
	ID              uuid.UUID  `json:"id"`
	TenantID        uuid.UUID  `json:"tenant_id"`
	Email           string     `json:"email"`
	Role            string     `json:"role"`   // OWNER, ADMIN, MEMBER, VIEWER
	Status          string     `json:"status"` // PENDING, ACTIVE, REVOKED
	InviteToken     string     `json:"-"`      // Hidden from JSON
	InviteExpiresAt *time.Time `json:"-"`      // Hidden from JSON
	UserID          *uuid.UUID `json:"user_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	AcceptedAt      *time.Time `json:"accepted_at,omitempty"`
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

// InviteUserRequest is the payload for inviting a team member
type InviteUserRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"` // ADMIN, MEMBER, VIEWER (not OWNER)
}

// AcceptInviteRequest is the payload for accepting an invitation
type AcceptInviteRequest struct {
	Token    string `json:"token"`
	Password string `json:"password,omitempty"` // If new user needs to set password
}

// TeamMemberResponse is used for API responses
type TeamMemberResponse struct {
	ID         uuid.UUID  `json:"id"`
	Email      string     `json:"email"`
	Role       string     `json:"role"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`
}

// SeatLimitError represents the structured error for seat limits
type SeatLimitError struct {
	Error      string `json:"error"`
	Message    string `json:"message"`
	UpgradeURL string `json:"upgrade_url"`
}

// IsValidTeamRole checks if a role is valid for invites (excludes OWNER)
func IsValidTeamRole(role string) bool {
	switch role {
	case TeamRoleAdmin, TeamRoleMember, TeamRoleViewer:
		return true
	}
	return false
}
