package services

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"

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
	db                 *pgxpool.Pool
	repo               repository.RepositoryInterface
	storageService     *StorageService
	qrService          *QRService
	pdfService         *PDFService
	csvService         *CSVService
	emailService       *EmailService
	auditExportService *AuditExportService
	logger             *slog.Logger
}

// NewExportJobService creates a new export job service
func NewExportJobService(
	db *pgxpool.Pool,
	repo repository.RepositoryInterface,
	storageService *StorageService,
	qrService *QRService,
	pdfService *PDFService,
	csvService *CSVService,
	emailService *EmailService,
	auditExportService *AuditExportService,
	logger *slog.Logger,
) *ExportJobService {
	return &ExportJobService{
		db:                 db,
		repo:               repo,
		storageService:     storageService,
		qrService:          qrService,
		pdfService:         pdfService,
		csvService:         csvService,
		emailService:       emailService,
		auditExportService: auditExportService,
		logger:             logger,
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
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM passports WHERE batch_id = $1 AND deleted_at IS NULL", batchID).Scan(&count)
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
		WHERE p.batch_id = $1 AND p.deleted_at IS NULL
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
		if markErr := s.MarkJobFailed(ctx, job.ID, err.Error()); markErr != nil {
			s.logger.Error("Failed to mark job as failed", "job_id", job.ID, "mark_error", markErr, "original_error", err)
		}
		return err
	}

	// Generate export file based on type
	var data []byte
	var contentType string

	switch job.JobType {
	case models.ExportJobTypeQRZip:
		data, contentType, err = s.generateQRZip(batch, passports)
	case models.ExportJobTypeLabelPDF:
		data, contentType, err = s.generateLabelPDF(batch, passports, tenant)
	case models.ExportJobTypeCSV:
		data, contentType, err = s.generateCSV(passports)
	case models.ExportJobTypeDueDiligence:
		data, contentType, err = s.generateDueDiligence(ctx, batch, tenant)
	case models.ExportJobTypeComplianceDeclaration:
		data, contentType, err = s.generateComplianceDeclaration(ctx, batch, tenant)
	case models.ExportJobTypeAuditCSV:
		data, contentType, err = s.generateAuditCSV(ctx, job.BatchID)
	case models.ExportJobTypeAuditPDF:
		data, contentType, err = s.generateAuditPDF(ctx, job.BatchID, batch, tenant)
	case models.ExportJobTypeEPCIS:
		data, contentType, err = s.generateEPCIS(ctx, job.BatchID, passports)
	case models.ExportJobTypePLIPacket:
		data, contentType, err = s.generatePLIPacket(ctx, job.BatchID, job.TenantID)
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
		if markErr := s.MarkJobFailed(ctx, job.ID, "Failed to upload file: "+err.Error()); markErr != nil {
			s.logger.Error("Failed to mark job as failed", "job_id", job.ID, "mark_error", markErr, "original_error", err)
		}
		return err
	}

	// Create presigned download URL
	expiresAt := time.Now().Add(DownloadURLExpiry)
	downloadURL, err := s.storageService.CreateSignedURL(ctx, filePath, DownloadURLExpiry)
	if err != nil {
		if markErr := s.MarkJobFailed(ctx, job.ID, "Failed to create download URL: "+err.Error()); markErr != nil {
			s.logger.Error("Failed to mark job as failed", "job_id", job.ID, "mark_error", markErr, "original_error", err)
		}
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
		s.sendAnvayaLabsEmail(ctx, userEmail, batch.BatchName, string(job.JobType), downloadURL)
	}

	return nil
}

// getBatchData retrieves batch, passports, and tenant data for processing
func (s *ExportJobService) getBatchData(ctx context.Context, batchID, tenantID uuid.UUID) (*models.Batch, []*models.Passport, *models.Tenant, error) {
	// Get batch with computed passport count and specs (needed for GTIN in QR generation)
	batchQuery := `
		SELECT b.id, b.batch_name, b.tenant_id, b.product_type,
		       COALESCE((SELECT COUNT(*)::int FROM passports WHERE batch_id = b.id AND deleted_at IS NULL), 0) as total_passports,
		       b.status, b.created_at, b.specs, COALESCE(b.gtin, '') as gtin
		FROM batches b 
		WHERE b.id = $1 AND b.tenant_id = $2`
	batch := &models.Batch{}
	var specsJSON []byte
	err := s.db.QueryRow(ctx, batchQuery, batchID, tenantID).Scan(
		&batch.ID, &batch.BatchName, &batch.TenantID, &batch.ProductType, &batch.TotalPassports, &batch.Status, &batch.CreatedAt, &specsJSON, &batch.GTIN,
	)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get batch: %w", err)
	}
	if len(specsJSON) > 0 {
		if err := json.Unmarshal(specsJSON, &batch.Specs); err != nil {
			return nil, nil, nil, fmt.Errorf("failed to unmarshal batch specs: %w", err)
		}
	}

	// Get passports
	passportQuery := `SELECT uuid, batch_id, serial_number, manufacture_date, status, created_at FROM passports WHERE batch_id = $1 AND deleted_at IS NULL`
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

