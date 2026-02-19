package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Port        string
	DatabaseURL string
	BaseURL     string // For QR code URLs (e.g., https://app.com)
	BackendURL  string // Backend public URL for OAuth callbacks
	Environment string // development, staging, production

	// JWT Configuration
	JWTSecret     string
	JWTExpiry     time.Duration
	RefreshExpiry time.Duration

	// Razorpay Payment Gateway
	RazorpayKeyID     string
	RazorpayKeySecret string

	// OAuth Configuration
	GoogleClientID        string
	GoogleClientSecret    string
	MicrosoftClientID     string
	MicrosoftClientSecret string
	FrontendURL           string // For OAuth callback redirects to frontend

	// CORS - Allowed Origins (comma-separated).
	// In production, set CORS_ORIGINS env var to your frontend domain (e.g., https://myapp.com)
	CORSOrigins []string

	// Art 78 Regulator Access (EU Battery Regulation)
	RegulatorAPIKey string
}

// Load reads configuration from environment variables
func Load() *Config {
	env := getEnv("APP_ENV", "development")

	// --- JWT Secret: crash in production if unset ---
	jwtSecret := getEnv("JWT_SECRET", "")
	if env == "production" && jwtSecret == "" {
		slog.Error("FATAL: JWT_SECRET environment variable must be set in production")
		os.Exit(1)
	}
	if jwtSecret == "" {
		jwtSecret = "dev-only-insecure-key-do-not-use-in-prod"
		slog.Warn("Using insecure default JWT secret (development only)")
	}

	// --- CORS Origins: crash in production if unset ---
	defaultCORS := "http://localhost:3000,http://localhost:5173"
	if env == "production" {
		defaultCORS = "" // Must be explicitly set in production
	}
	corsOrigins := getEnv("CORS_ORIGINS", defaultCORS)
	if env == "production" && corsOrigins == "" {
		slog.Error("FATAL: CORS_ORIGINS environment variable must be set in production")
		os.Exit(1)
	}

	port := getEnv("PORT", "8080")

	return &Config{
		Port:              port,
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/exportready?sslmode=disable"),
		BaseURL:           getEnv("BASE_URL", "http://localhost:3000"),
		BackendURL:        getEnv("BACKEND_URL", fmt.Sprintf("http://localhost:%s", port)),
		Environment:       env,
		JWTSecret:         jwtSecret,
		JWTExpiry:         parseDuration(getEnv("JWT_EXPIRY", "15m")),
		RefreshExpiry:     parseDuration(getEnv("REFRESH_EXPIRY", "168h")), // 7 days
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),
		// OAuth
		GoogleClientID:        getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:    getEnv("GOOGLE_CLIENT_SECRET", ""),
		MicrosoftClientID:     getEnv("MICROSOFT_CLIENT_ID", ""),
		MicrosoftClientSecret: getEnv("MICROSOFT_CLIENT_SECRET", ""),
		FrontendURL:           getEnv("FRONTEND_URL", getEnv("BASE_URL", "http://localhost:3000")),
		CORSOrigins:           parseOrigins(corsOrigins),
		RegulatorAPIKey:       getEnv("REGULATOR_API_KEY", ""),
	}
}

// getEnv reads an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// parseDuration parses a duration string, returns default on error
func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute // default
	}
	return d
}

// parseOrigins splits comma-separated CORS origins into a slice
func parseOrigins(s string) []string {
	if s == "" {
		return []string{}
	}
	origins := strings.Split(s, ",")
	// Trim whitespace from each origin
	for i, o := range origins {
		origins[i] = strings.TrimSpace(o)
	}
	return origins
}
