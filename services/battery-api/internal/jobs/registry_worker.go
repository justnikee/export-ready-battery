package jobs

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/anvayalabs/battery-api/internal/config"
	"github.com/anvayalabs/battery-api/internal/integrations/registry"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// tenantCertJobStore is the subset of repository methods needed to process
// tenant-level certificate verification jobs. Satisfied implicitly by
// *repository.Repository; asserted at construction time so test fakes that
// don't implement it simply disable this part of the worker.
type tenantCertJobStore interface {
	GetPendingTenantCertVerificationJobs(ctx context.Context, limit int) ([]models.TenantCertVerificationJob, error)
	UpdateTenantCertVerificationJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, errorMessage string) error
	UpdateDocumentStatus(ctx context.Context, tenantID uuid.UUID, docType string, status string) error
}

// RegistryWorkerPool processes async registry verification jobs.
type RegistryWorkerPool struct {
	repo            repository.RepositoryInterface
	tenantCertStore tenantCertJobStore
	adapters        *registry.AdapterRegistry
	cfg             *config.Config
	interval        time.Duration
	maxWorkers      int
	quit            chan struct{}
	wg              sync.WaitGroup
}

// NewRegistryWorkerPool creates a worker pool for registry jobs.
func NewRegistryWorkerPool(repo repository.RepositoryInterface, cfg *config.Config) *RegistryWorkerPool {
	regCfg := registry.RegistryConfig{}
	if cfg != nil {
		regCfg = registry.RegistryConfig{
			BISBaseURL:     cfg.BISBaseURL,
			CPCBBaseURL:    cfg.CPCBBaseURL,
			EUNANDOBaseURL: cfg.EUNANDOBaseURL,
			UN38BaseURL:    cfg.UN38BaseURL,
			HTTPTimeout:    cfg.RegistryHTTPTimeout,
		}
	}
	tenantCertStore, _ := repo.(tenantCertJobStore)
	return &RegistryWorkerPool{
		repo:            repo,
		tenantCertStore: tenantCertStore,
		adapters:        registry.NewAdapterRegistry(regCfg, repo),
		cfg:             cfg,
		interval:        cfg.RegistryWorkerInterval,
		maxWorkers:      cfg.RegistryWorkerCount,
		quit:            make(chan struct{}),
	}
}

// Start begins the worker pool in a background goroutine.
func (p *RegistryWorkerPool) Start() {
	if p.interval == 0 {
		p.interval = 30 * time.Second
	}
	if p.maxWorkers == 0 {
		p.maxWorkers = 3
	}

	go p.loop()
	slog.Info("registry worker pool started", "workers", p.maxWorkers, "interval", p.interval)
}

// Stop gracefully shuts down the worker pool.
func (p *RegistryWorkerPool) Stop() {
	close(p.quit)
	p.wg.Wait()
	slog.Info("registry worker pool stopped")
}

func (p *RegistryWorkerPool) loop() {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	for {
		select {
		case <-p.quit:
			return
		case <-ticker.C:
			p.processBatch()
			p.processTenantCertBatch()
		}
	}
}

func (p *RegistryWorkerPool) processBatch() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	jobs, err := p.repo.GetPendingRegistryJobs(ctx, p.maxWorkers*2)
	if err != nil {
		slog.Error("failed to poll registry jobs", "error", err)
		return
	}
	if len(jobs) == 0 {
		return
	}

	slog.Info("processing registry jobs", "count", len(jobs))

	sem := make(chan struct{}, p.maxWorkers)
	for _, job := range jobs {
		p.wg.Add(1)
		go func(j models.RegistryJob) {
			defer p.wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			p.processJob(ctx, j)
		}(job)
	}
}

