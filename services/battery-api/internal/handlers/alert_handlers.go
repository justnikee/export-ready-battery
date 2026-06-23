package handlers

import (
	"net/http"
	"strconv"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// AlertResponse wraps a single alert for JSON serialization.
type AlertResponse struct {
	ID           string  `json:"id"`
	AlertType    string  `json:"alert_type"`
	Severity     string  `json:"severity"`
	Title        string  `json:"title"`
	Message      string  `json:"message"`
	ResourceType string  `json:"resource_type,omitempty"`
	ResourceID   *string `json:"resource_id,omitempty"`
	ReadAt       *string `json:"read_at,omitempty"`
	CreatedAt    string  `json:"created_at"`
}

// GetAlerts handles GET /api/v1/alerts.
func (h *Handler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	offset := 0
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	alertSvc := services.NewAlertService(h.repo, nil)
	alerts, err := alertSvc.GetAlerts(r.Context(), tenantID, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve alerts")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"alerts": alerts,
	})
}

// GetUnreadAlerts handles GET /api/v1/alerts/unread.
func (h *Handler) GetUnreadAlerts(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	alertSvc := services.NewAlertService(h.repo, nil)
	alerts, err := alertSvc.GetUnreadAlerts(r.Context(), tenantID, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve alerts")
		return
	}

	count, err := alertSvc.GetUnreadCount(r.Context(), tenantID)
	if err != nil {
		count = 0
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"alerts": alerts,
		"count":  count,
	})
}

// GetUnreadAlertCount handles GET /api/v1/alerts/unread-count.
func (h *Handler) GetUnreadAlertCount(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	alertSvc := services.NewAlertService(h.repo, nil)
	count, err := alertSvc.GetUnreadCount(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to count alerts")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"count": count,
	})
}

// MarkAlertRead handles POST /api/v1/alerts/{id}/read.
func (h *Handler) MarkAlertRead(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	alertIDStr := r.PathValue("id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid alert ID")
		return
	}

	alertSvc := services.NewAlertService(h.repo, nil)
	if err := alertSvc.MarkAlertRead(r.Context(), alertID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to mark alert read")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Alert marked as read",
	})
}

// RunDailyAlerts handles POST /api/v1/jobs/daily-alerts.
// Triggers the daily compliance alert scan. Can be called by cron or manually.
func (h *Handler) RunDailyAlerts(w http.ResponseWriter, r *http.Request) {
	if h.alertService == nil {
		respondError(w, http.StatusInternalServerError, "Alert service not initialized")
		return
	}

	if err := h.alertService.CheckCertificateExpiries(r.Context(), 30); err != nil {
		respondError(w, http.StatusInternalServerError, "Certificate expiry check failed")
		return
	}

	if err := h.alertService.CheckComplianceScores(r.Context(), 70.0); err != nil {
		respondError(w, http.StatusInternalServerError, "Compliance score check failed")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Daily alert scan completed successfully",
	})
}
