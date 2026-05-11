package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// ExportJobHandler handles export job API requests
type ExportJobHandler struct {
	exportJobService *services.ExportJobService
	logger           *slog.Logger
}

// NewExportJobHandler creates a new export job handler
func NewExportJobHandler(exportJobService *services.ExportJobService, logger *slog.Logger) *ExportJobHandler {
	return &ExportJobHandler{
		exportJobService: exportJobService,
		logger:           logger,
	}
}

// CreateExportJobRequest represents the request body for creating an export job
type CreateExportJobRequest struct {
	BatchID string `json:"batch_id"`
	JobType string `json:"job_type"` // QR_ZIP, LABELS_PDF, CSV
}

// ExportJobResponse represents the API response for an export job
type ExportJobResponse struct {
	ID            string  `json:"id"`
	BatchID       string  `json:"batch_id"`
	BatchName     string  `json:"batch_name"`
	JobType       string  `json:"job_type"`
	Status        string  `json:"status"`
	PassportCount int     `json:"passport_count"`
	FileSizeBytes *int64  `json:"file_size_bytes,omitempty"`
	DownloadURL   *string `json:"download_url,omitempty"`
	ErrorMessage  *string `json:"error_message,omitempty"`
	RequestedAt   string  `json:"requested_at"`
	CompletedAt   *string `json:"completed_at,omitempty"`
	ExpiresAt     *string `json:"expires_at,omitempty"`
	DownloadCount int     `json:"download_count"`
}

