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

// Load reads configuration from environment variables.
// It returns an error if required values are missing or invalid.
func Load() (*Config, error) {
	env := getEnv("APP_ENV", "development")

	validEnvs := map[string]bool{"development": true, "staging": true, "production": true}
	if !validEnvs[env] {
		return nil, fmt.Errorf("invalid APP_ENV=%q: must be one of development, staging, production", env)
	}

	isProd := env == "production"

	// --- JWT Secret: required in production ---
	jwtSecret := getEnv("JWT_SECRET", "")
	if isProd && jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable must be set in production")
	}
	if jwtSecret == "" {
		jwtSecret = "dev-only-insecure-key-do-not-use-in-prod"
		slog.Warn("Using insecure default JWT secret (development only)")
	}

	// --- CORS Origins: required in production ---
	defaultCORS := "http://localhost:3000,http://localhost:5173"
	if isProd {
		defaultCORS = "" // Must be explicitly set in production
	}
	corsOrigins := getEnv("CORS_ORIGINS", defaultCORS)
	if isProd && corsOrigins == "" {
		return nil, fmt.Errorf("CORS_ORIGINS environment variable must be set in production")
	}

	port := getEnv("PORT", "8080")

	// --- Database URL ---
	databaseURL := getEnv("DATABASE_URL", "")
	if isProd {
		if databaseURL == "" {
			return nil, fmt.Errorf("DATABASE_URL environment variable must be set in production")
		}
		if strings.Contains(databaseURL, "localhost") || strings.Contains(databaseURL, "127.0.0.1") {
			return nil, fmt.Errorf("DATABASE_URL must not point to localhost in production")
		}
	}
	if databaseURL == "" {
		databaseURL = "postgres://postgres:postgres@localhost:5432/anvayalabs?sslmode=disable"
		slog.Warn("Using default local database (development only)")
	}

	// --- Backend URL ---
	backendURL := getEnv("BACKEND_URL", "")
	if isProd && backendURL == "" {
		return nil, fmt.Errorf("BACKEND_URL environment variable must be set in production")
	}
	if backendURL == "" {
		backendURL = fmt.Sprintf("http://localhost:%s", port)
	}

	// --- Warn about optional but critical production secrets ---
	if isProd {
		if getEnv("RAZORPAY_KEY_ID", "") == "" || getEnv("RAZORPAY_KEY_SECRET", "") == "" {
			slog.Warn("Razorpay credentials are empty in production: payments will fail")
		}
		if getEnv("REGULATOR_API_KEY", "") == "" {
			slog.Warn("REGULATOR_API_KEY is empty in production: Article 78 regulator access may be exposed or fail")
		}
	}

	return &Config{
		Port:              port,
		DatabaseURL:       databaseURL,
		BaseURL:           getEnv("BASE_URL", "http://localhost:3000"),
		BackendURL:        backendURL,
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
	}, nil
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
