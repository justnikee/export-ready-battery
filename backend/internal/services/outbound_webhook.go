package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	"anvayalabs-battery/internal/models"
)

// OutboundWebhookRepository defines storage methods for webhook configuration
type OutboundWebhookRepository interface {
	CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error
	ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error)
	DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error
	GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error)
	IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error
	UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error
}

// OutboundWebhookService dispatches webhook events to tenant-registered URLs
type OutboundWebhookService struct {
	repo   OutboundWebhookRepository
	client *http.Client
}

// NewOutboundWebhookService creates a webhook dispatcher with a 10s timeout HTTP client
func NewOutboundWebhookService(repo OutboundWebhookRepository) *OutboundWebhookService {
	return &OutboundWebhookService{
		repo: repo,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Dispatch sends a webhook payload to all registered endpoints for a tenant/event combo.
// Non-blocking: failures are logged and failure counters incremented but never propagated.
func (s *OutboundWebhookService) Dispatch(ctx context.Context, tenantID uuid.UUID, eventType string, passportID uuid.UUID, data map[string]interface{}) {
	if s.repo == nil {
		return
	}

	webhooks, err := s.repo.GetWebhooksByEvent(ctx, tenantID, eventType)
	if err != nil {
		slog.Warn("Failed to fetch webhooks", "tenant_id", tenantID, "event", eventType, "error", err)
		return
	}

	if len(webhooks) == 0 {
		return
	}

	payload := models.WebhookPayload{
		Event:      eventType,
		PassportID: passportID.String(),
		TenantID:   tenantID.String(),
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Data:       data,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		slog.Error("Failed to marshal webhook payload", "error", err)
		return
	}

	for _, wh := range webhooks {
		go s.deliver(ctx, wh, body)
	}
}

// deliver sends the HTTP POST to a single webhook endpoint with HMAC signature
func (s *OutboundWebhookService) deliver(ctx context.Context, wh *models.OutboundWebhook, body []byte) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, wh.URL, bytes.NewReader(body))
	if err != nil {
		slog.Warn("Failed to create webhook request", "url", wh.URL, "error", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "AnvayaLabs-Webhook/1.0")

	// Sign with HMAC-SHA256 if secret is configured
	if wh.Secret != "" {
		mac := hmac.New(sha256.New, []byte(wh.Secret))
		mac.Write(body)
		sig := hex.EncodeToString(mac.Sum(nil))
		req.Header.Set("X-Webhook-Signature", fmt.Sprintf("sha256=%s", sig))
	}

	resp, err := s.client.Do(req)
	if err != nil {
		slog.Warn("Webhook delivery failed", "url", wh.URL, "error", err)
		_ = s.repo.IncrementWebhookFailure(ctx, wh.ID)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		_ = s.repo.UpdateWebhookLastTriggered(ctx, wh.ID, time.Now())
	} else {
		slog.Warn("Webhook returned non-2xx", "url", wh.URL, "status", resp.StatusCode)
		_ = s.repo.IncrementWebhookFailure(ctx, wh.ID)
	}
}
