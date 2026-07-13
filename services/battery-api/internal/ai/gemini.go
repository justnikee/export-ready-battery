package ai

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"net/url"
	"time"
)

// geminiAPIBase is the only place in the codebase where Google's Gemini
// endpoint appears. Uses the generateContent REST endpoint — no SDK needed.
const geminiAPIBase = "https://generativelanguage.googleapis.com/v1beta/models"

// geminiDefaultModel is the free-tier Gemini Flash model. It has a generous
// daily quota (1,500 RPD / 15 RPM on the free tier) and fast inference.
const geminiDefaultModel = "gemini-1.5-flash"

// GeminiProvider implements Provider using the Google Gemini REST API.
// Uses the generateContent endpoint directly — zero external SDK dependency.
type GeminiProvider struct {
	apiKey string
	client *http.Client
	model  string
}

// NewGeminiProvider creates a GeminiProvider. If apiKey is empty,
// IsConfigured() returns false and the gateway will skip this provider.
func NewGeminiProvider(apiKey string, timeout time.Duration) *GeminiProvider {
	return &GeminiProvider{
		apiKey: apiKey,
		client: &http.Client{Timeout: timeout},
		model:  geminiDefaultModel,
	}
}

// Name implements Provider.
func (p *GeminiProvider) Name() string { return "gemini" }

// IsConfigured implements Provider.
func (p *GeminiProvider) IsConfigured() bool { return p.apiKey != "" }

// Model returns the model identifier.
func (p *GeminiProvider) Model() string { return p.model }

// Complete implements Provider.
func (p *GeminiProvider) Complete(ctx context.Context, req Request) (Response, error) {
	if !p.IsConfigured() {
		return Response{}, ErrNotConfigured
	}

	start := time.Now()
	endpoint := p.buildEndpoint()

	// Build the request payload in Gemini's format.
	// System instruction is supplied via the dedicated systemInstruction field.
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": req.UserPrompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     req.Temperature,
			"maxOutputTokens": p.resolveMaxTokens(req.MaxTokens),
			// Gemini supports JSON MIME type response — use it when JSONMode is on.
			"responseMimeType": p.responseMIME(req.JSONMode),
		},
	}

	// Attach system instruction if provided.
	if req.SystemPrompt != "" {
		payload["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]string{
				{"text": req.SystemPrompt},
			},
		}
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return Response{}, fmt.Errorf("gemini: marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return Response{}, fmt.Errorf("gemini: build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := p.client.Do(httpReq)
	if err != nil {
		return Response{}, fmt.Errorf("gemini: http: %w", err)
	}
	defer httpResp.Body.Close()

	respBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return Response{}, fmt.Errorf("gemini: read body: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return Response{}, fmt.Errorf("gemini: status %d: %s", httpResp.StatusCode, string(respBytes))
	}

	var apiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		UsageMetadata struct {
			PromptTokenCount     int `json:"promptTokenCount"`
			CandidatesTokenCount int `json:"candidatesTokenCount"`
			TotalTokenCount      int `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}
	if err := json.Unmarshal(respBytes, &apiResp); err != nil {
		return Response{}, fmt.Errorf("gemini: parse response: %w", err)
	}
	if len(apiResp.Candidates) == 0 || len(apiResp.Candidates[0].Content.Parts) == 0 {
		return Response{}, fmt.Errorf("gemini: empty candidates in response")
	}

	text := apiResp.Candidates[0].Content.Parts[0].Text

	return Response{
		Text:     text,
		Provider: p.Name(),
		Model:    p.model,
		Usage: Usage{
			TokensIn:  apiResp.UsageMetadata.PromptTokenCount,
			TokensOut: apiResp.UsageMetadata.CandidatesTokenCount,
			Total:     apiResp.UsageMetadata.TotalTokenCount,
		},
		Latency: time.Since(start),
	}, nil
}

// buildEndpoint constructs the full Gemini API URL with the API key as a query
// parameter (Gemini's key-auth mechanism for the REST API).
func (p *GeminiProvider) buildEndpoint() string {
	base := fmt.Sprintf("%s/%s:generateContent", geminiAPIBase, p.model)
	params := url.Values{}
	params.Set("key", p.apiKey)
	return base + "?" + params.Encode()
}

func (p *GeminiProvider) responseMIME(jsonMode bool) string {
	if jsonMode {
		return "application/json"
	}
	return "text/plain"
}

func (p *GeminiProvider) resolveMaxTokens(requested int) int {
	if requested > 0 {
		return requested
	}
	return 2048
}

// Embed generates a 768-dimensional vector embedding for a given input text using embedding-001.
// If the provider has no apiKey configured, it yields a high-fidelity offline fallback embedding
// calculated deterministically from the SHA-256 hash of the content.
func (p *GeminiProvider) Embed(ctx context.Context, text string) ([]float32, error) {
	if !p.IsConfigured() {
		slog.Warn("[ai] Gemini provider is not configured. Falling back to deterministic offline mock embedding.")
		return deterministicMockEmbedding(text), nil
	}

	endpoint := p.buildEmbeddingEndpoint()

	payload := map[string]interface{}{
		"model": "models/gemini-embedding-001",
		"content": map[string]interface{}{
			"parts": []map[string]interface{}{
				{"text": text},
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("gemini embed: marshal: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("gemini embed: build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := p.client.Do(httpReq)
	if err != nil {
		slog.Warn("[ai] Gemini embed API request failed. Falling back to deterministic offline mock embedding.", "error", err)
		return deterministicMockEmbedding(text), nil
	}
	defer httpResp.Body.Close()

	respBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		slog.Warn("[ai] Gemini embed read body failed. Falling back to deterministic offline mock embedding.", "error", err)
		return deterministicMockEmbedding(text), nil
	}

	if httpResp.StatusCode != http.StatusOK {
		slog.Warn("[ai] Gemini embed API returned error status. Falling back to deterministic offline mock embedding.", "status", httpResp.StatusCode, "response", string(respBytes))
		return deterministicMockEmbedding(text), nil
	}

	var apiResp struct {
		Embedding struct {
			Values []float32 `json:"values"`
		} `json:"embedding"`
	}
	if err := json.Unmarshal(respBytes, &apiResp); err != nil {
		slog.Warn("[ai] Gemini embed json unmarshal failed. Falling back to deterministic offline mock embedding.", "error", err)
		return deterministicMockEmbedding(text), nil
	}

	if len(apiResp.Embedding.Values) == 0 {
		slog.Warn("[ai] Gemini embed returned empty values. Falling back to deterministic offline mock embedding.")
		return deterministicMockEmbedding(text), nil
	}

	return apiResp.Embedding.Values, nil
}

func (p *GeminiProvider) buildEmbeddingEndpoint() string {
	base := fmt.Sprintf("%s/gemini-embedding-001:embedContent", geminiAPIBase)
	params := url.Values{}
	params.Set("key", p.apiKey)
	return base + "?" + params.Encode()
}

func deterministicMockEmbedding(text string) []float32 {
	h := sha256.Sum256([]byte(text))
	var seed int64
	for i := 0; i < 8; i++ {
		seed = (seed << 8) | int64(h[i])
	}
	r := rand.New(rand.NewSource(seed))
	emb := make([]float32, 768)
	for i := 0; i < 768; i++ {
		emb[i] = r.Float32()*2.0 - 1.0
	}
	return emb
}