// generateQRZip generates QR codes as a ZIP file with GS1 Digital Link support
func (s *ExportJobService) generateQRZip(batch *models.Batch, passports []*models.Passport) ([]byte, string, error) {
	ctx := &QRLabelContext{
		GTIN: batch.Specs.GTIN,
	}
	zipReader, _, err := s.qrService.GenerateAndZipEnriched(passports, ctx)
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

// generateDueDiligence generates the EU Due Diligence Report PDF.
// It queries the full batch (with specs, carbon result, and market region) since
// getBatchData only loads the lightweight fields needed by other export types.
func (s *ExportJobService) generateDueDiligence(ctx context.Context, batch *models.Batch, tenant *models.Tenant) ([]byte, string, error) {
	fullBatch, err := s.loadFullBatchForDocument(ctx, batch.ID)
	if err != nil {
		return nil, "", err
	}

	fullTenant, err := s.loadTenantForDocument(ctx, tenant.ID)
	if err != nil {
		return nil, "", err
	}

	data, err := GenerateDueDiligenceReport(fullBatch, fullTenant)
	if err != nil {
		return nil, "", err
	}
	return data, "application/pdf", nil
}

// generateComplianceDeclaration generates the EU Article 7 carbon footprint declaration PDF.
// Re-queries batch to get full carbon_footprint_result and specs.
func (s *ExportJobService) generateComplianceDeclaration(ctx context.Context, batch *models.Batch, tenant *models.Tenant) ([]byte, string, error) {
	fullBatch, err := s.loadFullBatchForDocument(ctx, batch.ID)
	if err != nil {
		return nil, "", err
	}

	fullTenant, err := s.loadTenantForDocument(ctx, tenant.ID)
	if err != nil {
		return nil, "", err
	}

	data, err := GenerateComplianceDeclaration(fullBatch, fullTenant)
	if err != nil {
		return nil, "", err
	}
	return data, "application/pdf", nil
}

func (s *ExportJobService) loadFullBatchForDocument(ctx context.Context, batchID uuid.UUID) (*models.Batch, error) {
	fullBatchQuery := `
		SELECT b.id, b.batch_name, b.model_name, b.specs, b.status, b.created_at,
		       b.product_type, b.market_region, b.manufacturing_start_date, b.manufacturing_end_date,
		       b.carbon_footprint_result,
		       COALESCE(b.ce_marking, false), COALESCE(b.carbon_performance_class, ''),
		       COALESCE(b.removable_and_replaceable, false), COALESCE(b.notified_body_number, ''), COALESCE(b.declaration_of_conformity_path, '')
		FROM batches b
		WHERE b.id = $1`
	fullBatch := &models.Batch{}
	err := s.db.QueryRow(ctx, fullBatchQuery, batchID).Scan(
		&fullBatch.ID, &fullBatch.BatchName, &fullBatch.ModelName, &fullBatch.Specs,
		&fullBatch.Status, &fullBatch.CreatedAt,
		&fullBatch.ProductType, &fullBatch.MarketRegion, &fullBatch.ManufacturingStartDate, &fullBatch.ManufacturingEndDate,
		&fullBatch.CarbonFootprintResult,
		&fullBatch.CEMarking, &fullBatch.CarbonPerformanceClass,
		&fullBatch.RemovableAndReplaceable, &fullBatch.NotifiedBodyNumber, &fullBatch.DeclarationOfConformityPath,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load full batch for document generation: %w", err)
	}
	return fullBatch, nil
}

func (s *ExportJobService) loadTenantForDocument(ctx context.Context, tenantID uuid.UUID) (*models.Tenant, error) {
	fullTenantQuery := `
		SELECT t.id, t.company_name, COALESCE(t.address, ''), COALESCE(t.logo_url, ''),
		       COALESCE(t.support_email, ''), COALESCE(t.website, ''),
		       COALESCE(bp.eu_authorized_representative_name, ''),
		       COALESCE(bp.eu_authorized_representative_address, ''),
		       COALESCE(bp.eu_contact_email, '')
		FROM tenants t
		LEFT JOIN public.battery_tenant_profiles bp ON bp.tenant_id = t.id
		WHERE t.id = $1`
	fullTenant := &models.Tenant{
		BatteryProfile: &models.BatteryTenantProfile{},
	}
	err := s.db.QueryRow(ctx, fullTenantQuery, tenantID).Scan(
		&fullTenant.ID, &fullTenant.CompanyName, &fullTenant.Address,
		&fullTenant.LogoURL, &fullTenant.SupportEmail, &fullTenant.Website,
		&fullTenant.BatteryProfile.EUAuthorizedRepresentativeName, &fullTenant.BatteryProfile.EUAuthorizedRepresentativeAddress,
		&fullTenant.BatteryProfile.EUContactEmail,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load full tenant for document generation: %w", err)
	}
	return fullTenant, nil
}

// getUserEmail retrieves user email for notifications
func (s *ExportJobService) getUserEmail(ctx context.Context, userID uuid.UUID) (string, error) {
	var email string
	query := `SELECT email FROM users WHERE id = $1`
	err := s.db.QueryRow(ctx, query, userID).Scan(&email)
	return email, err
}

// sendAnvayaLabsEmail sends notification that export is ready
func (s *ExportJobService) sendAnvayaLabsEmail(ctx context.Context, email, batchName, exportType, downloadURL string) {
	// Use email service to send notification
	subject := fmt.Sprintf("Your %s export is ready - %s", exportType, batchName)
	body := fmt.Sprintf(`
		<h2>Export Ready</h2>
		<p>Your <strong>%s</strong> export for batch <strong>%s</strong> is ready for download.</p>
		<p><a href="%s" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Export</a></p>
		<p><small>This download link expires in 24 hours.</small></p>
	`, exportType, batchName, downloadURL)

	if err := s.emailService.SendAnvayaLabs(email, subject, body); err != nil {
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

// ──────────────────────────────────────────────────────────────────────────────
// Audit trail export helpers
// ──────────────────────────────────────────────────────────────────────────────

func (s *ExportJobService) generateAuditCSV(ctx context.Context, batchID uuid.UUID) ([]byte, string, error) {
	data, err := s.auditExportService.ExportAuditTrailCSV(ctx, batchID)
	return data, "text/csv", err
}

func (s *ExportJobService) generateAuditPDF(ctx context.Context, batchID uuid.UUID, batch *models.Batch, tenant *models.Tenant) ([]byte, string, error) {
	data, err := s.auditExportService.ExportAuditTrailPDF(ctx, batchID, batch, tenant)
	return data, "application/pdf", err
}

// generateEPCIS builds one combined GS1 EPCIS 2.0 JSON-LD document covering
// every passport in the batch — the EU buyer per-shipment requirement
// (one file per batch shipment, not one file per passport).
func (s *ExportJobService) generateEPCIS(ctx context.Context, batchID uuid.UUID, passports []*models.Passport) ([]byte, string, error) {
	eventsByPassport, err := s.getEventsByPassportForBatch(ctx, batchID)
	if err != nil {
		return nil, "", err
	}

	doc := BuildBulkEPCISDocument(passports, eventsByPassport)
	data, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal EPCIS document: %w", err)
	}
	return data, "application/ld+json", nil
}

// getEventsByPassportForBatch fetches every passport_events row for the
// batch, grouped by passport_id, in the structured *models.PassportEvent
// shape the EPCIS builder needs (distinct from AuditExportService's
// flattened AuditEventRow, which is shaped for CSV/PDF columns instead).
func (s *ExportJobService) getEventsByPassportForBatch(ctx context.Context, batchID uuid.UUID) (map[uuid.UUID][]*models.PassportEvent, error) {
	query := `SELECT e.id, e.passport_id, e.event_type, COALESCE(e.action, ''), e.actor,
	                 COALESCE(e.actor_type, ''), COALESCE(e.actor_role, ''), COALESCE(e.actor_identifier, ''), COALESCE(e.source, ''),
	                 COALESCE(e.status_from, ''), COALESCE(e.status_to, ''), COALESCE(e.ip_address, ''),
	                 e.metadata, e.created_at, COALESCE(e.hash, ''), COALESCE(e.previous_hash, '')
	          FROM public.passport_events e
	          JOIN public.passports p ON p.uuid = e.passport_id
	          WHERE p.batch_id = $1
	          ORDER BY e.passport_id, e.created_at ASC, e.id ASC`

	rows, err := s.db.Query(ctx, query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to get batch events: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]*models.PassportEvent)
	for rows.Next() {
		event := &models.PassportEvent{}
		var metadataJSON []byte
		if err := rows.Scan(
			&event.ID, &event.PassportID, &event.EventType, &event.Action, &event.Actor,
			&event.ActorType, &event.ActorRole, &event.ActorID, &event.Source,
			&event.StatusFrom, &event.StatusTo, &event.IPAddress,
			&metadataJSON, &event.CreatedAt, &event.Hash, &event.PreviousHash,
		); err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &event.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal event metadata: %w", err)
			}
		}
		result[event.PassportID] = append(result[event.PassportID], event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating batch events: %w", err)
	}
	return result, nil
}

