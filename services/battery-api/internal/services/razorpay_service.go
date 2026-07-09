package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	razorpay "github.com/razorpay/razorpay-go"
)

// PackageKind distinguishes what a purchase actually does. Tier packages
// change the tenant's plan (feature access) and stamp an expiry (see
// BillingCycleDays); add-ons are pure top-ups that never touch
// plan_type/subscription_expires_at.
type PackageKind string

const (
	PackageKindTier       PackageKind = "tier"        // Starter/Growth (monthly or annual) — sets plan_type + expiry
	PackageKindQuotaAddOn PackageKind = "quota_addon" // extra passport credits only
	PackageKindSeatAddOn  PackageKind = "seat_addon"  // +1 permanent bonus team seat
)

// QuotaPackage defines a purchasable package. QuotaUnits are passport
// activation slots — ActivateBatch debits one unit per passport in the batch
// (see billing_handlers.go), not one unit per batch regardless of size.
//
// Annual tier packages are NOT real recurring billing (no Razorpay
// Subscriptions/autopay exists — see PRICING_AND_PACKAGING_STRATEGY.md R2).
// "Annual" here means: pay the discounted annual total once, receive the
// full year's quota (12x the monthly allowance) upfront, and a 365-day
// plan-tier window instead of 30. The tenant must manually repurchase at
// renewal; nothing auto-charges.
type QuotaPackage struct {
	ID   string      `json:"id"`
	Name string      `json:"name"`
	Kind PackageKind `json:"kind"`
	// RequiredPlan, if set, is the plan the tenant must currently be on to buy
	// this SKU (e.g. the cheaper Growth-rate add-ons aren't available to a
	// Starter tenant). Empty means any plan may purchase it.
	RequiredPlan string `json:"required_plan,omitempty"`
	// PlanType is the plan this purchase grants (Kind=Tier only) — set
	// explicitly rather than derived from ID, since annual SKUs have IDs like
	// "starter-annual" that would otherwise corrupt plan_type if uppercased.
	PlanType string `json:"plan_type,omitempty"`
	// BillingCycleDays is how long the plan-tier window lasts after purchase
	// (Kind=Tier only): 30 for monthly, 365 for annual. Defaults to 30 if unset.
	BillingCycleDays int   `json:"billing_cycle_days,omitempty"`
	QuotaUnits       int   `json:"quota_units,omitempty"` // for Tier / QuotaAddOn
	SeatBonus        int   `json:"seat_bonus,omitempty"`  // for SeatAddOn
	PricePaise       int64 `json:"price_paise"`           // Price in paise (100 paise = 1 INR)
	PriceINR         int   `json:"price_inr"`             // Price in INR for display
	// MonthlyEquivalentINR is the "/mo" rate shown for comparison on annual
	// SKUs (e.g. ₹11,999/mo for a ₹1,43,988/year Starter-annual purchase).
	// Unset for monthly SKUs and add-ons.
	MonthlyEquivalentINR int    `json:"monthly_equivalent_inr,omitempty"`
	Description          string `json:"description"`
}

