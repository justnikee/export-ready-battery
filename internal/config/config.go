package config

import (
	"log"
	"os"
)

// Config holds all configuration for the application
type Config struct {
	Port        string
	DatabaseURL string
	BaseURL     string // For QR code URLs (e.g., https://app.com)
}

// Load reads configuration from environment variables
func Load() *Config {
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/exportready?sslmode=disable")

	// Debug: Show which database we're connecting to (mask password)
	if len(dbURL) > 50 {
		log.Printf("Debug: DATABASE_URL (masked): %s...%s", dbURL[:30], dbURL[len(dbURL)-20:])
	}

	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: dbURL,
		BaseURL:     getEnv("BASE_URL", "http://localhost:3000"),
	}
}

// getEnv reads an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
