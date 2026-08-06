package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

// OutboundWebhookRepository defines storage methods for webhook configuration
// and delivery logging.
type OutboundWebhookRepository interface {
	CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error
	ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error)
	DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error
	GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error)
	GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error)
	GetOutboundWebhookByIDAny(ctx context.Context, id uuid.UUID) (*models.OutboundWebhook, error)
	IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error
	UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error
	CreateWebhookDelivery(ctx context.Context, d *models.WebhookDelivery) error
	UpdateWebhookDeliveryResult(ctx context.Context, id uuid.UUID, responseStatus *int, responseBody string, deliveredAt *time.Time, retryCount int, errorMessage string) error
	GetWebhookDeliveriesByWebhook(ctx context.Context, webhookID uuid.UUID, limit int) ([]*models.WebhookDelivery, error)
	GetWebhookDeliveryByID(ctx context.Context, id uuid.UUID) (*models.WebhookDelivery, error)
	GetFailedDeliveriesForRetry(ctx context.Context, maxRetries, limit int) ([]*models.WebhookDelivery, error)
}

// MaxWebhookRetries caps how many times the background worker will retry a
// failed delivery before giving up — matches the IncrementWebhookFailure
// auto-deactivation threshold in spirit (stop hammering a dead endpoint).
const MaxWebhookRetries = 5

// responseBodyTruncateLimit caps stored response bodies so a misbehaving
// endpoint returning megabytes of HTML can't bloat the deliveries table.
const responseBodyTruncateLimit = 2000

// OutboundWebhookService dispatches webhook events to tenant-registered URLs
type OutboundWebhookService struct {
	repo   OutboundWebhookRepository
	client *http.Client
}

// NewOutboundWebhookService creates a webhook dispatcher with an SSRF-hardened HTTP client.
func NewOutboundWebhookService(repo OutboundWebhookRepository) *OutboundWebhookService {
	return &OutboundWebhookService{
		repo:   repo,
		client: NewSafeWebhookHTTPClient(),
	}
}

// Create persists a new outbound webhook configuration after SSRF URL validation.
func (s *OutboundWebhookService) Create(ctx context.Context, wh *models.OutboundWebhook) error {
	if err := ValidateOutboundWebhookURL(wh.URL); err != nil {
		return fmt.Errorf("invalid webhook url: %w", err)
	}
	return s.repo.CreateOutboundWebhook(ctx, wh)
}

// List returns all webhooks registered for a tenant.
func (s *OutboundWebhookService) List(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error) {
	return s.repo.ListOutboundWebhooks(ctx, tenantID)
}

// Delete removes a tenant-owned webhook by ID.
func (s *OutboundWebhookService) Delete(ctx context.Context, id, tenantID uuid.UUID) error {
	return s.repo.DeleteOutboundWebhook(ctx, id, tenantID)
}

// GetByID fetches a single tenant-owned webhook, for delivery-log ownership checks.
func (s *OutboundWebhookService) GetByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) {
	return s.repo.GetOutboundWebhookByID(ctx, id, tenantID)
}

// GetDeliveries returns the delivery log for a webhook, after verifying the
// webhook belongs to the requesting tenant — GetWebhookDeliveriesByWebhook
// itself only filters by webhook_id, so the ownership check happens here.
func (s *OutboundWebhookService) GetDeliveries(ctx context.Context, webhookID, tenantID uuid.UUID, limit int) ([]*models.WebhookDelivery, error) {
	if _, err := s.repo.GetOutboundWebhookByID(ctx, webhookID, tenantID); err != nil {
		return nil, fmt.Errorf("webhook not found")
	}
	return s.repo.GetWebhookDeliveriesByWebhook(ctx, webhookID, limit)
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

	// Detach from the request context: these deliveries run in goroutines
	// that outlive the HTTP handler that triggered them. Dispatching with
	// ctx directly would cancel in-flight POSTs the moment the original
	// request finished — context.WithoutCancel keeps any context values
	// (trace IDs etc.) without inheriting that cancellation.
	deliverCtx := context.WithoutCancel(ctx)
	for _, wh := range webhooks {
		go s.deliver(deliverCtx, wh, eventType, body)
	}
}

// deliver sends the HTTP POST to a single webhook endpoint with an
// HMAC signature and logs the attempt as a WebhookDelivery row.
func (s *OutboundWebhookService) deliver(ctx context.Context, wh *models.OutboundWebhook, eventType string, body []byte) {
	delivery := &models.WebhookDelivery{
		ID:        uuid.New(),
		WebhookID: wh.ID,
		EventType: eventType,
		Payload:   body,
		CreatedAt: time.Now(),
	}

	status, responseBody, errMsg := s.attempt(ctx, wh, body)
	delivery.ResponseStatus = status
	delivery.ResponseBody = responseBody
	delivery.ErrorMessage = errMsg
	if delivery.Succeeded() {
		now := time.Now()
		delivery.DeliveredAt = &now
		_ = s.repo.UpdateWebhookLastTriggered(ctx, wh.ID, now)
	} else {
		_ = s.repo.IncrementWebhookFailure(ctx, wh.ID)
	}

	if err := s.repo.CreateWebhookDelivery(ctx, delivery); err != nil {
		slog.Error("Failed to log webhook delivery", "webhook_id", wh.ID, "error", err)
	}
}

