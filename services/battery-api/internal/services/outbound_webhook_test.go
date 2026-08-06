package services

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

var errNotFound = errors.New("not found")

// fakeWebhookRepo is an in-memory OutboundWebhookRepository for service-level tests.
type fakeWebhookRepo struct {
	mu         sync.Mutex
	webhooks   map[uuid.UUID]*models.OutboundWebhook
	deliveries map[uuid.UUID]*models.WebhookDelivery
}

func newFakeWebhookRepo() *fakeWebhookRepo {
	return &fakeWebhookRepo{
		webhooks:   make(map[uuid.UUID]*models.OutboundWebhook),
		deliveries: make(map[uuid.UUID]*models.WebhookDelivery),
	}
}

func (f *fakeWebhookRepo) CreateOutboundWebhook(ctx context.Context, wh *models.OutboundWebhook) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.webhooks[wh.ID] = wh
	return nil
}

func (f *fakeWebhookRepo) ListOutboundWebhooks(ctx context.Context, tenantID uuid.UUID) ([]*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*models.OutboundWebhook
	for _, wh := range f.webhooks {
		if wh.TenantID == tenantID {
			out = append(out, wh)
		}
	}
	return out, nil
}

func (f *fakeWebhookRepo) DeleteOutboundWebhook(ctx context.Context, id, tenantID uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	wh, ok := f.webhooks[id]
	if !ok || wh.TenantID != tenantID {
		return errNotFound
	}
	delete(f.webhooks, id)
	return nil
}

func (f *fakeWebhookRepo) GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*models.OutboundWebhook
	for _, wh := range f.webhooks {
		if wh.TenantID != tenantID || !wh.IsActive {
			continue
		}
		for _, et := range wh.EventTypes {
			if et == eventType || et == "*" {
				out = append(out, wh)
				break
			}
		}
	}
	return out, nil
}

func (f *fakeWebhookRepo) GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	wh, ok := f.webhooks[id]
	if !ok || wh.TenantID != tenantID {
		return nil, errNotFound
	}
	return wh, nil
}

func (f *fakeWebhookRepo) GetOutboundWebhookByIDAny(ctx context.Context, id uuid.UUID) (*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	wh, ok := f.webhooks[id]
	if !ok {
		return nil, errNotFound
	}
	return wh, nil
}

func (f *fakeWebhookRepo) IncrementWebhookFailure(ctx context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if wh, ok := f.webhooks[id]; ok {
		wh.FailureCount++
	}
	return nil
}

func (f *fakeWebhookRepo) UpdateWebhookLastTriggered(ctx context.Context, id uuid.UUID, at time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if wh, ok := f.webhooks[id]; ok {
		wh.LastTriggeredAt = &at
	}
	return nil
}

func (f *fakeWebhookRepo) CreateWebhookDelivery(ctx context.Context, d *models.WebhookDelivery) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.deliveries[d.ID] = d
	return nil
}

func (f *fakeWebhookRepo) UpdateWebhookDeliveryResult(ctx context.Context, id uuid.UUID, responseStatus *int, responseBody string, deliveredAt *time.Time, retryCount int, errorMessage string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	d, ok := f.deliveries[id]
	if !ok {
		return errNotFound
	}
	d.ResponseStatus = responseStatus
	d.ResponseBody = responseBody
	d.DeliveredAt = deliveredAt
	d.RetryCount = retryCount
	d.ErrorMessage = errorMessage
	return nil
}

func (f *fakeWebhookRepo) GetWebhookDeliveriesByWebhook(ctx context.Context, webhookID uuid.UUID, limit int) ([]*models.WebhookDelivery, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*models.WebhookDelivery
	for _, d := range f.deliveries {
		if d.WebhookID == webhookID {
			out = append(out, d)
		}
	}
	return out, nil
}

func (f *fakeWebhookRepo) GetWebhookDeliveryByID(ctx context.Context, id uuid.UUID) (*models.WebhookDelivery, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	d, ok := f.deliveries[id]
	if !ok {
		return nil, errNotFound
	}
	return d, nil
}

func (f *fakeWebhookRepo) GetFailedDeliveriesForRetry(ctx context.Context, maxRetries, limit int) ([]*models.WebhookDelivery, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*models.WebhookDelivery
	for _, d := range f.deliveries {
		if !d.Succeeded() && d.RetryCount < maxRetries {
			out = append(out, d)
		}
	}
	return out, nil
}

func waitForCondition(t *testing.T, timeout time.Duration, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("condition not met within timeout")
}

func TestOutboundWebhookService_CreateListDelete(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: "https://example.com/hook", Secret: "s3cret", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	if err := svc.Create(ctx, wh); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	list, err := svc.List(ctx, tenantID)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(list) != 1 || list[0].ID != wh.ID {
		t.Fatalf("expected 1 webhook for tenant, got %+v", list)
	}

	if err := svc.Delete(ctx, wh.ID, tenantID); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	list, _ = svc.List(ctx, tenantID)
	if len(list) != 0 {
		t.Fatalf("expected 0 webhooks after delete, got %d", len(list))
	}
}

