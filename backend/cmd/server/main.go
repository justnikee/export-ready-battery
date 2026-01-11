package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"exportready-battery/internal/config"
	"exportready-battery/internal/db"
	"exportready-battery/internal/handlers"
	"exportready-battery/internal/middleware"
	"exportready-battery/internal/services"
)

func main() {
	// Load .env file from the current directory
	// Using Overload to force .env values to override system environment variables
	if err := godotenv.Overload(); err != nil {
		log.Println("No .env file found, using system environment variables")
	} else {
		log.Println("✅ Loaded .env file (overriding system env vars)")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	log.Println("✅ Connected to PostgreSQL database")

	// Initialize services
	authService := services.NewAuthService(cfg.JWTSecret, cfg.JWTExpiry, cfg.RefreshExpiry)

	// Initialize handlers
	h := handlers.New(database, cfg.BaseURL)
	authHandler := handlers.NewAuthHandler(database, authService)

	// Initialize middleware
	authMiddleware := middleware.NewAuth(authService)

	// Setup routes
	mux := http.NewServeMux()

	// Health check endpoint (public)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"exportready-battery"}`))
	})

	// ============================================
	// AUTH ROUTES (Public)
	// ============================================
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", authHandler.Refresh)
	mux.HandleFunc("POST /api/v1/auth/forgot-password", authHandler.ForgotPassword)
	mux.HandleFunc("POST /api/v1/auth/reset-password", authHandler.ResetPassword)

	// ============================================
	// AUTH ROUTES (Protected)
	// ============================================
	mux.Handle("GET /api/v1/auth/me", authMiddleware.Protect(http.HandlerFunc(authHandler.Me)))

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
	mux.Handle("GET /api/v1/batches/{id}/passports", authMiddleware.Protect(http.HandlerFunc(h.GetBatchPassports)))

	// ============================================
	// TEMPLATE ROUTES (Protected)
	// ============================================
	mux.Handle("POST /api/v1/templates", authMiddleware.Protect(http.HandlerFunc(h.CreateTemplate)))
	mux.Handle("GET /api/v1/templates", authMiddleware.Protect(http.HandlerFunc(h.ListTemplates)))
	mux.Handle("GET /api/v1/templates/{id}", authMiddleware.Protect(http.HandlerFunc(h.GetTemplate)))
	mux.Handle("DELETE /api/v1/templates/{id}", authMiddleware.Protect(http.HandlerFunc(h.DeleteTemplate)))

	// ============================================
	// UTILITY ROUTES (Public)
	// ============================================
	mux.HandleFunc("GET /api/v1/sample-csv", h.DownloadSampleCSV)

	// ============================================
	// PASSPORT ROUTES (Public - for QR code scanning)
	// ============================================
	mux.HandleFunc("GET /api/v1/passports/{uuid}", h.GetPassport)

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      corsMiddleware(loggingMiddleware(mux)),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second, // Longer timeout for ZIP downloads
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Start server in goroutine
	go func() {
		log.Printf("🚀 Server starting on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-done
	log.Println("⏳ Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}

// loggingMiddleware logs incoming HTTP requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// corsMiddleware adds CORS headers for Next.js frontend
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
