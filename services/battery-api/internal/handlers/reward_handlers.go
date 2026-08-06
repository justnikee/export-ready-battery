package handlers

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/anvayalabs/battery-api/internal/auth"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
)

// RewardHandler handles reward/gamification endpoints
type RewardHandler struct {
	rewardService *services.RewardService
	authService   *services.AuthService
	jwtSecret     string
}

// NewRewardHandler creates a new reward handler
func NewRewardHandler(rewardService *services.RewardService, authService *services.AuthService, jwtSecret string) *RewardHandler {
	return &RewardHandler{
		rewardService: rewardService,
		authService:   authService,
		jwtSecret:     jwtSecret,
	}
}

// getEmailFromToken tries magic link token first, then JWT from Authorization only.
func (h *RewardHandler) getEmailFromToken(r *http.Request) (string, error) {
	// Prefer Bearer for session JWT (never session JWT in query — S-06).
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if h.authService != nil {
			if jwtClaims, err := h.authService.ValidateToken(tokenString); err == nil {
				return jwtClaims.Email, nil
			}
		}
		// Bearer may also be a magic token presented as header
		if magicClaims, err := auth.ValidateMagicToken(tokenString, h.jwtSecret); err == nil {
			return magicClaims.Email, nil
		}
		return "", fmt.Errorf("invalid token")
	}

	// Query param: magic-link one-time tokens only (email deep links)
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		return "", fmt.Errorf("no token provided")
	}
	magicClaims, err := auth.ValidateMagicToken(tokenString, h.jwtSecret)
	if err == nil {
		return magicClaims.Email, nil
	}

	return "", fmt.Errorf("invalid token")
}

// GetBalance handles GET /api/v1/rewards/balance
// Returns the authenticated user's reward balance and loyalty level
func (h *RewardHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	email, err := h.getEmailFromToken(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	tenantID := uuid.Nil // Cross-tenant for mechanics

	// Get reward balance
	balance, err := h.rewardService.GetUserRewards(r.Context(), tenantID, email)
	if err != nil {
		slog.Error("Failed to get reward balance", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve rewards")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"email":         balance.RecipientEmail,
		"total_points":  balance.TotalPoints,
		"loyalty_level": balance.LoyaltyLevel,
		"stats": map[string]interface{}{
			"installations": balance.InstallCount,
			"recycles":      balance.RecycleCount,
			"returns":       balance.ReturnCount,
		},
		"last_activity": balance.LastActivity,
	})
}

// GetLeaderboard handles GET /api/v1/rewards/leaderboard
// Returns top earners (public endpoint, emails anonymized)
func (h *RewardHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	// Get limit from query param (default 10, max 50)
	limitStr := r.URL.Query().Get("limit")
	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	// Tenant ID from query or use global (uuid.Nil for cross-tenant)
	tenantIDStr := r.URL.Query().Get("tenant_id")
	tenantID := uuid.Nil
	if tenantIDStr != "" {
		if tid, err := uuid.Parse(tenantIDStr); err == nil {
			tenantID = tid
		}
	}

	leaderboard, err := h.rewardService.GetLeaderboard(r.Context(), tenantID, limit)
	if err != nil {
		slog.Error("Failed to get leaderboard", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}

	// Anonymize emails for public display
	var anonymizedLeaderboard []map[string]interface{}
	for i, entry := range leaderboard {
		anonymizedLeaderboard = append(anonymizedLeaderboard, map[string]interface{}{
			"rank":          i + 1,
			"email":         anonymizeEmail(entry.RecipientEmail),
			"total_points":  entry.TotalPoints,
			"loyalty_level": entry.LoyaltyLevel,
			"stats": map[string]interface{}{
				"installations": entry.InstallCount,
				"recycles":      entry.RecycleCount,
				"returns":       entry.ReturnCount,
			},
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"leaderboard": anonymizedLeaderboard,
		"count":       len(anonymizedLeaderboard),
	})
}

// GetHistory handles GET /api/v1/rewards/history
// Returns transaction history for authenticated user
func (h *RewardHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	email, err := h.getEmailFromToken(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Get limit from query param
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	tenantID := uuid.Nil // Cross-tenant for now

	history, err := h.rewardService.GetRewardHistory(r.Context(), tenantID, email, limit)
	if err != nil {
		slog.Error("Failed to get reward history", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve history")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"email":   email,
		"history": history,
		"count":   len(history),
	})
}

// GetConfig returns the reward point configuration (public, no auth required)
func (h *RewardHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"points": map[string]int{
			models.RewardActionScanInstall: models.RewardPoints[models.RewardActionScanInstall],
			models.RewardActionScanRecycle: models.RewardPoints[models.RewardActionScanRecycle],
			models.RewardActionScanReturn:  models.RewardPoints[models.RewardActionScanReturn],
		},
		"actions": []map[string]string{
			{"key": models.RewardActionScanInstall, "label": "Installation"},
			{"key": models.RewardActionScanRecycle, "label": "Recycling"},
			{"key": models.RewardActionScanReturn, "label": "Return"},
		},
	})
}

// anonymizeEmail masks the email for public display
// john.doe@company.com -> j***e@c***y.com
func anonymizeEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***@***.***"
	}

	local := parts[0]
	domain := parts[1]

	// Anonymize local part
	if len(local) <= 2 {
		local = local[:1] + "***"
	} else {
		local = local[:1] + "***" + local[len(local)-1:]
	}

	// Anonymize domain
	domainParts := strings.Split(domain, ".")
	if len(domainParts) >= 2 {
		domainName := domainParts[0]
		if len(domainName) <= 2 {
			domainName = domainName[:1] + "***"
		} else {
			domainName = domainName[:1] + "***" + domainName[len(domainName)-1:]
		}
		domainParts[0] = domainName
		domain = strings.Join(domainParts, ".")
	}

	return local + "@" + domain
}
