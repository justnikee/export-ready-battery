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

// ============================================================================
// Compliance API Endpoints
// ============================================================================

// complianceCheckRequest is the body for POST /api/v1/compliance/check.
type complianceCheckRequest struct {
	ProductType  string          `json:"product_type"`
	MarketRegion string          `json:"market_region"`
	Specs        json.RawMessage `json:"specs"`
}

// ComplianceCheck handles POST /api/v1/compliance/check
// Performs a dry-run compliance check without saving anything. The frontend
// calls this in real-time as users fill in batch data to show a live compliance
// checklist and score before the batch is actually created or activated.
func (h *Handler) ComplianceCheck(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if h.batchService == nil {
		respondError(w, http.StatusServiceUnavailable, "Compliance engine not available")
		return
	}

	var req complianceCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.Specs) == 0 {
		respondError(w, http.StatusBadRequest, "specs is required")
		return
	}

	pt := models.ProductType(req.ProductType)
	if !pt.IsValid() {
		pt = models.DefaultProductType()
	}

	mr := models.MarketRegion(req.MarketRegion)
	if !mr.IsValid() {
		mr = models.MarketRegionGlobal
	}

	result, err := h.batchService.RunComplianceCheck(r.Context(), pt, mr, req.Specs)
	if err != nil {
		slog.Error("Compliance dry-run failed", "error", err)
		respondError(w, http.StatusUnprocessableEntity, "Compliance check failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"valid":    result.Valid,
		"score":    result.Score,
		"gaps":     result.Gaps,
		"errors":   result.Errors,
		"warnings": result.Warnings,
		"missing":  result.Missing,
	})
}

// GetBatchCompliance handles GET /api/v1/batches/{id}/compliance
// Returns the stored compliance score and structured gap list for a batch.
// This powers the compliance dashboard checklist widget.
func (h *Handler) GetBatchCompliance(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	// Parse gaps from JSONB for structured response.
	var gaps []map[string]interface{}
	if len(batch.ComplianceGaps) > 0 {
		_ = json.Unmarshal(batch.ComplianceGaps, &gaps)
	}
	if gaps == nil {
		gaps = []map[string]interface{}{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":         batch.ID,
		"batch_name":       batch.BatchName,
		"product_type":     batch.ProductType,
		"market_region":    batch.MarketRegion,
		"compliance_score": batch.ComplianceScore,
		"compliance_gaps":  gaps,
		"gap_count":        len(gaps),
		"status":           batch.Status,
	})
}

// DownloadComplianceReport handles GET /api/v1/batches/{id}/compliance-report
// Generates and returns a PDF containing the compliance score, gap details,
// and regulatory references for the specified batch.
func (h *Handler) DownloadComplianceReport(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to fetch tenant for compliance report", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve manufacturer details")
		return
	}

	pdfBytes, err := services.GenerateComplianceReport(batch, tenant)
	if err != nil {
		slog.Error("Failed to generate compliance report PDF", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate compliance report")
		return
	}

	safeName := sanitizeBatchName(batch.BatchName)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s_compliance_report.pdf"`, safeName))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))
	w.Write(pdfBytes)
}

// GetBatchEUAttributeScore handles GET /api/v1/batches/{id}/eu-attribute-score
// Evaluates the batch against the EU BatteryPass consortium's 56 mandatory
// attributes and returns per-attribute coverage with regulation references.
func (h *Handler) GetBatchEUAttributeScore(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	batchID, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant")
		return
	}

	result := services.CalculateComplianceScore(batch, tenant)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batch_id":   batchID,
		"score":      result.Score,
		"filled":     result.Filled,
		"total":      result.Total,
		"attributes": result.Attributes,
	})
}
