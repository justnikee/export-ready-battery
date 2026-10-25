package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"

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

	// The signed callback identifies a payment, but does not authenticate the
	// browser-supplied package or tenant. Fetch the captured payment and its
	// original order from Razorpay before granting anything.
	purchase, err := h.razorpayService.LookupCapturedPurchase(req.OrderID, req.PaymentID)
	if err != nil {
		slog.Warn("Unable to validate captured Razorpay purchase", "payment_id", req.PaymentID, "error", err)
		respondError(w, http.StatusBadGateway, "Payment is not yet verifiable. Your payment will be reconciled automatically; contact support if it does not appear.")
		return
	}
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	if purchase.TenantID != tenantIDStr || purchase.PackageID != req.PackageID {
		respondError(w, http.StatusForbidden, "Payment does not belong to this tenant or package")
		return
	}
	grant, err := paymentGrantForPurchase(tenantID, req.PaymentID, purchase.Package)
	if err != nil {
		slog.Error("Invalid purchased package configuration", "package_id", purchase.PackageID, "error", err)
		respondError(w, http.StatusInternalServerError, "Payment package is unavailable")
		return
	}
	result, err := h.repo.ApplyPaymentGrant(r.Context(), grant)
	if err != nil {
		slog.Error("Failed to fulfill captured payment", "payment_id", req.PaymentID, "error", err)
		respondError(w, http.StatusInternalServerError, "Payment received but fulfillment is pending. Please contact support if it does not appear.")
		return
	}
	status := "already_processed"
	quotaAdded, seatsAdded := 0, 0
	if result.Applied {
		status = "success"
		quotaAdded, seatsAdded = grant.QuotaUnits, grant.SeatBonus
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": status, "success": true, "quota_added": quotaAdded,
		"seats_added": seatsAdded, "quota_balance": result.QuotaBalance,
	})
}