func (p *RegistryWorkerPool) processJob(ctx context.Context, job models.RegistryJob) {
	start := time.Now()
	jobID, _ := uuid.Parse(job.ID)
	batchID, _ := uuid.Parse(job.BatchID)
	tenantID, _ := uuid.Parse(job.TenantID)

	// Update status to running
	_ = p.repo.UpdateRegistryJobStatus(ctx, jobID, "running", job.AttemptCount+1, nil, "", "", "", "")

	// Resolve registry type
	regType, err := registry.NormalizeRegistryType(job.RegistryType)
	if err != nil {
		p.failJob(ctx, jobID, job, fmt.Errorf("invalid registry type: %w", err), start)
		return
	}

	// Get adapter
	adapter := p.adapters.Get(regType)
	if adapter == nil {
		p.failJob(ctx, jobID, job, fmt.Errorf("no adapter for type: %s", regType), start)
		return
	}

	// Fetch batch metadata
	batch, err := p.repo.GetBatch(ctx, batchID, tenantID)
	if err != nil {
		p.failJob(ctx, jobID, job, fmt.Errorf("failed to load batch: %w", err), start)
		return
	}
	metadata := extractBatchMetadata(batch)

	// Build audit log entry
	audit := &models.RegistryAuditLog{
		ID:            uuid.New().String(),
		JobID:         job.ID,
		RegistryType:  job.RegistryType,
		CertificateNo: job.CertificateNo,
		RequestMethod: "GET",
		RequestURL:    adapter.Name(),
		CreatedAt:     time.Now(),
	}

	// Call adapter
	result, adapterErr := adapter.Verify(ctx, job.CertificateNo, metadata)
	latency := int(time.Since(start).Milliseconds())
	audit.LatencyMs = latency

	if adapterErr != nil {
		audit.ErrorMessage = adapterErr.Error()
		audit.ResponseStatus = 0
	} else {
		audit.ResponseStatus = 200
		audit.ResponsePayload = &result.VerifiedData
	}

	if err := p.repo.CreateRegistryAuditLog(ctx, audit); err != nil {
		slog.Error("failed to write registry audit log", "error", err, "job_id", job.ID)
	}

	if adapterErr != nil {
		p.failJob(ctx, jobID, job, adapterErr, start)
		return
	}

	// Cache the result
	now := time.Now()
	expires := now.Add(registry.DefaultCacheTTL)
	verification := &models.RegistryVerification{
		ID:            uuid.New().String(),
		TenantID:      job.TenantID,
		BatchID:       job.BatchID,
		RegistryType:  job.RegistryType,
		CertificateNo: job.CertificateNo,
		Status:        string(result.Status),
		TrustTier:     string(result.TrustTier),
		VerifiedData:  &result.VerifiedData,
		ErrorMessage:  result.ErrorMessage,
		VerifiedAt:    &now,
		ExpiresAt:     &expires,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	if err := p.repo.CreateRegistryVerification(ctx, verification); err != nil {
		slog.Error("failed to cache registry verification", "error", err, "job_id", job.ID)
	}

	// Mark job success
	_ = p.repo.UpdateRegistryJobStatus(ctx, jobID, "success", job.AttemptCount+1, nil, string(result.Status), string(result.TrustTier), verification.ID, "")
	slog.Info("registry job completed", "job_id", job.ID, "registry", job.RegistryType, "latency_ms", latency, "status", result.Status)
}

func (p *RegistryWorkerPool) failJob(ctx context.Context, jobID uuid.UUID, job models.RegistryJob, err error, start time.Time) {
	latency := int(time.Since(start).Milliseconds())
	attempts := job.AttemptCount + 1
	maxAttempts := job.MaxAttempts
	if maxAttempts == 0 {
		maxAttempts = 5
	}

	backoff := calculateBackoff(attempts)
	nextAttempt := time.Now().Add(backoff)
	status := "failed"
	if attempts >= maxAttempts {
		status = "dead"
	}

	_ = p.repo.UpdateRegistryJobStatus(ctx, jobID, status, attempts, &nextAttempt, "", "", "", err.Error())
	slog.Warn("registry job failed",
		"job_id", job.ID,
		"registry", job.RegistryType,
		"attempt", attempts,
		"max_attempts", maxAttempts,
		"next_attempt", nextAttempt,
		"latency_ms", latency,
		"error", err.Error(),
	)
}

// processTenantCertBatch polls and processes pending tenant certificate
// verification jobs (e.g. checking a BIS R-Number against the BIS portal).
// No-op if the underlying repo doesn't support tenant cert jobs.
func (p *RegistryWorkerPool) processTenantCertBatch() {
	if p.tenantCertStore == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	jobs, err := p.tenantCertStore.GetPendingTenantCertVerificationJobs(ctx, p.maxWorkers*2)
	if err != nil {
		slog.Error("failed to poll tenant cert verification jobs", "error", err)
		return
	}
	if len(jobs) == 0 {
		return
	}

	slog.Info("processing tenant cert verification jobs", "count", len(jobs))

	sem := make(chan struct{}, p.maxWorkers)
	for _, job := range jobs {
		p.wg.Add(1)
		go func(j models.TenantCertVerificationJob) {
			defer p.wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			p.processTenantCertJob(ctx, j)
		}(job)
	}
}

func (p *RegistryWorkerPool) processTenantCertJob(ctx context.Context, job models.TenantCertVerificationJob) {
	jobID, _ := uuid.Parse(job.ID)
	tenantID, _ := uuid.Parse(job.TenantID)

	_ = p.tenantCertStore.UpdateTenantCertVerificationJobStatus(ctx, jobID, "running", job.AttemptCount+1, nil, "", "", "")

	regType, err := registry.NormalizeRegistryType(job.DocType)
	if err != nil {
		// No registry adapter for this doc type (e.g. "epr"/"pli" today) —
		// leave it for manual admin review via /api/v1/admin/verify-doc.
		_ = p.tenantCertStore.UpdateTenantCertVerificationJobStatus(ctx, jobID, "dead", job.AttemptCount+1, nil, "", "", fmt.Sprintf("no registry adapter for doc type %q", job.DocType))
		return
	}

	adapter := p.adapters.Get(regType)
	if adapter == nil {
		_ = p.tenantCertStore.UpdateTenantCertVerificationJobStatus(ctx, jobID, "dead", job.AttemptCount+1, nil, "", "", fmt.Sprintf("no adapter for registry type %q", regType))
		return
	}

	result, adapterErr := adapter.Verify(ctx, job.CertificateNo, nil)
	if adapterErr != nil {
		p.failTenantCertJob(ctx, jobID, job, adapterErr)
		return
	}

	// Only auto-promote to VERIFIED when the registry positively confirms
	// the registration. Anything else (not_found, failed, error) leaves the
	// cert in PENDING for manual admin review — a fragile portal scrape
	// should never auto-reject a tenant's submission.
	if result.Status == models.RegistryStatusVerified && result.TrustTier == models.TrustTierRegistry {
		if err := p.tenantCertStore.UpdateDocumentStatus(ctx, tenantID, job.DocType, "VERIFIED"); err != nil {
			slog.Error("failed to mark document verified from registry", "error", err, "tenant_id", job.TenantID, "doc_type", job.DocType)
		} else {
			slog.Info("tenant cert auto-verified via registry", "tenant_id", job.TenantID, "doc_type", job.DocType, "registry", regType)
		}
	} else {
		slog.Info("tenant cert registry check inconclusive, awaiting manual review", "tenant_id", job.TenantID, "doc_type", job.DocType, "status", result.Status)
	}

	_ = p.tenantCertStore.UpdateTenantCertVerificationJobStatus(ctx, jobID, "success", job.AttemptCount+1, nil, string(result.Status), string(result.TrustTier), "")
}

func (p *RegistryWorkerPool) failTenantCertJob(ctx context.Context, jobID uuid.UUID, job models.TenantCertVerificationJob, err error) {
	attempts := job.AttemptCount + 1
	maxAttempts := job.MaxAttempts
	if maxAttempts == 0 {
		maxAttempts = 5
	}

	backoff := calculateBackoff(attempts)
	nextAttempt := time.Now().Add(backoff)
	status := "failed"
	if attempts >= maxAttempts {
		status = "dead"
	}

	_ = p.tenantCertStore.UpdateTenantCertVerificationJobStatus(ctx, jobID, status, attempts, &nextAttempt, "", "", err.Error())
	slog.Warn("tenant cert verification job failed",
		"job_id", job.ID,
		"doc_type", job.DocType,
		"attempt", attempts,
		"max_attempts", maxAttempts,
		"next_attempt", nextAttempt,
		"error", err.Error(),
	)
}

func calculateBackoff(attempt int) time.Duration {
	switch attempt {
	case 1:
		return 30 * time.Second
	case 2:
		return 2 * time.Minute
	case 3:
		return 5 * time.Minute
	case 4:
		return 15 * time.Minute
	default:
		return 30 * time.Minute
	}
}

func extractBatchMetadata(batch *models.Batch) map[string]string {
	m := map[string]string{
		"batch_name":    batch.BatchName,
		"model_name":    batch.ModelName,
		"product_type":  string(batch.ProductType),
		"market_region": string(batch.MarketRegion),
		"status":        batch.Status,
	}
	if batch.Specs.BISNumber != "" {
		m["bis_number"] = batch.Specs.BISNumber
	}
	if batch.Specs.EPRNumber != "" {
		m["epr_number"] = batch.Specs.EPRNumber
	}
	if batch.Specs.HSNCode != "" {
		m["hsn_code"] = batch.Specs.HSNCode
	}
	if batch.Specs.UN383TestDate != "" {
		m["un38_test_date"] = batch.Specs.UN383TestDate
	}
	if batch.Specs.UN383LabName != "" {
		m["un38_lab_name"] = batch.Specs.UN383LabName
	}
	if batch.Specs.IEC62133TestDate != "" {
		m["iec62133_test_date"] = batch.Specs.IEC62133TestDate
	}
	if batch.Specs.CENotifiedBodyNumber != "" {
		m["ce_notified_body_number"] = batch.Specs.CENotifiedBodyNumber
	}
	return m
}
