package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"exportready-battery/internal/config"
	"exportready-battery/internal/db"
	"exportready-battery/internal/handlers"
	"exportready-battery/internal/logger"
	"exportready-battery/internal/middleware"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
)

func main() {
	// Load .env file from the current directory
	// Using Overload to force .env values to override system environment variables
	if err := godotenv.Overload(); err != nil {
		slog.Info("No .env file found, using system environment variables")
	} else {
		slog.Info("Loaded .env file (overriding system env vars)")
	}

	// Initialize structured logger
	logger.Init()

	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	slog.Info("Connected to PostgreSQL database")

	// Initialize services
	authService := services.NewAuthService(cfg.JWTSecret, cfg.JWTExpiry, cfg.RefreshExpiry)
	authEmailService := services.NewEmailService(cfg.BaseURL)
	magicLinkEmailService := services.GetEmailServiceFromEnv(cfg.BaseURL)

	// Initialize repository
	repo := repository.New(database)

	// Initialize data access service
	dataAccessService := services.NewDataAccessService(repo)

	// Initialize handlers
	h := handlers.New(database, cfg.BaseURL, "assets/GeoLite2-City.mmdb", cfg.RazorpayKeyID, cfg.RazorpayKeySecret, magicLinkEmailService, dataAccessService, cfg.RegulatorAPIKey)
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

	// Initialize lifecycle service and handler
	lifecycleService := services.NewLifecycleService(repo)
	lifecycleHandler := handlers.NewLifecycleHandler(lifecycleService, repo)

	// Initialize reward service
	rewardService := services.NewRewardService(repo)

	// Initialize BMS Telemetry services
	deviceTokenService := services.NewDeviceTokenService(repo)
	telemetryService := services.NewTelemetryService(repo)

	// Initialize additional handlers
	telemetryHandler := handlers.NewTelemetryHandler(telemetryService, deviceTokenService)
	var exportJobHandler *handlers.ExportJobHandler
	if os.Getenv("SUPABASE_URL") != "" && os.Getenv("SUPABASE_SERVICE_ROLE_KEY") != "" {
		slogger := logger.Logger
		storageService := services.NewStorageService(slogger)
		exportEmailService := services.GetEmailServiceFromEnv(cfg.BaseURL)
		qrService := services.NewQRService(cfg.BaseURL)
		pdfService := services.NewPDFService(cfg.BaseURL)
		csvService := services.NewCSVService()
		auditExportService := services.NewAuditExportService(database.Pool)
		exportJobService := services.NewExportJobService(
			database.Pool,
			storageService,
			qrService,
			pdfService,
			csvService,
			exportEmailService,
			auditExportService,
			slogger,
		)
		exportJobHandler = handlers.NewExportJobHandler(exportJobService, slogger)
		slog.Info("Export job handler initialized")
	} else {
		slog.Warn("Export job handler not initialized (missing SUPABASE config)")
	}

	// Initialize magic link handler (with reward service for scan-to-earn and email service)
	magicLinkHandler := handlers.NewMagicLinkHandler(repo, lifecycleService, rewardService, magicLinkEmailService, cfg.JWTSecret, cfg.BaseURL)

	// Initialize trusted partner handler
	trustedPartnerHandler := handlers.NewTrustedPartnerHandler(repo)

	// Initialize reward handler
	rewardHandler := handlers.NewRewardHandler(rewardService, cfg.JWTSecret)

	// Initialize additional middleware
	deviceAuth := middleware.NewDeviceAuth(deviceTokenService)
	mux := http.NewServeMux()

	// Health check endpoint (public)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"exportready-battery"}`))
	})

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
    <title>ExportReady Battery API - Documentation</title>
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
	mux.Handle("PUT /api/v1/auth/profile", authMiddleware.Protect(http.HandlerFunc(authHandler.UpdateProfile)))

	// ============================================
	// BATCH ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/batches", authMiddleware.Protect(http.HandlerFunc(h.CreateBatch)))
	mux.Handle("GET /api/v1/batches", authMiddleware.Protect(http.HandlerFunc(h.ListBatches)))
	mux.Handle("GET /api/v1/batches/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetBatch)))
	mux.Handle("POST /api/v1/batches/{id}/upload", authMiddleware.Protect(http.HandlerFunc(h.UploadCSV)))
	mux.Handle("POST /api/v1/batches/{id}/validate", authMiddleware.Protect(http.HandlerFunc(h.ValidateCSV)))
	mux.Handle("POST /api/v1/batches/{id}/auto-generate", authMiddleware.Protect(http.HandlerFunc(h.AutoGeneratePassports)))
	mux.Handle("GET /api/v1/batches/{id}/download", authMiddleware.Protect(http.HandlerFunc(h.DownloadQRCodes)))
	mux.Handle("GET /api/v1/batches/{id}/labels", authMiddleware.Protect(http.HandlerFunc(h.DownloadLabels)))
	mux.Handle("GET /api/v1/batches/{id}/export", authMiddleware.Protect(http.HandlerFunc(h.ExportBatchCSV)))
	mux.Handle("GET /api/v1/batches/{id}/audit-export", authMiddleware.Protect(http.HandlerFunc(h.ExportBatchAuditCSV)))
	mux.Handle("GET /api/v1/batches/{id}/passports", authMiddleware.Protect(http.HandlerFunc(h.GetBatchPassports)))
	mux.Handle("DELETE /api/v1/batches/{id}", authMiddleware.Protect(http.HandlerFunc(h.DeleteBatch)))
	mux.Handle("POST /api/v1/batches/{id}/archive", authMiddleware.Protect(http.HandlerFunc(h.ArchiveBatch)))
	mux.Handle("DELETE /api/v1/batches/{id}/draft", authMiddleware.Protect(http.HandlerFunc(h.DeleteDraftBatch)))

	// ============================================
	// BULK OPERATIONS (Protected)
	// ============================================
	mux.Handle("POST /api/v1/passports/bulk/status", authMiddleware.Protect(http.HandlerFunc(h.BulkUpdateStatus)))
	mux.Handle("POST /api/v1/passports/bulk/delete", authMiddleware.Protect(http.HandlerFunc(h.BulkDeletePassports)))
	mux.Handle("POST /api/v1/passports/bulk/transition", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.BulkTransitionPassports)))

	// ============================================
	// PASSPORT LIFECYCLE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/passports/{uuid}/transition", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.TransitionPassport)))
	mux.Handle("GET /api/v1/passports/{uuid}/transitions", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetAllowedActions)))
	mux.Handle("GET /api/v1/passports/{uuid}/events", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.GetPassportEvents)))
	mux.Handle("POST /api/v1/passports/{uuid}/soh", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.UpdateStateOfHealth)))
	mux.Handle("POST /api/v1/passports/{uuid}/repairs", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.LogRepairEvent)))
	mux.Handle("POST /api/v1/passports/{uuid}/replacements", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.LogReplacementEvent)))
	mux.Handle("POST /api/v1/passports/{uuid}/transfer", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.TransferPassport)))
	mux.Handle("GET /api/v1/passports/{uuid}/verify-chain", authMiddleware.Protect(http.HandlerFunc(lifecycleHandler.VerifyAuditChain)))

	// ============================================
	// TEMPLATE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/templates", authMiddleware.Protect(http.HandlerFunc(h.CreateTemplate)))
	mux.Handle("GET /api/v1/templates", authMiddleware.Protect(http.HandlerFunc(h.ListTemplates)))
	mux.Handle("GET /api/v1/templates/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetTemplate)))
	mux.Handle("DELETE /api/v1/templates/{id}", authMiddleware.Protect(http.HandlerFunc(h.DeleteTemplate)))

	// ============================================
	// TEAM MANAGEMENT ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/team", authMiddleware.Protect(http.HandlerFunc(h.ListTeamMembers)))
	mux.Handle("POST /api/v1/team/invite", authMiddleware.Protect(http.HandlerFunc(h.InviteUser)))
	mux.Handle("DELETE /api/v1/team/{id}", authMiddleware.Protect(http.HandlerFunc(h.RemoveTeamMember)))
	mux.Handle("PUT /api/v1/team/{id}/role", authMiddleware.Protect(http.HandlerFunc(h.UpdateTeamMemberRole)))
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
	// BILLING ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/billing/balance", authMiddleware.Protect(http.HandlerFunc(h.GetBalance)))
	mux.Handle("GET /api/v1/billing/transactions", authMiddleware.Protect(http.HandlerFunc(h.GetTransactions)))
	mux.Handle("POST /api/v1/batches/{id}/activate", authMiddleware.Protect(http.HandlerFunc(h.ActivateBatch)))
	mux.Handle("POST /api/v1/batches/{id}/duplicate", authMiddleware.Protect(http.HandlerFunc(h.DuplicateBatch)))
	mux.Handle("POST /api/v1/billing/top-up", authMiddleware.Protect(http.HandlerFunc(h.TopUpQuota)))

	// Razorpay Payment Gateway
	mux.Handle("GET /api/v1/billing/packages", authMiddleware.Protect(http.HandlerFunc(h.GetPackages)))
	mux.Handle("POST /api/v1/billing/razorpay/order", authMiddleware.Protect(http.HandlerFunc(h.CreateRazorpayOrder)))
	mux.Handle("POST /api/v1/billing/razorpay/verify", authMiddleware.Protect(http.HandlerFunc(h.VerifyRazorpayPayment)))

	// ============================================
	// CARBON CALCULATOR ROUTES (Protected)
	// ============================================
	carbonService := services.NewCarbonCalculatorService(repo)
	carbonHandler := handlers.NewCarbonHandler(carbonService)
	mux.Handle("POST /api/v1/carbon/calculate", authMiddleware.Protect(http.HandlerFunc(carbonHandler.CalculateCarbon)))

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
	mux.Handle("POST /api/v1/device-tokens", authMiddleware.Protect(http.HandlerFunc(telemetryHandler.CreateDeviceToken)))
	mux.Handle("GET /api/v1/device-tokens", authMiddleware.Protect(http.HandlerFunc(telemetryHandler.ListDeviceTokens)))
	mux.Handle("DELETE /api/v1/device-tokens/{id}", authMiddleware.Protect(http.HandlerFunc(telemetryHandler.RevokeDeviceToken)))

	// ============================================
	// WEBHOOK ROUTES (Public - for payment providers)
	// ============================================
	webhookHandler := handlers.NewWebhookHandler(h.RazorpayService(), repo)
	mux.HandleFunc("POST /api/v1/webhooks/razorpay", webhookHandler.RazorpayWebhook)

	// ============================================
	// DOCUMENT UPLOAD ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/settings/upload-document", authMiddleware.Protect(http.HandlerFunc(h.UploadDocument)))
	mux.Handle("GET /api/v1/settings/documents/{type}", authMiddleware.Protect(http.HandlerFunc(h.ViewDocument)))
	mux.Handle("POST /api/v1/settings/upload-logo", authMiddleware.Protect(http.HandlerFunc(h.UploadLogo)))

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
	mux.Handle("POST /api/v1/admin/verify-doc", authMiddleware.Protect(http.HandlerFunc(h.AdminVerifyDocument)))

	// ============================================
	// SCAN ROUTES (Public - called from passport page)
	// ============================================
	mux.HandleFunc("POST /api/v1/scans/record", h.RecordScan)

	// ============================================
	// PASSPORT ROUTES (Public - for QR code scanning)
	// ============================================
	mux.HandleFunc("GET /api/v1/passports/{uuid}", h.GetPassport)

	// ============================================
	// MAGIC LINK PASSPORT ROUTES (Token Authenticated)
	// ============================================
	mux.HandleFunc("POST /api/v1/passport/{uuid}/transition", magicLinkHandler.TransitionWithMagicLink)
	mux.HandleFunc("GET /api/v1/passport/{uuid}/action-info", magicLinkHandler.GetPassportForAction)

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

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      corsMiddleware(cfg.CORSOrigins)(loggingMiddleware(mux)),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second, // Longer timeout for ZIP downloads
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

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

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("Server exited gracefully")
}

// loggingMiddleware logs incoming HTTP requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		slog.Info("HTTP request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(start))
	})
}

// corsMiddleware adds CORS headers for Next.js frontend
// SECURITY: Uses whitelist instead of wildcard
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
