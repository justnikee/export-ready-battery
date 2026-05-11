package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// RazorpayHandler handles payment-related endpoints
type RazorpayHandler struct {
	razorpay *services.RazorpayService
	repo     interface {
		AddQuota(ctx interface{}, tenantID uuid.UUID, amount int) error
		CreateTransaction(ctx interface{}, tx *models.Transaction) error
		GetQuotaBalance(ctx interface{}, tenantID uuid.UUID) (int, error)
	}
}

// NewRazorpayHandler creates a new Razorpay handler
func NewRazorpayHandler(razorpayService *services.RazorpayService, repo interface {
	AddQuota(ctx interface{}, tenantID uuid.UUID, amount int) error
	CreateTransaction(ctx interface{}, tx *models.Transaction) error
	GetQuotaBalance(ctx interface{}, tenantID uuid.UUID) (int, error)
}) *RazorpayHandler {
	return &RazorpayHandler{
		razorpay: razorpayService,
		repo:     repo,
	}
}

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

	// Add quota to tenant
	err = h.repo.AddQuota(r.Context(), tenantID, pkg.QuotaUnits)
	if err != nil {
		slog.Error("Failed to add quota", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update quota balance")
		return
	}

	// Log transaction
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: fmt.Sprintf("Razorpay Purchase: %s (%d quota)", pkg.Name, pkg.QuotaUnits),
		QuotaChange: pkg.QuotaUnits,
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
		"success":       true,
		"message":       "Payment verified successfully",
		"quota_added":   pkg.QuotaUnits,
		"quota_balance": newBalance,
	})
}