// Available packages. Base tiers (see PRICING_AND_PACKAGING_STRATEGY.md §3);
// add-ons mirror the "Overage & Add-On Packs" table in that doc (§4) — these
// existed only on paper until 2026-07-05.
var Packages = map[string]QuotaPackage{
	"starter": {
		ID:               "starter",
		Name:             "Starter License (Monthly)",
		Kind:             PackageKindTier,
		PlanType:         PlanStarter,
		BillingCycleDays: 30,
		QuotaUnits:       500,
		PricePaise:       1499900, // ₹14,999
		PriceINR:         14999,
		Description:      "500 Passport Activations",
	},
	"starter-annual": {
		ID:                   "starter-annual",
		Name:                 "Starter License (Annual)",
		Kind:                 PackageKindTier,
		PlanType:             PlanStarter,
		BillingCycleDays:     365,
		QuotaUnits:           6000,     // 500/mo x 12
		PricePaise:           14398800, // ₹1,43,988 (= ₹11,999/mo)
		PriceINR:             143988,
		MonthlyEquivalentINR: 11999,
		Description:          "6,000 Passport Activations (500/mo, billed annually)",
	},
	"growth": {
		ID:               "growth",
		Name:             "Growth License (Monthly)",
		Kind:             PackageKindTier,
		PlanType:         PlanGrowth,
		BillingCycleDays: 30,
		QuotaUnits:       5000,
		PricePaise:       4499900, // ₹44,999
		PriceINR:         44999,
		Description:      "5,000 Passport Activations",
	},
	"growth-annual": {
		ID:                   "growth-annual",
		Name:                 "Growth License (Annual)",
		Kind:                 PackageKindTier,
		PlanType:             PlanGrowth,
		BillingCycleDays:     365,
		QuotaUnits:           60000,    // 5,000/mo x 12
		PricePaise:           43198800, // ₹4,31,988 (= ₹35,999/mo)
		PriceINR:             431988,
		MonthlyEquivalentINR: 35999,
		Description:          "60,000 Passport Activations (5,000/mo, billed annually)",
	},
	"addon-passports-500-starter": {
		ID:           "addon-passports-500-starter",
		Name:         "Extra 500 Passports",
		Kind:         PackageKindQuotaAddOn,
		RequiredPlan: PlanStarter,
		QuotaUnits:   500,
		PricePaise:   600000, // ₹6,000 (₹12/passport)
		PriceINR:     6000,
		Description:  "500 additional passport activations",
	},
	"addon-passports-500-growth": {
		ID:           "addon-passports-500-growth",
		Name:         "Extra 500 Passports",
		Kind:         PackageKindQuotaAddOn,
		RequiredPlan: PlanGrowth,
		QuotaUnits:   500,
		PricePaise:   400000, // ₹4,000 (₹8/passport)
		PriceINR:     4000,
		Description:  "500 additional passport activations",
	},
	"addon-passports-5000-growth": {
		ID:           "addon-passports-5000-growth",
		Name:         "Extra 5,000 Passports",
		Kind:         PackageKindQuotaAddOn,
		RequiredPlan: PlanGrowth,
		QuotaUnits:   5000,
		PricePaise:   3500000, // ₹35,000 (₹7/passport)
		PriceINR:     35000,
		Description:  "5,000 additional passport activations",
	},
	"addon-seat-starter": {
		ID:           "addon-seat-starter",
		Name:         "Extra Team Seat",
		Kind:         PackageKindSeatAddOn,
		RequiredPlan: PlanStarter,
		SeatBonus:    1,
		PricePaise:   250000, // ₹2,500
		PriceINR:     2500,
		Description:  "+1 team seat beyond your plan's included seats",
	},
	"addon-seat-growth": {
		ID:           "addon-seat-growth",
		Name:         "Extra Team Seat",
		Kind:         PackageKindSeatAddOn,
		RequiredPlan: PlanGrowth,
		SeatBonus:    1,
		PricePaise:   200000, // ₹2,000
		PriceINR:     2000,
		Description:  "+1 team seat beyond your plan's included seats",
	},
}

// AddOnPackageIDs lists purchasable add-ons (excludes base tiers) for a given
// plan, in display order. Used by GetPackages to show only what's actually
// buyable for the tenant's current plan.
func AddOnPackageIDsForPlan(plan string) []string {
	var ids []string
	for _, id := range []string{
		"addon-passports-500-starter", "addon-passports-500-growth",
		"addon-passports-5000-growth",
		"addon-seat-starter", "addon-seat-growth",
	} {
		if pkg, ok := Packages[id]; ok && (pkg.RequiredPlan == "" || pkg.RequiredPlan == NormalizePlan(plan)) {
			ids = append(ids, id)
		}
	}
	return ids
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

// ErrPlanMismatch is returned when a tenant tries to buy an add-on priced for
// a different plan than the one they're currently on (e.g. a Starter tenant
// requesting the Growth-rate add-on).
var ErrPlanMismatch = fmt.Errorf("package not available for your current plan")

// CreateOrder creates a Razorpay order for a package. tenantPlan is the
// tenant's current plan_type, used to enforce a package's RequiredPlan (e.g.
// the cheaper Growth-rate add-ons aren't purchasable by a Starter tenant).
func (s *RazorpayService) CreateOrder(packageID, tenantID, tenantPlan string) (*CreateOrderResponse, error) {
	pkg, exists := Packages[packageID]
	if !exists {
		return nil, fmt.Errorf("invalid package: %s", packageID)
	}
	if pkg.RequiredPlan != "" && pkg.RequiredPlan != NormalizePlan(tenantPlan) {
		return nil, ErrPlanMismatch
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
