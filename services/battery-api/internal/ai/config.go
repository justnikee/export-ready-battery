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
	// Free tier: ~14,400 requests/day on llama-3.3-70b-versatile.
	GroqAPIKey string

	// GeminiAPIKey is the API key for Google Gemini (https://aistudio.google.com).
	// Free tier: 1,500 requests/day on gemini-1.5-flash.
	GeminiAPIKey string

	// AnthropicAPIKey is the key for Anthropic Claude (paid — leave empty for now).
	// The gateway checks IsConfigured() before including Anthropic in the chain.
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
//
// Environment variables:
//
//	AI_PROVIDERS               Comma-separated provider list. Default: "groq"
//	GROQ_API_KEY               Groq API key
//	GEMINI_API_KEY             Google Gemini API key
//	ANTHROPIC_API_KEY          Anthropic API key (optional; leave empty)
//	AI_REQUEST_TIMEOUT         Per-provider HTTP timeout. Default: "30s"
//	AI_CIRCUIT_BREAKER_THRESHOLD  Failure threshold. Default: 5
//	AI_CIRCUIT_BREAKER_COOLDOWN   Cooldown after open. Default: "60s"
//	AI_GROQ_DAILY_LIMIT        Groq soft daily cap. Default: 500
//	AI_GEMINI_DAILY_LIMIT      Gemini soft daily cap. Default: 1000
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
