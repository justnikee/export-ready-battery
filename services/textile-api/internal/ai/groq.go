package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const groqAPIURL = "https://api.groq.com/openai/v1/chat/completions"
const groqDefaultModel = "llama-3.3-70b-versatile"

type GroqProvider struct {
	apiKey string
	client *http.Client
	model  string
}

func NewGroqProvider(apiKey string, timeout time.Duration) *GroqProvider {
	return &GroqProvider{
		apiKey: apiKey,
		client: &http.Client{Timeout: timeout},
		model:  groqDefaultModel,
	}
}

func (p *GroqProvider) Name() string { return "groq" }

func (p *GroqProvider) IsConfigured() bool { return p.apiKey != "" }

func (p *GroqProvider) Model() string { return p.model }

func (p *GroqProvider) Complete(ctx context.Context, req Request) (Response, error) {
	if !p.IsConfigured() {
		return Response{}, ErrNotConfigured
	}

	start := time.Now()

	messages := []map[string]string{
		{"role": "system", "content": p.systemPrompt(req)},
		{"role": "user", "content": req.UserPrompt},
	}

	body := map[string]interface{}{
		"model":       p.model,
		"messages":    messages,
		"temperature": req.Temperature,
		"max_tokens":  p.resolveMaxTokens(req.MaxTokens),
	}
	if req.JSONMode {
		body["response_format"] = map[string]string{"type": "json_object"}
	}

	jsonData, err := json.Marshal(body)
	if err != nil {
		return Response{}, fmt.Errorf("groq: marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, groqAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return Response{}, fmt.Errorf("groq: build request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := p.client.Do(httpReq)
	if err != nil {
		return Response{}, fmt.Errorf("groq: http: %w", err)
	}
	defer httpResp.Body.Close()

	respBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return Response{}, fmt.Errorf("groq: read body: %w", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return Response{}, fmt.Errorf("groq: status %d: %s", httpResp.StatusCode, string(respBytes))
	}

	var apiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
	}
	if err := json.Unmarshal(respBytes, &apiResp); err != nil {
		return Response{}, fmt.Errorf("groq: parse response: %w", err)
	}
	if len(apiResp.Choices) == 0 {
		return Response{}, fmt.Errorf("groq: empty choices in response")
	}

	return Response{
		Text:     apiResp.Choices[0].Message.Content,
		Provider: p.Name(),
		Model:    p.model,
		Usage: Usage{
			TokensIn:  apiResp.Usage.PromptTokens,
			TokensOut: apiResp.Usage.CompletionTokens,
			Total:     apiResp.Usage.TotalTokens,
		},
		Latency: time.Since(start),
	}, nil
}

func (p *GroqProvider) systemPrompt(req Request) string {
	if req.SystemPrompt != "" {
		return req.SystemPrompt
	}
	if req.JSONMode {
		return "You are a precise data extraction assistant. Respond only with valid JSON."
	}
	return "You are a helpful assistant."
}

func (p *GroqProvider) resolveMaxTokens(requested int) int {
	if requested > 0 {
		return requested
	}
	return 2048
}
