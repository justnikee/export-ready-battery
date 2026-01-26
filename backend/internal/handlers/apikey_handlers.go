package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// ============================================================================
// API KEY HANDLERS
// ============================================================================

// CreateAPIKey handles POST /api/v1/api-keys
func (h *Handler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate name
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	// Validate scope
	if req.Scope == "" {
		req.Scope = "read"
	}
	if !models.IsValidScope(req.Scope) {
		respondError(w, http.StatusBadRequest, "Invalid scope. Must be 'read' or 'write'")
		return
	}

	// Validate rate limit tier
	if req.RateLimitTier == "" {
		req.RateLimitTier = "starter"
	}
	if req.RateLimitTier != "starter" && req.RateLimitTier != "production" {
		respondError(w, http.StatusBadRequest, "Invalid rate_limit_tier. Must be 'starter' or 'production'")
		return
	}

	// Get tenant ID
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Generate key
	keyService := services.NewAPIKeyService()
	fullKey, prefix, err := keyService.GenerateKey()
	if err != nil {
		log.Printf("Failed to generate API key: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate API key")
		return
	}

	// Hash key
	keyHash, err := keyService.HashKey(fullKey)
	if err != nil {
		log.Printf("Failed to hash API key: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create API key")
		return
	}

	// Calculate expiration
	var expiresAt *time.Time
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		expires := time.Now().AddDate(0, 0, *req.ExpiresInDays)
		expiresAt = &expires
	}

	// Create API key record
	apiKey := &models.APIKey{
		ID:            uuid.New(),
		TenantID:      tenantID,
		Name:          req.Name,
		KeyHash:       keyHash,
		KeyPrefix:     prefix,
		Scope:         req.Scope,
		RateLimitTier: req.RateLimitTier,
		ExpiresAt:     expiresAt,
		IsActive:      true,
		CreatedAt:     time.Now(),
	}

	if err := h.repo.CreateAPIKey(r.Context(), apiKey); err != nil {
		log.Printf("Failed to save API key: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create API key")
		return
	}

	log.Printf("🔑 API key created: %s (tenant: %s, scope: %s)", req.Name, tenantIDStr[:8], req.Scope)

	// Return key with full key (only time it's shown)
	respondJSON(w, http.StatusCreated, models.APIKeyWithSecret{
		APIKey: *apiKey,
		Key:    fullKey,
	})
}

// ListAPIKeys handles GET /api/v1/api-keys
func (h *Handler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	keys, err := h.repo.ListAPIKeys(r.Context(), tenantID)
	if err != nil {
		log.Printf("Failed to list API keys: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to list API keys")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"api_keys": keys,
		"count":    len(keys),
	})
}

// GetAPIKey handles GET /api/v1/api-keys/{id}
func (h *Handler) GetAPIKey(w http.ResponseWriter, r *http.Request) {
	keyIDStr := r.PathValue("id")
	keyID, err := uuid.Parse(keyIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid API key ID")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	apiKey, err := h.repo.GetAPIKeyByID(r.Context(), keyID)
	if err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}

	// Verify ownership
	if apiKey.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"api_key": apiKey,
	})
}

// UpdateAPIKey handles PATCH /api/v1/api-keys/{id}
func (h *Handler) UpdateAPIKey(w http.ResponseWriter, r *http.Request) {
	keyIDStr := r.PathValue("id")
	keyID, err := uuid.Parse(keyIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid API key ID")
		return
	}

	var req models.UpdateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Verify ownership
	apiKey, err := h.repo.GetAPIKeyByID(r.Context(), keyID)
	if err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}
	if apiKey.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if err := h.repo.UpdateAPIKey(r.Context(), keyID, req.Name, req.IsActive); err != nil {
		log.Printf("Failed to update API key: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to update API key")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "API key updated",
	})
}

// DeleteAPIKey handles DELETE /api/v1/api-keys/{id}
func (h *Handler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	keyIDStr := r.PathValue("id")
	keyID, err := uuid.Parse(keyIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid API key ID")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Verify ownership
	apiKey, err := h.repo.GetAPIKeyByID(r.Context(), keyID)
	if err != nil {
		respondError(w, http.StatusNotFound, "API key not found")
		return
	}
	if apiKey.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if err := h.repo.DeleteAPIKey(r.Context(), keyID); err != nil {
		log.Printf("Failed to delete API key: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete API key")
		return
	}

	log.Printf("🗑️ API key deleted: %s (tenant: %s)", apiKey.Name, tenantIDStr[:8])

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "API key deleted",
	})
}
