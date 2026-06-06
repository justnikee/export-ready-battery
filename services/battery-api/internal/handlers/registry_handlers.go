package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// VerifyBatchRegistry handles POST /api/v1/batches/{id}/verify-registry
// Triggers a verification against an external registry for a specific batch.
func (h *Handler) VerifyBatchRegistry(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	batchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	var req models.VerifyBatchRegistryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.RegistryType == "" {
		respondError(w, http.StatusBadRequest, "registry_type is required")
		return
	}

	// Initialize service on-demand if not injected
	svc := h.registryVerificationService
	if svc == nil {
		svc = services.NewRegistryVerificationService(h.repo, nil)
	}

	verification, err := svc.VerifyBatch(r.Context(), tenantID, batchID, req.RegistryType, req.CertificateNo)
	if err != nil {
		slog.Error("registry verification failed", "error", err, "batch_id", batchID, "registry", req.RegistryType)
		status := http.StatusInternalServerError
		if err.Error() == "unknown registry type: "+req.RegistryType {
			status = http.StatusBadRequest
		}
		respondError(w, status, "verification failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, verification)
}

// GetBatchRegistryVerifications handles GET /api/v1/batches/{id}/verifications
// Returns all cached registry verifications for a batch.
func (h *Handler) GetBatchRegistryVerifications(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	batchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	svc := h.registryVerificationService
	if svc == nil {
		svc = services.NewRegistryVerificationService(h.repo, nil)
	}

	summary, err := svc.GetBatchVerificationSummary(r.Context(), batchID)
	if err != nil {
		slog.Error("failed to get batch verifications", "error", err, "batch_id", batchID)
		respondError(w, http.StatusInternalServerError, "failed to get verifications")
		return
	}

	respondJSON(w, http.StatusOK, summary)
}

// AutoVerifyBatchRegistry handles POST /api/v1/batches/{id}/auto-verify
// Runs verification against all configured adapters for a batch.
func (h *Handler) AutoVerifyBatchRegistry(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	batchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid batch id")
		return
	}

	svc := h.registryVerificationService
	if svc == nil {
		svc = services.NewRegistryVerificationService(h.repo, nil)
	}

	results, err := svc.AutoVerifyBatch(r.Context(), tenantID, batchID)
	if err != nil {
		slog.Error("auto-verify failed", "error", err, "batch_id", batchID)
		respondError(w, http.StatusInternalServerError, "auto-verify failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"verifications": results,
		"count":         len(results),
	})
}
