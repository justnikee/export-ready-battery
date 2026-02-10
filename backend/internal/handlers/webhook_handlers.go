package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"

	"exportready-battery/internal/logger"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"
)

// WebhookHandler handles incoming webhooks from payment providers
type WebhookHandler struct {
	razorpayService *services.RazorpayService
	repo            interface {
		AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error
		CreateTransaction(ctx context.Context, tx *models.Transaction) error
	}
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(razorpay *services.RazorpayService, repo interface {
	AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error
	CreateTransaction(ctx context.Context, tx *models.Transaction) error
}) *WebhookHandler {
	return &WebhookHandler{
		razorpayService: razorpay,
		repo:            repo,
	}
}

// RazorpayWebhook handles POST /api/v1/webhooks/razorpay
// This endpoint receives payment notifications directly from Razorpay servers
// and must verify the signature before processing
func (h *WebhookHandler) RazorpayWebhook(w http.ResponseWriter, r *http.Request) {
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
	// Extract tenant ID and package ID from notes
	tenantIDStr := event.GetTenantID()
	packageID := event.GetPackageID()

	if tenantIDStr == "" || packageID == "" {
		logger.Error("Missing tenant_id or package_id in payment notes",
			"payment_id", event.GetPaymentID(),
			"tenant_id", tenantIDStr,
			"package_id", packageID,
		)
		http.Error(w, "Missing required notes", http.StatusBadRequest)
		return
	}

	// Parse tenant UUID
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		logger.Error("Invalid tenant_id format", "tenant_id", tenantIDStr, "error", err)
		http.Error(w, "Invalid tenant ID", http.StatusBadRequest)
		return
	}

	// Get package details
	pkg, exists := services.GetPackage(packageID)
	if !exists {
		logger.Error("Unknown package in webhook", "package_id", packageID)
		http.Error(w, "Unknown package", http.StatusBadRequest)
		return
	}

	// Verify the payment amount matches the package
	if event.GetAmount() < pkg.PricePaise {
		logger.Warn("Payment amount mismatch",
			"expected", pkg.PricePaise,
			"received", event.GetAmount(),
			"payment_id", event.GetPaymentID(),
		)
		// Continue processing - Razorpay handles partial payments
	}

	// Add quota to tenant
	err = h.repo.AddQuota(r.Context(), tenantID, pkg.QuotaUnits)
	if err != nil {
		logger.Error("Failed to add quota via webhook",
			"tenant_id", tenantIDStr,
			"quota", pkg.QuotaUnits,
			"error", err,
		)
		// Return 500 so Razorpay will retry
		http.Error(w, "Failed to update quota", http.StatusInternalServerError)
		return
	}

	// Log the transaction
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: "Razorpay Webhook: " + pkg.Name,
		QuotaChange: pkg.QuotaUnits,
	}
	if err := h.repo.CreateTransaction(r.Context(), tx); err != nil {
		logger.Error("Failed to log webhook transaction", "error", err)
		// Non-critical, continue
	}

	logger.Info("Successfully processed payment webhook",
		"tenant_id", tenantIDStr[:8],
		"package", packageID,
		"quota_added", pkg.QuotaUnits,
		"payment_id", event.GetPaymentID(),
	)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "success",
		"quota_added": pkg.QuotaUnits,
		"tenant_id":   tenantIDStr[:8] + "...",
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
