package ai

import (
	"context"
	"os"
	"strconv"
	"strings"
	"time"
)

// GatewayConfig holds all runtime configuration for the LLM gateway.
// Values are loaded from environment variables via Load().
type GatewayConfig struct {
	// Providers is the ordered list of provider names to try (e.g. ["groq", "gemini"]).
	// The gateway tries them left-to-right on each request.
	Providers []string

	// GroqAPIKey is the API key for Groq (https://console.groq.com).
	GroqAPIKey string

	// GeminiAPIKey is the API key for Google Gemini (https://aistudio.google.com).
	GeminiAPIKey string

	// AnthropicAPIKey is the key for Anthropic Claude (paid — leave empty for now).
	AnthropicAPIKey string

	// RequestTimeout is the per-provider HTTP timeout. Default: 30s.
	RequestTimeout time.Duration

	// CircuitBreakerThreshold is the number of consecutive failures before a
	// provider's circuit opens. Default: 5.
	CircuitBreakerThreshold int

	// CircuitBreakerCooldown is how long to skip a tripped provider. Default: 60s.
	CircuitBreakerCooldown time.Duration

	// GroqDailyLimit is the soft daily request cap for Groq. Default: 500.
	GroqDailyLimit int

	// GeminiDailyLimit is the soft daily request cap for Gemini. Default: 1000.
	GeminiDailyLimit int

	// LogAICall callback hook to log AI executions.
	LogAICall func(ctx context.Context, task string, textHash string, provider string, model string, promptVersion int, latencyMs int, tokensIn int, tokensOut int, outcome string, fieldsWon []string)

	// GetDailyCount callback hook to fetch daily call count from Postgres.
	GetDailyCount func(ctx context.Context, provider string, since time.Time) (int, error)
}

// Load reads GatewayConfig from environment variables. Defaults are applied for
// any value that is absent or unparseable.
func Load() GatewayConfig {
	rawProviders := getenv("AI_PROVIDERS", "groq")
	providers := []string{}
	for _, p := range strings.Split(rawProviders, ",") {
		p = strings.TrimSpace(strings.ToLower(p))
		if p != "" {
			providers = append(providers, p)
		}
	}

	return GatewayConfig{
		Providers:               providers,
		GroqAPIKey:              getenv("GROQ_API_KEY", ""),
		GeminiAPIKey:            getenv("GEMINI_API_KEY", ""),
		AnthropicAPIKey:         getenv("ANTHROPIC_API_KEY", ""),
		RequestTimeout:          parseDuration("AI_REQUEST_TIMEOUT", 30*time.Second),
		CircuitBreakerThreshold: parseInt("AI_CIRCUIT_BREAKER_THRESHOLD", 5),
		CircuitBreakerCooldown:  parseDuration("AI_CIRCUIT_BREAKER_COOLDOWN", 60*time.Second),
		GroqDailyLimit:          parseInt("AI_GROQ_DAILY_LIMIT", 500),
		GeminiDailyLimit:        parseInt("AI_GEMINI_DAILY_LIMIT", 1000),
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func parseDuration(key string, def time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return def
	}
	return d
}

func parseInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}
