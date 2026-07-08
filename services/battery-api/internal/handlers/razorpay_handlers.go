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
	// razorpayService is nil when RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are unset
	// (see handlers.New) — without this guard the call below panics.
	if h.razorpayService == nil {
		respondError(w, http.StatusServiceUnavailable,
			"Payments are not configured on this server: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set")
		return
	}

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
		respondError(w, http.StatusBadRequest, "Invalid package_id")
		return
	}

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

	tenantPlan, _, _, err := h.repo.GetTenantSubscriptionStatus(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to load tenant plan for order", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create payment order")
		return
	}

	// Create Razorpay order
	orderResp, err := h.razorpayService.CreateOrder(req.PackageID, tenantIDStr, tenantPlan)
	if err != nil {
		if err == services.ErrPlanMismatch {
			respondError(w, http.StatusBadRequest, "This package isn't available on your current plan")
			return
		}
		slog.Error("Failed to create Razorpay order", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create payment order")
		return
	}

	respondJSON(w, http.StatusOK, orderResp)
}

// VerifyRazorpayPayment handles POST /api/v1/billing/razorpay/verify
func (h *Handler) VerifyRazorpayPayment(w http.ResponseWriter, r *http.Request) {
	// Same nil guard as CreateRazorpayOrder — unset keys must not panic.
	if h.razorpayService == nil {
		respondError(w, http.StatusServiceUnavailable,
			"Payments are not configured on this server: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set")
		return
	}

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

	// What a purchase actually does depends on its Kind — add-ons are pure
	// top-ups and must NEVER touch plan_type/subscription_expires_at (only
	// PackageKindTier does). Getting this wrong would corrupt plan_type with
	// an add-on's SKU id (e.g. "ADDON-PASSPORTS-500-STARTER").
	var txDescription string
	var quotaChange int
	switch pkg.Kind {
	case services.PackageKindSeatAddOn:
		if err := h.repo.AddBonusSeats(r.Context(), tenantID, pkg.SeatBonus); err != nil {
			slog.Error("Failed to add bonus seat", "error", err, "tenant_id", tenantID)
			respondError(w, http.StatusInternalServerError, "Failed to update seat allowance")
			return
		}
		txDescription = fmt.Sprintf("Razorpay Purchase: %s (+%d seat)", pkg.Name, pkg.SeatBonus)
		quotaChange = 0

	case services.PackageKindQuotaAddOn:
		if err := h.repo.AddQuota(r.Context(), tenantID, pkg.QuotaUnits); err != nil {
			slog.Error("Failed to add quota", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to update quota balance")
			return
		}
		txDescription = fmt.Sprintf("Razorpay Purchase: %s (%d quota)", pkg.Name, pkg.QuotaUnits)
		quotaChange = pkg.QuotaUnits

	default: // PackageKindTier — also unlocks/renews the plan (monthly or annual)
		if err := h.repo.AddQuota(r.Context(), tenantID, pkg.QuotaUnits); err != nil {
			slog.Error("Failed to add quota", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to update quota balance")
			return
		}
		planType := pkg.PlanType
		if planType == "" {
			planType = strings.ToUpper(pkg.ID) // fallback for any SKU that forgot to set PlanType
		}
		cycleDays := pkg.BillingCycleDays
		if cycleDays == 0 {
			cycleDays = 30
		}
		expiresAt := time.Now().AddDate(0, 0, cycleDays)
		if err := h.repo.UpdateTenantSubscription(r.Context(), tenantID, planType, expiresAt, "ACTIVE"); err != nil {
			slog.Error("Failed to update tenant subscription details on purchase", "tenant_id", tenantID, "error", err)
			// Non-critical, continue
		}
		txDescription = fmt.Sprintf("Razorpay Purchase: %s (%d quota)", pkg.Name, pkg.QuotaUnits)
		quotaChange = pkg.QuotaUnits
	}

	// Log transaction. payment_id has a partial unique index, so a concurrent
	// duplicate request will fail here as a backstop to the check above.
	paymentID := req.PaymentID
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: txDescription,
		QuotaChange: quotaChange,
		PaymentID:   &paymentID,
	}
	err = h.repo.CreateTransaction(r.Context(), tx)
	if err != nil {
		slog.Warn("Failed to log transaction", "error", err)
		// Non-critical, continue
	}

	// Get new balance
	newBalance, _ := h.repo.GetQuotaBalance(r.Context(), tenantID)

	slog.Info("Payment verified", "tenant", tenantIDStr[:8], "package", pkg.Name, "kind", pkg.Kind)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":        "success",
		"success":       true,
		"message":       "Payment verified successfully",
		"quota_added":   pkg.QuotaUnits,
		"seats_added":   pkg.SeatBonus,
		"quota_balance": newBalance,
	})
}