// CreateExportJob handles POST /api/v1/export-jobs
func (h *ExportJobHandler) CreateExportJob(w http.ResponseWriter, r *http.Request) {
	// Get tenant from context (set by auth middleware)
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Use tenant ID as user ID (tenant is the user in this system)
	userID := tenantID

	// Parse request body
	var req CreateExportJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate batch ID
	batchID, err := uuid.Parse(req.BatchID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch_id")
		return
	}

	// Validate job type
	var jobType models.ExportJobType
	switch req.JobType {
	case "QR_ZIP":
		jobType = models.ExportJobTypeQRZip
	case "LABELS_PDF":
		jobType = models.ExportJobTypeLabelPDF
	case "CSV":
		jobType = models.ExportJobTypeCSV
	case "DUE_DILIGENCE":
		jobType = models.ExportJobTypeDueDiligence
	case "COMPLIANCE_DECLARATION":
		jobType = models.ExportJobTypeComplianceDeclaration
	case "AUDIT_CSV":
		jobType = models.ExportJobTypeAuditCSV
	case "AUDIT_PDF":
		jobType = models.ExportJobTypeAuditPDF
	default:
		respondError(w, http.StatusBadRequest, "Invalid job_type. Must be QR_ZIP, LABELS_PDF, CSV, DUE_DILIGENCE, COMPLIANCE_DECLARATION, AUDIT_CSV, or AUDIT_PDF")
		return
	}

	// Hard block CSV export if any passport missing SHIPPED event
	if jobType == models.ExportJobTypeCSV {
		missing, err := h.exportJobService.CountPassportsMissingShippedEvent(r.Context(), batchID)
		if err != nil {
			h.logger.Error("failed to validate shipped status", "error", err, "batchId", batchID)
			respondError(w, http.StatusInternalServerError, "Failed to validate shipped status")
			return
		}
		if missing > 0 {
			respondError(w, http.StatusForbidden, "Export blocked: one or more passports are missing SHIPPED events")
			return
		}
	}
	// Get passport count from batch
	passportCount, err := h.exportJobService.GetPassportCountByBatch(r.Context(), batchID)
	if err != nil {
		h.logger.Error("failed to get passport count", "error", err, "batchId", batchID)
		// Fallback to 0 - the service will determine the count when processing
		passportCount = 0
	}

	// Create the export job
	job, err := h.exportJobService.CreateJob(r.Context(), tenantID, batchID, userID, jobType, passportCount)
	if err != nil {
		h.logger.Error("failed to create export job", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to create export job")
		return
	}

	respondJSON(w, http.StatusAccepted, map[string]interface{}{
		"message": "Export job created. You'll receive an email when ready.",
		"job":     h.jobToResponse(job),
	})
}

// ListExportJobs handles GET /api/v1/export-jobs
func (h *ExportJobHandler) ListExportJobs(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Parse pagination params
	limit := 20
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	jobs, total, err := h.exportJobService.ListJobsByTenant(r.Context(), tenantID, limit, offset)
	if err != nil {
		h.logger.Error("failed to list export jobs", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to list export jobs")
		return
	}

	// Convert to response format
	jobResponses := make([]ExportJobResponse, len(jobs))
	for i, job := range jobs {
		jobResponses[i] = h.jobToResponse(&job)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"jobs":   jobResponses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetExportJob handles GET /api/v1/export-jobs/{id}
func (h *ExportJobHandler) GetExportJob(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Get job ID from path
	jobIDStr := r.PathValue("id")
	if jobIDStr == "" {
		respondError(w, http.StatusBadRequest, "Job ID is required")
		return
	}

	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid job ID")
		return
	}

	job, err := h.exportJobService.GetJobByID(r.Context(), jobID)
	if err != nil {
		h.logger.Error("failed to get export job", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get export job")
		return
	}

	if job == nil {
		respondError(w, http.StatusNotFound, "Export job not found")
		return
	}

	// Verify tenant access
	if job.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	respondJSON(w, http.StatusOK, h.jobToResponse(job))
}

// DownloadExportJob handles GET /api/v1/export-jobs/{id}/download
func (h *ExportJobHandler) DownloadExportJob(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Get job ID from path
	jobIDStr := r.PathValue("id")
	if jobIDStr == "" {
		respondError(w, http.StatusBadRequest, "Job ID is required")
		return
	}

	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid job ID")
		return
	}

	job, err := h.exportJobService.GetJobByID(r.Context(), jobID)
	if err != nil {
		h.logger.Error("failed to get export job", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get export job")
		return
	}

	if job == nil {
		respondError(w, http.StatusNotFound, "Export job not found")
		return
	}

	// Verify tenant access
	if job.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Check job status
	if job.Status != models.ExportJobStatusCompleted {
		respondError(w, http.StatusBadRequest, "Export job is not completed yet")
		return
	}

	// Check if download URL exists and is valid
	if job.DownloadURL == nil || *job.DownloadURL == "" {
		respondError(w, http.StatusBadRequest, "Download URL not available")
		return
	}

	// Check if URL is expired and refresh if needed
	if job.ExpiresAt != nil && job.ExpiresAt.Before(time.Now()) {
		newURL, err := h.exportJobService.RefreshDownloadURL(r.Context(), jobID)
		if err != nil {
			h.logger.Error("failed to refresh download URL", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to refresh download URL")
			return
		}
		job.DownloadURL = &newURL
	}

	// Increment download count
	_ = h.exportJobService.IncrementDownloadCount(r.Context(), jobID)

	// Redirect to presigned URL
	http.Redirect(w, r, *job.DownloadURL, http.StatusTemporaryRedirect)
}

// RefreshDownloadURL handles POST /api/v1/export-jobs/{id}/refresh
func (h *ExportJobHandler) RefreshDownloadURL(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant ID")
		return
	}

	// Get job ID from path
	jobIDStr := r.PathValue("id")
	if jobIDStr == "" {
		respondError(w, http.StatusBadRequest, "Job ID is required")
		return
	}

	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid job ID")
		return
	}

	job, err := h.exportJobService.GetJobByID(r.Context(), jobID)
	if err != nil || job == nil {
		respondError(w, http.StatusNotFound, "Export job not found")
		return
	}

	// Verify tenant access
	if job.TenantID != tenantID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if job.Status != models.ExportJobStatusCompleted {
		respondError(w, http.StatusBadRequest, "Can only refresh completed jobs")
		return
	}

	newURL, err := h.exportJobService.RefreshDownloadURL(r.Context(), jobID)
	if err != nil {
		h.logger.Error("failed to refresh download URL", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to refresh download URL")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"download_url": newURL,
		"message":      "Download URL refreshed. Valid for 24 hours.",
	})
}

// jobToResponse converts an ExportJob model to API response format
func (h *ExportJobHandler) jobToResponse(job *models.ExportJob) ExportJobResponse {
	resp := ExportJobResponse{
		ID:            job.ID.String(),
		BatchID:       job.BatchID.String(),
		BatchName:     job.BatchName,
		JobType:       string(job.JobType),
		Status:        string(job.Status),
		PassportCount: job.PassportCount,
		FileSizeBytes: job.FileSizeBytes,
		DownloadURL:   job.DownloadURL,
		ErrorMessage:  job.ErrorMessage,
		RequestedAt:   job.RequestedAt.Format("2006-01-02T15:04:05Z"),
		DownloadCount: job.DownloadCount,
	}

	if job.CompletedAt != nil {
		formatted := job.CompletedAt.Format("2006-01-02T15:04:05Z")
		resp.CompletedAt = &formatted
	}

	if job.ExpiresAt != nil {
		formatted := job.ExpiresAt.Format("2006-01-02T15:04:05Z")
		resp.ExpiresAt = &formatted
	}

	return resp
}
