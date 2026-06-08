package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/anvayalabs/battery-api/internal/app"
	"github.com/anvayalabs/battery-api/internal/compliance"
	battery "github.com/anvayalabs/battery-api/internal/compliance/battery"
	"github.com/anvayalabs/battery-api/internal/events"
	"github.com/anvayalabs/battery-api/internal/handlers"
	"github.com/anvayalabs/battery-api/internal/integrations/tally"
	"github.com/anvayalabs/battery-api/internal/jobs"
	"github.com/anvayalabs/battery-api/internal/logger"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/schema"
	schemaSeeds "github.com/anvayalabs/battery-api/internal/schema/seeds"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

func main() {
	deps, err := app.Bootstrap("api-server")
	if err != nil {
		os.Exit(1)
	}
	defer deps.Close()

	cfg := deps.Config
	database := deps.Database

	slog.Info("Connected to PostgreSQL database")

	// Initialize services
	authService := services.NewAuthService(cfg.JWTSecret, cfg.JWTExpiry, cfg.RefreshExpiry)
	authEmailService := services.GetEmailServiceFromEnv(cfg.BaseURL)
	magicLinkEmailService := services.GetEmailServiceFromEnv(cfg.BaseURL)

	// Initialize repository
	repo := repository.New(database)

	// Initialize registry worker pool (async verification jobs)
	registryWorkerPool := jobs.NewRegistryWorkerPool(repo, cfg)

	// Start background anchor upgrade ticker (every 30 minutes)
	jobs.StartAnchorUpgradeTicker(repo, 30*time.Minute)

	// Start Tally ERP live sync ticker (every 5 minutes)
	tally.StartSyncTicker(repo, 5*time.Minute)

	// Initialize alert service (shared across handlers and background jobs)
	alertService := services.NewAlertService(repo, authEmailService)

	// Start background daily alert ticker (every 24 hours)
	jobs.StartDailyAlertTicker(alertService, 24*time.Hour)

	// Start registry worker pool (async registry verification)
	registryWorkerPool.Start()

	// Start regulatory intelligence worker (every 6 hours)
	regulatoryWorker := jobs.NewRegulatoryWorker(repo, 6*time.Hour)
	regulatoryWorker.Start()

	// Seed default regulatory sources if none exist
	if err := seedRegulatorySources(context.Background(), repo); err != nil {
		slog.Warn("failed to seed regulatory sources", "error", err)
	}

	// Initialize data access service
	dataAccessService := services.NewDataAccessService(repo)

	// =========================================================================
	// Phase 3: Initialise pluggable engines
	// =========================================================================

	// 1. Schema Registry — seeded with battery_v1 JSON; DB-backed for future schemas.
	schemaRegistry := schema.NewRegistry(repo)
	if batteryV1, seedErr := schemaSeeds.LoadBatteryV1(); seedErr != nil {
		slog.Warn("Failed to load battery_v1 seed schema — schema validation will be skipped", "error", seedErr)
	} else {
		schemaRegistry.Seed(batteryV1)
		// Attempt to upsert into DB so the registry can cache it on next lookup.
		if upsertErr := repo.UpsertProductSchema(context.Background(), batteryV1); upsertErr != nil {
			slog.Warn("Failed to upsert battery_v1 schema to DB — using in-memory seed only", "error", upsertErr)
		} else {
			slog.Info("Battery v1 schema seeded into product_schemas table")
		}
	}
	// 2. Compliance Registry — India and EU battery validators registered.
	complianceRegistry := compliance.NewRegistry()
	complianceRegistry.Register(models.ProductTypeBattery, models.MarketRegionIndia, battery.NewIndiaValidator())
	complianceRegistry.Register(models.ProductTypeBattery, models.MarketRegionEU, battery.NewEUValidator().WithRepository(repo))
	// 3. Event Bus — async domain event dispatch.
	eventBus := events.NewBus()

	// 4. BatchService — schema validation + async compliance runner.
	batchService := services.NewBatchService(schemaRegistry, complianceRegistry, repo)

	// 5. PassportService — BPAN-V2 serial generation.
	passportService := services.NewPassportService()

	// =========================================================================
	// Initialize handlers
	// =========================================================================
	// Initialize registry verification service
	registryVerificationService := services.NewRegistryVerificationService(repo, cfg)

	// Initialize storage service (if Supabase credentials are available)
	var storageService *services.StorageService
	if os.Getenv("SUPABASE_URL") != "" && os.Getenv("SUPABASE_SERVICE_ROLE_KEY") != "" {
		storageService = services.NewStorageService(logger.Logger)
	}

	h := handlers.New(
		database, cfg.BaseURL, "assets/GeoLite2-City.mmdb",
		cfg.RazorpayKeyID, cfg.RazorpayKeySecret,
		magicLinkEmailService, dataAccessService, cfg.RegulatorAPIKey,
		handlers.WithBatchService(batchService),
		handlers.WithPassportService(passportService),
		handlers.WithEventBus(eventBus),
		handlers.WithAuthService(authService),
		handlers.WithAlertService(alertService),
		handlers.WithRegistryVerificationService(registryVerificationService),
		handlers.WithStorageService(storageService),
	)
	authHandler := handlers.NewAuthHandler(database, repo, authService, authEmailService)

	// Initialize OAuth service and handler
	oauthService := services.NewOAuthService(
		cfg.GoogleClientID, cfg.GoogleClientSecret,
		cfg.MicrosoftClientID, cfg.MicrosoftClientSecret,
		cfg.BackendURL,
	)
	oauthHandler := handlers.NewOAuthHandler(database, repo, authService, oauthService, cfg.FrontendURL)

	// Initialize middleware
	authMiddleware := middleware.NewAuth(authService)
	apiKeyService := services.NewAPIKeyService()
	apiKeyMiddleware := middleware.NewAPIKeyAuth(repo, apiKeyService)
	authRateLimiter := middleware.NewAuthRateLimiter()
	apiRateLimiter := middleware.NewAPIRateLimiter()

	// Initialize lifecycle service and handler
	outboundWebhookService := services.NewOutboundWebhookService(repo)
	lifecycleService := services.NewLifecycleService(repo).WithWebhooks(outboundWebhookService)
	lifecycleHandler := handlers.NewLifecycleHandler(lifecycleService, repo).WithDocRepo(repo)

	// Initialize reward service
	rewardService := services.NewRewardService(repo)

	// Initialize BMS Telemetry services
	deviceTokenService := services.NewDeviceTokenService(repo)
	telemetryService := services.NewTelemetryService(repo)

	// Initialize additional handlers
	telemetryHandler := handlers.NewTelemetryHandler(telemetryService, deviceTokenService)
	var exportJobHandler *handlers.ExportJobHandler
	var exportJobService *services.ExportJobService
	if storageService != nil {
		exportEmailService := services.GetEmailServiceFromEnv(cfg.BaseURL)
		qrService := services.NewQRService(cfg.BaseURL)
		pdfService := services.NewPDFService(cfg.BaseURL)
		csvService := services.NewCSVService()
		auditExportService := services.NewAuditExportService(database.Pool)
		exportJobService = services.NewExportJobService(
			database.Pool,
			storageService,
			qrService,
			pdfService,
			csvService,
			exportEmailService,
			auditExportService,
			logger.Logger,
		)
		exportJobHandler = handlers.NewExportJobHandler(exportJobService, logger.Logger)
		slog.Info("Export job handler initialized with embedded worker")
	} else {
		slog.Warn("Export job handler not initialized (missing SUPABASE config)")
	}

	// Initialize magic link handler (with reward service for scan-to-earn and email service)
	magicLinkHandler := handlers.NewMagicLinkHandler(repo, lifecycleService, rewardService, magicLinkEmailService, cfg.JWTSecret, cfg.BaseURL)

	// Initialize trusted partner handler
	trustedPartnerHandler := handlers.NewTrustedPartnerHandler(repo)

	// Initialize reward handler
	rewardHandler := handlers.NewRewardHandler(rewardService, authService, cfg.JWTSecret)

	// Initialize additional middleware
	deviceAuth := middleware.NewDeviceAuth(deviceTokenService)
	mux := http.NewServeMux()

	// Health check endpoint (public)
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		response := map[string]string{
			"status":    "healthy",
			"database":  "connected",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}

		if err := database.Ping(ctx); err != nil {
			response["status"] = "degraded"
			response["database"] = "disconnected"
			w.WriteHeader(http.StatusServiceUnavailable)
			slog.Error("health check failed", "error", err)
		} else {
			w.WriteHeader(http.StatusOK)
		}

		_ = json.NewEncoder(w).Encode(response)
	}
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /api/v1/health", healthHandler)

	// ============================================
	// API DOCUMENTATION (Public)
	// ============================================
	// Serve OpenAPI specification
	mux.HandleFunc("GET /api/v1/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./api/openapi.yaml")
	})

	// Swagger UI (CDN-based)
	mux.HandleFunc("GET /docs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnvayaLabs Battery API - Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            SwaggerUIBundle({
                url: '/api/v1/openapi.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                docExpansion: 'list',
                defaultModelsExpandDepth: 1,
                syntaxHighlight: { theme: 'monokai' }
            });
        };
    </script>
