package models

import (
	"time"

	"github.com/google/uuid"
)

// TeamAuditLog represents a log entry of a team membership action/change.
type TeamAuditLog struct {
	ID           uuid.UUID `json:"id"`
	TenantID     uuid.UUID `json:"tenant_id"`
	ActorEmail   string    `json:"actor_email"`
	SubjectEmail string    `json:"subject_email"`
	Action       string    `json:"action"` // INVITE, ROLE_CHANGE, REMOVE, ACCEPT
	OldRole      *string   `json:"old_role,omitempty"`
	NewRole      *string   `json:"new_role,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
