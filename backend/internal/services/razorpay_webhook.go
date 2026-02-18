package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
)

// VerifyWebhookSignature is a standalone function for testing signature verification
// The signature is computed as HMAC-SHA256 of the raw body using the webhook secret
func VerifyWebhookSignature(body []byte, signature string, secret string) bool {
	if signature == "" || secret == "" {
		return false
	}
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

// WebhookEvent represents the structure of a Razorpay webhook event
type WebhookEvent struct {
	Entity    string         `json:"entity"`
	AccountID string         `json:"account_id"`
	Event     string         `json:"event"`
	Contains  []string       `json:"contains"`
	Payload   WebhookPayload `json:"payload"`
	CreatedAt int64          `json:"created_at"`
}

// WebhookPayload contains the payment details
type WebhookPayload struct {
	Payment struct {
		Entity PaymentEntity `json:"entity"`
	} `json:"payment"`
	Order struct {
		Entity OrderEntity `json:"entity"`
	} `json:"order"`
}

// PaymentEntity represents a Razorpay payment
type PaymentEntity struct {
	ID          string                 `json:"id"`
	Entity      string                 `json:"entity"`
	Amount      int64                  `json:"amount"`
	Currency    string                 `json:"currency"`
	Status      string                 `json:"status"`
	OrderID     string                 `json:"order_id"`
	Description string                 `json:"description"`
	Email       string                 `json:"email"`
	Contact     string                 `json:"contact"`
	Notes       map[string]interface{} `json:"notes"`
	CreatedAt   int64                  `json:"created_at"`
	ErrorCode   string                 `json:"error_code,omitempty"`
	ErrorReason string                 `json:"error_reason,omitempty"`
}

// OrderEntity represents a Razorpay order
type OrderEntity struct {
	ID         string                 `json:"id"`
	Entity     string                 `json:"entity"`
	Amount     int64                  `json:"amount"`
	AmountPaid int64                  `json:"amount_paid"`
	AmountDue  int64                  `json:"amount_due"`
	Currency   string                 `json:"currency"`
	Receipt    string                 `json:"receipt"`
	Status     string                 `json:"status"`
	Notes      map[string]interface{} `json:"notes"`
	CreatedAt  int64                  `json:"created_at"`
}

// VerifyWebhookSignature verifies the webhook signature from Razorpay
// The signature is computed as HMAC-SHA256 of the raw body using the webhook secret
func (s *RazorpayService) VerifyWebhookSignature(body []byte, signature string) bool {
	h := hmac.New(sha256.New, []byte(s.keySecret))
	h.Write(body)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

// ParseWebhookEvent parses the raw webhook body into a WebhookEvent struct
func ParseWebhookEvent(body []byte) (*WebhookEvent, error) {
	var event WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return nil, err
	}
	return &event, nil
}

// GetPaymentNotes extracts notes from the payment or order
func (e *WebhookEvent) GetPaymentNotes() map[string]interface{} {
	// Try to get notes from payment first
	if len(e.Payload.Payment.Entity.Notes) > 0 {
		return e.Payload.Payment.Entity.Notes
	}
	// Fall back to order notes
	if e.Payload.Order.Entity.Notes != nil {
		return e.Payload.Order.Entity.Notes
	}
	return nil
}

// GetTenantID extracts the tenant_id from notes
func (e *WebhookEvent) GetTenantID() string {
	notes := e.GetPaymentNotes()
	if notes == nil {
		return ""
	}
	if tenantID, ok := notes["tenant_id"].(string); ok {
		return tenantID
	}
	return ""
}

// GetPackageID extracts the package_id from notes
func (e *WebhookEvent) GetPackageID() string {
	notes := e.GetPaymentNotes()
	if notes == nil {
		return ""
	}
	if packageID, ok := notes["package_id"].(string); ok {
		return packageID
	}
	return ""
}

// IsPaymentCaptured checks if the event is a successful payment capture
func (e *WebhookEvent) IsPaymentCaptured() bool {
	return e.Event == "payment.captured"
}

// IsPaymentFailed checks if the event is a failed payment
func (e *WebhookEvent) IsPaymentFailed() bool {
	return strings.HasPrefix(e.Event, "payment.failed")
}

// GetPaymentID returns the payment ID
func (e *WebhookEvent) GetPaymentID() string {
	return e.Payload.Payment.Entity.ID
}

// GetOrderID returns the order ID
func (e *WebhookEvent) GetOrderID() string {
	if e.Payload.Payment.Entity.OrderID != "" {
		return e.Payload.Payment.Entity.OrderID
	}
	return e.Payload.Order.Entity.ID
}

// GetAmount returns the payment amount in paise
func (e *WebhookEvent) GetAmount() int64 {
	return e.Payload.Payment.Entity.Amount
}
