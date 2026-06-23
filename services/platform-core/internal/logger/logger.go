package logger

import (
	"log/slog"
	"os"
	"strings"
)

var (
	// Logger is the global structured logger instance
	Logger *slog.Logger
)

// Init initializes the global logger with the specified log level
// Reads LOG_LEVEL from environment: DEBUG, INFO, WARN, ERROR
// Defaults to INFO if not set
func Init() {
	levelStr := strings.ToUpper(os.Getenv("LOG_LEVEL"))

	var level slog.Level
	switch levelStr {
	case "DEBUG":
		level = slog.LevelDebug
	case "WARN", "WARNING":
		level = slog.LevelWarn
	case "ERROR":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: level,
	}

	// Use JSON handler for production-ready structured logs
	handler := slog.NewJSONHandler(os.Stdout, opts)
	Logger = slog.New(handler)

	// Set as default logger
	slog.SetDefault(Logger)

	Logger.Info("Logger initialized", "level", level.String())
}

// Info logs at INFO level with structured key-value pairs
func Info(msg string, args ...any) {
	Logger.Info(msg, args...)
}

// Debug logs at DEBUG level with structured key-value pairs
func Debug(msg string, args ...any) {
	Logger.Debug(msg, args...)
}

// Warn logs at WARN level with structured key-value pairs
func Warn(msg string, args ...any) {
	Logger.Warn(msg, args...)
}

// Error logs at ERROR level with structured key-value pairs
func Error(msg string, args ...any) {
	Logger.Error(msg, args...)
}

// With returns a new Logger with the given attributes
func With(args ...any) *slog.Logger {
	return Logger.With(args...)
}
