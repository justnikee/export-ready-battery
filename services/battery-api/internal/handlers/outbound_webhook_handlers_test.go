package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
)

var errWebhookNotFound = errors.New("not found")

// fakeWebhookRepo is an in-memory services.OutboundWebhookRepository for handler tests.
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
		return errWebhookNotFound
	}
	delete(f.webhooks, id)
	return nil
}

func (f *fakeWebhookRepo) GetWebhooksByEvent(ctx context.Context, tenantID uuid.UUID, eventType string) ([]*models.OutboundWebhook, error) {
	return nil, nil
}

func (f *fakeWebhookRepo) GetOutboundWebhookByID(ctx context.Context, id, tenantID uuid.UUID) (*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	wh, ok := f.webhooks[id]
	if !ok || wh.TenantID != tenantID {
		return nil, errWebhookNotFound
	}
	return wh, nil
}

func (f *fakeWebhookRepo) GetOutboundWebhookByIDAny(ctx context.Context, id uuid.UUID) (*models.OutboundWebhook, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	wh, ok := f.webhooks[id]
	if !ok {
		return nil, errWebhookNotFound
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
		return errWebhookNotFound
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
		return nil, errWebhookNotFound
	}
	return d, nil
}

func (f *fakeWebhookRepo) GetFailedDeliveriesForRetry(ctx context.Context, maxRetries, limit int) ([]*models.WebhookDelivery, error) {
	return nil, nil
}

// TestCreateOutboundWebhook_PersistsAndReturnsSecret guards against the
// regression where the handler built a webhook struct and returned it
// without ever calling through to the repository — webhooks looked
// created but were never actually saved, so they could never fire.
func TestCreateOutboundWebhook_PersistsAndReturnsSecret(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := services.NewOutboundWebhookService(repo)
	handler := NewOutboundWebhookHandler(svc)
	tenantID := uuid.New()

	body, _ := json.Marshal(models.CreateOutboundWebhookRequest{
		URL:        "https://example.com/hook",
		EventTypes: []string{"lifecycle.RECALL"},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/outbound-webhooks", bytes.NewReader(body))
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateOutboundWebhook(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Webhook struct {
			ID     string `json:"id"`
			Secret string `json:"secret"`
		} `json:"webhook"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Webhook.Secret == "" {
		t.Fatal("expected the create response to expose the signing secret once")
	}

	// The actual regression check: was it persisted?
	list, err := svc.List(req.Context(), tenantID)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected webhook to be persisted, found %d webhooks", len(list))
	}
	if list[0].ID.String() != resp.Webhook.ID {
		t.Fatalf("persisted webhook ID %s doesn't match response ID %s", list[0].ID, resp.Webhook.ID)
	}
}

func TestCreateOutboundWebhook_RejectsInvalidURL(t *testing.T) {
	repo := newFakeWebhookRepo()
	handler := NewOutboundWebhookHandler(services.NewOutboundWebhookService(repo))
	tenantID := uuid.New()

	body, _ := json.Marshal(models.CreateOutboundWebhookRequest{URL: "not-a-url", EventTypes: []string{"lifecycle.RECALL"}})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/outbound-webhooks", bytes.NewReader(body))
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateOutboundWebhook(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid URL, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListOutboundWebhooks_ReturnsCreatedWebhooks(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := services.NewOutboundWebhookService(repo)
	handler := NewOutboundWebhookHandler(svc)
	tenantID := uuid.New()

	_ = svc.Create(context.Background(), &models.OutboundWebhook{ID: uuid.New(), TenantID: tenantID, URL: "https://example.com/a", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/outbound-webhooks", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListOutboundWebhooks(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp struct {
		Webhooks []models.OutboundWebhook `json:"webhooks"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(resp.Webhooks) != 1 {
		t.Fatalf("expected 1 webhook in list, got %d (regression: list used to always return empty)", len(resp.Webhooks))
	}
}

func TestDeleteOutboundWebhook_ActuallyDeletes(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := services.NewOutboundWebhookService(repo)
	handler := NewOutboundWebhookHandler(svc)
	tenantID := uuid.New()
	whID := uuid.New()

	_ = svc.Create(context.Background(), &models.OutboundWebhook{ID: whID, TenantID: tenantID, URL: "https://example.com/a", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true})

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/outbound-webhooks/"+whID.String(), nil)
	req.SetPathValue("id", whID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.DeleteOutboundWebhook(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	list, _ := svc.List(req.Context(), tenantID)
	if len(list) != 0 {
		t.Fatalf("expected webhook to be deleted, still found %d", len(list))
	}
}

func TestGetWebhookDeliveries_RejectsOtherTenant(t *testing.T) {
	repo := newFakeWebhookRepo()
	svc := services.NewOutboundWebhookService(repo)
	handler := NewOutboundWebhookHandler(svc)
	tenantID := uuid.New()
	otherTenantID := uuid.New()
	whID := uuid.New()

	_ = svc.Create(context.Background(), &models.OutboundWebhook{ID: whID, TenantID: tenantID, URL: "https://example.com/a", EventTypes: []string{"lifecycle.RECALL"}, IsActive: true})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/webhooks/"+whID.String()+"/deliveries", nil)
	req.SetPathValue("id", whID.String())
	req = setAuthContext(req, otherTenantID, "intruder@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetWebhookDeliveries(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 fetching another tenant's webhook deliveries, got %d", rr.Code)
	}
}

func TestRetryWebhookDelivery_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	repo := newFakeWebhookRepo()
	svc := services.NewOutboundWebhookService(repo)
	handler := NewOutboundWebhookHandler(svc)
	tenantID := uuid.New()
	whID := uuid.New()

	_ = svc.Create(context.Background(), &models.OutboundWebhook{ID: whID, TenantID: tenantID, URL: server.URL, EventTypes: []string{"lifecycle.RECALL"}, IsActive: true})
	delivery := &models.WebhookDelivery{ID: uuid.New(), WebhookID: whID, EventType: "lifecycle.RECALL", Payload: []byte("{}")}
	_ = repo.CreateWebhookDelivery(context.Background(), delivery)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/webhooks/deliveries/"+delivery.ID.String()+"/retry", nil)
	req.SetPathValue("id", delivery.ID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.RetryWebhookDelivery(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}
