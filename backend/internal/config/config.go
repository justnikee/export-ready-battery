package config

import (
	"os"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Port        string
	DatabaseURL string
	BaseURL     string // For QR code URLs (e.g., https://app.com)

	// JWT Configuration
	JWTSecret     string
	JWTExpiry     time.Duration
	RefreshExpiry time.Duration

	// Razorpay Payment Gateway
	RazorpayKeyID     string
	RazorpayKeySecret string
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/exportready?sslmode=disable"),
		BaseURL:           getEnv("BASE_URL", "http://localhost:3000"),
		JWTSecret:         getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		JWTExpiry:         parseDuration(getEnv("JWT_EXPIRY", "15m")),
		RefreshExpiry:     parseDuration(getEnv("REFRESH_EXPIRY", "168h")), // 7 days
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),
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
