package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"exportready-battery/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// ThresholdForAsyncExport defines the minimum passport count to trigger async export
	ThresholdForAsyncExport = 500

	// DownloadURLExpiry is how long presigned download URLs remain valid
	DownloadURLExpiry = 24 * time.Hour
)

// ExportJobService handles async export job operations
type ExportJobService struct {
	db             *pgxpool.Pool
	storageService *StorageService
	qrService      *QRService
	pdfService     *PDFService
	csvService     *CSVService
	emailService   *EmailService
	logger         *slog.Logger
}

// NewExportJobService creates a new export job service
func NewExportJobService(
	db *pgxpool.Pool,
	storageService *StorageService,
	qrService *QRService,
	pdfService *PDFService,
	csvService *CSVService,
	emailService *EmailService,
	logger *slog.Logger,
) *ExportJobService {
	return &ExportJobService{
		db:             db,
		storageService: storageService,
		qrService:      qrService,
		pdfService:     pdfService,
		csvService:     csvService,
		emailService:   emailService,
		logger:         logger,
	}
}

// CreateJob creates a new pending export job
func (s *ExportJobService) CreateJob(ctx context.Context, tenantID, batchID, requestedBy uuid.UUID, jobType models.ExportJobType, passportCount int) (*models.ExportJob, error) {
	job := &models.ExportJob{
		ID:            uuid.New(),
		TenantID:      tenantID,
		BatchID:       batchID,
		JobType:       jobType,
		Status:        models.ExportJobStatusPending,
		PassportCount: passportCount,
		RequestedBy:   requestedBy,
		RequestedAt:   time.Now(),
	}

	query := `
		INSERT INTO export_jobs (id, tenant_id, batch_id, job_type, status, passport_count, requested_by, requested_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	err := s.db.QueryRow(ctx, query,
		job.ID, job.TenantID, job.BatchID, job.JobType, job.Status,
		job.PassportCount, job.RequestedBy, job.RequestedAt,
	).Scan(&job.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create export job: %w", err)
	}

	s.logger.Info("export job created",
		"jobId", job.ID,
		"batchId", batchID,
		"jobType", jobType,
		"passportCount", passportCount,
	)

	return job, nil
}

// GetPassportCountByBatch returns the number of passports in a batch
func (s *ExportJobService) GetPassportCountByBatch(ctx context.Context, batchID uuid.UUID) (int, error) {
	var count int
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM passports WHERE batch_id = $1", batchID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get passport count: %w", err)
	}
	return count, nil
}

// CountPassportsMissingShippedEvent returns count of passports missing a SHIPPED event
func (s *ExportJobService) CountPassportsMissingShippedEvent(ctx context.Context, batchID uuid.UUID) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM passports p
		WHERE p.batch_id = $1
		  AND NOT EXISTS (
			  SELECT 1 FROM passport_events e
			  WHERE e.passport_id = p.uuid AND e.event_type = 'SHIPPED'
		  )
	`
	if err := s.db.QueryRow(ctx, query, batchID).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count missing shipped events: %w", err)
	}
	return count, nil
}

// GetJobByID retrieves an export job by ID
func (s *ExportJobService) GetJobByID(ctx context.Context, jobID uuid.UUID) (*models.ExportJob, error) {
	query := `
		SELECT ej.id, ej.tenant_id, ej.batch_id, ej.job_type, ej.status, ej.passport_count,
			   ej.file_path, ej.file_size_bytes, ej.download_url, ej.error_message,
			   ej.requested_by, ej.requested_at, ej.started_at, ej.completed_at, ej.expires_at,
			   ej.download_count, ej.last_downloaded_at, b.batch_name
		FROM export_jobs ej
		JOIN batches b ON b.id = ej.batch_id
		WHERE ej.id = $1`

	job := &models.ExportJob{}

	err := s.db.QueryRow(ctx, query, jobID).Scan(
		&job.ID, &job.TenantID, &job.BatchID, &job.JobType, &job.Status, &job.PassportCount,
		&job.FilePath, &job.FileSizeBytes, &job.DownloadURL, &job.ErrorMessage,
		&job.RequestedBy, &job.RequestedAt, &job.StartedAt, &job.CompletedAt, &job.ExpiresAt,
		&job.DownloadCount, &job.LastDownloadedAt, &job.BatchName,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get export job: %w", err)
	}

	return job, nil
}

