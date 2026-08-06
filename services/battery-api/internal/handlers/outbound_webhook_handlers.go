package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

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

// CreateOutboundWebhookResponse includes the signing secret, which is shown
// exactly once at creation — OutboundWebhook.Secret is otherwise never
// serialized, mirroring how API keys are revealed once on creation.
type CreateOutboundWebhookResponse struct {
	*models.OutboundWebhook
	Secret string `json:"secret"`
}

// CreateOutboundWebhook handles POST /api/v1/outbound-webhooks
func (h *OutboundWebhookHandler) CreateOutboundWebhook(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if h.svc == nil {
		respondError(w, http.StatusServiceUnavailable, "Webhook service not available")
		return
	}

	var req models.CreateOutboundWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.EventTypes) == 0 {
		respondError(w, http.StatusBadRequest, "event_types list is required")
		return
	}

	// S-04: SSRF checks (scheme, private/metadata IPs, DNS, userinfo, prod HTTPS).
	if err := services.ValidateOutboundWebhookURL(req.URL); err != nil {
		respondError(w, http.StatusBadRequest, "invalid webhook url: "+err.Error())
		return
	}

	wh := &models.OutboundWebhook{
		ID:         uuid.New(),
		TenantID:   tenantID,
		URL:        strings.TrimSpace(req.URL),
		Secret:     strings.ReplaceAll(uuid.New().String(), "-", ""),
		EventTypes: req.EventTypes,
		IsActive:   true,
	}

	if err := h.svc.Create(r.Context(), wh); err != nil {
		// Validation errors should already be caught above; still map clearly.
		if strings.Contains(err.Error(), "invalid webhook url") {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create webhook")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"webhook": CreateOutboundWebhookResponse{OutboundWebhook: wh, Secret: wh.Secret},
		"message": "Outbound webhook registered. Save the secret now — it won't be shown again. Events will be POSTed to the URL with an X-Webhook-Signature HMAC-SHA256 header.",
	})
}

// ListOutboundWebhooks handles GET /api/v1/outbound-webhooks
func (h *OutboundWebhookHandler) ListOutboundWebhooks(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if h.svc == nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"webhooks": []interface{}{}})
		return
	}

	webhooks, err := h.svc.List(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list webhooks")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"webhooks": webhooks,
	})
}

// DeleteOutboundWebhook handles DELETE /api/v1/outbound-webhooks/{id}
func (h *OutboundWebhookHandler) DeleteOutboundWebhook(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	whIDStr := r.PathValue("id")
	whID, err := uuid.Parse(whIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid webhook ID")
		return
	}

	if h.svc == nil {
		respondError(w, http.StatusServiceUnavailable, "Webhook service not available")
		return
	}

	if err := h.svc.Delete(r.Context(), whID, tenantID); err != nil {
		respondError(w, http.StatusNotFound, "Webhook not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "webhook deleted",
	})
}

// GetWebhookDeliveries handles GET /api/v1/webhooks/{id}/deliveries
func (h *OutboundWebhookHandler) GetWebhookDeliveries(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	whIDStr := r.PathValue("id")
	whID, err := uuid.Parse(whIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid webhook ID")
		return
	}

	if h.svc == nil {
		respondError(w, http.StatusServiceUnavailable, "Webhook service not available")
		return
	}

	deliveries, err := h.svc.GetDeliveries(r.Context(), whID, tenantID, 50)
	if err != nil {
		respondError(w, http.StatusNotFound, "Webhook not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"deliveries": deliveries,
	})
}

// RetryWebhookDelivery handles POST /api/v1/webhooks/deliveries/{id}/retry
func (h *OutboundWebhookHandler) RetryWebhookDelivery(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	deliveryIDStr := r.PathValue("id")
	deliveryID, err := uuid.Parse(deliveryIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid delivery ID")
		return
	}

	if h.svc == nil {
		respondError(w, http.StatusServiceUnavailable, "Webhook service not available")
		return
	}

	delivery, err := h.svc.RetryDelivery(r.Context(), deliveryID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Delivery not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"delivery": delivery,
	})
}
