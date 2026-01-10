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

	// Initialize handlers with database and config
	h := handlers.New(database, cfg.BaseURL)

	// Setup routes
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"exportready-battery"}`))
	})

	// Batch & CSV Upload routes
	mux.HandleFunc("POST /api/v1/batches", h.CreateBatch)
	mux.HandleFunc("GET /api/v1/batches", h.ListBatches)
	mux.HandleFunc("GET /api/v1/batches/{id}", h.GetBatch)
	mux.HandleFunc("POST /api/v1/batches/{id}/upload", h.UploadCSV)

	// Passport routes
	mux.HandleFunc("GET /api/v1/passports/{uuid}", h.GetPassport)

	// QR Code download
	mux.HandleFunc("GET /api/v1/batches/{id}/download", h.DownloadQRCodes)

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
