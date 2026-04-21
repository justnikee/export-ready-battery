package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"exportready-battery/internal/app"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
)

const (
	// PollInterval is how often the worker checks for new jobs
	PollInterval = 5 * time.Second

	// MaxConcurrentJobs limits parallel processing
	MaxConcurrentJobs = 3
)

func main() {
	deps, err := app.Bootstrap("export-worker")
	if err != nil {
		// Bootstrap already logged the details; just exit.
		os.Exit(1)
	}
	defer deps.Close()

	logger := deps.Logger
	cfg := deps.Config
	database := deps.Database

	// Initialize services
	storageService := services.NewStorageService(logger)
	qrService := services.NewQRService(cfg.BaseURL)
	pdfService := services.NewPDFService(cfg.BaseURL)
	csvService := services.NewCSVService()
	emailService := services.NewEmailService(cfg.BaseURL)
	auditExportService := services.NewAuditExportService(database.Pool)

	exportJobService := services.NewExportJobService(
		database.Pool,
		storageService,
		qrService,
		pdfService,
		csvService,
		emailService,
		auditExportService,
		logger,
	)

	// Create worker
	worker := NewExportWorker(exportJobService, logger)

	// Setup chain verifier (runs every 6 hours)
	repo := repository.New(database)
	lifecycleService := services.NewLifecycleService(repo)
	chainVerifier := NewChainVerifier(database.Pool, lifecycleService, logger)

	// Setup graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Info("received shutdown signal", "signal", sig)
		cancel()
	}()

	// Start chain verification on a 6-hour ticker (runs once immediately on startup)
	go func() {
		chainVerifier.RunOnce(ctx)
		ticker := time.NewTicker(ChainVerifyInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				chainVerifier.RunOnce(ctx)
			}
		}
	}()

	// Start worker
	worker.Start(ctx)
}

// ExportWorker polls for and processes export jobs
type ExportWorker struct {
	exportJobService *services.ExportJobService
	logger           *slog.Logger
	semaphore        chan struct{}
}

// NewExportWorker creates a new export worker
func NewExportWorker(exportJobService *services.ExportJobService, logger *slog.Logger) *ExportWorker {
	return &ExportWorker{
		exportJobService: exportJobService,
		logger:           logger,
		semaphore:        make(chan struct{}, MaxConcurrentJobs),
	}
}

// Start begins the worker loop
func (w *ExportWorker) Start(ctx context.Context) {
	w.logger.Info("export worker started", "pollInterval", PollInterval, "maxConcurrent", MaxConcurrentJobs)

	ticker := time.NewTicker(PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("export worker shutting down")
			// Wait for in-flight jobs to complete
			for i := 0; i < MaxConcurrentJobs; i++ {
				w.semaphore <- struct{}{}
			}
			w.logger.Info("export worker stopped")
			return
		case <-ticker.C:
			w.pollAndProcess(ctx)
		}
	}
}

// pollAndProcess fetches pending jobs and processes them
func (w *ExportWorker) pollAndProcess(ctx context.Context) {
	// Get pending jobs
	jobs, err := w.exportJobService.GetPendingJobs(ctx, MaxConcurrentJobs)
	if err != nil {
		w.logger.Error("failed to get pending jobs", "error", err)
		return
	}

	if len(jobs) == 0 {
		return
	}

	w.logger.Info("found pending jobs", "count", len(jobs))

	// Process each job concurrently with semaphore limiting
	for i := range jobs {
		job := jobs[i] // Capture for goroutine

		select {
		case <-ctx.Done():
			return
		case w.semaphore <- struct{}{}:
			go func() {
				defer func() { <-w.semaphore }()

				w.logger.Info("processing job",
					"jobId", job.ID,
					"batchId", job.BatchID,
					"type", job.JobType,
					"passportCount", job.PassportCount,
				)

				startTime := time.Now()

				if err := w.exportJobService.ProcessJob(ctx, &job); err != nil {
					w.logger.Error("job processing failed",
						"jobId", job.ID,
						"error", err,
						"duration", time.Since(startTime),
					)
				} else {
					w.logger.Info("job completed successfully",
						"jobId", job.ID,
						"duration", time.Since(startTime),
					)
				}
			}()
		}
	}
}
