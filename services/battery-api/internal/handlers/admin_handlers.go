package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// VerifyDocumentRequest is the request payload for platform-admin document verification.
// tenant_id is required because this is a cross-tenant operator action — the caller
// is authenticated via X-Admin-API-Key, not a tenant JWT.
type VerifyDocumentRequest struct {
	TenantID string `json:"tenant_id"`
	DocType  string `json:"doc_type"` // epr, bis, pli
	Action   string `json:"action"`   // APPROVE, REJECT
}

// AdminVerifyDocument handles POST /api/v1/admin/verify-doc
//
// Authorization: platform ADMIN_API_KEY only (X-Admin-API-Key), enforced by
// middleware.AdminAPIKey. Tenant OWNER JWTs must never authorize this endpoint —
// that was the S-01 cross-tenant IDOR.
//
// Manual review path for certificates the registry worker cannot auto-verify
// (see jobs/registry_worker.go).
func (h *Handler) AdminVerifyDocument(w http.ResponseWriter, r *http.Request) {
	var req VerifyDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	tenantID, err := uuid.Parse(strings.TrimSpace(req.TenantID))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant_id format")
		return
	}

	docType := strings.ToLower(strings.TrimSpace(req.DocType))
	if docType != "epr" && docType != "bis" && docType != "pli" {
		respondError(w, http.StatusBadRequest, "Invalid doc_type. Must be 'epr', 'bis', or 'pli'")
		return
	}

	var status string
	switch strings.ToUpper(strings.TrimSpace(req.Action)) {
	case "APPROVE":
		status = "VERIFIED"
	case "REJECT":
		status = "REJECTED"
	default:
		respondError(w, http.StatusBadRequest, "Invalid action. Must be 'APPROVE' or 'REJECT'")
		return
	}

	// Confirm the target tenant exists before mutating profile rows.
	if _, err := h.repo.GetTenant(r.Context(), tenantID); err != nil {
		slog.Warn("Admin document verify: tenant not found", "tenant_id", tenantID, "error", err)
		respondError(w, http.StatusNotFound, "Tenant not found")
		return
	}

	if err := h.repo.UpdateDocumentStatus(r.Context(), tenantID, docType, status); err != nil {
		slog.Error("Failed to update document status", "error", err, "tenant_id", tenantID, "doc_type", docType)
		respondError(w, http.StatusInternalServerError, "Failed to update document status")
		return
	}

	slog.Info("Platform admin document action",
		"action", strings.ToUpper(req.Action),
		"doc_type", docType,
		"tenant_id", tenantID,
		"new_status", status,
	)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"tenant_id":  tenantID.String(),
		"doc_type":   docType,
		"new_status": status,
		"message":    "Document status updated successfully",
	})
}

// ---------------------------------------------------------------------------
// S-12: Platform admin — regulator API keys (Art. 78 market surveillance)
// Auth: X-Admin-API-Key only (same as verify-doc).
// ---------------------------------------------------------------------------

// AdminCreateRegulatorKey handles POST /api/v1/admin/regulator-keys
// Returns the raw key once; only the hash is stored.
func (h *Handler) AdminCreateRegulatorKey(w http.ResponseWriter, r *http.Request) {
	if h.regulatorKeyService == nil {
		respondError(w, http.StatusServiceUnavailable, "Regulator key service not configured")
		return
	}

	var req services.CreateRegulatorKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	result, err := h.regulatorKeyService.GenerateKey(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	slog.Info("platform admin created regulator key",
		"key_id", result.Metadata.ID,
		"name", result.Metadata.Name,
		"tenant_count", len(result.Metadata.TenantIDs),
		"markets", result.Metadata.Markets,
	)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"key":      result.Key,
		"metadata": result.Metadata,
		"message":  "Save the key now — it will not be shown again",
	})
}

// AdminListRegulatorKeys handles GET /api/v1/admin/regulator-keys
func (h *Handler) AdminListRegulatorKeys(w http.ResponseWriter, r *http.Request) {
	if h.regulatorKeyService == nil {
		respondError(w, http.StatusServiceUnavailable, "Regulator key service not configured")
		return
	}
	keys, err := h.regulatorKeyService.ListKeys(r.Context())
	if err != nil {
		slog.Error("list regulator keys failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list regulator keys")
		return
	}
	if keys == nil {
		keys = []*repository.RegulatorAPIKey{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"items": keys, "total": len(keys)})
}

// AdminRevokeRegulatorKey handles DELETE /api/v1/admin/regulator-keys/{id}
func (h *Handler) AdminRevokeRegulatorKey(w http.ResponseWriter, r *http.Request) {
	if h.regulatorKeyService == nil {
		respondError(w, http.StatusServiceUnavailable, "Regulator key service not configured")
		return
	}
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid key id")
		return
	}
	if err := h.regulatorKeyService.RevokeKey(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	slog.Info("platform admin revoked regulator key", "key_id", id)
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "id": id.String()})
}

// AdminListRegulatorAccessLog handles GET /api/v1/admin/regulator-access-log?limit=100
func (h *Handler) AdminListRegulatorAccessLog(w http.ResponseWriter, r *http.Request) {
	if h.regulatorKeyService == nil {
		respondError(w, http.StatusServiceUnavailable, "Regulator key service not configured")
		return
	}
	limit := ParseQueryLimit(r, 100, MaxListLimit)
	logs, err := h.regulatorKeyService.ListAccessLogs(r.Context(), limit)
	if err != nil {
		slog.Error("list regulator access log failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list access log")
		return
	}
	if logs == nil {
		logs = []*repository.RegulatorAccessLogEntry{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"items": logs, "total": len(logs)})
}
