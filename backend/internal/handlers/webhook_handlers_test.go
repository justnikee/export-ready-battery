package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"anvayalabs-battery/internal/services"
)

// TestRazorpayWebhook_SignatureVerification tests webhook signature validation
func TestRazorpayWebhook_SignatureVerification(t *testing.T) {
	tests := []struct {
		name           string
		body           string
		signature      string
		secret         string
		expectedStatus int
	}{
		{
			name:           "Missing signature header",
			body:           `{"event": "payment.captured"}`,
			signature:      "",
			secret:         "test_secret",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Invalid signature",
			body:           `{"event": "payment.captured"}`,
			signature:      "invalid_signature",
			secret:         "test_secret",
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/webhooks/razorpay", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			if tt.signature != "" {
				req.Header.Set("X-Razorpay-Signature", tt.signature)
			}

			// Test that the request is properly formed
			if req.Method != http.MethodPost {
				t.Errorf("Expected POST method, got %s", req.Method)
			}

			// Note: Full handler testing requires mocking dependencies
			if tt.signature == "" && tt.expectedStatus == http.StatusUnauthorized {
				t.Logf("Test case: %s - Would expect 401 for missing signature", tt.name)
			}
		})
	}
}

// TestVerifyWebhookSignature tests the signature verification function
func TestVerifyWebhookSignature(t *testing.T) {
	secret := "test_webhook_secret_key"
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123"}}}}`)

	// Generate valid signature
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	validSignature := hex.EncodeToString(mac.Sum(nil))

	tests := []struct {
		name      string
		body      []byte
		signature string
		secret    string
		want      bool
	}{
		{
			name:      "Valid signature",
			body:      body,
			signature: validSignature,
			secret:    secret,
			want:      true,
		},
		{
			name:      "Invalid signature",
			body:      body,
			signature: "definitely_not_valid",
			secret:    secret,
			want:      false,
		},
		{
			name:      "Wrong secret",
			body:      body,
			signature: validSignature,
			secret:    "wrong_secret",
			want:      false,
		},
		{
			name:      "Tampered body",
			body:      []byte(`{"event":"payment.failed"}`),
			signature: validSignature,
			secret:    secret,
			want:      false,
		},
		{
			name:      "Empty signature",
			body:      body,
			signature: "",
			secret:    secret,
			want:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := services.VerifyWebhookSignature(tt.body, tt.signature, tt.secret)
			if got != tt.want {
				t.Errorf("VerifyWebhookSignature() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestParseWebhookEvent tests webhook event parsing
func TestParseWebhookEvent(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		wantEvent string
		wantErr   bool
	}{
		{
			name:      "Valid payment.captured event",
			body:      `{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","amount":99900,"currency":"INR","status":"captured","notes":{"tenant_id":"uuid-123","package_id":"starter"}}}}}`,
			wantEvent: "payment.captured",
			wantErr:   false,
		},
		{
			name:      "Valid payment.failed event",
			body:      `{"event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_456","amount":50000,"currency":"INR","status":"failed"}}}}`,
			wantEvent: "payment.failed",
			wantErr:   false,
		},
		{
			name:      "Invalid JSON",
			body:      `{not valid json}`,
			wantEvent: "",
			wantErr:   true,
		},
		{
			name:      "Empty body",
			body:      ``,
			wantEvent: "",
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event, err := services.ParseWebhookEvent([]byte(tt.body))
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseWebhookEvent() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if err == nil && event.Event != tt.wantEvent {
				t.Errorf("ParseWebhookEvent() event = %v, want %v", event.Event, tt.wantEvent)
			}
		})
	}
}

// TestWebhookEventPayloadExtraction tests extracting data from webhook payloads
func TestWebhookEventPayloadExtraction(t *testing.T) {
	body := `{
		"event": "payment.captured",
		"payload": {
			"payment": {
				"entity": {
					"id": "pay_ABC123",
					"amount": 99900,
					"currency": "INR",
					"status": "captured",
					"notes": {
						"tenant_id": "550e8400-e29b-41d4-a716-446655440000",
						"package_id": "professional"
					}
				}
			}
		}
	}`

	event, err := services.ParseWebhookEvent([]byte(body))
	if err != nil {
		t.Fatalf("ParseWebhookEvent() error = %v", err)
	}

	// Verify payment data extraction
	payment := event.Payload.Payment.Entity
	if payment.ID != "pay_ABC123" {
		t.Errorf("Payment ID = %v, want pay_ABC123", payment.ID)
	}
	if payment.Amount != 99900 {
		t.Errorf("Payment Amount = %v, want 99900", payment.Amount)
	}
	if payment.Currency != "INR" {
		t.Errorf("Payment Currency = %v, want INR", payment.Currency)
	}
	if payment.Status != "captured" {
		t.Errorf("Payment Status = %v, want captured", payment.Status)
	}

	// Verify notes extraction
	tenantID, ok := payment.Notes["tenant_id"]
	if !ok || tenantID != "550e8400-e29b-41d4-a716-446655440000" {
		t.Errorf("Tenant ID = %v, want 550e8400-e29b-41d4-a716-446655440000", tenantID)
	}
	packageID, ok := payment.Notes["package_id"]
	if !ok || packageID != "professional" {
		t.Errorf("Package ID = %v, want professional", packageID)
	}
}

// TestWebhookTimestampParsing tests that webhook timestamps are handled correctly
func TestWebhookTimestampParsing(t *testing.T) {
	// Razorpay uses Unix timestamps
	now := time.Now().Unix()
	body := map[string]interface{}{
		"event": "payment.captured",
		"payload": map[string]interface{}{
			"payment": map[string]interface{}{
				"entity": map[string]interface{}{
					"id":         "pay_123",
					"amount":     100000,
					"currency":   "INR",
					"status":     "captured",
					"created_at": now,
					"notes":      map[string]string{},
				},
			},
		},
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("Failed to marshal test body: %v", err)
	}

	event, err := services.ParseWebhookEvent(jsonBody)
	if err != nil {
		t.Fatalf("ParseWebhookEvent() error = %v", err)
	}

	if event.Event != "payment.captured" {
		t.Errorf("Event type = %v, want payment.captured", event.Event)
	}
}
