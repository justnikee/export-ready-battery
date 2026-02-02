package config

import (
	"os"
	"strings"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Port        string
	DatabaseURL string
	BaseURL     string // For QR code URLs (e.g., https://app.com)
	Environment string // development, staging, production

	// JWT Configuration
	JWTSecret     string
	JWTExpiry     time.Duration
	RefreshExpiry time.Duration

	// Razorpay Payment Gateway
	RazorpayKeyID     string
	RazorpayKeySecret string

	// CORS - Allowed Origins (comma-separated)
	CORSOrigins []string
}

// Load reads configuration from environment variables
func Load() *Config {
	env := getEnv("APP_ENV", "development")

	// Default CORS origins based on environment
	defaultCORS := "http://localhost:3000,http://localhost:5173"
	if env == "production" {
		defaultCORS = "" // Must be explicitly set in production
	}

	return &Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/exportready?sslmode=disable"),
		BaseURL:           getEnv("BASE_URL", "http://localhost:3000"),
		Environment:       env,
		JWTSecret:         getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		JWTExpiry:         parseDuration(getEnv("JWT_EXPIRY", "15m")),
		RefreshExpiry:     parseDuration(getEnv("REFRESH_EXPIRY", "168h")), // 7 days
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),
		CORSOrigins:       parseOrigins(getEnv("CORS_ORIGINS", defaultCORS)),
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
