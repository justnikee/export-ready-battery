package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/logger"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

// WebhookHandler handles incoming webhooks from payment providers
type WebhookHandler struct {
	razorpayService *services.RazorpayService
	repo            interface {
		ApplyPaymentGrant(ctx context.Context, grant repository.PaymentGrant) (repository.PaymentGrantResult, error)
	}
}

func NewWebhookHandler(razorpay *services.RazorpayService, repo interface {
	ApplyPaymentGrant(ctx context.Context, grant repository.PaymentGrant) (repository.PaymentGrantResult, error)
}) *WebhookHandler {
	return &WebhookHandler{razorpayService: razorpay, repo: repo}
}

// RazorpayWebhook handles POST /api/v1/webhooks/razorpay
// This endpoint receives payment notifications directly from Razorpay servers
// and must verify the signature before processing
func (h *WebhookHandler) RazorpayWebhook(w http.ResponseWriter, r *http.Request) {
	if h.razorpayService == nil {
		http.Error(w, "Payments are not configured", http.StatusServiceUnavailable)
		return
	}
	// Read the raw request body for signature verification
	// Limit to 1MB to prevent DoS via oversized payloads
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	if err != nil {
		logger.Error("Failed to read webhook body", "error", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Get the signature from the header
	signature := r.Header.Get("X-Razorpay-Signature")
	if signature == "" {
		logger.Warn("Missing webhook signature header")
		http.Error(w, "Missing signature", http.StatusBadRequest)
		return
	}

	// Verify the webhook signature
	if !h.razorpayService.VerifyWebhookSignature(body, signature) {
		logger.Warn("Invalid webhook signature", "signature", signature[:min(16, len(signature))])
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// Parse the webhook event
	event, err := services.ParseWebhookEvent(body)
	if err != nil {
		logger.Error("Failed to parse webhook event", "error", err)
		http.Error(w, "Invalid event format", http.StatusBadRequest)
		return
	}

	// Log the incoming event
	logger.Info("Received Razorpay webhook",
		"event", event.Event,
		"payment_id", event.GetPaymentID(),
		"order_id", event.GetOrderID(),
	)

	// Handle different event types
	switch {
	case event.IsPaymentCaptured():
		h.handlePaymentCaptured(w, r, event)
	case event.IsPaymentFailed():
		h.handlePaymentFailed(w, r, event)
	default:
		// Acknowledge other events but don't process them
		logger.Debug("Ignoring unhandled webhook event", "event", event.Event)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ignored",
			"event":  event.Event,
		})
	}
}

// handlePaymentCaptured processes successful payment events
func (h *WebhookHandler) handlePaymentCaptured(w http.ResponseWriter, r *http.Request, event *services.WebhookEvent) {
	// The signed webhook identifies the payment. The fetched provider order is
	// authoritative for tenant, package and price, just as in browser verify.
	purchase, err := h.razorpayService.LookupCapturedPurchase(event.GetOrderID(), event.GetPaymentID())
	if err != nil {
		logger.Error("Could not validate captured payment", "payment_id", event.GetPaymentID(), "error", err)
		http.Error(w, "Payment validation unavailable", http.StatusBadGateway)
		return
	}
	tenantID, err := uuid.Parse(purchase.TenantID)
	if err != nil {
		logger.Error("Invalid provider order tenant", "order_id", event.GetOrderID())
		http.Error(w, "Invalid order tenant", http.StatusBadRequest)
		return
	}
	grant, err := paymentGrantForPurchase(tenantID, event.GetPaymentID(), purchase.Package)
	if err != nil {
		logger.Error("Invalid purchased package configuration", "package_id", purchase.PackageID, "error", err)
		http.Error(w, "Invalid package", http.StatusInternalServerError)
		return
	}
	result, err := h.repo.ApplyPaymentGrant(r.Context(), grant)
	if err != nil {
		logger.Error("Failed to fulfill captured payment", "payment_id", event.GetPaymentID(), "error", err)
		http.Error(w, "Payment fulfillment pending", http.StatusInternalServerError)
		return
	}
	status := "already_processed"
	quotaAdded := 0
	if result.Applied {
		status, quotaAdded = "success", grant.QuotaUnits
	}
	logger.Info("Processed captured payment", "tenant_id", purchase.TenantID, "payment_id", event.GetPaymentID(), "status", status)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": status, "quota_added": quotaAdded,
	})
}

// handlePaymentFailed logs failed payment events
func (h *WebhookHandler) handlePaymentFailed(w http.ResponseWriter, r *http.Request, event *services.WebhookEvent) {
	logger.Warn("Payment failed",
		"payment_id", event.GetPaymentID(),
		"order_id", event.GetOrderID(),
		"tenant_id", event.GetTenantID(),
		"error_code", event.Payload.Payment.Entity.ErrorCode,
		"error_reason", event.Payload.Payment.Entity.ErrorReason,
	)

	// Acknowledge the event
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "noted",
	})
}
