package services

import "testing"

func TestValidateCapturedPurchaseRejectsMismatches(t *testing.T) {
	order := map[string]interface{}{"id": "order_123", "amount": float64(600000), "currency": "INR", "notes": map[string]interface{}{"tenant_id": "tenant-1", "package_id": "addon-passports-500-starter"}}
	payment := map[string]interface{}{"id": "pay_123", "order_id": "order_123", "status": "captured", "amount": float64(600000), "currency": "INR"}
	if _, err := validateCapturedPurchase("order_123", "pay_123", order, payment); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name   string
		target map[string]interface{}
		key    string
		bad    interface{}
	}{
		{"uncaptured", payment, "status", "authorized"},
		{"wrong order", payment, "order_id", "order_other"},
		{"underpayment", payment, "amount", float64(1)},
		{"wrong currency", order, "currency", "USD"},
		{"wrong SKU price", order, "amount", float64(1)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			old := tc.target[tc.key]
			tc.target[tc.key] = tc.bad
			defer func() { tc.target[tc.key] = old }()
			if _, err := validateCapturedPurchase("order_123", "pay_123", order, payment); err == nil {
				t.Fatal("invalid purchase accepted")
			}
		})
	}
}