// RetryDelivery re-sends a previously logged delivery's stored payload and
// records the new outcome on the same delivery row, incrementing retry_count.
func (s *OutboundWebhookService) RetryDelivery(ctx context.Context, deliveryID, tenantID uuid.UUID) (*models.WebhookDelivery, error) {
	delivery, err := s.repo.GetWebhookDeliveryByID(ctx, deliveryID)
	if err != nil {
		return nil, err
	}
	wh, err := s.repo.GetOutboundWebhookByID(ctx, delivery.WebhookID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("webhook not found")
	}

	status, responseBody, errMsg := s.attempt(ctx, wh, delivery.Payload)
	delivery.ResponseStatus = status
	delivery.ResponseBody = responseBody
	delivery.ErrorMessage = errMsg
	delivery.RetryCount++
	if delivery.Succeeded() {
		now := time.Now()
		delivery.DeliveredAt = &now
		_ = s.repo.UpdateWebhookLastTriggered(ctx, wh.ID, now)
	} else {
		_ = s.repo.IncrementWebhookFailure(ctx, wh.ID)
	}

	if err := s.repo.UpdateWebhookDeliveryResult(ctx, delivery.ID, delivery.ResponseStatus, delivery.ResponseBody, delivery.DeliveredAt, delivery.RetryCount, delivery.ErrorMessage); err != nil {
		return nil, fmt.Errorf("delivery retried but failed to save result: %w", err)
	}
	return delivery, nil
}

// RetryFailedDeliveries is the background worker's entry point: finds
// deliveries that haven't succeeded and haven't exceeded MaxWebhookRetries,
// and retries each one. Returns how many were attempted.
func (s *OutboundWebhookService) RetryFailedDeliveries(ctx context.Context, limit int) int {
	deliveries, err := s.repo.GetFailedDeliveriesForRetry(ctx, MaxWebhookRetries, limit)
	if err != nil {
		slog.Error("Failed to list deliveries needing retry", "error", err)
		return 0
	}

	attempted := 0
	for _, d := range deliveries {
		wh, err := s.repo.GetOutboundWebhookByIDAny(ctx, d.WebhookID)
		if err != nil || !wh.IsActive {
			continue
		}

		status, responseBody, errMsg := s.attempt(ctx, wh, d.Payload)
		d.ResponseStatus = status
		d.ResponseBody = responseBody
		d.ErrorMessage = errMsg
		d.RetryCount++
		if d.Succeeded() {
			now := time.Now()
			d.DeliveredAt = &now
			_ = s.repo.UpdateWebhookLastTriggered(ctx, wh.ID, now)
		} else {
			_ = s.repo.IncrementWebhookFailure(ctx, wh.ID)
		}
		if err := s.repo.UpdateWebhookDeliveryResult(ctx, d.ID, d.ResponseStatus, d.ResponseBody, d.DeliveredAt, d.RetryCount, d.ErrorMessage); err != nil {
			slog.Error("Failed to save retry result", "delivery_id", d.ID, "error", err)
		}
		attempted++
	}
	return attempted
}

// attempt performs a single HTTP POST attempt and returns the outcome,
// without touching storage — shared by the first-send and retry paths.
func (s *OutboundWebhookService) attempt(ctx context.Context, wh *models.OutboundWebhook, body []byte) (status *int, responseBody, errMsg string) {
	// Re-validate on every delivery (S-04): blocks legacy rows that pointed at
	// private IPs and resists DNS rebinding between create and send.
	if err := ValidateOutboundWebhookURL(wh.URL); err != nil {
		return nil, "", fmt.Sprintf("webhook url blocked: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, wh.URL, bytes.NewReader(body))
	if err != nil {
		return nil, "", fmt.Sprintf("failed to build request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "AnvayaLabs-Webhook/1.0")

	if wh.Secret != "" {
		mac := hmac.New(sha256.New, []byte(wh.Secret))
		mac.Write(body)
		sig := hex.EncodeToString(mac.Sum(nil))
		req.Header.Set("X-Webhook-Signature", fmt.Sprintf("sha256=%s", sig))
	}

	resp, err := s.client.Do(req)
	if err != nil {
		slog.Warn("Webhook delivery failed", "url", wh.URL, "error", err)
		return nil, "", err.Error()
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(io.LimitReader(resp.Body, responseBodyTruncateLimit))
	code := resp.StatusCode
	if code < 200 || code >= 300 {
		slog.Warn("Webhook returned non-2xx", "url", wh.URL, "status", code)
	}
	return &code, string(respBytes), ""
}
