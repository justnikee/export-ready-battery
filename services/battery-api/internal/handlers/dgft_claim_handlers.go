package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// ListDGFTSchemeConfigs handles GET /api/v1/dgft-claims/schemes
func (h *Handler) ListDGFTSchemeConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := h.repo.ListDGFTSchemeConfigs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list scheme configs")
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"schemes": configs})
}

// CreateDGFTClaim handles POST /api/v1/dgft-claims
func (h *Handler) CreateDGFTClaim(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req models.DGFTClaimInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SchemeType == "" || req.ClaimPeriodStart == "" || req.ClaimPeriodEnd == "" {
		respondError(w, http.StatusBadRequest, "scheme_type, claim_period_start, and claim_period_end are required")
		return
	}

	// Fetch scheme config for rate
	configs, err := h.repo.ListDGFTSchemeConfigs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch scheme config")
		return
	}

	var defaultRate float64
	for _, c := range configs {
		if c.SchemeType == req.SchemeType {
			defaultRate = c.DefaultRate
			break
		}
	}

	// Calculate estimated amount
	calc := services.NewDGFTCalculator()
	estimated, err := calc.CalculateClaimAmount(req.SchemeType, req.ExportValueINR, req.ExportQuantity, req.HSNCode, defaultRate)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	claim := &models.DGFTClaim{
		ID:                   uuid.New().String(),
		TenantID:             tenantID.String(),
		SchemeType:           req.SchemeType,
		Status:               "DRAFT",
		ClaimPeriodStart:     req.ClaimPeriodStart,
		ClaimPeriodEnd:       req.ClaimPeriodEnd,
		HSNCode:              req.HSNCode,
		DestinationCountry:   req.DestinationCountry,
		ExportValueINR:       req.ExportValueINR,
		ExportQuantity:       req.ExportQuantity,
		EstimatedClaimAmount: estimated,
		Notes:                req.Notes,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if req.BatchID != nil {
		claim.BatchID = req.BatchID
	}

	if err := h.repo.CreateDGFTClaim(r.Context(), claim); err != nil {
		slog.Error("failed to create dgft claim", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create claim")
		return
	}

	respondJSON(w, http.StatusCreated, claim)
}

// ListDGFTClaims handles GET /api/v1/dgft-claims
func (h *Handler) ListDGFTClaims(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	schemeType := r.URL.Query().Get("scheme_type")
	status := r.URL.Query().Get("status")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	claims, total, err := h.repo.ListDGFTClaimsByTenant(r.Context(), tenantID, schemeType, status, page, pageSize)
	if err != nil {
		slog.Error("failed to list dgft claims", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list claims")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"claims": claims,
		"total":  total,
		"page":   page,
	})
}

// GetDGFTClaim handles GET /api/v1/dgft-claims/{id}
func (h *Handler) GetDGFTClaim(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	claim, err := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "claim not found")
		return
	}

	respondJSON(w, http.StatusOK, claim)
}

// UpdateDGFTClaim handles PUT /api/v1/dgft-claims/{id}
func (h *Handler) UpdateDGFTClaim(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req models.DGFTClaimInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Fetch existing to preserve fields
	existing, err := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "claim not found")
		return
	}

	if existing.Status != "DRAFT" {
		respondError(w, http.StatusForbidden, "only DRAFT claims can be updated")
		return
	}

	// Recalculate estimated amount
	configs, err := h.repo.ListDGFTSchemeConfigs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch scheme config")
		return
	}
	var defaultRate float64
	for _, c := range configs {
		if c.SchemeType == req.SchemeType {
			defaultRate = c.DefaultRate
			break
		}
	}

	calc := services.NewDGFTCalculator()
	estimated, err := calc.CalculateClaimAmount(req.SchemeType, req.ExportValueINR, req.ExportQuantity, req.HSNCode, defaultRate)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	claim := &models.DGFTClaim{
		ID:                   id.String(),
		TenantID:             tenantID.String(),
		BatchID:              req.BatchID,
		SchemeType:           req.SchemeType,
		Status:               existing.Status,
		ClaimPeriodStart:     req.ClaimPeriodStart,
		ClaimPeriodEnd:       req.ClaimPeriodEnd,
		HSNCode:              req.HSNCode,
		DestinationCountry:   req.DestinationCountry,
		ExportValueINR:       req.ExportValueINR,
		ExportQuantity:       req.ExportQuantity,
		EstimatedClaimAmount: estimated,
		ApprovedClaimAmount:  existing.ApprovedClaimAmount,
		Documents:            existing.Documents,
		GeneratedFiles:       existing.GeneratedFiles,
		DGFTReferenceNo:      existing.DGFTReferenceNo,
		Notes:                req.Notes,
		CreatedAt:            existing.CreatedAt,
		UpdatedAt:            time.Now(),
	}

	if err := h.repo.UpdateDGFTClaim(r.Context(), claim); err != nil {
		slog.Error("failed to update dgft claim", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update claim")
		return
	}

	respondJSON(w, http.StatusOK, claim)
}

