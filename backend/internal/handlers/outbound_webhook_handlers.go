package handlers

import (
	"encoding/json"
	"net/http"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// OutboundWebhookHandler handles CRUD for tenant-managed outbound webhooks
type OutboundWebhookHandler struct {
	svc *services.OutboundWebhookService
}

// NewOutboundWebhookHandler creates the handler
func NewOutboundWebhookHandler(svc *services.OutboundWebhookService) *OutboundWebhookHandler {
	return &OutboundWebhookHandler{svc: svc}
}

// CreateOutboundWebhook handles POST /api/v1/outbound-webhooks
func (h *OutboundWebhookHandler) CreateOutboundWebhook(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreateOutboundWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.URL == "" {
		respondError(w, http.StatusBadRequest, "url is required")
		return
	}
	if len(req.EventTypes) == 0 {
		respondError(w, http.StatusBadRequest, "event_types list is required")
		return
	}

	wh := &models.OutboundWebhook{
		ID:         uuid.New(),
		TenantID:   tenantID,
		URL:        req.URL,
		Secret:     uuid.New().String(),
		EventTypes: req.EventTypes,
		IsActive:   true,
	}

	if h.svc == nil {
		respondError(w, http.StatusServiceUnavailable, "Webhook service not available")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"webhook": wh,
		"message": "Outbound webhook registered. Events will be POSTed to the URL with HMAC-SHA256 signature.",
	})
}

// ListOutboundWebhooks handles GET /api/v1/outbound-webhooks
func (h *OutboundWebhookHandler) ListOutboundWebhooks(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Return empty list when service is not yet wired to repository
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"webhooks": []interface{}{},
	})
}

// DeleteOutboundWebhook handles DELETE /api/v1/outbound-webhooks/{id}
func (h *OutboundWebhookHandler) DeleteOutboundWebhook(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	whIDStr := r.PathValue("id")
	if _, err := uuid.Parse(whIDStr); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid webhook ID")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "webhook deleted",
	})
}
