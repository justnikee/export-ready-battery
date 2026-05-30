package services

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// AlertService generates and manages proactive compliance alerts.
type AlertService struct {
	repo          repository.RepositoryInterface
	emailService  *EmailService
}

// NewAlertService creates an alert service.
func NewAlertService(repo repository.RepositoryInterface, emailService *EmailService) *AlertService {
	return &AlertService{
		repo:         repo,
		emailService: emailService,
	}
}

// CheckCertificateExpiries scans all batches and creates alerts for certificates
// expiring within the given warning window (default 30 days).
func (s *AlertService) CheckCertificateExpiries(ctx context.Context, warningWindowDays int) error {
	if warningWindowDays <= 0 {
		warningWindowDays = 30
	}

	offset := 0
	limit := 500
	now := time.Now()
	warningCutoff := now.AddDate(0, 0, warningWindowDays)

	for {
		batches, err := s.repo.ListAllBatches(ctx, "", limit, offset)
		if err != nil {
			return fmt.Errorf("failed to list batches for expiry check: %w", err)
		}
		if len(batches) == 0 {
			break
		}

		for _, batch := range batches {
			if batch.Status != "ACTIVE" {
				continue
			}

			checks := []struct {
				date     string
				certName string
				validity int // months
			}{
				{batch.Specs.BISCertificateIssueDate, "BIS IS 16046", 24},
				{batch.Specs.UN383TestDate, "UN38.3", 24},
				{batch.Specs.IEC62133TestDate, "IEC 62133", 36},
				{batch.Specs.MSDSIssueDate, "MSDS", 36},
			}

			for _, check := range checks {
				if check.date == "" {
					continue
				}

				issueDate, err := time.Parse("2006-01-02", check.date)
				if err != nil {
					continue
				}

				expiryDate := issueDate.AddDate(0, check.validity, 0)
				if expiryDate.After(warningCutoff) {
					continue // not within warning window
				}

				daysUntil := int(expiryDate.Sub(now).Hours() / 24)
				resourceID := batch.ID.String()

				// Deduplicate: don't create the same alert within 7 days
				exists, err := s.repo.HasRecentAlert(ctx, batch.TenantID, "CERTIFICATE_EXPIRY", &resourceID, 7*24*time.Hour)
				if err != nil || exists {
					continue
				}

				severity := "WARNING"
				if daysUntil <= 0 {
					severity = "CRITICAL"
					daysUntil = 0
				}

				title := fmt.Sprintf("%s certificate expiring soon", check.certName)
				if daysUntil <= 0 {
					title = fmt.Sprintf("%s certificate has expired", check.certName)
				}

				message := fmt.Sprintf("Batch '%s' — %s certificate issued on %s expires in %d days (%s). Please renew before expiry.",
					batch.BatchName, check.certName, check.date, daysUntil, expiryDate.Format("2006-01-02"))
				if daysUntil <= 0 {
					message = fmt.Sprintf("Batch '%s' — %s certificate issued on %s has expired (%s). Please renew immediately.",
					batch.BatchName, check.certName, check.date, expiryDate.Format("2006-01-02"))
				}

				alert := &models.TenantAlert{
					ID:           uuid.New().String(),
					TenantID:     batch.TenantID.String(),
					AlertType:    "CERTIFICATE_EXPIRY",
					Severity:     severity,
					Title:        title,
					Message:      message,
					ResourceType: "BATCH",
					ResourceID:   &resourceID,
					CreatedAt:    now,
				}

				if err := s.repo.CreateAlert(ctx, alert); err != nil {
					slog.Error("failed to create certificate expiry alert", "batch", batch.ID, "error", err)
					continue
				}

				s.sendAlertEmail(ctx, batch.TenantID, alert)
			}
		}

		offset += len(batches)
		if len(batches) < limit {
			break
		}
	}

	return nil
}

