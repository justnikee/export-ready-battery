package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

// VerifyDocumentRequest is the request payload for admin document verification
type VerifyDocumentRequest struct {
	TenantID string `json:"tenant_id"`
	DocType  string `json:"doc_type"` // epr, bis, pli
	Action   string `json:"action"`   // APPROVE, REJECT
}

// AdminVerifyDocument handles POST /api/v1/admin/verify-doc
// This is an admin-only endpoint to verify or reject uploaded documents
func (h *Handler) AdminVerifyDocument(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req VerifyDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate tenant ID
	tenantID, err := uuid.Parse(req.TenantID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant_id format")
		return
	}

	// Validate document type
	docType := strings.ToLower(req.DocType)
	if docType != "epr" && docType != "bis" && docType != "pli" {
		respondError(w, http.StatusBadRequest, "Invalid doc_type. Must be 'epr', 'bis', or 'pli'")
		return
	}

	// Map action to status
	var status string
	switch strings.ToUpper(req.Action) {
	case "APPROVE":
		status = "VERIFIED"
	case "REJECT":
		status = "REJECTED"
	default:
		respondError(w, http.StatusBadRequest, "Invalid action. Must be 'APPROVE' or 'REJECT'")
		return
	}

	// Update the status
	if err := h.repo.UpdateDocumentStatus(r.Context(), tenantID, docType, status); err != nil {
		log.Printf("Failed to update document status: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to update document status")
		return
	}

	log.Printf("Admin %s %s document for tenant %s", req.Action, docType, tenantID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"tenant_id":  tenantID.String(),
		"doc_type":   docType,
		"new_status": status,
		"message":    "Document status updated successfully",
	})
}