func TestOutboundWebhookService_Dispatch_LogsSuccessfulDelivery(t *testing.T) {
	skipSSRFValidateForTest = true
	t.Cleanup(func() { skipSSRFValidateForTest = false })

	var received []byte
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()
	passportID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: server.URL, Secret: "s3cret", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	if err := svc.Create(ctx, wh); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	svc.Dispatch(ctx, tenantID, "lifecycle.RECALL", passportID, map[string]interface{}{"status": "RECALLED"})

	waitForCondition(t, 2*time.Second, func() bool {
		deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
		return len(deliveries) == 1
	})

	deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
	if len(deliveries) != 1 {
		t.Fatalf("expected 1 delivery logged, got %d", len(deliveries))
	}
	d := deliveries[0]
	if !d.Succeeded() {
		t.Fatalf("expected delivery to have succeeded, got status %v", d.ResponseStatus)
	}
	if d.DeliveredAt == nil {
		t.Fatal("expected DeliveredAt to be set on success")
	}
	if len(received) == 0 {
		t.Fatal("expected the test server to receive a payload")
	}
}

func TestOutboundWebhookService_Dispatch_LogsFailedDelivery(t *testing.T) {
	skipSSRFValidateForTest = true
	t.Cleanup(func() { skipSSRFValidateForTest = false })

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: server.URL, EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	_ = svc.Create(ctx, wh)

	svc.Dispatch(ctx, tenantID, "lifecycle.RECALL", uuid.New(), map[string]interface{}{})

	waitForCondition(t, 2*time.Second, func() bool {
		deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
		return len(deliveries) == 1
	})

	deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
	d := deliveries[0]
	if d.Succeeded() {
		t.Fatal("expected delivery to have failed")
	}
	if d.ResponseStatus == nil || *d.ResponseStatus != 500 {
		t.Fatalf("expected status 500, got %v", d.ResponseStatus)
	}

	updated, _ := repo.GetOutboundWebhookByIDAny(ctx, wh.ID)
	if updated.FailureCount != 1 {
		t.Fatalf("expected failure_count incremented to 1, got %d", updated.FailureCount)
	}
}

func TestOutboundWebhookService_RetryDelivery_SucceedsAfterFailure(t *testing.T) {
	skipSSRFValidateForTest = true
	t.Cleanup(func() { skipSSRFValidateForTest = false })

	callCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		if callCount == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: server.URL, EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	_ = svc.Create(ctx, wh)

	svc.Dispatch(ctx, tenantID, "lifecycle.RECALL", uuid.New(), map[string]interface{}{})
	waitForCondition(t, 2*time.Second, func() bool {
		deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
		return len(deliveries) == 1
	})

	deliveries, _ := repo.GetWebhookDeliveriesByWebhook(ctx, wh.ID, 10)
	deliveryID := deliveries[0].ID

	retried, err := svc.RetryDelivery(ctx, deliveryID, tenantID)
	if err != nil {
		t.Fatalf("RetryDelivery failed: %v", err)
	}
	if !retried.Succeeded() {
		t.Fatalf("expected retry to succeed, got status %v", retried.ResponseStatus)
	}
	if retried.RetryCount != 1 {
		t.Fatalf("expected retry_count 1, got %d", retried.RetryCount)
	}
}

func TestOutboundWebhookService_RetryDelivery_WrongTenantRejected(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()
	otherTenantID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: "https://example.com", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	_ = svc.Create(ctx, wh)
	delivery := &models.WebhookDelivery{ID: uuid.New(), WebhookID: wh.ID, EventType: "lifecycle.RECALL", Payload: []byte("{}"), CreatedAt: time.Now()}
	_ = repo.CreateWebhookDelivery(ctx, delivery)

	if _, err := svc.RetryDelivery(ctx, delivery.ID, otherTenantID); err == nil {
		t.Fatal("expected error retrying another tenant's delivery")
	}
}

func TestOutboundWebhookService_RetryFailedDeliveries_RespectsMaxRetries(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	repo := newFakeWebhookRepo()
	svc := NewOutboundWebhookService(repo)
	ctx := context.Background()
	tenantID := uuid.New()

	wh := &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: server.URL, EventTypes: []string{"lifecycle.RECALL"}, IsActive: true}
	_ = svc.Create(ctx, wh)

	status := 500
	delivery := &models.WebhookDelivery{ID: uuid.New(), WebhookID: wh.ID, EventType: "lifecycle.RECALL", Payload: []byte("{}"), ResponseStatus: &status, RetryCount: MaxWebhookRetries, CreatedAt: time.Now()}
	_ = repo.CreateWebhookDelivery(ctx, delivery)

	attempted := svc.RetryFailedDeliveries(ctx, 50)
	if attempted != 0 {
		t.Fatalf("expected 0 retries for a delivery already at MaxWebhookRetries, got %d", attempted)
	}
}
