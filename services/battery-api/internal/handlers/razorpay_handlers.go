package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

	"strings"
	"time"

	"github.com/google/uuid"
)

// CreateRazorpayOrder handles POST /api/v1/billing/razorpay/order
func (h *Handler) CreateRazorpayOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PackageID string `json:"package_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.PackageID == "" {
		respondError(w, http.StatusBadRequest, "package_id is required")
		return
	}

	// Validate package exists
	_, exists := services.GetPackage(req.PackageID)
	if !exists {
		respondError(w, http.StatusBadRequest, "Invalid package_id. Use 'starter' or 'growth'")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	// Create Razorpay order
	orderResp, err := h.razorpayService.CreateOrder(req.PackageID, tenantIDStr)
	if err != nil {
		slog.Error("Failed to create Razorpay order", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create payment order")
		return
	}

	respondJSON(w, http.StatusOK, orderResp)
}

// VerifyRazorpayPayment handles POST /api/v1/billing/razorpay/verify
func (h *Handler) VerifyRazorpayPayment(w http.ResponseWriter, r *http.Request) {
	var req services.VerifyPaymentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.OrderID == "" || req.PaymentID == "" || req.Signature == "" || req.PackageID == "" {
		respondError(w, http.StatusBadRequest, "Missing required payment verification fields")
		return
	}

	// Verify signature
	valid, err := h.razorpayService.VerifyPayment(&req)
	if err != nil {
		slog.Error("Payment verification error", "error", err)
		respondError(w, http.StatusInternalServerError, "Payment verification failed")
		return
	}

	if !valid {
		slog.Warn("FRAUD ALERT: Invalid payment signature", "order_id", req.OrderID)
		respondError(w, http.StatusBadRequest, "Invalid payment signature")
		return
	}

	// Get package details
	pkg, exists := services.GetPackage(req.PackageID)
	if !exists {
		respondError(w, http.StatusBadRequest, "Invalid package")
		return
	}

	// Get tenant ID
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	// Idempotency check: a verify request that's already been processed for
	// this Razorpay payment (e.g. retried after a network blip) must not
	// credit quota a second time.
	alreadyProcessed, err := h.repo.TransactionExistsForPayment(r.Context(), req.PaymentID)
	if err != nil {
		slog.Error("Failed to check existing transaction for payment", "error", err)
		respondError(w, http.StatusInternalServerError, "Payment verification failed")
		return
	}
	if alreadyProcessed {
		newBalance, _ := h.repo.GetQuotaBalance(r.Context(), tenantID)
		slog.Info("Payment already processed", "tenant", tenantIDStr[:8], "payment_id", req.PaymentID)
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":        "already_processed",
			"success":       true,
			"message":       "Payment already verified",
			"quota_added":   0,
			"quota_balance": newBalance,
		})
		return
	}

	// Add quota to tenant
	err = h.repo.AddQuota(r.Context(), tenantID, pkg.QuotaUnits)
	if err != nil {
		slog.Error("Failed to add quota", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update quota balance")
		return
	}

	// Update subscription details (Phase 4 Billing Infrastructure)
	planType := strings.ToUpper(pkg.ID)
	expiresAt := time.Now().AddDate(0, 1, 0) // 30 days renewal
	err = h.repo.UpdateTenantSubscription(r.Context(), tenantID, planType, expiresAt, "ACTIVE")
	if err != nil {
		slog.Error("Failed to update tenant subscription details on purchase", "tenant_id", tenantID, "error", err)
		// Non-critical, continue
	}

	// Log transaction. payment_id has a partial unique index, so a concurrent
	// duplicate request will fail here as a backstop to the check above.
	paymentID := req.PaymentID
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: fmt.Sprintf("Razorpay Purchase: %s (%d quota)", pkg.Name, pkg.QuotaUnits),
		QuotaChange: pkg.QuotaUnits,
		PaymentID:   &paymentID,
	}
	err = h.repo.CreateTransaction(r.Context(), tx)
	if err != nil {
		slog.Warn("Failed to log transaction", "error", err)
		// Non-critical, continue
	}

	// Get new balance
	newBalance, _ := h.repo.GetQuotaBalance(r.Context(), tenantID)

	slog.Info("Payment verified", "tenant", tenantIDStr[:8], "package", pkg.Name, "quota_added", pkg.QuotaUnits)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":        "success",
		"success":       true,
		"message":       "Payment verified successfully",
		"quota_added":   pkg.QuotaUnits,
		"quota_balance": newBalance,
	})
}
