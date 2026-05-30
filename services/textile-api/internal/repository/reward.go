package repository

import (
	"context"
	"fmt"

	"github.com/anvayalabs/textile-api/internal/models"

	"github.com/google/uuid"
)

// ============================================================================
// REWARD LEDGER REPOSITORY METHODS (NOT IMPLEMENTED FOR TEXTILE)
// ============================================================================

// CreateRewardEntry records a points earning event
func (r *Repository) CreateRewardEntry(ctx context.Context, entry *models.RewardLedger) error {
	return fmt.Errorf("rewards are not implemented for textile products")
}

// GetRewardBalance gets the aggregated reward balance for a user
func (r *Repository) GetRewardBalance(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error) {
	return nil, fmt.Errorf("rewards are not implemented for textile products")
}

// GetRewardLeaderboard gets top earners for a tenant
func (r *Repository) GetRewardLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error) {
	return nil, fmt.Errorf("rewards are not implemented for textile products")
}

// GetRewardHistory gets the reward transaction history for a user
func (r *Repository) GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error) {
	return nil, fmt.Errorf("rewards are not implemented for textile products")
}
