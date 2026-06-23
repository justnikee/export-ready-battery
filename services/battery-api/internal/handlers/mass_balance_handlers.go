package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

type createMassBalanceLedgerRequest struct {
	MaterialType   string  `json:"material_type"`
	IncomingKg     float64 `json:"incoming_kg"`
	IncomingSource string  `json:"incoming_source,omitempty"`
	CertificateURL string  `json:"certificate_url,omitempty"`
	Notes          string  `json:"notes,omitempty"`
}

type updateMassBalanceLedgerRequest struct {
	IncomingDelta  float64 `json:"incoming_delta"`
	AllocatedDelta float64 `json:"allocated_delta"`
}

type createMassBalanceAllocationRequest struct {
	LedgerID     uuid.UUID  `json:"ledger_id"`
	BatchID      uuid.UUID  `json:"batch_id"`
	PassportID   *uuid.UUID `json:"passport_id,omitempty"`
	MaterialType string     `json:"material_type"`
	AllocatedKg  float64    `json:"allocated_kg"`
}

var validMaterialTypes = map[string]bool{
	"cobalt":  true,
	"lithium": true,
	"nickel":  true,
	"lead":    true,
}

func validateMaterialType(m string) bool {
	return validMaterialTypes[m]
}

// ============================================================================
// LEDGER HANDLERS
// ============================================================================

// CreateMassBalanceLedger handles POST /api/v1/mass-balance/ledgers
func (h *Handler) CreateMassBalanceLedger(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req createMassBalanceLedgerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if !validateMaterialType(req.MaterialType) {
		respondError(w, http.StatusBadRequest, "material_type must be cobalt, lithium, nickel, or lead")
		return
	}
	if req.IncomingKg < 0 {
		respondError(w, http.StatusBadRequest, "incoming_kg cannot be negative")
		return
	}

	ledger := &models.MassBalanceLedger{
		ID:             uuid.New(),
		TenantID:       tenantID,
		MaterialType:   req.MaterialType,
		IncomingKg:     req.IncomingKg,
		IncomingSource: req.IncomingSource,
		AllocatedKg:    0,
		BalanceKg:      req.IncomingKg,
		CertificateURL: req.CertificateURL,
		Notes:          req.Notes,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.repo.CreateMassBalanceLedger(r.Context(), ledger); err != nil {
		slog.Error("failed to create mass balance ledger", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create ledger")
		return
	}

	respondJSON(w, http.StatusCreated, ledger)
}

// ListMassBalanceLedgers handles GET /api/v1/mass-balance/ledgers
func (h *Handler) ListMassBalanceLedgers(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	materialType := r.URL.Query().Get("material_type")
	if materialType != "" && !validateMaterialType(materialType) {
		respondError(w, http.StatusBadRequest, "material_type must be cobalt, lithium, nickel, or lead")
		return
	}

	ledgers, err := h.repo.GetMassBalanceLedgersByTenant(r.Context(), tenantID, materialType)
	if err != nil {
		slog.Error("failed to list mass balance ledgers", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list ledgers")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"ledgers": ledgers,
		"count":   len(ledgers),
	})
}

// GetMassBalanceLedger handles GET /api/v1/mass-balance/ledgers/{id}
func (h *Handler) GetMassBalanceLedger(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid ledger id")
		return
	}

	ledger, err := h.repo.GetMassBalanceLedgerByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "ledger not found")
		return
	}

	// Verify tenant ownership
	tenantIDStr := middleware.GetTenantID(r.Context())
	if ledger.TenantID.String() != tenantIDStr {
		respondError(w, http.StatusForbidden, "access denied")
		return
	}

	respondJSON(w, http.StatusOK, ledger)
}

