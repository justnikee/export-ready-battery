package services

import (
	"context"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// ============================================================================
// REWARD SERVICE (POINTS COUNTER ONLY - NO PAYMENT GATEWAY)
// ============================================================================

// RewardService handles scan-to-earn gamification points
// This is a reputation/loyalty system - no cash out, just display
type RewardService struct {
	repo *repository.Repository
}

// NewRewardService creates a new reward service
func NewRewardService(repo *repository.Repository) *RewardService {
	return &RewardService{repo: repo}
}

// AwardPointsRequest represents a request to award points
type AwardPointsRequest struct {
	TenantID       uuid.UUID              `json:"tenant_id"`
	RecipientEmail string                 `json:"recipient_email"`
	PassportUUID   *uuid.UUID             `json:"passport_uuid,omitempty"`
	ActionType     string                 `json:"action_type"` // SCAN_INSTALL, SCAN_RECYCLE, SCAN_RETURN
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// AwardPointsResult contains the result of awarding points
type AwardPointsResult struct {
	Success      bool   `json:"success"`
	PointsEarned int    `json:"points_earned"`
	TotalPoints  int    `json:"total_points"`
	LoyaltyLevel string `json:"loyalty_level"`
	Error        string `json:"error,omitempty"`
}

// AwardPoints awards points for a specific action
func (s *RewardService) AwardPoints(ctx context.Context, req AwardPointsRequest) (*AwardPointsResult, error) {
	// Get points for this action type
	points, exists := models.RewardPoints[req.ActionType]
	if !exists {
		return &AwardPointsResult{
			Success: false,
			Error:   "Invalid action type: " + req.ActionType,
		}, nil
	}

	// Create ledger entry
	entry := &models.RewardLedger{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		RecipientEmail: req.RecipientEmail,
		PassportUUID:   req.PassportUUID,
		ActionType:     req.ActionType,
		PointsEarned:   points,
		Metadata:       req.Metadata,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.CreateRewardEntry(ctx, entry); err != nil {
		return &AwardPointsResult{
			Success: false,
			Error:   "Failed to record points: " + err.Error(),
		}, err
	}

	// Get updated balance
	balance, err := s.repo.GetRewardBalance(ctx, req.TenantID, req.RecipientEmail)
	if err != nil {
		// Points were awarded, but couldn't get balance - still success
		return &AwardPointsResult{
			Success:      true,
			PointsEarned: points,
			TotalPoints:  points, // Assume this is their first
			LoyaltyLevel: models.GetLoyaltyLevel(points),
		}, nil
	}

	return &AwardPointsResult{
		Success:      true,
		PointsEarned: points,
		TotalPoints:  balance.TotalPoints,
		LoyaltyLevel: models.GetLoyaltyLevel(balance.TotalPoints),
	}, nil
}

// GetUserRewards gets reward balance and history for a user
func (s *RewardService) GetUserRewards(ctx context.Context, tenantID uuid.UUID, email string) (*models.RewardBalance, error) {
	balance, err := s.repo.GetRewardBalance(ctx, tenantID, email)
	if err != nil {
		return nil, err
	}

	// Add computed loyalty level
	balance.LoyaltyLevel = models.GetLoyaltyLevel(balance.TotalPoints)

	return balance, nil
}

// GetLeaderboard gets top earners for a tenant
func (s *RewardService) GetLeaderboard(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.RewardBalance, error) {
	if limit <= 0 {
		limit = 10 // Default
	}
	if limit > 100 {
		limit = 100 // Max
	}

	leaderboard, err := s.repo.GetRewardLeaderboard(ctx, tenantID, limit)
	if err != nil {
		return nil, err
	}

	// Add loyalty levels
	for _, entry := range leaderboard {
		entry.LoyaltyLevel = models.GetLoyaltyLevel(entry.TotalPoints)
	}

	return leaderboard, nil
}

// AwardInstallPoints is a convenience method for SCAN_INSTALL
func (s *RewardService) AwardInstallPoints(ctx context.Context, tenantID uuid.UUID, email string, passportUUID uuid.UUID) (*AwardPointsResult, error) {
	return s.AwardPoints(ctx, AwardPointsRequest{
		TenantID:       tenantID,
		RecipientEmail: email,
		PassportUUID:   &passportUUID,
		ActionType:     models.RewardActionScanInstall,
	})
}

// AwardRecyclePoints is a convenience method for SCAN_RECYCLE
func (s *RewardService) AwardRecyclePoints(ctx context.Context, tenantID uuid.UUID, email string, passportUUID uuid.UUID) (*AwardPointsResult, error) {
	return s.AwardPoints(ctx, AwardPointsRequest{
		TenantID:       tenantID,
		RecipientEmail: email,
		PassportUUID:   &passportUUID,
		ActionType:     models.RewardActionScanRecycle,
	})
}

// AwardReturnPoints is a convenience method for SCAN_RETURN
func (s *RewardService) AwardReturnPoints(ctx context.Context, tenantID uuid.UUID, email string, passportUUID uuid.UUID) (*AwardPointsResult, error) {
	return s.AwardPoints(ctx, AwardPointsRequest{
		TenantID:       tenantID,
		RecipientEmail: email,
		PassportUUID:   &passportUUID,
		ActionType:     models.RewardActionScanReturn,
	})
}

// GetRewardHistory gets the reward transaction history for a user
func (s *RewardService) GetRewardHistory(ctx context.Context, tenantID uuid.UUID, email string, limit int) ([]*models.RewardLedger, error) {
	if limit <= 0 {
		limit = 20 // Default
	}
	if limit > 100 {
		limit = 100 // Max
	}
	return s.repo.GetRewardHistory(ctx, tenantID, email, limit)
}
