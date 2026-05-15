package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"anvayalabs-battery/internal/events"
	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
)

// Package represents a billing package for quota purchase
type Package struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Price         int      `json:"price"`         // Price in paise (INR)
	DisplayPrice  string   `json:"display_price"` // Formatted price string
	Quota         int      `json:"quota"`         // Number of batch activations
	PricePerBatch string   `json:"price_per_batch"`
	Description   string   `json:"description"`
	Features      []string `json:"features"`
	IsPopular     bool     `json:"is_popular,omitempty"`
	IsEnterprise  bool     `json:"is_enterprise,omitempty"`
}

// GetPackages handles GET /api/v1/billing/packages
func (h *Handler) GetPackages(w http.ResponseWriter, r *http.Request) {
	packages := []Package{
		{
			ID:            "starter",
			Name:          "Starter License",
			Price:         499900, // ₹4,999 in paise
			DisplayPrice:  "₹4,999",
			Quota:         10,
			PricePerBatch: "₹499",
			Description:   "Perfect for pilot runs and small scale manufacturing.",
			Features: []string{
				"10 Batch Activations",
				"Standard PDF Label Generation",
				"India Compliance (EPR/BIS)",
				"Email Support",
				"Basic Analytics",
			},
		},
		{
			ID:            "growth",
			Name:          "Growth License",
			Price:         1999900, // ₹19,999 in paise
			DisplayPrice:  "₹19,999",
			Quota:         50,
			PricePerBatch: "₹399",
			Description:   "For high-volume production and export compliance.",
			IsPopular:     true,
			Features: []string{
				"Everything in Starter",
				"50 Batch Activations",
				"Priority Label Generation",
				"Importer Mode (China/Korea)",
				"WhatsApp Priority Support",
			},
		},
		{
			ID:            "enterprise",
			Name:          "Enterprise License",
			Price:         0, // Custom pricing
			DisplayPrice:  "Custom",
			Quota:         200,
			PricePerBatch: "Contact Us",
			Description:   "Industrial scale solution for large manufacturers.",
			IsEnterprise:  true,
			Features: []string{
				"Everything in Growth",
				"200+ Batch Activations",
				"Custom Label Formats",
				"Dedicated Account Manager",
				"API Access & Custom Integrations",
			},
		},
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"packages": packages,
	})
}

func (h *Handler) GetBalance(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID using helper
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	balance, err := h.repo.GetQuotaBalance(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to get quota balance", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve balance")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"quota_balance": balance,
	})
}

// GetTransactions handles GET /api/v1/billing/transactions
func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	transactions, err := h.repo.ListTransactions(r.Context(), tenantID, 50)
	if err != nil {
		slog.Error("Failed to get transactions", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve transactions")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"transactions": transactions,
		"count":        len(transactions),
	})
}

// ActivateBatch handles POST /api/v1/batches/{id}/activate
func (h *Handler) ActivateBatch(w http.ResponseWriter, r *http.Request) {
	// Get batch ID from path
	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	// Get tenant ID
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	// Get batch to verify ownership and status
	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Verify ownership
	if batch.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Check if already active
	if batch.Status == models.BatchStatusActive {
		respondError(w, http.StatusBadRequest, "Batch is already active")
		return
	}

	// Compliance hard-block at activation
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}
	compliance := h.batchService.ValidateActivation(batch, tenant)
	if !compliance.Valid {
		respondJSON(w, http.StatusForbidden, map[string]interface{}{
			"error":   "Compliance requirements missing or invalid. Activation blocked.",
			"missing": compliance.Missing,
			"errors":  compliance.Errors,
			"warnings": compliance.Warnings,
		})
		return
	}

	// Check quota balance
	balance, err := h.repo.GetQuotaBalance(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to get quota balance", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to check quota")
		return
	}

	if balance < 1 {
		respondError(w, http.StatusPaymentRequired, "Insufficient quota. Please purchase more activation slots.")
		return
	}

	// Deduct quota (atomic operation)
	err = h.repo.DeductQuota(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to deduct quota", "error", err)
		if err.Error() == "insufficient quota" {
			respondError(w, http.StatusPaymentRequired, "Insufficient quota")
		} else {
			respondError(w, http.StatusInternalServerError, "Failed to deduct quota")
		}
		return
	}

	// Set batch status to ACTIVE
	err = h.repo.SetBatchStatus(r.Context(), batchID, models.BatchStatusActive)
	if err != nil {
		slog.Error("Failed to activate batch", "error", err)
		// Try to refund quota if activation fails
		_ = h.repo.AddQuota(r.Context(), tenantID, 1)
		respondError(w, http.StatusInternalServerError, "Failed to activate batch")
		return
	}

	// Log transaction
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: fmt.Sprintf("Batch Activation: %s", batch.BatchName),
		QuotaChange: -1,
		BatchID:     &batchID,
	}
	err = h.repo.CreateTransaction(r.Context(), tx)
	if err != nil {
		slog.Warn("Failed to log transaction", "error", err)
		// Non-critical, don't fail the request
	}

	// Phase 3: run compliance engine asynchronously (non-blocking).
	// If batchService is not wired (tests / legacy startup), skip gracefully.
	if h.batchService != nil {
		// Re-fetch the batch now that it is ACTIVE so validators see the correct status.
		activeBatch, fetchErr := h.repo.GetBatch(r.Context(), batchID, tenantID)
		if fetchErr == nil {
			go h.batchService.RunAndSaveCompliance(context.Background(), batchID, activeBatch, tenant)
		} else {
			slog.Warn("ActivateBatch: could not re-fetch batch for compliance run", "error", fetchErr)
		}
	}

	// Phase 3: publish domain event (non-blocking).
	if h.eventBus != nil {
		h.eventBus.Publish(&events.BatchActivatedPayload{
			BatchID:      batchID.String(),
			TenantID:     tenantID.String(),
			ProductType:  string(batch.ProductType),
			MarketRegion: string(batch.MarketRegion),
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Batch activated successfully",
		"batch_id":      batchID,
		"quota_balance": balance - 1,
	})
}

// TopUpQuota handles POST /api/v1/billing/top-up (MOCK for now)
func (h *Handler) TopUpQuota(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Amount int `json:"amount"` // Number of quota units to add
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Amount must be positive")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	// Add quota
	err = h.repo.AddQuota(r.Context(), tenantID, req.Amount)
	if err != nil {
		slog.Error("Failed to add quota", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to add quota")
		return
	}

	// Log transaction
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: fmt.Sprintf("Mock Top-Up: %d quota units", req.Amount),
		QuotaChange: req.Amount,
	}
	err = h.repo.CreateTransaction(r.Context(), tx)
	if err != nil {
		slog.Warn("Failed to log transaction", "error", err)
	}

	// Get new balance
	newBalance, _ := h.repo.GetQuotaBalance(r.Context(), tenantID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Quota added successfully",
		"amount_added":  req.Amount,
		"quota_balance": newBalance,
	})
}
