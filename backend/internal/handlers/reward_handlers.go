package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"exportready-battery/internal/auth"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// RewardHandler handles reward/gamification endpoints
type RewardHandler struct {
	rewardService *services.RewardService
	jwtSecret     string
}

// NewRewardHandler creates a new reward handler
func NewRewardHandler(rewardService *services.RewardService, jwtSecret string) *RewardHandler {
	return &RewardHandler{
		rewardService: rewardService,
		jwtSecret:     jwtSecret,
	}
}

// GetBalance handles GET /api/v1/rewards/balance
// Returns the authenticated user's reward balance and loyalty level
func (h *RewardHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	// Extract token from Authorization header or query param
	tokenString := extractToken(r)
	if tokenString == "" {
		respondError(w, http.StatusUnauthorized, "Authentication required. Use magic link token.")
		return
	}

	// Validate magic link token
	claims, err := auth.ValidateMagicToken(tokenString, h.jwtSecret)
	if err != nil {
		log.Printf("Token validation failed: %v", err)
		respondError(w, http.StatusUnauthorized, "Invalid or expired token")
		return
	}

	// Get tenant ID from passport (if needed) - for now use email only
	// In production, you might want to scope rewards by tenant
	tenantID := uuid.Nil // Placeholder - rewards are cross-tenant for mechanics

	// Get reward balance
	balance, err := h.rewardService.GetUserRewards(r.Context(), tenantID, claims.Email)
	if err != nil {
		log.Printf("Failed to get reward balance: %v", err)
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
		log.Printf("Failed to get leaderboard: %v", err)
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
	// Extract token from Authorization header
	tokenString := extractToken(r)
	if tokenString == "" {
		respondError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	claims, err := auth.ValidateMagicToken(tokenString, h.jwtSecret)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid or expired token")
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

	history, err := h.rewardService.GetRewardHistory(r.Context(), tenantID, claims.Email, limit)
	if err != nil {
		log.Printf("Failed to get reward history: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve history")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"email":   claims.Email,
		"history": history,
		"count":   len(history),
	})
}

// extractToken extracts JWT from header or query param
func extractToken(r *http.Request) string {
	// Try Authorization header first
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Try query param
	return r.URL.Query().Get("token")
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
