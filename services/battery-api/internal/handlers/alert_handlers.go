package handlers

import (
	"errors"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

	// P-02: default 50, hard max 200
	limit := ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	offset := ParseQueryOffset(r)

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

	// Unread feed is small UX surface — still hard-capped (≤100 ≤ MaxListLimit)
	limit := ParseQueryLimit(r, 20, 100)

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
// S-07: scoped to the caller's tenant — foreign alert IDs return 404.
func (h *Handler) MarkAlertRead(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
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
	if err := alertSvc.MarkAlertRead(r.Context(), alertID, tenantID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "Alert not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to mark alert read")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Alert marked as read",
	})
}

// RunDailyAlerts handles POST /api/v1/jobs/daily-alerts.
// Platform-admin only (X-Admin-API-Key / ADMIN_API_KEY) — S-03.
// The in-process daily ticker still runs without HTTP; this is a manual/cron trigger.
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
