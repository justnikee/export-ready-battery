package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/anvayalabs/battery-api/internal/compliance/supplier"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// GetSupplierRiskProfile handles GET /api/v1/suppliers/{id}/risk-profile
func (h *Handler) GetSupplierRiskProfile(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	supplierID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	// Verify supplier belongs to tenant
	s, err := h.repo.GetSupplierByID(r.Context(), supplierID)
	if err != nil || s == nil || s.TenantID != tenantIDStr {
		respondError(w, http.StatusNotFound, "supplier not found")
		return
	}

	// Compute fresh profile
	calc := supplier.NewRiskCalculator(h.repo)
	profile, err := calc.ComputeProfile(r.Context(), supplierID, tenantID)
	if err != nil {
		slog.Error("failed to compute risk profile", "error", err, "supplier_id", supplierID)
		respondError(w, http.StatusInternalServerError, "failed to compute risk profile")
		return
	}
	if profile == nil {
		respondError(w, http.StatusNotFound, "supplier not found")
		return
	}

	respondJSON(w, http.StatusOK, profile)
}

// CreateDueDiligenceAssessment handles POST /api/v1/suppliers/{id}/dd-assessments
func (h *Handler) CreateDueDiligenceAssessment(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	supplierID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	var req struct {
		Step    string `json:"step" validate:"required,oneof=policy identify assess respond audit"`
		BatchID string `json:"batch_id,omitempty"`
		Notes   string `json:"notes,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	assessment := &models.DueDiligenceAssessment{
		ID:         uuid.New().String(),
		SupplierID: supplierID.String(),
		TenantID:   tenantIDStr,
		Step:       req.Step,
		Status:     "not_started",
		Notes:      req.Notes,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	if req.BatchID != "" {
		assessment.BatchID = &req.BatchID
	}

	if err := h.repo.CreateDueDiligenceAssessment(r.Context(), assessment); err != nil {
		slog.Error("failed to create dd assessment", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create assessment")
		return
	}

	respondJSON(w, http.StatusCreated, assessment)
}

// ListDueDiligenceAssessments handles GET /api/v1/suppliers/{id}/dd-assessments
func (h *Handler) ListDueDiligenceAssessments(w http.ResponseWriter, r *http.Request) {
	supplierID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	assessments, err := h.repo.GetDueDiligenceAssessmentsBySupplier(r.Context(), supplierID)
	if err != nil {
		slog.Error("failed to list dd assessments", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list assessments")
		return
	}

	respondJSON(w, http.StatusOK, assessments)
}

// TransitionDueDiligenceAssessment handles POST /api/v1/dd-assessments/{id}/transition
func (h *Handler) TransitionDueDiligenceAssessment(w http.ResponseWriter, r *http.Request) {
	userIDStr := middleware.GetEmail(r.Context())
	assessmentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid assessment id")
		return
	}

	var req models.DDAssessmentTransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	assessment, err := h.repo.GetDueDiligenceAssessmentByID(r.Context(), assessmentID)
	if err != nil || assessment == nil {
		respondError(w, http.StatusNotFound, "assessment not found")
		return
	}

	// Validate step progression rules
	if req.Status == "in_progress" && assessment.Status != "not_started" && assessment.Status != "in_progress" {
		respondError(w, http.StatusBadRequest, "cannot transition to in_progress from "+assessment.Status)
		return
	}
	if req.Status == "complete" && assessment.Status != "in_progress" {
		respondError(w, http.StatusBadRequest, "must be in_progress before complete")
		return
	}

	now := time.Now()
	assessment.Status = req.Status
	assessment.Notes = req.Notes
	if req.Status == "complete" {
		assessment.CompletedAt = &now
		assessment.CompletedBy = &userIDStr
	}

	if err := h.repo.UpdateDueDiligenceAssessment(r.Context(), assessment); err != nil {
		slog.Error("failed to update dd assessment", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update assessment")
		return
	}

	// Auto-create corrective action if failed
	if req.Status == "failed" {
		ca := &models.CorrectiveAction{
			ID:           uuid.New().String(),
			SupplierID:   assessment.SupplierID,
			TenantID:     assessment.TenantID,
			AssessmentID: &assessment.ID,
			Title:        "OECD Step Failed: " + assessment.Step,
			Description:  "Supplier failed the " + assessment.Step + " step of due diligence assessment. Notes: " + req.Notes,
			Severity:     "high",
			Status:       "open",
			DueDate:      time.Now().AddDate(0, 1, 0).Format("2006-01-02"), // 30 days
			CreatedAt:    time.Now(),
		}
		if err := h.repo.CreateCorrectiveAction(r.Context(), ca); err != nil {
			slog.Error("failed to auto-create corrective action", "error", err)
		}
	}

	respondJSON(w, http.StatusOK, assessment)
}

// ListCorrectiveActions handles GET /api/v1/corrective-actions
func (h *Handler) ListCorrectiveActions(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	status := r.URL.Query().Get("status")
	actions, err := h.repo.ListCorrectiveActionsByTenant(r.Context(), tenantID, status)
	if err != nil {
		slog.Error("failed to list corrective actions", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list corrective actions")
		return
	}

	respondJSON(w, http.StatusOK, actions)
}

// CreateCorrectiveAction handles POST /api/v1/corrective-actions
func (h *Handler) CreateCorrectiveAction(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req models.CreateCorrectiveActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ca := &models.CorrectiveAction{
		ID:           uuid.New().String(),
		SupplierID:   req.SupplierID,
		TenantID:     tenantIDStr,
		Title:        req.Title,
		Description:  req.Description,
		Severity:     req.Severity,
		Status:       "open",
		DueDate:      req.DueDate,
		CreatedAt:    time.Now(),
	}
	if req.AssessmentID != "" {
		ca.AssessmentID = &req.AssessmentID
	}

	if err := h.repo.CreateCorrectiveAction(r.Context(), ca); err != nil {
		slog.Error("failed to create corrective action", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to create corrective action")
		return
	}

	respondJSON(w, http.StatusCreated, ca)
}

// UpdateCorrectiveActionStatus handles PUT /api/v1/corrective-actions/{id}/status
func (h *Handler) UpdateCorrectiveActionStatus(w http.ResponseWriter, r *http.Request) {
	userIDStr := middleware.GetEmail(r.Context())
	caID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid corrective action id")
		return
	}

	var req models.UpdateCorrectiveActionStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ca, err := h.repo.GetCorrectiveActionByID(r.Context(), caID)
	if err != nil || ca == nil {
		respondError(w, http.StatusNotFound, "corrective action not found")
		return
	}

	var remediatedAt interface{}
	var verifiedBy interface{}

	if req.Status == "remediated" {
		now := time.Now()
		remediatedAt = &now
	}
	if req.Status == "verified" {
		verifiedBy = userIDStr
	}

	if err := h.repo.UpdateCorrectiveActionStatus(r.Context(), caID, req.Status, remediatedAt, verifiedBy); err != nil {
		slog.Error("failed to update corrective action status", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update status")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": req.Status})
}