// ──────────────────────────────────────────────────────────────────────────────
// PLI claim packet (STRAT-04)
// ──────────────────────────────────────────────────────────────────────────────

// generatePLIPacket assembles a single ZIP containing the DVA calculation
// report, batch compliance report, the latest DGFT export-incentive claim
// (if one has been filed against this batch), any uploaded BIS/PLI
// certificate files, and a manifest cover sheet listing what's actually
// included. Documents this platform doesn't track (e.g. ARAI/iCAT type
// approval) are explicitly flagged as missing in the manifest rather than
// silently absent.
func (s *ExportJobService) generatePLIPacket(ctx context.Context, batchID, tenantID uuid.UUID) ([]byte, string, error) {
	fullBatch, err := s.loadFullBatchForDocument(ctx, batchID)
	if err != nil {
		return nil, "", err
	}

	fullTenant, err := s.loadTenantForDocument(ctx, tenantID)
	if err != nil {
		return nil, "", err
	}

	profile, err := s.loadBatteryProfileForPLIPacket(ctx, tenantID)
	if err != nil {
		return nil, "", err
	}
	fullTenant.BatteryProfile = profile

	type packetFile struct {
		name string
		data []byte
	}
	var files []packetFile
	hasDVA := false
	hasComplianceReport := false

	if dvaBytes, err := GenerateDVACalculationReport(fullBatch, fullTenant); err == nil {
		files = append(files, packetFile{"01_DVA_Calculation_Report.pdf", dvaBytes})
		hasDVA = true
	} else {
		s.logger.Warn("PLI packet: DVA report generation failed", "batch_id", batchID, "error", err)
	}

	if crBytes, err := GenerateComplianceReport(fullBatch, fullTenant); err == nil {
		files = append(files, packetFile{"02_Compliance_Report.pdf", crBytes})
		hasComplianceReport = true
	} else {
		s.logger.Warn("PLI packet: compliance report generation failed", "batch_id", batchID, "error", err)
	}

	var dgftClaim *models.DGFTClaim
	if s.repo != nil {
		claim, err := s.repo.GetLatestDGFTClaimByBatch(ctx, batchID, tenantID)
		if err != nil {
			s.logger.Warn("PLI packet: failed to look up DGFT claim", "batch_id", batchID, "error", err)
		} else if claim != nil {
			dgftClaim = claim
			if pdfBytes, err := s.generateDGFTClaimPDF(ctx, claim, fullTenant.CompanyName); err == nil {
				files = append(files, packetFile{"03_DGFT_Claim.pdf", pdfBytes})
			} else {
				s.logger.Warn("PLI packet: DGFT claim PDF generation failed", "batch_id", batchID, "error", err)
			}
		}
	}

	if bisBytes, ok := s.fetchCertificateFile(ctx, profile.BISCertificatePath); ok {
		files = append(files, packetFile{"04_BIS_Certificate" + certFileExt(profile.BISCertificatePath), bisBytes})
	}
	if pliBytes, ok := s.fetchCertificateFile(ctx, profile.PLICertificatePath); ok {
		files = append(files, packetFile{"05_PLI_Certificate" + certFileExt(profile.PLICertificatePath), pliBytes})
	}

	manifest, err := GeneratePLIPacketManifest(PLIPacketManifestInput{
		Batch:               fullBatch,
		Tenant:              fullTenant,
		HasDVAReport:        hasDVA,
		HasComplianceReport: hasComplianceReport,
		HasBISCertificate:   profile.BISCertificatePath != "",
		HasPLICertificate:   profile.PLICertificatePath != "",
		DGFTClaim:           dgftClaim,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate PLI packet manifest: %w", err)
	}

	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	writeZipEntry := func(name string, data []byte) error {
		w, err := zipWriter.Create(name)
		if err != nil {
			return err
		}
		_, err = w.Write(data)
		return err
	}

	if err := writeZipEntry("00_Manifest.pdf", manifest); err != nil {
		return nil, "", fmt.Errorf("failed to write manifest to zip: %w", err)
	}
	for _, f := range files {
		if err := writeZipEntry(f.name, f.data); err != nil {
			return nil, "", fmt.Errorf("failed to write %s to zip: %w", f.name, err)
		}
	}
	if err := zipWriter.Close(); err != nil {
		return nil, "", fmt.Errorf("failed to finalize PLI packet zip: %w", err)
	}

	return buf.Bytes(), "application/zip", nil
}

// loadBatteryProfileForPLIPacket loads only the certificate paths needed by
// the PLI packet — a dedicated, narrow query rather than overloading
// loadTenantForDocument (which is shaped for the EU-specific generators).
func (s *ExportJobService) loadBatteryProfileForPLIPacket(ctx context.Context, tenantID uuid.UUID) (*models.BatteryTenantProfile, error) {
	query := `
		SELECT COALESCE(bis_certificate_path, ''), COALESCE(pli_certificate_path, ''), COALESCE(epr_certificate_path, '')
		FROM battery_tenant_profiles
		WHERE tenant_id = $1`

	profile := &models.BatteryTenantProfile{TenantID: tenantID}
	err := s.db.QueryRow(ctx, query, tenantID).Scan(&profile.BISCertificatePath, &profile.PLICertificatePath, &profile.EPRCertificatePath)
	if errors.Is(err, pgx.ErrNoRows) {
		return profile, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to load battery tenant profile: %w", err)
	}
	return profile, nil
}

// generateDGFTClaimPDF looks up the scheme config for a claim and renders its PDF.
func (s *ExportJobService) generateDGFTClaimPDF(ctx context.Context, claim *models.DGFTClaim, tenantName string) ([]byte, error) {
	schemes, err := s.repo.ListDGFTSchemeConfigs(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list DGFT scheme configs: %w", err)
	}
	var scheme *models.DGFTSchemeConfig
	for i := range schemes {
		if schemes[i].SchemeType == claim.SchemeType {
			scheme = &schemes[i]
			break
		}
	}
	if scheme == nil {
		return nil, fmt.Errorf("scheme config not found for scheme type %q", claim.SchemeType)
	}

	buf, err := GenerateClaimPDF(claim, scheme, tenantName)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// fetchCertificateFile downloads an already-uploaded certificate from its
// stored URL. Certificate paths on BatteryTenantProfile are stored as
// ready-to-fetch URLs (see document_handlers.go's ViewDocument), which may be
// public or a previously-issued signed URL that has since expired — a fetch
// failure here is treated as "not available" rather than a fatal error, so
// one stale certificate link doesn't block the rest of the packet.
func (s *ExportJobService) fetchCertificateFile(ctx context.Context, fileURL string) ([]byte, bool) {
	if fileURL == "" {
		return nil, false
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fileURL, nil)
	if err != nil {
		return nil, false
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		s.logger.Warn("PLI packet: failed to fetch certificate file", "url", fileURL, "error", err)
		return nil, false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.logger.Warn("PLI packet: certificate file fetch returned non-200", "url", fileURL, "status", resp.StatusCode)
		return nil, false
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, false
	}
	return data, true
}

// certFileExt extracts a file extension from a certificate URL, stripping
// any query string (signed URLs carry one), defaulting to .pdf.
func certFileExt(fileURL string) string {
	clean := fileURL
	if idx := strings.IndexAny(clean, "?#"); idx >= 0 {
		clean = clean[:idx]
	}
	ext := path.Ext(clean)
	if ext == "" {
		return ".pdf"
	}
	return ext
}