</body>
</html>`))
	})

	// ============================================
	// AUTH ROUTES (Public but rate-limited)
	// ============================================
	authMux := http.NewServeMux()
	authMux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	authMux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	authMux.HandleFunc("POST /api/v1/auth/refresh", authHandler.Refresh)
	authMux.HandleFunc("POST /api/v1/auth/forgot-password", authHandler.ForgotPassword)
	authMux.HandleFunc("POST /api/v1/auth/reset-password", authHandler.ResetPassword)
	authMux.HandleFunc("POST /api/v1/auth/magic-link", magicLinkHandler.RequestMagicLink)
	authMux.HandleFunc("POST /api/v1/auth/request-access", h.RequestAccess)
	// Email verification (public, rate-limited)
	authMux.HandleFunc("GET /api/v1/auth/verify-email", authHandler.VerifyEmail)
	authMux.HandleFunc("POST /api/v1/auth/resend-verification", authHandler.ResendVerification)
	// OAuth routes
	authMux.HandleFunc("GET /api/v1/auth/google", oauthHandler.GoogleRedirect)
	authMux.HandleFunc("GET /api/v1/auth/google/callback", oauthHandler.GoogleCallback)
	authMux.HandleFunc("GET /api/v1/auth/microsoft", oauthHandler.MicrosoftRedirect)
	authMux.HandleFunc("GET /api/v1/auth/microsoft/callback", oauthHandler.MicrosoftCallback)
	// Apply rate limiting to all auth routes
	mux.Handle("/api/v1/auth/", authRateLimiter.Limit(authMux))

	// ============================================
	// AUTH ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/auth/me", authMiddleware.Protect(http.HandlerFunc(authHandler.Me)))
	mux.Handle("GET /api/v1/auth/readiness", authMiddleware.Protect(http.HandlerFunc(authHandler.GetReadiness)))
	mux.Handle("POST /api/v1/auth/readiness", authMiddleware.Protect(http.HandlerFunc(authHandler.PostReadiness)))
	mux.Handle("PUT /api/v1/auth/profile", authMiddleware.Protect(http.HandlerFunc(authHandler.UpdateProfile)))
	// Logout — clears refresh token JTI (requires valid access token)
	mux.Handle("POST /api/v1/auth/logout", authMiddleware.Protect(http.HandlerFunc(authHandler.Logout)))

	// ============================================
	// SCHEMA ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/schemas", authMiddleware.Protect(http.HandlerFunc(h.ListSchemas)))
	mux.Handle("GET /api/v1/schemas/{product_type}", authMiddleware.Protect(http.HandlerFunc(h.GetSchema)))

	// ============================================
	// COMPLIANCE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/compliance/check", authMiddleware.Protect(http.HandlerFunc(h.ComplianceCheck)))
	mux.Handle("GET /api/v1/compliance/rules", authMiddleware.Protect(http.HandlerFunc(h.ListComplianceRules)))
	mux.Handle("GET /api/v1/compliance/deadlines", authMiddleware.Protect(http.HandlerFunc(h.GetComplianceDeadlines)))

	// ============================================
	// BATCH ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/admin/signup-requests/{id}/approve", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.ApproveSignupRequest))))
	mux.Handle("POST /api/v1/admin/signup-requests/{id}/reject", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.RejectSignupRequest))))
	mux.Handle("GET /api/v1/admin/signup-requests", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.ListSignupRequests))))

	mux.Handle("POST /api/v1/batches", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateBatch))))
	mux.Handle("POST /api/v1/batches/validate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.ValidateBatchCreation))))
	mux.Handle("GET /api/v1/batches", authMiddleware.Protect(http.HandlerFunc(h.ListBatches)))
	mux.Handle("GET /api/v1/batches/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetBatch)))
	mux.Handle("POST /api/v1/batches/bulk-import", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.BulkImportBatches))))
	mux.Handle("POST /api/v1/batches/{id}/upload", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadCSV))))
	mux.Handle("POST /api/v1/batches/{id}/validate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.ValidateCSV))))
	mux.Handle("POST /api/v1/batches/{id}/auto-generate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.AutoGeneratePassports))))
	mux.Handle("GET /api/v1/batches/{id}/download", authMiddleware.Protect(http.HandlerFunc(h.DownloadQRCodes)))
	mux.Handle("GET /api/v1/batches/{id}/labels", authMiddleware.Protect(http.HandlerFunc(h.DownloadLabels)))
	mux.Handle("GET /api/v1/batches/{id}/export", authMiddleware.Protect(http.HandlerFunc(h.ExportBatchCSV)))
	mux.Handle("GET /api/v1/batches/{id}/audit-export", authMiddleware.Protect(http.HandlerFunc(h.ExportBatchAuditCSV)))
	mux.Handle("GET /api/v1/batches/{id}/compliance-declaration", authMiddleware.Protect(http.HandlerFunc(h.DownloadComplianceDeclaration)))
	mux.Handle("GET /api/v1/batches/{id}/compliance-report", authMiddleware.Protect(http.HandlerFunc(h.DownloadComplianceReport)))
	mux.Handle("GET /api/v1/batches/{id}/compliance", authMiddleware.Protect(http.HandlerFunc(h.GetBatchCompliance)))
	mux.Handle("GET /api/v1/batches/{id}/eu-attribute-score", authMiddleware.Protect(http.HandlerFunc(h.GetBatchEUAttributeScore)))
	mux.Handle("GET /api/v1/batches/{id}/due-diligence-report", authMiddleware.Protect(http.HandlerFunc(h.DownloadDueDiligenceReport)))
	mux.Handle("GET /api/v1/batches/{id}/passports", authMiddleware.Protect(http.HandlerFunc(h.GetBatchPassports)))
	mux.Handle("DELETE /api/v1/batches/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteBatch))))
	mux.Handle("POST /api/v1/batches/{id}/archive", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.ArchiveBatch))))
	mux.Handle("DELETE /api/v1/batches/{id}/draft", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteDraftBatch))))

	// ============================================
	// COMPONENT / BOM ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/batches/{batch_id}/components", authMiddleware.Protect(http.HandlerFunc(h.ListComponentsByBatch)))
	mux.Handle("GET /api/v1/batches/{batch_id}/components/tree", authMiddleware.Protect(http.HandlerFunc(h.GetComponentTreeByBatch)))
	mux.Handle("POST /api/v1/batches/{batch_id}/components", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateComponent))))
	mux.Handle("GET /api/v1/components/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetComponent)))
	mux.Handle("PUT /api/v1/components/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpdateComponent))))
	mux.Handle("DELETE /api/v1/components/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteComponent))))

	// ============================================
	// DGFT EXPORT INCENTIVE CLAIM ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/dgft-claims/schemes", authMiddleware.Protect(http.HandlerFunc(h.ListDGFTSchemeConfigs)))
	mux.Handle("POST /api/v1/dgft-claims", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateDGFTClaim))))
	mux.Handle("GET /api/v1/dgft-claims", authMiddleware.Protect(http.HandlerFunc(h.ListDGFTClaims)))
	mux.Handle("GET /api/v1/dgft-claims/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetDGFTClaim)))
	mux.Handle("PUT /api/v1/dgft-claims/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpdateDGFTClaim))))
	mux.Handle("DELETE /api/v1/dgft-claims/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteDGFTClaim))))
	mux.Handle("POST /api/v1/dgft-claims/{id}/submit", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.SubmitDGFTClaim))))
	mux.Handle("GET /api/v1/dgft-claims/{id}/export/pdf", authMiddleware.Protect(http.HandlerFunc(h.ExportClaimPDF)))
	mux.Handle("GET /api/v1/dgft-claims/{id}/export/excel", authMiddleware.Protect(http.HandlerFunc(h.ExportClaimExcel)))
	mux.Handle("POST /api/v1/dgft-claims/{id}/documents", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadDGFTClaimDocument))))

	// SUPPLIER PORTAL ROUTES
	// Tenant-scoped management
	mux.Handle("POST /api/v1/suppliers/invitations", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.InviteSupplier))))
	mux.Handle("GET /api/v1/suppliers", authMiddleware.Protect(http.HandlerFunc(h.ListSuppliers)))
	mux.Handle("PUT /api/v1/suppliers/{id}/status", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpdateSupplierStatus))))
	mux.Handle("GET /api/v1/supplier-documents", authMiddleware.Protect(http.HandlerFunc(h.ListTenantSupplierDocuments)))
	mux.Handle("PUT /api/v1/supplier-documents/{id}/status", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.ReviewSupplierDocument))))
	// Supplier auth (no middleware)
	mux.Handle("POST /api/v1/suppliers/accept", http.HandlerFunc(h.AcceptSupplierInvitation))
	mux.Handle("POST /api/v1/supplier/login", http.HandlerFunc(h.SupplierLogin))
	// Supplier-scoped actions (Protect validates any JWT; handler checks SupplierID)
	mux.Handle("GET /api/v1/supplier/batches", authMiddleware.Protect(http.HandlerFunc(h.ListSupplierBatches)))
	mux.Handle("POST /api/v1/supplier/documents", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadSupplierDocument))))
	mux.Handle("GET /api/v1/supplier/documents", authMiddleware.Protect(http.HandlerFunc(h.ListSupplierDocuments)))

	// ============================================
	// DUE DILIGENCE ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/suppliers/{id}/risk-profile", authMiddleware.Protect(http.HandlerFunc(h.GetSupplierRiskProfile)))
	mux.Handle("POST /api/v1/suppliers/{id}/dd-assessments", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateDueDiligenceAssessment))))
	mux.Handle("GET /api/v1/suppliers/{id}/dd-assessments", authMiddleware.Protect(http.HandlerFunc(h.ListDueDiligenceAssessments)))
	mux.Handle("POST /api/v1/dd-assessments/{id}/transition", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.TransitionDueDiligenceAssessment))))
	mux.Handle("POST /api/v1/dd-assessments/{id}/evidence", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadEvidence))))
	mux.Handle("GET /api/v1/corrective-actions", authMiddleware.Protect(http.HandlerFunc(h.ListCorrectiveActions)))
	mux.Handle("POST /api/v1/corrective-actions", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateCorrectiveAction))))
	mux.Handle("PUT /api/v1/corrective-actions/{id}/status", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpdateCorrectiveActionStatus))))
	mux.Handle("POST /api/v1/suppliers/{id}/cmrt-upload", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadCMRT))))
	mux.Handle("GET /api/v1/suppliers/{id}/cmrt-reports", authMiddleware.Protect(http.HandlerFunc(h.ListCMRTReports)))

	// ============================================
	// REGISTRY VERIFICATION ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/batches/{id}/verify-registry", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.VerifyBatchRegistry))))
	mux.Handle("GET /api/v1/batches/{id}/verifications", authMiddleware.Protect(http.HandlerFunc(h.GetBatchRegistryVerifications)))
	mux.Handle("POST /api/v1/batches/{id}/auto-verify", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.AutoVerifyBatchRegistry))))

	// ============================================
	// CERTIFICATE BLOCKCHAIN ANCHORS (Protected)
	// ============================================
	mux.Handle("POST /api/v1/batches/{id}/anchors", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateCertificateAnchor))))
	mux.Handle("GET /api/v1/batches/{id}/anchors", authMiddleware.Protect(http.HandlerFunc(h.GetCertificateAnchors)))
	mux.Handle("POST /api/v1/jobs/upgrade-anchors", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpgradeCertificateAnchors))))

	// ============================================
	// ALERTS (Protected)
	// ============================================
	mux.Handle("GET /api/v1/alerts", authMiddleware.Protect(http.HandlerFunc(h.GetAlerts)))
	mux.Handle("GET /api/v1/alerts/unread", authMiddleware.Protect(http.HandlerFunc(h.GetUnreadAlerts)))
	mux.Handle("GET /api/v1/alerts/unread-count", authMiddleware.Protect(http.HandlerFunc(h.GetUnreadAlertCount)))
	mux.Handle("POST /api/v1/alerts/{id}/read", authMiddleware.Protect(http.HandlerFunc(h.MarkAlertRead)))
	mux.Handle("POST /api/v1/jobs/daily-alerts", authMiddleware.Protect(http.HandlerFunc(h.RunDailyAlerts)))

	// ============================================
	// MASS BALANCE (Protected)
	// ============================================
	mux.Handle("POST /api/v1/mass-balance/ledgers", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateMassBalanceLedger))))
	mux.Handle("GET /api/v1/mass-balance/ledgers", authMiddleware.Protect(http.HandlerFunc(h.ListMassBalanceLedgers)))
	mux.Handle("GET /api/v1/mass-balance/ledgers/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetMassBalanceLedger)))
	mux.Handle("PATCH /api/v1/mass-balance/ledgers/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UpdateMassBalanceLedger))))
	mux.Handle("POST /api/v1/mass-balance/allocations", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateMassBalanceAllocation))))
	mux.Handle("GET /api/v1/mass-balance/allocations", authMiddleware.Protect(http.HandlerFunc(h.ListMassBalanceAllocations)))

	// ============================================
	// BULK OPERATIONS (Protected)
	// ============================================
	mux.Handle("POST /api/v1/passports/bulk/status", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.BulkUpdateStatus))))
	// RBAC: bulk delete requires owner or operator
	mux.Handle("POST /api/v1/passports/bulk/delete", authMiddleware.Protect(h.RequireOnboardingComplete(middleware.RequireRole("owner", "operator")(http.HandlerFunc(h.BulkDeletePassports)))))
	mux.Handle("POST /api/v1/passports/bulk/transition", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.BulkTransitionPassports))))
	mux.Handle("GET /api/v1/passports/bulk/allowed-actions", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetBulkAllowedActions)))
	mux.Handle("GET /api/v1/passports", authMiddleware.Protect(http.HandlerFunc(h.ListPassports)))

	// ============================================
	// PASSPORT LIFECYCLE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/passports/{uuid}/transition", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.TransitionPassport))))
	mux.Handle("GET /api/v1/passports/{uuid}/transitions", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetAllowedActions)))
	mux.Handle("GET /api/v1/passports/{uuid}/events", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetPassportEvents)))
	mux.Handle("POST /api/v1/passports/{uuid}/soh", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.UpdateStateOfHealth))))
	mux.Handle("GET /api/v1/passports/{uuid}/soh/history", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetSoHHistory)))
	mux.Handle("POST /api/v1/passports/{uuid}/repairs", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.LogRepairEvent))))
	mux.Handle("POST /api/v1/passports/{uuid}/replacements", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.LogReplacementEvent))))
	mux.Handle("POST /api/v1/passports/{uuid}/transfer", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(lifecycleHandler.TransferPassport))))
	mux.Handle("GET /api/v1/passports/{uuid}/verify-chain", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.VerifyAuditChain)))

	// ============================================
	// PASSPORT EPCIS EXPORT (Phase 4)
	// ============================================
	mux.Handle("GET /api/v1/passports/{uuid}/epcis", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.ExportEPCIS)))

	// ============================================
	// PASSPORT DOCUMENTS (Phase 6)
	// ============================================
	mux.Handle("GET /api/v1/passports/{uuid}/documents", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetPassportDocuments)))

	// ============================================
	// TEMPLATE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/templates", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateTemplate))))
	mux.Handle("GET /api/v1/templates", authMiddleware.Protect(http.HandlerFunc(h.ListTemplates)))
	mux.Handle("GET /api/v1/templates/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetTemplate)))
	mux.Handle("DELETE /api/v1/templates/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteTemplate))))

	// ============================================
	// EPR OBLIGATION ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/epr/obligation", authMiddleware.Protect(http.HandlerFunc(h.GetEPRObligation)))
	mux.Handle("GET /api/v1/epr/obligation/summary", authMiddleware.Protect(http.HandlerFunc(h.GetEPRMultiYear)))

	// ============================================
	// EPR CERTIFICATE LEDGER ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/epr/certificates", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateEPRCertificate))))
	mux.Handle("GET /api/v1/epr/certificates", authMiddleware.Protect(http.HandlerFunc(h.ListEPRCertificates)))
	mux.Handle("GET /api/v1/epr/ledger", authMiddleware.Protect(http.HandlerFunc(h.GetEPRLedger)))
	mux.Handle("PUT /api/v1/epr/certificates/{id}/retire", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.RetireEPRCertificate))))
	mux.Handle("DELETE /api/v1/epr/certificates/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DeleteEPRCertificate))))

	// ============================================
	// CPCB EXPORT ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/epr/cpcb-export", authMiddleware.Protect(http.HandlerFunc(h.ExportCPCBForm3)))

	// ============================================
	// TEAM MANAGEMENT ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/team", authMiddleware.Protect(http.HandlerFunc(h.ListTeamMembers)))
	mux.Handle("POST /api/v1/team/invite", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.InviteUser))))
	// RBAC: only owners can remove members or change roles
	mux.Handle("DELETE /api/v1/team/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(middleware.RequireRole("owner")(http.HandlerFunc(h.RemoveTeamMember)))))
	mux.Handle("PUT /api/v1/team/{id}/role", authMiddleware.Protect(h.RequireOnboardingComplete(middleware.RequireRole("owner")(http.HandlerFunc(h.UpdateTeamMemberRole)))))
	mux.HandleFunc("POST /api/v1/team/accept", h.AcceptInvite) // Public for invite links

	// ============================================
	// UTILITY ROUTES (Public)
	// ============================================
	mux.HandleFunc("GET /api/v1/sample-csv", h.DownloadSampleCSV)

	// ============================================
	// DASHBOARD ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/dashboard/stats", authMiddleware.Protect(http.HandlerFunc(h.GetDashboardStats)))
	mux.Handle("GET /api/v1/batches/recent", authMiddleware.Protect(http.HandlerFunc(h.GetRecentBatches)))
	mux.Handle("GET /api/v1/scans/feed", authMiddleware.Protect(http.HandlerFunc(h.GetScanFeed)))

	// ============================================
	// ANALYTICS ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/analytics/overview", authMiddleware.Protect(http.HandlerFunc(h.GetAnalyticsOverview)))

	// ============================================
	// BILLING ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/billing/balance", authMiddleware.Protect(http.HandlerFunc(h.GetBalance)))
	mux.Handle("GET /api/v1/billing/transactions", authMiddleware.Protect(http.HandlerFunc(h.GetTransactions)))
	mux.Handle("POST /api/v1/batches/{id}/activate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.ActivateBatch))))
	mux.Handle("PATCH /api/v1/batches/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.PatchBatch))))
	mux.Handle("POST /api/v1/batches/{id}/carbon", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.SaveCarbonFootprint))))
	mux.Handle("POST /api/v1/batches/{id}/duplicate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.DuplicateBatch))))
	mux.Handle("POST /api/v1/billing/top-up", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.TopUpQuota))))

	// Razorpay Payment Gateway
	mux.Handle("GET /api/v1/billing/packages", authMiddleware.Protect(http.HandlerFunc(h.GetPackages)))
	mux.Handle("POST /api/v1/billing/razorpay/order", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.CreateRazorpayOrder))))
	mux.Handle("POST /api/v1/billing/razorpay/verify", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.VerifyRazorpayPayment))))

	// ============================================
	// CARBON CALCULATOR ROUTES (Protected)
	// ============================================
	carbonService := services.NewCarbonCalculatorService(repo)
	carbonHandler := handlers.NewCarbonHandler(carbonService)
	mux.Handle("POST /api/v1/carbon/calculate", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(carbonHandler.CalculateCarbon))))

	// ============================================
	// AI / LLM ROUTES (Protected)
	// ============================================
	aiService := services.NewAIService(cfg.GroqAPIKey)
	aiHandler := handlers.NewAIHandler(aiService)
	mux.Handle("POST /api/v1/ai/parse-datasheet", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(aiHandler.ParseDatasheet))))
	mux.Handle("POST /api/v1/ai/parse-datasheet-upload", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(aiHandler.ParseDatasheetFromUpload))))
	mux.Handle("POST /api/v1/ai/nl-create-batch", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(aiHandler.NLCreateBatch))))

	// ============================================
	// BMS TELEMETRY ROUTES (Device Token Authenticated)
	// ============================================
	mux.Handle("POST /api/v1/telemetry", deviceAuth.Authenticate(http.HandlerFunc(telemetryHandler.IngestTelemetry)))
	mux.Handle("POST /api/v1/telemetry/batch", deviceAuth.Authenticate(http.HandlerFunc(telemetryHandler.IngestTelemetryBatch)))

	// ============================================
	// BMS TELEMETRY MANAGEMENT (Protected)
	// ============================================
	mux.Handle("GET /api/v1/passports/{uuid}/telemetry", authMiddleware.Protect(http.HandlerFunc(telemetryHandler.GetTelemetryHistory)))

	// ============================================
	// DEVICE TOKEN MANAGEMENT (Protected)
	// ============================================
	mux.Handle("POST /api/v1/device-tokens", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(telemetryHandler.CreateDeviceToken))))
	mux.Handle("GET /api/v1/device-tokens", authMiddleware.Protect(http.HandlerFunc(telemetryHandler.ListDeviceTokens)))
	mux.Handle("DELETE /api/v1/device-tokens/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(telemetryHandler.RevokeDeviceToken))))

	// ============================================
	// CSV SOH UPLOAD (Protected)
	// ============================================
	mux.Handle("POST /api/v1/telemetry/soh-upload", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(telemetryHandler.UploadSoHCSV))))

	// ============================================
	// WEBHOOK ROUTES (Public - for payment providers)
	// ============================================
	webhookHandler := handlers.NewWebhookHandler(h.RazorpayService(), repo)
	mux.HandleFunc("POST /api/v1/webhooks/razorpay", webhookHandler.RazorpayWebhook)

	// ============================================
	// OUTBOUND WEBHOOK MANAGEMENT (Protected)
	// ============================================
	outboundWHHandler := handlers.NewOutboundWebhookHandler(outboundWebhookService)
	mux.Handle("POST /api/v1/outbound-webhooks", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(outboundWHHandler.CreateOutboundWebhook))))
	mux.Handle("GET /api/v1/outbound-webhooks", authMiddleware.Protect(http.HandlerFunc(outboundWHHandler.ListOutboundWebhooks)))
	mux.Handle("DELETE /api/v1/outbound-webhooks/{id}", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(outboundWHHandler.DeleteOutboundWebhook))))

	// ============================================
	// DOCUMENT UPLOAD ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/settings/upload-document", authMiddleware.Protect(http.HandlerFunc(h.UploadDocument)))
	mux.Handle("GET /api/v1/settings/documents/{type}", authMiddleware.Protect(http.HandlerFunc(h.ViewDocument)))
	mux.Handle("POST /api/v1/settings/upload-logo", authMiddleware.Protect(http.HandlerFunc(h.UploadLogo)))

	// ============================================
	// PASSPORT EVENT DOCUMENTS (Phase 2)
	// ============================================
	mux.Handle("POST /api/v1/documents/upload", authMiddleware.Protect(h.RequireOnboardingComplete(http.HandlerFunc(h.UploadPassportDocument))))
	mux.Handle("GET /api/v1/documents/{document_id}", authMiddleware.Protect(http.HandlerFunc(h.GetPassportDocument)))

	// ============================================
	// STATIC UPLOADS (Public - for serving logos)
	// ============================================
	uploadsFS := http.FileServer(http.Dir("./uploads"))
	// Wrap with path traversal guard to prevent directory traversal attacks
	safeUploadsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.Clean(r.URL.Path)
		if strings.Contains(cleanPath, "..") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		http.StripPrefix("/api/v1/uploads/", uploadsFS).ServeHTTP(w, r)
	})
	mux.Handle("GET /api/v1/uploads/", safeUploadsHandler)

	// ============================================
	// ADMIN ROUTES (Secret - for document verification)
	// ============================================
	// RBAC: only owners can trigger admin document verification
	mux.Handle("POST /api/v1/admin/verify-doc", authMiddleware.Protect(middleware.RequireRole("owner")(http.HandlerFunc(h.AdminVerifyDocument))))

	// ============================================
	// SCAN ROUTES (Public - rate limited to prevent abuse)
	// ============================================
	mux.Handle("POST /api/v1/scans/record", apiRateLimiter.Limit(http.HandlerFunc(h.RecordScan)))

	// ============================================
	// PASSPORT ROUTES (Public - rate limited to prevent enumeration)
	// ============================================
	mux.Handle("GET /api/v1/passports/{uuid}", apiRateLimiter.Limit(http.HandlerFunc(h.GetPassport)))
	mux.Handle("POST /api/v1/passports/{uuid}/vc", authMiddleware.Protect(http.HandlerFunc(h.GenerateVCHandle)))
	mux.Handle("GET /api/v1/did.json", http.HandlerFunc(h.GetDIDDocumentHandle))

	// ============================================
	// MAGIC LINK PASSPORT ROUTES (Token Authenticated)
	// ============================================
	mux.HandleFunc("POST /api/v1/passport/{uuid}/transition", magicLinkHandler.TransitionWithMagicLink)
	mux.HandleFunc("GET /api/v1/passport/{uuid}/action-info", magicLinkHandler.GetPassportForAction)
	// SOH push via magic link (action=SOH_UPDATE) — multi-use token, not consumed on push
	mux.HandleFunc("POST /api/v1/passport/{uuid}/soh", magicLinkHandler.UpdateSoHWithMagicLink)
	// Phase 7: OTP confirmation and resend
	mux.HandleFunc("POST /api/v1/magic-links/{token}/confirm-otp", magicLinkHandler.ConfirmOTP)
	mux.HandleFunc("POST /api/v1/magic-links/{token}/resend-otp", magicLinkHandler.ResendOTP)

	// ============================================
	// API KEY MANAGEMENT (Protected)
	// ============================================
	mux.Handle("POST /api/v1/api-keys", authMiddleware.Protect(http.HandlerFunc(h.CreateAPIKey)))
	mux.Handle("GET /api/v1/api-keys", authMiddleware.Protect(http.HandlerFunc(h.ListAPIKeys)))
	mux.Handle("GET /api/v1/api-keys/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetAPIKey)))
	mux.Handle("PATCH /api/v1/api-keys/{id}", authMiddleware.Protect(http.HandlerFunc(h.UpdateAPIKey)))
	mux.Handle("DELETE /api/v1/api-keys/{id}", authMiddleware.Protect(http.HandlerFunc(h.DeleteAPIKey)))

	// ============================================
	// TRUSTED PARTNERS MANAGEMENT (Protected)
	// ============================================
	mux.Handle("POST /api/v1/partners/trusted", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.CreateTrustedPartner)))
	mux.Handle("GET /api/v1/partners/trusted", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.ListTrustedPartners)))
	mux.Handle("DELETE /api/v1/partners/trusted/{id}", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.DeleteTrustedPartner)))
	mux.Handle("POST /api/v1/partners/codes", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.CreatePartnerCode)))
	mux.Handle("GET /api/v1/partners/codes", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.ListPartnerCodes)))
	mux.Handle("DELETE /api/v1/partners/codes/{id}", authMiddleware.Protect(http.HandlerFunc(trustedPartnerHandler.DeactivatePartnerCode)))

	// ============================================
	// DATA ACCESS TOKENS (Protected - Tenant Admin)
	// ============================================
	dataAccessHandler := handlers.NewDataAccessHandler(dataAccessService)
	mux.Handle("POST /api/v1/data-access/tokens", authMiddleware.Protect(http.HandlerFunc(dataAccessHandler.CreateToken)))
	mux.Handle("GET /api/v1/data-access/tokens", authMiddleware.Protect(http.HandlerFunc(dataAccessHandler.ListTokens)))
	mux.Handle("DELETE /api/v1/data-access/tokens/{id}", authMiddleware.Protect(http.HandlerFunc(dataAccessHandler.RevokeToken)))

	// ============================================
	// REWARDS/GAMIFICATION ROUTES (Magic Link Authenticated)
	// ============================================
	mux.HandleFunc("GET /api/v1/rewards/balance", rewardHandler.GetBalance)
	mux.HandleFunc("GET /api/v1/rewards/leaderboard", rewardHandler.GetLeaderboard)
	mux.HandleFunc("GET /api/v1/rewards/history", rewardHandler.GetHistory)
	mux.HandleFunc("GET /api/v1/rewards/config", rewardHandler.GetConfig)

	// ============================================
	// EXPORT JOBS ROUTES (Protected - Async Exports)
	// ============================================
	if exportJobHandler != nil {
		mux.Handle("POST /api/v1/export-jobs", authMiddleware.Protect(http.HandlerFunc(exportJobHandler.CreateExportJob)))
		mux.Handle("GET /api/v1/export-jobs", authMiddleware.Protect(http.HandlerFunc(exportJobHandler.ListExportJobs)))
		mux.Handle("GET /api/v1/export-jobs/{id}", authMiddleware.Protect(http.HandlerFunc(exportJobHandler.GetExportJob)))
		mux.Handle("GET /api/v1/export-jobs/{id}/download", authMiddleware.Protect(http.HandlerFunc(exportJobHandler.DownloadExportJob)))
		mux.Handle("POST /api/v1/export-jobs/{id}/refresh", authMiddleware.Protect(http.HandlerFunc(exportJobHandler.RefreshDownloadURL)))
	}

	// ============================================
	// EXTERNAL API (API Key Authenticated - ERP Integration)
	// ============================================
	mux.Handle("GET /api/v1/external/passports/{uuid}", apiKeyMiddleware.Authenticate(http.HandlerFunc(h.ExternalGetPassport)))
	mux.Handle("POST /api/v1/external/batches", apiKeyMiddleware.AuthenticateWrite(http.HandlerFunc(h.ExternalCreateBatch)))
	mux.Handle("POST /api/v1/external/batches/{id}/passports", apiKeyMiddleware.AuthenticateWrite(http.HandlerFunc(h.ExternalCreatePassports)))
	mux.Handle("GET /api/v1/external/batches/{id}/labels", apiKeyMiddleware.Authenticate(http.HandlerFunc(h.ExternalDownloadLabels)))
	mux.Handle("POST /api/v1/external/passports/{uuid}/transition", apiKeyMiddleware.AuthenticateWrite(http.HandlerFunc(h.ExternalTransitionPassport)))

	// Tally ERP integration
	tallyHandler := tally.NewHandler(repo)
	tallySyncHandler := tally.NewSyncHandler(repo)
	mux.Handle("POST /api/v1/integrations/tally/import", authMiddleware.Protect(http.HandlerFunc(tallyHandler.Import)))
	mux.Handle("GET /api/v1/integrations/tally/history", authMiddleware.Protect(http.HandlerFunc(tallyHandler.History)))
	mux.Handle("GET /api/v1/integrations/tally/sync-config", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.GetConfig)))
	mux.Handle("POST /api/v1/integrations/tally/sync-config", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.SaveConfig)))
	mux.Handle("GET /api/v1/integrations/tally/staging", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.GetStaging)))
	mux.Handle("POST /api/v1/integrations/tally/staging/{id}/apply", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.ApplyStaging)))
	mux.Handle("POST /api/v1/integrations/tally/staging/{id}/discard", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.DiscardStaging)))
	mux.Handle("POST /api/v1/integrations/tally/sync-trigger", authMiddleware.Protect(http.HandlerFunc(tallySyncHandler.TriggerSync)))

	// ============================================
	// REGULATORY INTELLIGENCE (Phase E)
	// ============================================
	mux.Handle("GET /api/v1/regulatory/sources", authMiddleware.Protect(http.HandlerFunc(h.ListRegulatorySources)))
	mux.Handle("POST /api/v1/regulatory/sources", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.CreateRegulatorySource))))
	mux.Handle("PUT /api/v1/regulatory/sources/{id}", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.UpdateRegulatorySource))))
	mux.Handle("POST /api/v1/regulatory/sources/{id}/fetch", authMiddleware.Protect(middleware.RequireRole("owner", "admin")(http.HandlerFunc(h.ForceFetchRegulatorySource))))
	mux.Handle("GET /api/v1/regulatory/items", authMiddleware.Protect(http.HandlerFunc(h.ListRegulatoryItems)))
	mux.Handle("GET /api/v1/regulatory/alerts", authMiddleware.Protect(http.HandlerFunc(h.GetRegulatoryAlerts)))
	mux.Handle("GET /api/v1/regulatory/alerts/unread-count", authMiddleware.Protect(http.HandlerFunc(h.GetRegulatoryAlertUnreadCount)))
	mux.Handle("POST /api/v1/regulatory/alerts/{id}/read", authMiddleware.Protect(http.HandlerFunc(h.MarkRegulatoryAlertRead)))
	mux.Handle("POST /api/v1/regulatory/alerts/{id}/dismiss", authMiddleware.Protect(http.HandlerFunc(h.DismissRegulatoryAlert)))

	// Build handler chain: SecurityHeaders → MaxBytesReader → RecoverPanic → RequestLogger → CORS → mux
	// MaxBytesReader prevents trivial large-body DoS (10 MB limit)
	const maxBodyBytes = 10 << 20 // 10 MB
	baseHandler := middleware.SecurityHeaders(middleware.RecoverPanic(middleware.RequestLogger(corsMiddleware(cfg.CORSOrigins)(mux))))
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		baseHandler.ServeHTTP(w, r)
	})

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second, // Longer timeout for ZIP downloads
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Create a cancellable context for background workers
	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()

	// Start embedded export worker (polls every 5s for pending jobs)
	if exportJobService != nil {
		go func() {
			const pollInterval = 5 * time.Second
			const maxConcurrent = 3
			semaphore := make(chan struct{}, maxConcurrent)
			ticker := time.NewTicker(pollInterval)
			defer ticker.Stop()
			slog.Info("Embedded export worker started", "pollInterval", pollInterval)
			for {
				select {
				case <-workerCtx.Done():
					slog.Info("Export worker shutting down")
					return
				case <-ticker.C:
					jobs, err := exportJobService.GetPendingJobs(workerCtx, maxConcurrent)
					if err != nil {
						slog.Error("Worker failed to get pending jobs", "error", err)
						continue
					}
					for i := range jobs {
						job := jobs[i]
						select {
						case <-workerCtx.Done():
							return
						case semaphore <- struct{}{}:
							go func() {
								defer func() { <-semaphore }()
								slog.Info("Processing export job", "jobId", job.ID, "type", job.JobType)
								if err := exportJobService.ProcessJob(workerCtx, &job); err != nil {
									slog.Error("Export job failed", "jobId", job.ID, "error", err)
								} else {
									slog.Info("Export job completed", "jobId", job.ID)
								}
							}()
						}
					}
				}
			}
		}()
	}

	// Start server in goroutine
	go func() {
		slog.Info("Server starting", "addr", "http://localhost:"+cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for shutdown signal
	<-done
	slog.Info("Shutting down server...")

	// Stop background workers gracefully
	regulatoryWorker.Stop()
	registryWorkerPool.Stop()

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
		deps.Close()
		os.Exit(1)
	}

	deps.Close()
	slog.Info("Server exited gracefully")
}

// corsMiddleware adds CORS headers for Next.js frontend
// SECURITY: Uses whitelist instead of wildcard
// seedRegulatorySources inserts default regulatory feeds if the table is empty.
func seedRegulatorySources(ctx context.Context, repo repository.RepositoryInterface) error {
	sources, err := repo.ListRegulatorySources(ctx, false)
	if err != nil {
		return err
	}
	if len(sources) > 0 {
		return nil
	}

	defaults := []models.RegulatorySource{
		{
			ID:            uuid.New(),
			Name:          "EU Official Journal — Battery Regulation",
			SourceType:    models.RegulatorySourceTypeRSS,
			URL:           "https://eur-lex.europa.eu/oj/direct-access.html?locale=en",
			FetchInterval: "6h",
			IsActive:      true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:            uuid.New(),
			Name:          "ECHA SVHC Candidate List",
			SourceType:    models.RegulatorySourceTypeScraper,
			URL:           "https://echa.europa.eu/candidate-list-table",
			Config:        map[string]string{"item_regex": `(?i)<tr[^>]*>.*?<td[^>]*>(?P<title>.*?)</td>.*?<a[^>]*href="(?P<url>.*?)"`, "base_url": "https://echa.europa.eu"},
			FetchInterval: "24h",
			IsActive:      true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:            uuid.New(),
			Name:          "MoEF&CC Notifications",
			SourceType:    models.RegulatorySourceTypeScraper,
			URL:           "https://moef.gov.in/notifications",
			Config:        map[string]string{"item_regex": `(?i)<a[^>]*href="(?P<url>.*?)"[^>]*>(?P<title>.*?)</a>`},
			FetchInterval: "12h",
			IsActive:      true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
	}

	for _, s := range defaults {
		if err := repo.CreateRegulatorySource(ctx, &s); err != nil {
			return fmt.Errorf("failed to seed source %s: %w", s.Name, err)
		}
	}
	slog.Info("seeded default regulatory sources", "count", len(defaults))
	return nil
}

func corsMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	// Build origin lookup map for O(1) checks
	originMap := make(map[string]bool)
	for _, o := range allowedOrigins {
		originMap[o] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			if origin != "" {
				if originMap[origin] {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				} else {
					slog.Warn("CORS Blocked Origin", "origin", origin, "allowed", allowedOrigins)
				}
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Device-Token")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
