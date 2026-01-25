package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// ============================================================================
// REWARD LEDGER REPOSITORY METHODS (POINTS COUNTER ONLY)
// ============================================================================

// CreateRewardEntry records a points earning event
func (r *Repository) CreateRewardEntry(ctx context.Context, entry *models.RewardLedger) error {
	query := `
		INSERT INTO public.reward_ledger (id, tenant_id, recipient_email, passport_uuid, action_type, points_earned, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	if entry.ID == uuid.Nil {
		entry.ID = uuid.New()
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}

	metadataJSON, err := json.Marshal(entry.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	_, err = r.db.Pool.Exec(ctx, query,
		entry.ID,
		entry.TenantID,
		entry.RecipientEmail,
		entry.PassportUUID,
		entry.ActionType,
		entry.PointsEarned,
		metadataJSON,
		entry.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create reward entry: %w", err)
	}
	return nil
}

// GetRewardBalance gets the aggregated reward balance for a user
func (r *Repository) GetRewardBalance(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error) {
	// Use the view we created in migration
	query := `
		SELECT 
			tenant_id,
			recipient_email,
			COALESCE(total_points, 0) as total_points,
			COALESCE(install_count, 0) as install_count,
			COALESCE(recycle_count, 0) as recycle_count,
			COALESCE(return_count, 0) as return_count,
			COALESCE(last_activity, NOW()) as last_activity
		FROM public.reward_balances
		WHERE tenant_id = $1 AND recipient_email = $2
	`
	balance := &models.RewardBalance{}
	err := r.db.Pool.QueryRow(ctx, query, tenantID, email).Scan(
		&balance.TenantID,
		&balance.RecipientEmail,
		&balance.TotalPoints,
		&balance.InstallCount,
		&balance.RecycleCount,
		&balance.ReturnCount,
		&balance.LastActivity,
	)
	if err != nil {
		// If no rows, return zero balance
		return &models.RewardBalance{
			TenantID:       tenantID,
			RecipientEmail: email,
			TotalPoints:    0,
			InstallCount:   0,
			RecycleCount:   0,
			ReturnCount:    0,
			LastActivity:   time.Now(),
			LoyaltyLevel:   models.GetLoyaltyLevel(0),
		}, nil
	}
	return balance, nil
}

// GetRewardLeaderboard gets top earners for a tenant
func (r *Repository) GetRewardLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error) {
	query := `
		SELECT 
			tenant_id,
			recipient_email,
			COALESCE(total_points, 0) as total_points,
			COALESCE(install_count, 0) as install_count,
			COALESCE(recycle_count, 0) as recycle_count,
			COALESCE(return_count, 0) as return_count,
			COALESCE(last_activity, NOW()) as last_activity
		FROM public.reward_balances
		WHERE tenant_id = $1
		ORDER BY total_points DESC
		LIMIT $2
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}
	defer rows.Close()

	var leaderboard []*models.RewardBalance
	for rows.Next() {
		balance := &models.RewardBalance{}
		if err := rows.Scan(
			&balance.TenantID,
			&balance.RecipientEmail,
			&balance.TotalPoints,
			&balance.InstallCount,
			&balance.RecycleCount,
			&balance.ReturnCount,
			&balance.LastActivity,
		); err != nil {
			return nil, fmt.Errorf("failed to scan leaderboard entry: %w", err)
		}
		leaderboard = append(leaderboard, balance)
	}
	return leaderboard, nil
}

// GetRewardHistory gets the reward transaction history for a user
func (r *Repository) GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error) {
	query := `
		SELECT id, tenant_id, recipient_email, passport_uuid, action_type, points_earned, metadata, created_at
		FROM public.reward_ledger
		WHERE tenant_id = $1 AND recipient_email = $2
		ORDER BY created_at DESC
		LIMIT $3
	`
	rows, err := r.db.Pool.Query(ctx, query, tenantID, email, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get reward history: %w", err)
	}
	defer rows.Close()

	var entries []*models.RewardLedger
	for rows.Next() {
		entry := &models.RewardLedger{}
		var metadataJSON []byte
		if err := rows.Scan(
			&entry.ID,
			&entry.TenantID,
			&entry.RecipientEmail,
			&entry.PassportUUID,
			&entry.ActionType,
			&entry.PointsEarned,
			&metadataJSON,
			&entry.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan reward entry: %w", err)
		}
		if len(metadataJSON) > 0 {
			_ = json.Unmarshal(metadataJSON, &entry.Metadata)
		}
		entries = append(entries, entry)
	}
	return entries, nil
}