// UpdateMassBalanceLedger handles PATCH /api/v1/mass-balance/ledgers/{id}
func (h *Handler) UpdateMassBalanceLedger(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid ledger id")
		return
	}

	// Verify tenant ownership
	ledger, err := h.repo.GetMassBalanceLedgerByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "ledger not found")
		return
	}
	tenantIDStr := middleware.GetTenantID(r.Context())
	if ledger.TenantID.String() != tenantIDStr {
		respondError(w, http.StatusForbidden, "access denied")
		return
	}

	var req updateMassBalanceLedgerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.IncomingDelta == 0 && req.AllocatedDelta == 0 {
		respondError(w, http.StatusBadRequest, "at least one of incoming_delta or allocated_delta must be non-zero")
		return
	}

	if err := h.repo.UpdateMassBalanceLedger(r.Context(), id, req.IncomingDelta, req.AllocatedDelta); err != nil {
		if err.Error() == "insufficient balance: allocation would exceed available mass balance" {
			respondError(w, http.StatusConflict, err.Error())
			return
		}
		slog.Error("failed to update mass balance ledger", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update ledger")
		return
	}

	// Fetch updated ledger for response
	updated, err := h.repo.GetMassBalanceLedgerByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "ledger updated but failed to fetch")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

// ============================================================================
// ALLOCATION HANDLERS
// ============================================================================

// CreateMassBalanceAllocation handles POST /api/v1/mass-balance/allocations
func (h *Handler) CreateMassBalanceAllocation(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req createMassBalanceAllocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.LedgerID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "ledger_id is required")
		return
	}
	if req.BatchID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "batch_id is required")
		return
	}
	if !validateMaterialType(req.MaterialType) {
		respondError(w, http.StatusBadRequest, "material_type must be cobalt, lithium, nickel, or lead")
		return
	}
	if req.AllocatedKg <= 0 {
		respondError(w, http.StatusBadRequest, "allocated_kg must be greater than zero")
		return
	}

	// Verify ledger ownership and balance
	ledger, err := h.repo.GetMassBalanceLedgerByID(r.Context(), req.LedgerID)
	if err != nil {
		respondError(w, http.StatusNotFound, "ledger not found")
		return
	}
	if ledger.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "access denied")
		return
	}
	if ledger.BalanceKg < req.AllocatedKg {
		respondError(w, http.StatusConflict,
			fmt.Sprintf("insufficient balance: ledger has %.2f kg available, requested %.2f kg",
				ledger.BalanceKg, req.AllocatedKg))
		return
	}

	allocation := &models.MassBalanceAllocation{
		ID:           uuid.New(),
		LedgerID:     req.LedgerID,
		BatchID:      req.BatchID,
		PassportID:   req.PassportID,
		MaterialType: req.MaterialType,
		AllocatedKg:  req.AllocatedKg,
		CreatedAt:    time.Now(),
	}

	if err := h.repo.CreateMassBalanceAllocation(r.Context(), allocation); err != nil {
		slog.Error("failed to create mass balance allocation", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create allocation")
		return
	}

	// Atomically update the ledger balance
	if err := h.repo.UpdateMassBalanceLedger(r.Context(), req.LedgerID, 0, req.AllocatedKg); err != nil {
		slog.Error("failed to update ledger after allocation", "error", err)
		respondError(w, http.StatusInternalServerError, "allocation created but failed to update ledger balance")
		return
	}

	respondJSON(w, http.StatusCreated, allocation)
}

// ListMassBalanceAllocations handles GET /api/v1/mass-balance/allocations
func (h *Handler) ListMassBalanceAllocations(w http.ResponseWriter, r *http.Request) {
	batchIDStr := r.URL.Query().Get("batch_id")
	if batchIDStr == "" {
		respondError(w, http.StatusBadRequest, "batch_id query parameter is required")
		return
	}

	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch_id")
		return
	}

	allocations, err := h.repo.GetMassBalanceAllocationsByBatch(r.Context(), batchID)
	if err != nil {
		slog.Error("failed to list mass balance allocations", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list allocations")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"allocations": allocations,
		"count":       len(allocations),
	})
}
