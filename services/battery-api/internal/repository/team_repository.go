package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

// ============================================================================
// TEAM MEMBER REPOSITORY
// ============================================================================

// CountTeamMembers returns the number of team members for a tenant
func (r *Repository) CountTeamMembers(ctx context.Context, tenantID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM team_members WHERE tenant_id = $1 AND status != 'REVOKED'`
	err := r.db.Pool.QueryRow(ctx, query, tenantID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count team members: %w", err)
	}
	return count, nil
}

// CreateTeamMember creates a new team member (pending invite)
func (r *Repository) CreateTeamMember(ctx context.Context, member *models.TeamMember) error {
	query := `INSERT INTO team_members (id, tenant_id, email, role, status, invite_token, invite_expires_at, user_id, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Pool.Exec(ctx, query,
		member.ID,
		member.TenantID,
		member.Email,
		member.Role,
		member.Status,
		member.InviteToken,
		member.InviteExpiresAt,
		member.UserID,
		member.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create team member: %w", err)
	}
	return nil
}

// GetTeamMembers returns all team members for a tenant
func (r *Repository) GetTeamMembers(ctx context.Context, tenantID uuid.UUID) ([]*models.TeamMember, error) {
	query := `SELECT id, tenant_id, email, role, status, user_id, created_at, accepted_at
	          FROM team_members 
	          WHERE tenant_id = $1 
	          ORDER BY 
	              CASE role WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'MEMBER' THEN 3 ELSE 4 END,
	              created_at ASC`

	rows, err := r.db.Pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get team members: %w", err)
	}
	defer rows.Close()

	var members []*models.TeamMember
	for rows.Next() {
		member := &models.TeamMember{}
		if err := rows.Scan(
			&member.ID,
			&member.TenantID,
			&member.Email,
			&member.Role,
			&member.Status,
			&member.UserID,
			&member.CreatedAt,
			&member.AcceptedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan team member: %w", err)
		}
		members = append(members, member)
	}

	return members, nil
}

// GetTeamMemberByToken retrieves a team member by their invite token
func (r *Repository) GetTeamMemberByToken(ctx context.Context, token string) (*models.TeamMember, error) {
	member := &models.TeamMember{}
	query := `SELECT id, tenant_id, email, role, status, invite_token, invite_expires_at, user_id, created_at, accepted_at
	          FROM team_members WHERE invite_token = $1`

	err := r.db.Pool.QueryRow(ctx, query, token).Scan(
		&member.ID,
		&member.TenantID,
		&member.Email,
		&member.Role,
		&member.Status,
		&member.InviteToken,
		&member.InviteExpiresAt,
		&member.UserID,
		&member.CreatedAt,
		&member.AcceptedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("invite not found: %w", err)
	}
	return member, nil
}

// GetTeamMemberByEmail retrieves a team member by tenant and email
func (r *Repository) GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error) {
	member := &models.TeamMember{}
	query := `SELECT id, tenant_id, email, role, status, user_id, created_at, accepted_at
	          FROM team_members WHERE tenant_id = $1 AND email = $2`

	err := r.db.Pool.QueryRow(ctx, query, tenantID, email).Scan(
		&member.ID,
		&member.TenantID,
		&member.Email,
		&member.Role,
		&member.Status,
		&member.UserID,
		&member.CreatedAt,
		&member.AcceptedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("team member not found: %w", err)
	}
	return member, nil
}

// GetUserIDByEmail returns the identity (users.id) for an email, if one exists.
func (r *Repository) GetUserIDByEmail(ctx context.Context, email string) (uuid.UUID, error) {
	var id uuid.UUID
	err := r.db.Pool.QueryRow(ctx, `SELECT id FROM public.users WHERE email = $1`, email).Scan(&id)
	if err != nil {
		return uuid.UUID{}, err
	}
	return id, nil
}

// UpdateTeamMemberStatus updates the status of a team member
func (r *Repository) UpdateTeamMemberStatus(ctx context.Context, id uuid.UUID, status string, userID *uuid.UUID) error {
	var query string
	var err error

	if status == models.TeamStatusActive {
		now := time.Now()
		query = `UPDATE team_members SET status = $1, user_id = $2, accepted_at = $3, invite_token = NULL WHERE id = $4`
		_, err = r.db.Pool.Exec(ctx, query, status, userID, now, id)
	} else {
		query = `UPDATE team_members SET status = $1 WHERE id = $2`
		_, err = r.db.Pool.Exec(ctx, query, status, id)
	}

	if err != nil {
		return fmt.Errorf("failed to update team member status: %w", err)
	}
	return nil
}

// UpdateTeamMemberRole updates the role of a team member
func (r *Repository) UpdateTeamMemberRole(ctx context.Context, id uuid.UUID, role string) error {
	query := `UPDATE team_members SET role = $1 WHERE id = $2`
	_, err := r.db.Pool.Exec(ctx, query, role, id)
	if err != nil {
		return fmt.Errorf("failed to update team member role: %w", err)
	}
	return nil
}

// DeleteTeamMember removes a team member (or revokes access)
func (r *Repository) DeleteTeamMember(ctx context.Context, id uuid.UUID) error {
	// Soft delete by setting status to REVOKED
	query := `UPDATE team_members SET status = 'REVOKED' WHERE id = $1`
	_, err := r.db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete team member: %w", err)
	}
	return nil
}

// GetTeamMemberByID retrieves a team member by ID
func (r *Repository) GetTeamMemberByID(ctx context.Context, id uuid.UUID) (*models.TeamMember, error) {
	member := &models.TeamMember{}
	query := `SELECT id, tenant_id, email, role, status, user_id, created_at, accepted_at
	          FROM team_members WHERE id = $1`

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&member.ID,
		&member.TenantID,
		&member.Email,
		&member.Role,
		&member.Status,
		&member.UserID,
		&member.CreatedAt,
		&member.AcceptedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("team member not found: %w", err)
	}
	return member, nil
}

// GetPendingInvitesByEmail retrieves all pending invites for a given email
func (r *Repository) GetPendingInvitesByEmail(ctx context.Context, email string) ([]models.TeamMember, error) {
	query := `SELECT id, tenant_id, email, role, status, invite_token, invite_expires_at, user_id, created_at
	          FROM team_members WHERE LOWER(email) = LOWER($1) AND status = 'PENDING'`

	rows, err := r.db.Pool.Query(ctx, query, email)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending invites: %w", err)
	}
	defer rows.Close()

	var invites []models.TeamMember
	for rows.Next() {
		var member models.TeamMember
		err := rows.Scan(
			&member.ID,
			&member.TenantID,
			&member.Email,
			&member.Role,
			&member.Status,
			&member.InviteToken,
			&member.InviteExpiresAt,
			&member.UserID,
			&member.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pending invite: %w", err)
		}
		invites = append(invites, member)
	}

	return invites, nil
}

// CreateTeamAuditLog inserts a new team action/change audit log entry.
func (r *Repository) CreateTeamAuditLog(ctx context.Context, log *models.TeamAuditLog) error {
	query := `INSERT INTO public.team_audit_log (id, tenant_id, actor_email, subject_email, action, old_role, new_role, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.Pool.Exec(ctx, query,
		log.ID,
		log.TenantID,
		log.ActorEmail,
		log.SubjectEmail,
		log.Action,
		log.OldRole,
		log.NewRole,
		log.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create team audit log: %w", err)
	}
	return nil
}
