package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// CreateMagicLinkTokenRequest contains parameters for creating a magic link token record
type CreateMagicLinkTokenRequest struct {
	PassportID uuid.UUID
	Email      string
	Role       string
	Action     string
	TokenHash  string
	ExpiresAt  time.Time
}

// MagicLinkTokenRecord represents stored token state for validation.
type MagicLinkTokenRecord struct {
	PassportID  uuid.UUID
	Email       string
	Role        string
	Action      string
	ExpiresAt   time.Time
	UsedAt      *time.Time
	RequiresOTP bool
}

// CreateMagicLinkToken stores a magic link token in the database for tracking
func (r *Repository) CreateMagicLinkToken(ctx context.Context, req CreateMagicLinkTokenRequest) error {
	query := `INSERT INTO magic_link_tokens (passport_id, email, role, action, token_hash, expires_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.db.Pool.Exec(ctx, query,
		req.PassportID,
		req.Email,
		req.Role,
		req.Action,
		req.TokenHash,
		req.ExpiresAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create magic link token: %w", err)
	}

	return nil
}

// GetMagicLinkTokenByHash fetches token state for validation.
func (r *Repository) GetMagicLinkTokenByHash(ctx context.Context, tokenHash string) (*MagicLinkTokenRecord, error) {
	query := `SELECT passport_id, email, role, action, expires_at, used_at,
	                 COALESCE(requires_otp, false)
	          FROM magic_link_tokens
	          WHERE token_hash = $1`

	var record MagicLinkTokenRecord
	err := r.db.Pool.QueryRow(ctx, query, tokenHash).Scan(
		&record.PassportID,
		&record.Email,
		&record.Role,
		&record.Action,
		&record.ExpiresAt,
		&record.UsedAt,
		&record.RequiresOTP,
	)
	if isUndefinedColumnError(err, "requires_otp") {
		legacyQuery := `SELECT passport_id, email, role, action, expires_at, used_at
			FROM magic_link_tokens
			WHERE token_hash = $1`
		legacyErr := r.db.Pool.QueryRow(ctx, legacyQuery, tokenHash).Scan(
			&record.PassportID,
			&record.Email,
			&record.Role,
			&record.Action,
			&record.ExpiresAt,
			&record.UsedAt,
		)
		if legacyErr == pgx.ErrNoRows {
			return nil, nil
		}
		if legacyErr != nil {
			return nil, fmt.Errorf("failed to fetch legacy magic link token: %w", legacyErr)
		}
		record.RequiresOTP = false
		return &record, nil
	}
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch magic link token: %w", err)
	}
	return &record, nil
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
	query := `UPDATE passports SET current_owner_email = $1, current_owner_identifier = $1 WHERE uuid = $2`

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

// ============================================================================
// Phase 7 — OTP repository helpers
// ============================================================================

// OTPRecord holds OTP state fetched from magic_link_otp.
type OTPRecord struct {
	ID                 uuid.UUID
	MagicLinkTokenHash string
	OTPHash            string
	AttemptCount       int
	MaxAttempts        int
	LastResentAt       *time.Time
	ResendCount        int
	MaxResends         int
	CreatedAt          time.Time
	UsedAt             *time.Time
}

// CreateMagicLinkOTP inserts a new OTP challenge row.
func (r *Repository) CreateMagicLinkOTP(ctx context.Context, tokenHash, otpHash string) error {
	_, err := r.db.Pool.Exec(ctx,
		`INSERT INTO magic_link_otp (magic_link_token_hash, otp_hash)
		 VALUES ($1, $2)
		 ON CONFLICT DO NOTHING`,
		tokenHash, otpHash,
	)
	return err
}

// GetMagicLinkOTP fetches the active OTP record for a token hash.
// Returns nil, nil if not found.
func (r *Repository) GetMagicLinkOTP(ctx context.Context, tokenHash string) (*OTPRecord, error) {
	row := r.db.Pool.QueryRow(ctx,
		`SELECT id, magic_link_token_hash, otp_hash,
		        attempt_count, max_attempts,
		        last_resent_at, resend_count, max_resends,
		        created_at, used_at
		 FROM   magic_link_otp
		 WHERE  magic_link_token_hash = $1
		   AND  used_at IS NULL
		 ORDER  BY created_at DESC
		 LIMIT  1`,
		tokenHash,
	)
	var rec OTPRecord
	err := row.Scan(
		&rec.ID, &rec.MagicLinkTokenHash, &rec.OTPHash,
		&rec.AttemptCount, &rec.MaxAttempts,
		&rec.LastResentAt, &rec.ResendCount, &rec.MaxResends,
		&rec.CreatedAt, &rec.UsedAt,
	)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

// IncrementOTPAttempt increments the attempt count for an OTP record.
func (r *Repository) IncrementOTPAttempt(ctx context.Context, otpID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE magic_link_otp SET attempt_count = attempt_count + 1 WHERE id = $1`,
		otpID,
	)
	return err
}

// MarkOTPUsed marks an OTP as consumed.
func (r *Repository) MarkOTPUsed(ctx context.Context, otpID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE magic_link_otp SET used_at = NOW() WHERE id = $1`,
		otpID,
	)
	return err
}

// RecordOTPResend bumps resend_count and updates last_resent_at.
func (r *Repository) RecordOTPResend(ctx context.Context, otpID uuid.UUID) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE magic_link_otp
		 SET    resend_count = resend_count + 1,
		        last_resent_at = NOW()
		 WHERE  id = $1`,
		otpID,
	)
	return err
}

// ReplaceOTP deletes any existing unused OTP for the token hash and inserts a new one.
func (r *Repository) ReplaceOTP(ctx context.Context, tokenHash, newOTPHash string) error {
	_, err := r.db.Pool.Exec(ctx,
		`DELETE FROM magic_link_otp WHERE magic_link_token_hash = $1 AND used_at IS NULL`,
		tokenHash,
	)
	if err != nil {
		return err
	}
	return r.CreateMagicLinkOTP(ctx, tokenHash, newOTPHash)
}

// SetRequiresOTP sets requires_otp on a magic_link_tokens row.
func (r *Repository) SetRequiresOTP(ctx context.Context, tokenHash string, required bool) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE magic_link_tokens SET requires_otp = $1 WHERE token_hash = $2`,
		required, tokenHash,
	)
	if isUndefinedColumnError(err, "requires_otp") {
		return nil
	}
	return err
}

func isUndefinedColumnError(err error, columnName string) bool {
	if err == nil {
		return false
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "42703" && strings.EqualFold(pgErr.ColumnName, columnName)
	}

	return strings.Contains(strings.ToLower(err.Error()), strings.ToLower(columnName))
}

// CleanupExpiredOTPs removes OTP records older than 30 minutes.
func (r *Repository) CleanupExpiredOTPs(ctx context.Context) error {
	_, err := r.db.Pool.Exec(ctx,
		`DELETE FROM magic_link_otp WHERE created_at < NOW() - INTERVAL '30 minutes'`,
	)
	return err
}
