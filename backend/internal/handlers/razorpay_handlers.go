package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

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
		log.Printf("Failed to create Razorpay order: %v", err)
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
		log.Printf("Payment verification error: %v", err)
		respondError(w, http.StatusInternalServerError, "Payment verification failed")
		return
	}

	if !valid {
		log.Printf("⚠️ FRAUD ALERT: Invalid payment signature for order %s", req.OrderID)
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
		log.Printf("Failed to add quota: %v", err)
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
		log.Printf("Failed to log transaction: %v", err)
		// Non-critical, continue
	}

	// Get new balance
	newBalance, _ := h.repo.GetQuotaBalance(r.Context(), tenantID)

	log.Printf("✅ Payment verified: Tenant %s purchased %s (+%d quota)", tenantIDStr[:8], pkg.Name, pkg.QuotaUnits)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"message":       "Payment verified successfully",
		"quota_added":   pkg.QuotaUnits,
		"quota_balance": newBalance,
	})
}
