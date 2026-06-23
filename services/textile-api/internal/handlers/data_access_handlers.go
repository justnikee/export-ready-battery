package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/anvayalabs/textile-api/internal/middleware"
	"github.com/anvayalabs/textile-api/internal/repository"
	"github.com/anvayalabs/textile-api/internal/services"

	"github.com/google/uuid"
)

// DataAccessHandler handles data access token management endpoints.
type DataAccessHandler struct {
	service *services.DataAccessService
}

// NewDataAccessHandler creates a new DataAccessHandler.
func NewDataAccessHandler(service *services.DataAccessService) *DataAccessHandler {
	return &DataAccessHandler{service: service}
}

// createTokenRequest is the JSON request body for creating a data access token.
type createTokenRequest struct {
	Label       string `json:"label"`
	GranteeName string `json:"grantee_name"`
	GranteeOrg  string `json:"grantee_org,omitempty"`
	AccessTier  string `json:"access_tier"`          // PARTNER or REGULATOR
	ExpiresIn   string `json:"expires_in,omitempty"` // e.g. "720h" for 30 days, "8760h" for 1 year
}

// CreateToken handles POST /api/v1/data-access/tokens
func (h *DataAccessHandler) CreateToken(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	var req createTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Label == "" || req.GranteeName == "" {
		respondError(w, http.StatusBadRequest, "label and grantee_name are required")
		return
	}

	tier := strings.ToUpper(req.AccessTier)
	if tier != "PARTNER" && tier != "REGULATOR" {
		respondError(w, http.StatusBadRequest, "access_tier must be PARTNER or REGULATOR")
		return
	}

	var expiresIn *time.Duration
	if req.ExpiresIn != "" {
		d, err := time.ParseDuration(req.ExpiresIn)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid expires_in format (use Go duration e.g. 720h)")
			return
		}
		expiresIn = &d
	}

	result, err := h.service.GenerateToken(r.Context(), services.CreateDataAccessTokenRequest{
		TenantID:    tenantID,
		Label:       req.Label,
		GranteeName: req.GranteeName,
		GranteeOrg:  req.GranteeOrg,
		AccessTier:  tier,
		ExpiresIn:   expiresIn,
	})
	if err != nil {
		slog.Error("Failed to create data access token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create token")
		return
	}

	respondJSON(w, http.StatusCreated, result)
}

// ListTokens handles GET /api/v1/data-access/tokens
func (h *DataAccessHandler) ListTokens(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	tokens, err := h.service.ListTokens(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to list data access tokens", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list tokens")
		return
	}

	// Avoid null in JSON response
	if tokens == nil {
		tokens = make([]*repository.DataAccessToken, 0)
	}
	respondJSON(w, http.StatusOK, tokens)
}

// RevokeToken handles DELETE /api/v1/data-access/tokens/{id}
func (h *DataAccessHandler) RevokeToken(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	idStr := r.PathValue("id")
	tokenID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid token ID")
		return
	}

	if err := h.service.RevokeToken(r.Context(), tokenID, tenantID); err != nil {
		slog.Error("Failed to revoke data access token", "error", err, "id", idStr)
		respondError(w, http.StatusInternalServerError, "Failed to revoke token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Token revoked successfully"})
}
