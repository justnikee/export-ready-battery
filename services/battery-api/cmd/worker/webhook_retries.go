package main

import (
	"context"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"
)

const (
	// WebhookRetryInterval is how often the worker sweeps for failed
	// deliveries to retry. Flat interval, not exponential backoff — each
	// delivery still only retries up to services.MaxWebhookRetries times,
	// which is enough to ride out a brief outage on the receiving end
	// without building a full backoff scheduler for this first pass.
	WebhookRetryInterval = 5 * time.Minute

	// webhookRetryBatchSize caps how many deliveries one sweep retries.
	webhookRetryBatchSize = 50
)

// WebhookRetryWorker periodically retries failed outbound webhook deliveries.
type WebhookRetryWorker struct {
	svc    *services.OutboundWebhookService
	logger *slog.Logger
}

// NewWebhookRetryWorker constructs a WebhookRetryWorker.
func NewWebhookRetryWorker(svc *services.OutboundWebhookService, logger *slog.Logger) *WebhookRetryWorker {
	return &WebhookRetryWorker{svc: svc, logger: logger}
}

// RunOnce retries one batch of failed deliveries. Safe to call concurrently
// from a ticker and on startup.
func (w *WebhookRetryWorker) RunOnce(ctx context.Context) {
	attempted := w.svc.RetryFailedDeliveries(ctx, webhookRetryBatchSize)
	if attempted > 0 {
		w.logger.Info("webhook retry sweep finished", "attempted", attempted)
	}
}