// DeleteDGFTClaim handles DELETE /api/v1/dgft-claims/{id}
func (h *Handler) DeleteDGFTClaim(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	if err := h.repo.DeleteDGFTClaim(r.Context(), id, tenantID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete claim")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// SubmitDGFTClaim handles POST /api/v1/dgft-claims/{id}/submit
func (h *Handler) SubmitDGFTClaim(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	if err := h.repo.SubmitDGFTClaim(r.Context(), id, tenantID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to submit claim")
		return
	}

	// Send alert notification
	if h.alertService != nil {
		claim, _ := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
		if claim != nil {
			_ = h.alertService.CreateDGFTClaimAlert(r.Context(), tenantID, claim.ID, claim.SchemeType, "SUBMITTED", nil)
		}
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "submitted"})
}


// ExportClaimPDF handles GET /api/v1/dgft-claims/{id}/export/pdf
func (h *Handler) ExportClaimPDF(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	claim, err := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "claim not found")
		return
	}

	configs, err := h.repo.ListDGFTSchemeConfigs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch scheme config")
		return
	}

	var scheme *models.DGFTSchemeConfig
	for i := range configs {
		if configs[i].SchemeType == claim.SchemeType {
			scheme = &configs[i]
			break
		}
	}
	if scheme == nil {
		respondError(w, http.StatusInternalServerError, "scheme config not found")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch tenant")
		return
	}

	buf, err := services.GenerateClaimPDF(claim, scheme, tenant.CompanyName)
	if err != nil {
		slog.Error("failed to generate claim PDF", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to generate PDF")
		return
	}

	filename := fmt.Sprintf("dgft_claim_%s_%s.pdf", strings.ToLower(claim.SchemeType), claim.ID[:8])
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

// ExportClaimExcel handles GET /api/v1/dgft-claims/{id}/export/excel
func (h *Handler) ExportClaimExcel(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	claim, err := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "claim not found")
		return
	}

	configs, err := h.repo.ListDGFTSchemeConfigs(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch scheme config")
		return
	}

	var scheme *models.DGFTSchemeConfig
	for i := range configs {
		if configs[i].SchemeType == claim.SchemeType {
			scheme = &configs[i]
			break
		}
	}
	if scheme == nil {
		respondError(w, http.StatusInternalServerError, "scheme config not found")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch tenant")
		return
	}

	buf, err := services.GenerateClaimCSV(claim, scheme, tenant.CompanyName)
	if err != nil {
		slog.Error("failed to generate claim CSV", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to generate Excel export")
		return
	}

	filename := fmt.Sprintf("dgft_claim_%s_%s.csv", strings.ToLower(claim.SchemeType), claim.ID[:8])
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

// UploadDGFTClaimDocument handles POST /api/v1/dgft-claims/{id}/documents
// Accepts multipart form with 'file' (PDF) and 'document_type'.
func (h *Handler) UploadDGFTClaimDocument(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid claim id")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	// Verify claim exists and is editable
	claim, err := h.repo.GetDGFTClaimByID(r.Context(), id, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "claim not found")
		return
	}
	if claim.Status != "DRAFT" && claim.Status != "SUBMITTED" {
		respondError(w, http.StatusForbidden, "documents can only be uploaded to DRAFT or SUBMITTED claims")
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	documentType := strings.ToLower(strings.TrimSpace(r.FormValue("document_type")))
	if documentType == "" {
		respondError(w, http.StatusBadRequest, "document_type is required")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	if header.Size > 5<<20 {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" && !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		respondError(w, http.StatusBadRequest, "Only PDF files are allowed")
		return
	}

	// Save to uploads/dgft-claims/{tenant_id}/{claim_id}/
	uploadDir := filepath.Join(".", "uploads", "dgft-claims", tenantID.String(), id.String())
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Error("Failed to create upload directory", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to process upload")
		return
	}

	safeDocType := strings.ReplaceAll(documentType, " ", "_")
	filename := fmt.Sprintf("%s_%s.pdf", safeDocType, time.Now().Format("20060102_150405"))
	filePath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		slog.Error("Failed to create file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		slog.Error("Failed to write file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Append to claim documents
	now := time.Now()
	doc := models.DGFTClaimDocument{
		DocType:    documentType,
		FileURL:    filePath,
		Status:     "UPLOADED",
		UploadedAt: &now,
	}
	if err := h.repo.AddDGFTClaimDocument(r.Context(), id, tenantID, doc); err != nil {
		slog.Error("Failed to update claim documents", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update claim record")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"document_type": documentType,
		"file_url":      filePath,
		"message":       "Document uploaded successfully",
	})
}
