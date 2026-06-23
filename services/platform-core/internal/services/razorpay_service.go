package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	razorpay "github.com/razorpay/razorpay-go"
)

// QuotaPackage defines a purchasable quota package
type QuotaPackage struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	QuotaUnits  int    `json:"quota_units"`
	PricePaise  int64  `json:"price_paise"` // Price in paise (100 paise = 1 INR)
	PriceINR    int    `json:"price_inr"`   // Price in INR for display
	Description string `json:"description"`
}

// Available packages
var Packages = map[string]QuotaPackage{
	"starter": {
		ID:          "starter",
		Name:        "Starter License",
		QuotaUnits:  10,
		PricePaise:  499900, // ₹4,999
		PriceINR:    4999,
		Description: "10 Batch Activations",
	},
	"growth": {
		ID:          "growth",
		Name:        "Growth License",
		QuotaUnits:  50,
		PricePaise:  1999900, // ₹19,999
		PriceINR:    19999,
		Description: "50 Batch Activations",
	},
}

// RazorpayService handles payment operations
type RazorpayService struct {
	client    *razorpay.Client
	keyID     string
	keySecret string
}

// NewRazorpayService creates a new Razorpay service
func NewRazorpayService(keyID, keySecret string) *RazorpayService {
	client := razorpay.NewClient(keyID, keySecret)
	return &RazorpayService{
		client:    client,
		keyID:     keyID,
		keySecret: keySecret,
	}
}

// CreateOrderRequest is the input for creating an order
type CreateOrderRequest struct {
	PackageID string `json:"package_id"`
	TenantID  string `json:"tenant_id"`
}

// CreateOrderResponse is returned after order creation
type CreateOrderResponse struct {
	OrderID    string `json:"order_id"`
	KeyID      string `json:"key_id"`
	Amount     int64  `json:"amount"`
	Currency   string `json:"currency"`
	PackageID  string `json:"package_id"`
	QuotaUnits int    `json:"quota_units"`
}

// CreateOrder creates a Razorpay order for a package
func (s *RazorpayService) CreateOrder(packageID, tenantID string) (*CreateOrderResponse, error) {
	pkg, exists := Packages[packageID]
	if !exists {
		return nil, fmt.Errorf("invalid package: %s", packageID)
	}

	orderData := map[string]interface{}{
		"amount":   pkg.PricePaise,
		"currency": "INR",
		"receipt":  fmt.Sprintf("tenant_%s_pkg_%s", tenantID[:8], packageID),
		"notes": map[string]string{
			"tenant_id":  tenantID,
			"package_id": packageID,
		},
	}

	order, err := s.client.Order.Create(orderData, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	orderID, ok := order["id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid order response")
	}

	return &CreateOrderResponse{
		OrderID:    orderID,
		KeyID:      s.keyID,
		Amount:     pkg.PricePaise,
		Currency:   "INR",
		PackageID:  packageID,
		QuotaUnits: pkg.QuotaUnits,
	}, nil
}

// VerifyPaymentRequest contains Razorpay callback data
type VerifyPaymentRequest struct {
	OrderID   string `json:"razorpay_order_id"`
	PaymentID string `json:"razorpay_payment_id"`
	Signature string `json:"razorpay_signature"`
	PackageID string `json:"package_id"`
}

// VerifyPayment verifies the payment signature using HMAC-SHA256
func (s *RazorpayService) VerifyPayment(req *VerifyPaymentRequest) (bool, error) {
	// Generate expected signature: HMAC-SHA256(order_id + "|" + payment_id)
	data := req.OrderID + "|" + req.PaymentID

	h := hmac.New(sha256.New, []byte(s.keySecret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	// Compare signatures
	return hmac.Equal([]byte(expectedSignature), []byte(req.Signature)), nil
}

// GetPackage returns package details by ID
func GetPackage(packageID string) (QuotaPackage, bool) {
	pkg, exists := Packages[packageID]
	return pkg, exists
}

// GetAllPackages returns all available packages
func GetAllPackages() []QuotaPackage {
	return []QuotaPackage{
		Packages["starter"],
		Packages["growth"],
	}
}
