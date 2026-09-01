package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/events"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"io"
	"strings"

	"github.com/google/uuid"
)

// Package represents a billing package for quota purchase. Quota is metered
// per passport (see ActivateBatch), not per batch — `PricePerBatch`/`price_per_batch`
// is a legacy field name kept for frontend API-contract stability; it means
// "price per quota unit" (i.e. per passport).
type Package struct {
	ID                   string   `json:"id"`
	Name                 string   `json:"name"`
	Price                int      `json:"price"`         // Price in paise (INR)
	DisplayPrice         string   `json:"display_price"` // Formatted price string
	Quota                int      `json:"quota"`         // Number of passport activation slots
	PricePerBatch        string   `json:"price_per_batch"`
	Description          string   `json:"description"`
	Features             []string `json:"features"`
	IsPopular            bool     `json:"is_popular,omitempty"`
	IsEnterprise         bool     `json:"is_enterprise,omitempty"`
	BillingCycleDays     int      `json:"billing_cycle_days,omitempty"`
	MonthlyEquivalentINR int      `json:"monthly_equivalent_inr,omitempty"`
}

// tierDisplayMeta holds the display-only fields (feature bullets, popular/
// enterprise flags) shared by a tier's monthly and annual SKU — these don't
// live in services.Packages since they're presentation, not billing, data.
type tierDisplayMeta struct {
	name         string
	pricePerUnit string
	description  string
	isPopular    bool
	features     []string
}

var tierDisplayMetaBySKUPrefix = map[string]tierDisplayMeta{
	"starter": {
		name:         "Starter License",
		pricePerUnit: "₹30",
		description:  "Perfect for pilot runs and small scale manufacturing.",
		features: []string{
			"500 Passport Activations / month",
			"2 Team Seats",
			"Standard PDF Label Generation",
			"India Compliance (EPR/BIS)",
			"Email Support (48h SLA)",
			"Basic Analytics",
		},
	},
	"growth": {
		name:         "Growth License",
		pricePerUnit: "₹9",
		description:  "For high-volume production and export compliance.",
		isPopular:    true,
		features: []string{
			"Everything in Starter",
			"5,000 Passport Activations / month",
			"10 Team Seats",
			"Priority Label Generation",
			"Importer Mode (China/Korea)",
			"Priority Support (24h SLA) + Onboarding Call",
		},
	},
}

// AddOn represents a purchasable top-up (extra quota or an extra seat) — see
// PRICING_AND_PACKAGING_STRATEGY.md §4 "Overage & Add-On Packs". Unlike a
// Package, buying one never changes plan_type/subscription_expires_at.
type AddOn struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Kind         string `json:"kind"` // "quota_addon" | "seat_addon"
	Price        int    `json:"price"`
	DisplayPrice string `json:"display_price"`
	Quota        int    `json:"quota,omitempty"`
	SeatBonus    int    `json:"seat_bonus,omitempty"`
	Description  string `json:"description"`
}