// CheckComplianceScores scans all active batches and creates alerts for those
// with compliance scores below the threshold (default 70%).
func (s *AlertService) CheckComplianceScores(ctx context.Context, threshold float64) error {
	if threshold <= 0 {
		threshold = 70.0
	}

	offset := 0
	limit := 500
	now := time.Now()

	for {
		batches, err := s.repo.ListAllBatches(ctx, "", limit, offset)
		if err != nil {
			return fmt.Errorf("failed to list batches for compliance check: %w", err)
		}
		if len(batches) == 0 {
			break
		}

		for _, batch := range batches {
			if batch.Status != "ACTIVE" {
				continue
			}
			if batch.ComplianceScore >= threshold {
				continue
			}

			resourceID := batch.ID.String()

			// Deduplicate: don't create the same alert within 7 days
			exists, err := s.repo.HasRecentAlert(ctx, batch.TenantID, "COMPLIANCE_DEGRADED", &resourceID, 7*24*time.Hour)
			if err != nil || exists {
				continue
			}

			severity := "WARNING"
			if batch.ComplianceScore < 50 {
				severity = "CRITICAL"
			}

			alert := &models.TenantAlert{
				ID:           uuid.New().String(),
				TenantID:     batch.TenantID.String(),
				AlertType:    "COMPLIANCE_DEGRADED",
				Severity:     severity,
				Title:        fmt.Sprintf("Batch '%s' compliance below threshold", batch.BatchName),
				Message:      fmt.Sprintf("Batch '%s' has a compliance score of %.1f%% (threshold: %.0f%%). Review and fix the identified gaps.", batch.BatchName, batch.ComplianceScore, threshold),
				ResourceType: "BATCH",
				ResourceID:   &resourceID,
				CreatedAt:    now,
			}

			if err := s.repo.CreateAlert(ctx, alert); err != nil {
				slog.Error("failed to create compliance alert", "batch", batch.ID, "error", err)
				continue
			}

			s.sendAlertEmail(ctx, batch.TenantID, alert)
		}

		offset += len(batches)
		if len(batches) < limit {
			break
		}
	}

	return nil
}

// GetAlerts returns paginated alerts for a tenant.
func (s *AlertService) GetAlerts(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantAlert, error) {
	return s.repo.GetAlertsByTenant(ctx, tenantID, limit, offset)
}

// GetUnreadAlerts returns unread alerts for a tenant.
func (s *AlertService) GetUnreadAlerts(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.TenantAlert, error) {
	return s.repo.GetUnreadAlerts(ctx, tenantID, limit)
}

// GetUnreadCount returns the number of unread alerts for a tenant.
func (s *AlertService) GetUnreadCount(ctx context.Context, tenantID uuid.UUID) (int, error) {
	return s.repo.GetUnreadAlertCount(ctx, tenantID)
}

// MarkAlertRead marks an alert as read.
func (s *AlertService) MarkAlertRead(ctx context.Context, alertID uuid.UUID) error {
	return s.repo.MarkAlertRead(ctx, alertID)
}

// CreateDGFTClaimAlert creates an alert when a DGFT claim status changes.
func (s *AlertService) CreateDGFTClaimAlert(ctx context.Context, tenantID uuid.UUID, claimID, schemeType, status string, approvedAmount *float64) error {
	now := time.Now()
	severity := "INFO"
	title := fmt.Sprintf("DGFT %s claim %s", schemeType, status)
	message := fmt.Sprintf("Your %s claim has been marked as %s.", schemeType, status)
	if status == "APPROVED" && approvedAmount != nil {
		message = fmt.Sprintf("Your %s claim has been APPROVED. Approved amount: ₹%.2f", schemeType, *approvedAmount)
		severity = "WARNING"
	}
	if status == "REJECTED" {
		severity = "CRITICAL"
	}

	alert := &models.TenantAlert{
		ID:        uuid.New().String(),
		TenantID:  tenantID.String(),
		AlertType: "DGFT_CLAIM_STATUS",
		Severity:  severity,
		Title:     title,
		Message:   message,
		ResourceType: "DGFT_CLAIM",
		ResourceID:   &claimID,
		CreatedAt: now,
	}

	if err := s.repo.CreateAlert(ctx, alert); err != nil {
		return fmt.Errorf("failed to create DGFT claim alert: %w", err)
	}
	s.sendAlertEmail(ctx, tenantID, alert)
	return nil
}

