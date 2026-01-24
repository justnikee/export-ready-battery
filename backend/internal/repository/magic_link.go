package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// CreateMagicLinkTokenRequest contains parameters for creating a magic link token record
type CreateMagicLinkTokenRequest struct {
	PassportID uuid.UUID
	Email      string
	Role       string
	TokenHash  string
	ExpiresAt  time.Time
}

// CreateMagicLinkToken stores a magic link token in the database for tracking
func (r *Repository) CreateMagicLinkToken(ctx context.Context, req CreateMagicLinkTokenRequest) error {
	query := `INSERT INTO magic_link_tokens (passport_id, email, role, token_hash, expires_at) 
	          VALUES ($1, $2, $3, $4, $5)`

	_, err := r.db.Pool.Exec(ctx, query,
		req.PassportID,
		req.Email,
		req.Role,
		req.TokenHash,
		req.ExpiresAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create magic link token: %w", err)
	}

	return nil
}

// MarkMagicTokenUsed marks a magic link token as used
func (r *Repository) MarkMagicTokenUsed(ctx context.Context, tokenHash string) error {
	query := `UPDATE magic_link_tokens SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL`

	_, err := r.db.Pool.Exec(ctx, query, tokenHash)
	if err != nil {
		return fmt.Errorf("failed to mark token as used: %w", err)
	}

	return nil
}

// IsMagicTokenUsed checks if a token has already been used
func (r *Repository) IsMagicTokenUsed(ctx context.Context, tokenHash string) (bool, error) {
	var usedAt *time.Time
	query := `SELECT used_at FROM magic_link_tokens WHERE token_hash = $1`

	err := r.db.Pool.QueryRow(ctx, query, tokenHash).Scan(&usedAt)
	if err != nil {
		// Token not found in DB means it wasn't tracked (still valid for stateless mode)
		return false, nil
	}

	return usedAt != nil, nil
}

// UpdatePassportOwner updates the current owner email on a passport
func (r *Repository) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, email string) error {
	query := `UPDATE passports SET current_owner_email = $1 WHERE uuid = $2`

	_, err := r.db.Pool.Exec(ctx, query, email, passportID)
	if err != nil {
		return fmt.Errorf("failed to update passport owner: %w", err)
	}

	return nil
}

// UpdatePassportRecycledAt sets the recycled_at timestamp
func (r *Repository) UpdatePassportRecycledAt(ctx context.Context, passportID uuid.UUID) error {
	query := `UPDATE passports SET recycled_at = NOW() WHERE uuid = $1`

	_, err := r.db.Pool.Exec(ctx, query, passportID)
	if err != nil {
		return fmt.Errorf("failed to update recycled_at: %w", err)
	}

	return nil
}

// CleanupExpiredMagicTokens removes expired tokens (for scheduled cleanup)
func (r *Repository) CleanupExpiredMagicTokens(ctx context.Context) (int, error) {
	query := `DELETE FROM magic_link_tokens WHERE expires_at < NOW()`

	result, err := r.db.Pool.Exec(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired tokens: %w", err)
	}

	return int(result.RowsAffected()), nil
}
