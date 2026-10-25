package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/logger"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func TestRazorpayWebhookUsesProviderOrderForGrant(t *testing.T) {
	logger.Init()
	id := uuid.New()
	orderID, paymentID := "order_test123", "pay_test456"
	service := capturedPaymentService(t, id, "addon-passports-500-starter", orderID, paymentID)
	repo := new(repository.MockRepository)
	repo.On("ApplyPaymentGrant", mock.Anything, mock.MatchedBy(func(g repository.PaymentGrant) bool {
		return g.TenantID == id && g.PaymentID == paymentID && g.QuotaUnits == 500 && g.PlanType == ""
	})).Return(repository.PaymentGrantResult{Applied: true, QuotaBalance: 520}, nil).Once()
	// Webhook notes deliberately lie. The provider order above is authoritative.
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test456","order_id":"order_test123","notes":{"tenant_id":"other","package_id":"growth-annual"}}}}}`)
	mac := hmac.New(sha256.New, []byte("test_key_secret"))
	mac.Write(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/webhooks/razorpay", bytes.NewReader(body))
	req.Header.Set("X-Razorpay-Signature", hex.EncodeToString(mac.Sum(nil)))
	rr := httptest.NewRecorder()
	NewWebhookHandler(service, repo).RazorpayWebhook(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	repo.AssertExpectations(t)
}