// ListJobsByTenant retrieves all export jobs for a tenant
func (s *ExportJobService) ListJobsByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]models.ExportJob, int, error) {
	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM export_jobs WHERE tenant_id = $1`
	if err := s.db.QueryRow(ctx, countQuery, tenantID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count export jobs: %w", err)
	}

	// Get jobs
	query := `
		SELECT ej.id, ej.tenant_id, ej.batch_id, ej.job_type, ej.status, ej.passport_count,
			   ej.file_path, ej.file_size_bytes, ej.download_url, ej.error_message,
			   ej.requested_by, ej.requested_at, ej.started_at, ej.completed_at, ej.expires_at,
			   ej.download_count, ej.last_downloaded_at, b.batch_name
		FROM export_jobs ej
		JOIN batches b ON b.id = ej.batch_id
		WHERE ej.tenant_id = $1
		ORDER BY ej.requested_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := s.db.Query(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list export jobs: %w", err)
	}
	defer rows.Close()

	var jobs []models.ExportJob
	for rows.Next() {
		job := models.ExportJob{}
		if err := rows.Scan(
			&job.ID, &job.TenantID, &job.BatchID, &job.JobType, &job.Status, &job.PassportCount,
			&job.FilePath, &job.FileSizeBytes, &job.DownloadURL, &job.ErrorMessage,
			&job.RequestedBy, &job.RequestedAt, &job.StartedAt, &job.CompletedAt, &job.ExpiresAt,
			&job.DownloadCount, &job.LastDownloadedAt, &job.BatchName,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan export job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, total, nil
}

// GetPendingJobs retrieves jobs ready for processing
func (s *ExportJobService) GetPendingJobs(ctx context.Context, limit int) ([]models.ExportJob, error) {
	query := `
		SELECT id, tenant_id, batch_id, job_type, status, passport_count, requested_by, requested_at
		FROM export_jobs
		WHERE status = 'PENDING'
		ORDER BY requested_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED`

	rows, err := s.db.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending jobs: %w", err)
	}
	defer rows.Close()

	var jobs []models.ExportJob
	for rows.Next() {
		job := models.ExportJob{}
		if err := rows.Scan(
			&job.ID, &job.TenantID, &job.BatchID, &job.JobType, &job.Status,
			&job.PassportCount, &job.RequestedBy, &job.RequestedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan pending job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// MarkJobProcessing updates job status to PROCESSING
func (s *ExportJobService) MarkJobProcessing(ctx context.Context, jobID uuid.UUID) error {
	query := `
		UPDATE export_jobs
		SET status = 'PROCESSING', started_at = NOW()
		WHERE id = $1`

	_, err := s.db.Exec(ctx, query, jobID)
	if err != nil {
		return fmt.Errorf("failed to mark job processing: %w", err)
	}

	s.logger.Info("job marked as processing", "jobId", jobID)
	return nil
}

// MarkJobCompleted updates job status to COMPLETED with file info
func (s *ExportJobService) MarkJobCompleted(ctx context.Context, jobID uuid.UUID, filePath string, fileSize int64, downloadURL string, expiresAt time.Time) error {
	query := `
		UPDATE export_jobs
		SET status = 'COMPLETED', 
			completed_at = NOW(),
			file_path = $2,
			file_size_bytes = $3,
			download_url = $4,
			expires_at = $5
		WHERE id = $1`

	_, err := s.db.Exec(ctx, query, jobID, filePath, fileSize, downloadURL, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to mark job completed: %w", err)
	}

	s.logger.Info("job completed",
		"jobId", jobID,
		"filePath", filePath,
		"fileSize", fileSize,
	)
	return nil
}

// MarkJobFailed updates job status to FAILED with error message
func (s *ExportJobService) MarkJobFailed(ctx context.Context, jobID uuid.UUID, errorMsg string) error {
	query := `
		UPDATE export_jobs
		SET status = 'FAILED', 
			completed_at = NOW(),
			error_message = $2
		WHERE id = $1`

	_, err := s.db.Exec(ctx, query, jobID, errorMsg)
	if err != nil {
		return fmt.Errorf("failed to mark job failed: %w", err)
	}

	s.logger.Error("job failed", "jobId", jobID, "error", errorMsg)
	return nil
}

// IncrementDownloadCount increments the download counter
func (s *ExportJobService) IncrementDownloadCount(ctx context.Context, jobID uuid.UUID) error {
	query := `
		UPDATE export_jobs
		SET download_count = download_count + 1,
			last_downloaded_at = NOW()
		WHERE id = $1`

	_, err := s.db.Exec(ctx, query, jobID)
	return err
}

// ProcessJob processes a single export job - called by background worker
func (s *ExportJobService) ProcessJob(ctx context.Context, job *models.ExportJob) error {
	// Mark as processing
	if err := s.MarkJobProcessing(ctx, job.ID); err != nil {
		return err
	}

	// Get batch and passports
	batch, passports, tenant, err := s.getBatchData(ctx, job.BatchID, job.TenantID)
	if err != nil {
		s.MarkJobFailed(ctx, job.ID, err.Error())
		return err
	}

	// Generate export file based on type
	var data []byte
	var contentType string

	switch job.JobType {
	case models.ExportJobTypeQRZip:
		data, contentType, err = s.generateQRZip(passports)
	case models.ExportJobTypeLabelPDF:
		data, contentType, err = s.generateLabelPDF(batch, passports, tenant)
	case models.ExportJobTypeCSV:
		data, contentType, err = s.generateCSV(passports)
	default:
		err = fmt.Errorf("unknown job type: %s", job.JobType)
	}

	if err != nil {
		s.MarkJobFailed(ctx, job.ID, err.Error())
		return err
	}

	// Upload to Supabase Storage
	filePath := fmt.Sprintf("%s/%s/%s", job.TenantID, job.BatchID, job.GetFilename(batch.BatchName))

	if err := s.storageService.UploadFile(ctx, data, filePath, contentType); err != nil {
		s.MarkJobFailed(ctx, job.ID, "Failed to upload file: "+err.Error())
		return err
	}

	// Create presigned download URL
	expiresAt := time.Now().Add(DownloadURLExpiry)
	downloadURL, err := s.storageService.CreateSignedURL(ctx, filePath, DownloadURLExpiry)
	if err != nil {
		s.MarkJobFailed(ctx, job.ID, "Failed to create download URL: "+err.Error())
		return err
	}

	// Mark job completed
	fileSize := int64(len(data))
	if err := s.MarkJobCompleted(ctx, job.ID, filePath, fileSize, downloadURL, expiresAt); err != nil {
		return err
	}

	// Send email notification
	userEmail, err := s.getUserEmail(ctx, job.RequestedBy)
	if err == nil && userEmail != "" {
		s.sendExportReadyEmail(ctx, userEmail, batch.BatchName, string(job.JobType), downloadURL)
	}

	return nil
}

// getBatchData retrieves batch, passports, and tenant data for processing
func (s *ExportJobService) getBatchData(ctx context.Context, batchID, tenantID uuid.UUID) (*models.Batch, []*models.Passport, *models.Tenant, error) {
	// Get batch with computed passport count
	batchQuery := `
		SELECT b.id, b.batch_name, b.tenant_id, 
		       COALESCE((SELECT COUNT(*)::int FROM passports WHERE batch_id = b.id), 0) as total_passports,
		       b.status, b.created_at 
		FROM batches b 
		WHERE b.id = $1 AND b.tenant_id = $2`
	batch := &models.Batch{}
	err := s.db.QueryRow(ctx, batchQuery, batchID, tenantID).Scan(
		&batch.ID, &batch.BatchName, &batch.TenantID, &batch.TotalPassports, &batch.Status, &batch.CreatedAt,
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get batch: %w", err)
	}

	// Get passports
	passportQuery := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at FROM passports WHERE batch_id = $1`
	rows, err := s.db.Query(ctx, passportQuery, batchID)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get passports: %w", err)
	}
	defer rows.Close()

	var passports []*models.Passport
	for rows.Next() {
		p := &models.Passport{}
		if err := rows.Scan(&p.UUID, &p.BatchID, &p.SerialNumber, &p.ManufactureDate, &p.Status, &p.CreatedAt); err != nil {
			return nil, nil, nil, fmt.Errorf("failed to scan passport: %w", err)
		}
		passports = append(passports, p)
	}

	// Get tenant
	tenantQuery := `SELECT id, company_name, address, logo_url, support_email, website FROM tenants WHERE id = $1`
	tenant := &models.Tenant{}
	err = s.db.QueryRow(ctx, tenantQuery, tenantID).Scan(
		&tenant.ID, &tenant.CompanyName, &tenant.Address, &tenant.LogoURL, &tenant.SupportEmail, &tenant.Website,
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return batch, passports, tenant, nil
}

// generateQRZip generates QR codes as a ZIP file
func (s *ExportJobService) generateQRZip(passports []*models.Passport) ([]byte, string, error) {
	zipReader, _, err := s.qrService.GenerateAndZip(passports)
	if err != nil {
		return nil, "", err
	}

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(zipReader); err != nil {
		return nil, "", err
	}

	return buf.Bytes(), "application/zip", nil
}

// generateLabelPDF generates PDF labels
func (s *ExportJobService) generateLabelPDF(batch *models.Batch, passports []*models.Passport, tenant *models.Tenant) ([]byte, string, error) {
	pdfBuffer, err := s.pdfService.GenerateLabelSheet(batch, passports, tenant)
	if err != nil {
		return nil, "", err
	}
	return pdfBuffer.Bytes(), "application/pdf", nil
}

// generateCSV generates CSV export
func (s *ExportJobService) generateCSV(passports []*models.Passport) ([]byte, string, error) {
	csvBytes, err := s.csvService.ExportPassports(passports)
	if err != nil {
		return nil, "", err
	}
	return csvBytes, "text/csv", nil
}

// getUserEmail retrieves user email for notifications
func (s *ExportJobService) getUserEmail(ctx context.Context, userID uuid.UUID) (string, error) {
	var email string
	query := `SELECT email FROM users WHERE id = $1`
	err := s.db.QueryRow(ctx, query, userID).Scan(&email)
	return email, err
}

// sendExportReadyEmail sends notification that export is ready
func (s *ExportJobService) sendExportReadyEmail(ctx context.Context, email, batchName, exportType, downloadURL string) {
	// Use email service to send notification
	subject := fmt.Sprintf("Your %s export is ready - %s", exportType, batchName)
	body := fmt.Sprintf(`
		<h2>Export Ready</h2>
		<p>Your <strong>%s</strong> export for batch <strong>%s</strong> is ready for download.</p>
		<p><a href="%s" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Export</a></p>
		<p><small>This download link expires in 24 hours.</small></p>
	`, exportType, batchName, downloadURL)

	if err := s.emailService.SendExportReady(email, subject, body); err != nil {
		s.logger.Error("failed to send export ready email", "email", email, "error", err)
	}
}

// ShouldUseAsyncExport determines if a batch should use async export
func ShouldUseAsyncExport(passportCount int) bool {
	return passportCount > ThresholdForAsyncExport
}

// RefreshDownloadURL creates a new presigned URL if expired
func (s *ExportJobService) RefreshDownloadURL(ctx context.Context, jobID uuid.UUID) (string, error) {
	job, err := s.GetJobByID(ctx, jobID)
	if err != nil || job == nil {
		return "", fmt.Errorf("job not found")
	}

	if job.Status != models.ExportJobStatusCompleted || job.FilePath == nil {
		return "", fmt.Errorf("job is not completed or has no file")
	}

	// Create new presigned URL
	expiresAt := time.Now().Add(DownloadURLExpiry)
	downloadURL, err := s.storageService.CreateSignedURL(ctx, *job.FilePath, DownloadURLExpiry)
	if err != nil {
		return "", err
	}

	// Update job with new URL
	query := `UPDATE export_jobs SET download_url = $2, expires_at = $3 WHERE id = $1`
	_, err = s.db.Exec(ctx, query, jobID, downloadURL, expiresAt)
	if err != nil {
		return "", err
	}

	return downloadURL, nil
}