// GetPackages handles GET /api/v1/billing/packages
func (h *Handler) GetPackages(w http.ResponseWriter, r *http.Request) {
	// Tier SKUs are derived from services.Packages (the single source of
	// truth also used for order creation/verification) rather than kept as a
	// separate hardcoded copy here — that duplication is exactly what caused
	// prices to drift out of sync with the purchasable SKUs previously.
	var packages []Package
	for _, id := range []string{"starter", "starter-annual", "growth", "growth-annual"} {
		pkg, ok := services.GetPackage(id)
		if !ok {
			continue
		}
		meta := tierDisplayMetaBySKUPrefix[strings.TrimSuffix(id, "-annual")]
		packages = append(packages, Package{
			ID:                   pkg.ID,
			Name:                 meta.name,
			Price:                int(pkg.PricePaise),
			DisplayPrice:         fmt.Sprintf("₹%d", pkg.PriceINR),
			Quota:                pkg.QuotaUnits,
			PricePerBatch:        meta.pricePerUnit,
			Description:          meta.description,
			Features:             meta.features,
			IsPopular:            meta.isPopular,
			BillingCycleDays:     pkg.BillingCycleDays,
			MonthlyEquivalentINR: pkg.MonthlyEquivalentINR,
		})
	}
	packages = append(packages, Package{
		ID:            "enterprise",
		Name:          "Enterprise License",
		Price:         0, // Custom pricing — direct sales, floor ~₹1,50,000/mo
		DisplayPrice:  "Custom",
		Quota:         50000,
		PricePerBatch: "Contact Us",
		Description:   "Industrial scale solution for large manufacturers.",
		IsEnterprise:  true,
		Features: []string{
			"Everything in Growth",
			"50,000+ Passport Activations / month",
			"Up to 100 Team Seats",
			"Custom Label Formats",
			"Dedicated CSM + SLA Guarantees",
			"SSO/SAML & Multi-Entity Support",
		},
	})

	// Only show add-ons priced for the tenant's *current* plan (e.g. a Starter
	// tenant sees the Starter-rate extra-500-passports pack, not Growth's
	// cheaper one — CreateRazorpayOrder enforces this server-side regardless).
	tenantPlan := services.PlanStarter
	if tenantIDStr := middleware.GetTenantID(r.Context()); tenantIDStr != "" {
		if tenantID, err := uuid.Parse(tenantIDStr); err == nil {
			if plan, _, _, err := h.repo.GetTenantSubscriptionStatus(r.Context(), tenantID); err == nil {
				tenantPlan = plan
			}
		}
	}

	var addOns []AddOn
	for _, id := range services.AddOnPackageIDsForPlan(tenantPlan) {
		pkg, ok := services.GetPackage(id)
		if !ok {
			continue
		}
		addOns = append(addOns, AddOn{
			ID:           pkg.ID,
			Name:         pkg.Name,
			Kind:         string(pkg.Kind),
			Price:        int(pkg.PricePaise),
			DisplayPrice: fmt.Sprintf("₹%d", pkg.PriceINR),
			Quota:        pkg.QuotaUnits,
			SeatBonus:    pkg.SeatBonus,
			Description:  pkg.Description,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"packages": packages,
		"add_ons":  addOns,
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

	// SECURITY: Enforce onboarding completion before batch activation
	if !h.checkIfOnboardingCompleted(w, r) {
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
			"error":    "Compliance requirements missing or invalid. Activation blocked.",
			"missing":  compliance.Missing,
			"errors":   compliance.Errors,
			"warnings": compliance.Warnings,
		})
		return
	}

	// Count pre-existing passports (created while DRAFT) — used for quota deduction.
	// Passports added later (to an already-ACTIVE batch) are charged at upload time.
	passportCount, err := h.repo.CountPassportsByBatch(r.Context(), batchID)
	if err != nil {
		slog.Error("Failed to count passports for batch", "batch_id", batchID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to count passports in batch")
		return
	}

	// Check quota balance
	balance, err := h.repo.GetQuotaBalance(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to get quota balance", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to check quota")
		return
	}

	if balance < passportCount {
		respondError(w, http.StatusPaymentRequired, fmt.Sprintf("Insufficient quota. This batch requires %d passports, but you only have %d activation slots.", passportCount, balance))
		return
	}

	// Deduct quota (atomic operation)
	err = h.repo.DeductQuota(r.Context(), tenantID, passportCount)
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
		_ = h.repo.AddQuota(r.Context(), tenantID, passportCount)
		respondError(w, http.StatusInternalServerError, "Failed to activate batch")
		return
	}

	// Log transaction
	tx := &models.Transaction{
		TenantID:    tenantID,
		Description: fmt.Sprintf("Batch Activation (%d Passports): %s", passportCount, batch.BatchName),
		QuotaChange: -passportCount,
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
		"quota_balance": balance - passportCount,
	})
}

// DownloadInvoice handles GET /api/v1/billing/invoices/{payment_id}/download
func (h *Handler) DownloadInvoice(w http.ResponseWriter, r *http.Request) {
	tenantID, err := parseTenantID(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant")
		return
	}

	paymentID := r.PathValue("payment_id")
	if paymentID == "" {
		respondError(w, http.StatusBadRequest, "Payment ID is required")
		return
	}

	// Fetch tenant details for invoice info
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return
	}

	// Fetch transaction details
	tx, err := h.repo.GetTransactionByPaymentID(r.Context(), tenantID, paymentID)
	if err != nil {
		slog.Error("Invoice download: transaction not found", "payment_id", paymentID, "error", err)
		respondError(w, http.StatusNotFound, "Transaction details not found for payment ID")
		return
	}

	// Determine package
	pkg := services.Packages["starter"] // default fallback
	if strings.Contains(strings.ToLower(tx.Description), "growth") {
		pkg = services.Packages["growth"]
	}

	// Generate PDF
	buf, err := services.GenerateInvoicePDF(tenant, pkg, paymentID)
	if err != nil {
		slog.Error("Failed to generate invoice PDF", "payment_id", paymentID, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate invoice PDF")
		return
	}

	// Set headers for file download
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invoice_%s.pdf", paymentID))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", buf.Len()))

	_, _ = io.Copy(w, buf)
}
