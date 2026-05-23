package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/anvayalabs/platform-core/internal/app"
	"github.com/anvayalabs/platform-core/internal/handlers"
	"github.com/anvayalabs/platform-core/internal/middleware"
	"github.com/anvayalabs/platform-core/internal/repository"
	"github.com/anvayalabs/platform-core/internal/services"
)

func main() {
	deps, err := app.Bootstrap("platform-core")
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

	// Initialize repository
	repo := repository.New(database)

	// Initialize handlers
	h := handlers.New(repo, cfg.RazorpayKeyID, cfg.RazorpayKeySecret, authEmailService)
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
	authRateLimiter := middleware.NewAuthRateLimiter()

	mux := http.NewServeMux()

	// Health check endpoint (public)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
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
	mux.Handle("PUT /api/v1/auth/profile", authMiddleware.Protect(http.HandlerFunc(authHandler.UpdateProfile)))
	// Logout — clears refresh token JTI (requires valid access token)
	mux.Handle("POST /api/v1/auth/logout", authMiddleware.Protect(http.HandlerFunc(authHandler.Logout)))

	// ============================================
	// TEAM MANAGEMENT ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/team", authMiddleware.Protect(http.HandlerFunc(h.ListTeamMembers)))
	mux.Handle("POST /api/v1/team/invite", authMiddleware.Protect(http.HandlerFunc(h.InviteUser)))
	// RBAC: only owners can remove members or change roles
	mux.Handle("DELETE /api/v1/team/{id}", authMiddleware.Protect(middleware.RequireRole("owner")(http.HandlerFunc(h.RemoveTeamMember))))
	mux.Handle("PUT /api/v1/team/{id}/role", authMiddleware.Protect(middleware.RequireRole("owner")(http.HandlerFunc(h.UpdateTeamMemberRole))))
	mux.HandleFunc("POST /api/v1/team/accept", h.AcceptInvite) // Public for invite links

	// ============================================
	// BILLING ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/billing/balance", authMiddleware.Protect(http.HandlerFunc(h.GetBalance)))
	mux.Handle("GET /api/v1/billing/transactions", authMiddleware.Protect(http.HandlerFunc(h.GetTransactions)))
	mux.Handle("POST /api/v1/billing/top-up", authMiddleware.Protect(http.HandlerFunc(h.TopUpQuota)))

	// Razorpay Payment Gateway
	mux.Handle("GET /api/v1/billing/packages", authMiddleware.Protect(http.HandlerFunc(h.GetPackages)))
	mux.Handle("POST /api/v1/billing/razorpay/order", authMiddleware.Protect(http.HandlerFunc(h.CreateRazorpayOrder)))
	mux.Handle("POST /api/v1/billing/razorpay/verify", authMiddleware.Protect(http.HandlerFunc(h.VerifyRazorpayPayment)))

	// ============================================
	// WEBHOOK ROUTES (Public - for payment providers)
	// ============================================
	webhookHandler := handlers.NewWebhookHandler(h.RazorpayService(), repo)
	mux.HandleFunc("POST /api/v1/webhooks/razorpay", webhookHandler.RazorpayWebhook)

	// Create HTTP server
	port := cfg.Port
	if port == "" {
		port = "8081"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      middleware.RecoverPanic(middleware.RequestLogger(corsMiddleware(cfg.CORSOrigins)(mux))),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Start server in goroutine
	go func() {
		slog.Info("Server starting", "addr", "http://localhost:"+port)
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
		deps.Close()
		os.Exit(1)
	}

	deps.Close()
	slog.Info("Server exited gracefully")
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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Device-Token")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