// CreateSupplierDocumentAlert creates an alert when a supplier uploads a document.
func (s *AlertService) CreateSupplierDocumentAlert(ctx context.Context, tenantID uuid.UUID, supplierID, supplierName, docType string) error {
	now := time.Now()
	alert := &models.TenantAlert{
		ID:        uuid.New().String(),
		TenantID:  tenantID.String(),
		AlertType: "SUPPLIER_DOCUMENT_UPLOAD",
		Severity:  "INFO",
		Title:     fmt.Sprintf("New %s from %s", docType, supplierName),
		Message:   fmt.Sprintf("Supplier '%s' uploaded a new %s document. Please review and approve.", supplierName, docType),
		ResourceType: "SUPPLIER_DOCUMENT",
		ResourceID:   &supplierID,
		CreatedAt: now,
	}

	if err := s.repo.CreateAlert(ctx, alert); err != nil {
		return fmt.Errorf("failed to create supplier document alert: %w", err)
	}
	s.sendAlertEmail(ctx, tenantID, alert)
	return nil
}

// CreateSupplierInvitationAlert creates an alert when a supplier accepts an invitation.
func (s *AlertService) CreateSupplierInvitationAlert(ctx context.Context, tenantID uuid.UUID, supplierID, supplierName string) error {
	now := time.Now()
	alert := &models.TenantAlert{
		ID:        uuid.New().String(),
		TenantID:  tenantID.String(),
		AlertType: "SUPPLIER_JOINED",
		Severity:  "INFO",
		Title:     fmt.Sprintf("%s joined your supplier portal", supplierName),
		Message:   fmt.Sprintf("Supplier '%s' has accepted your invitation and can now upload documents.", supplierName),
		ResourceType: "SUPPLIER",
		ResourceID:   &supplierID,
		CreatedAt: now,
	}

	if err := s.repo.CreateAlert(ctx, alert); err != nil {
		return fmt.Errorf("failed to create supplier invitation alert: %w", err)
	}
	s.sendAlertEmail(ctx, tenantID, alert)
	return nil
}

// sendAlertEmail attempts to send an email notification for an alert.
func (s *AlertService) sendAlertEmail(ctx context.Context, tenantID uuid.UUID, alert *models.TenantAlert) {
	if s.emailService == nil {
		return
	}

	// Lookup tenant to get support email
	tenant, err := s.repo.GetTenant(ctx, tenantID)
	if err != nil {
		slog.Error("failed to lookup tenant for alert email", "tenant_id", tenantID, "error", err)
		return
	}

	toEmail := tenant.SupportEmail
	if toEmail == "" {
		slog.Warn("tenant has no support_email configured, skipping alert email", "tenant_id", tenantID)
		return
	}

	data := AlertEmailData{
		CompanyName:  tenant.CompanyName,
		AlertTitle:   alert.Title,
		AlertType:    alert.AlertType,
		Severity:     alert.Severity,
		Message:      alert.Message,
		DashboardURL: fmt.Sprintf("%s/dashboard", os.Getenv("FRONTEND_URL")),
	}

	if err := s.emailService.SendAlertEmail(toEmail, data); err != nil {
		slog.Error("failed to send alert email", "tenant_id", tenantID, "alert_id", alert.ID, "error", err)
		return
	}

	if err := s.repo.MarkAlertEmailed(ctx, uuid.MustParse(alert.ID)); err != nil {
		slog.Error("failed to mark alert as emailed", "alert_id", alert.ID, "error", err)
	}
}
