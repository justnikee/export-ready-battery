package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// setRoleContext injects role into the request context.
func setRoleContext(req *http.Request, role string) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.RoleKey, role)
	return req.WithContext(ctx)
}

func TestRequireFeature_Gating(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	feature := services.FeatureEUCompliance

	// Wrap a dummy handler that returns 200 OK
	gatedHandler := handler.RequireFeature(feature)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: STARTER plan tenant should get 402 Payment Required
	mockRepo.On("GetTenantSubscriptionStatus", mock.Anything, tenantID).Return(services.PlanStarter, "ACTIVE", (*time.Time)(nil), nil).Once()

	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/some-growth-feature", nil)
	req1 = setAuthContext(req1, tenantID, "user@example.com", models.ProductTypeBattery)
	rr1 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr1, req1)

	if rr1.Code != http.StatusPaymentRequired {
		t.Errorf("expected 402 for Starter plan, got %d: %s", rr1.Code, rr1.Body.String())
	}

	var respBody map[string]interface{}
	if err := json.Unmarshal(rr1.Body.Bytes(), &respBody); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if respBody["error"] != "upgrade_required" {
		t.Errorf("expected error field to be 'upgrade_required', got %v", respBody["error"])
	}

	// Case 2: GROWTH plan, active subscription should pass through (200 OK)
	mockRepo.On("GetTenantSubscriptionStatus", mock.Anything, tenantID).Return(services.PlanGrowth, "ACTIVE", (*time.Time)(nil), nil).Once()

	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/some-growth-feature", nil)
	req2 = setAuthContext(req2, tenantID, "user@example.com", models.ProductTypeBattery)
	rr2 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("expected 200 for Growth plan, got %d", rr2.Code)
	}

	// Case 3: GROWTH plan but EXPIRED — must 402 with subscription_expired, not
	// fall through to upgrade_required. This is the gap closed on 2026-07-05:
	// previously RequireFeature never checked plan_status/expiry at all, so an
	// expired Growth tenant retained indefinite read access to Growth features.
	mockRepo.On("GetTenantSubscriptionStatus", mock.Anything, tenantID).Return(services.PlanGrowth, "EXPIRED", (*time.Time)(nil), nil).Once()

	req3 := httptest.NewRequest(http.MethodGet, "/api/v1/some-growth-feature", nil)
	req3 = setAuthContext(req3, tenantID, "user@example.com", models.ProductTypeBattery)
	rr3 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr3, req3)

	if rr3.Code != http.StatusPaymentRequired {
		t.Errorf("expected 402 for expired Growth plan, got %d: %s", rr3.Code, rr3.Body.String())
	}
	var respBody3 map[string]interface{}
	if err := json.Unmarshal(rr3.Body.Bytes(), &respBody3); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if respBody3["error"] != "subscription_expired" {
		t.Errorf("expected error field to be 'subscription_expired', got %v", respBody3["error"])
	}

	mockRepo.AssertExpectations(t)
}

func TestRequireRole_Gating(t *testing.T) {
	// RequireRole OWNER or ADMIN
	gatedHandler := middleware.RequireRole("OWNER", "ADMIN")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: OWNER role should pass through
	req1 := httptest.NewRequest(http.MethodDelete, "/api/v1/team/member-id", nil)
	req1 = setRoleContext(req1, "OWNER")
	rr1 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr1, req1)

	if rr1.Code != http.StatusOK {
		t.Errorf("expected 200 for OWNER role, got %d", rr1.Code)
	}

	// Case 2: VIEWER role should get 403 Forbidden
	req2 := httptest.NewRequest(http.MethodDelete, "/api/v1/team/member-id", nil)
	req2 = setRoleContext(req2, "VIEWER")
	rr2 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusForbidden {
		t.Errorf("expected 403 for VIEWER role, got %d: %s", rr2.Code, rr2.Body.String())
	}
}

func TestTeamHandlers_AuditLogging(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	actorEmail := "owner@example.com"

	// Mock GetTenant (used for seat limits / plan limits checks)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Test Corp",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	}, nil)

	mockRepo.On("CountTeamMembers", mock.Anything, tenantID).Return(1, nil)
	mockRepo.On("GetTeamMemberByEmail", mock.Anything, tenantID, "invitee@example.com").Return(nil, nil)
	mockRepo.On("CreateTeamMember", mock.Anything, mock.AnythingOfType("*models.TeamMember")).Return(nil)

	// Verify CreateTeamAuditLog is called on Invite
	mockRepo.On("CreateTeamAuditLog", mock.Anything, mock.MatchedBy(func(log *models.TeamAuditLog) bool {
		return log.TenantID == tenantID &&
			log.ActorEmail == actorEmail &&
			log.SubjectEmail == "invitee@example.com" &&
			log.Action == "INVITE" &&
			log.NewRole != nil && *log.NewRole == "ADMIN"
	})).Return(nil).Once()

	body := `{"email":"invitee@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, actorEmail, models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 on invite, got %d: %s", rr.Code, rr.Body.String())
	}

	mockRepo.AssertExpectations(t)
}

func TestActivateBatch_PassportMeteredQuota(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := validBillingBatch(tenantID)
	batch.ID = batchID
	tenant := validBillingTenant(tenantID)
	tenant.PlanStatus = "ACTIVE"

	// Setup tenant and batch mock data
	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)

	// Case 1: Batch has 5 passports, tenant has balance of 4 -> should fail with 402
	mockRepo.On("CountPassportsByBatch", mock.Anything, batchID).Return(5, nil).Once()
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(4, nil).Once()

	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/activate", nil)
	req1.SetPathValue("id", batchID.String())
	req1 = setAuthContext(req1, tenantID, "user@example.com", models.ProductTypeBattery)
	rr1 := httptest.NewRecorder()

	handler.ActivateBatch(rr1, req1)

	if rr1.Code != http.StatusPaymentRequired {
		t.Errorf("expected 402 for insufficient quota, got %d: %s", rr1.Code, rr1.Body.String())
	}

	// Case 2: Batch has 5 passports, tenant has balance of 5 -> should succeed and deduct 5
	mockRepo.On("CountPassportsByBatch", mock.Anything, batchID).Return(5, nil).Once()
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(5, nil).Once()
	mockRepo.On("DeductQuota", mock.Anything, tenantID, 5).Return(nil).Once()
	mockRepo.On("SetBatchStatus", mock.Anything, batchID, models.BatchStatusActive).Return(nil).Once()
	mockRepo.On("CreateTransaction", mock.Anything, mock.AnythingOfType("*models.Transaction")).Return(nil).Once()
	mockRepo.On("UpdateBatchComplianceResult", mock.Anything, batchID, mock.Anything, mock.Anything).Return(nil).Once()

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/activate", nil)
	req2.SetPathValue("id", batchID.String())
	req2 = setAuthContext(req2, tenantID, "user@example.com", models.ProductTypeBattery)
	rr2 := httptest.NewRecorder()

	handler.ActivateBatch(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("expected 200 for successful activation, got %d: %s", rr2.Code, rr2.Body.String())
	}

	// Give the background compliance run goroutine a moment to execute
	time.Sleep(50 * time.Millisecond)

	mockRepo.AssertExpectations(t)
}

// TestRequireOnboardingComplete_ExpiredSubscription verifies the write-route
// expiry gate. (Previously named TestRequireActiveSubscription_Expired, but it
// never actually exercised RequireActiveSubscription — that middleware duplicated
// this same check and was wired to zero routes, so it was deleted; this test
// renamed to describe what it really covers.)
func TestRequireOnboardingComplete_ExpiredSubscription(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	gatedHandler := handler.RequireOnboardingComplete(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: Tenant is expired -> should return 402 with subscription_expired
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(&models.Tenant{
		ID:                  tenantID,
		OnboardingCompleted: true,
		PlanStatus:          "EXPIRED",
	}, nil).Once()

	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req1 = setAuthContext(req1, tenantID, "user@example.com", models.ProductTypeBattery)
	rr1 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr1, req1)

	if rr1.Code != http.StatusPaymentRequired {
		t.Errorf("expected 402 for expired subscription, got %d: %s", rr1.Code, rr1.Body.String())
	}

	var respBody map[string]interface{}
	if err := json.Unmarshal(rr1.Body.Bytes(), &respBody); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if respBody["error"] != "subscription_expired" {
		t.Errorf("expected error field to be 'subscription_expired', got %v", respBody["error"])
	}

	// Case 2: Tenant is active -> should pass through (200 OK)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(&models.Tenant{
		ID:                  tenantID,
		OnboardingCompleted: true,
		PlanStatus:          "ACTIVE",
	}, nil).Once()

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil)
	req2 = setAuthContext(req2, tenantID, "user@example.com", models.ProductTypeBattery)
	rr2 := httptest.NewRecorder()

	gatedHandler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("expected 200 for active subscription, got %d", rr2.Code)
	}

	mockRepo.AssertExpectations(t)
}

// signRazorpayPayload computes the same HMAC-SHA256(order_id + "|" + payment_id)
// signature RazorpayService.VerifyPayment expects, using the given key secret.
func signRazorpayPayload(orderID, paymentID, keySecret string) string {
	h := hmac.New(sha256.New, []byte(keySecret))
	h.Write([]byte(orderID + "|" + paymentID))
	return hex.EncodeToString(h.Sum(nil))
}

// TestVerifyRazorpayPayment_AddOnDoesNotChangePlan guards the exact bug this
// add-on feature could reintroduce: buying a pure quota/seat top-up must never
// call UpdateTenantSubscription (that would stamp plan_type with the add-on's
// SKU id, e.g. "ADDON-PASSPORTS-500-STARTER", corrupting the tenant's plan).
// Not calling `mockRepo.On("UpdateTenantSubscription", ...)` means testify will
// panic the test if the handler calls it anyway — that's the regression guard.
func TestVerifyRazorpayPayment_AddOnDoesNotChangePlan(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)
	handler.razorpayService = services.NewRazorpayService("test_key_id", "test_key_secret")

	tenantID := uuid.New()
	orderID := "order_test123"
	paymentID := "pay_test456"
	signature := signRazorpayPayload(orderID, paymentID, "test_key_secret")

	mockRepo.On("TransactionExistsForPayment", mock.Anything, paymentID).Return(false, nil).Once()
	mockRepo.On("AddQuota", mock.Anything, tenantID, 500).Return(nil).Once()
	mockRepo.On("CreateTransaction", mock.Anything, mock.MatchedBy(func(tx *models.Transaction) bool {
		return tx.QuotaChange == 500 && tx.TenantID == tenantID
	})).Return(nil).Once()
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(1000, nil).Once()
	// Deliberately NOT mocking UpdateTenantSubscription or AddBonusSeats — if
	// the handler calls either, the mock panics and the test fails.

	body, _ := json.Marshal(map[string]string{
		"razorpay_order_id":   orderID,
		"razorpay_payment_id": paymentID,
		"razorpay_signature":  signature,
		"package_id":          "addon-passports-500-starter",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/razorpay/verify", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()

	handler.VerifyRazorpayPayment(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// TestVerifyRazorpayPayment_AnnualTierUses365DayExpiry guards against deriving
// plan_type/expiry from the SKU id (which would break for "starter-annual" ->
// invalid "STARTER-ANNUAL" and grant only the default 30-day window instead of
// the paid-for 365 days). It must use pkg.PlanType/pkg.BillingCycleDays.
func TestVerifyRazorpayPayment_AnnualTierUses365DayExpiry(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)
	handler.razorpayService = services.NewRazorpayService("test_key_id", "test_key_secret")

	tenantID := uuid.New()
	orderID := "order_annual123"
	paymentID := "pay_annual456"
	signature := signRazorpayPayload(orderID, paymentID, "test_key_secret")

	mockRepo.On("TransactionExistsForPayment", mock.Anything, paymentID).Return(false, nil).Once()
	mockRepo.On("AddQuota", mock.Anything, tenantID, 6000).Return(nil).Once()
	mockRepo.On("UpdateTenantSubscription", mock.Anything, tenantID, "STARTER", mock.MatchedBy(func(expiresAt time.Time) bool {
		days := time.Until(expiresAt).Hours() / 24
		return days > 364 && days <= 365
	}), "ACTIVE").Return(nil).Once()
	mockRepo.On("CreateTransaction", mock.Anything, mock.MatchedBy(func(tx *models.Transaction) bool {
		return tx.QuotaChange == 6000 && tx.TenantID == tenantID
	})).Return(nil).Once()
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(6000, nil).Once()

	body, _ := json.Marshal(map[string]string{
		"razorpay_order_id":   orderID,
		"razorpay_payment_id": paymentID,
		"razorpay_signature":  signature,
		"package_id":          "starter-annual",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/razorpay/verify", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()

	handler.VerifyRazorpayPayment(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// TestVerifyRazorpayPayment_SeatAddOn verifies a seat add-on purchase credits
// bonus seats (not quota) and, like the quota add-on, never touches plan_type.
func TestVerifyRazorpayPayment_SeatAddOn(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)
	handler.razorpayService = services.NewRazorpayService("test_key_id", "test_key_secret")

	tenantID := uuid.New()
	orderID := "order_test789"
	paymentID := "pay_test789"
	signature := signRazorpayPayload(orderID, paymentID, "test_key_secret")

	mockRepo.On("TransactionExistsForPayment", mock.Anything, paymentID).Return(false, nil).Once()
	mockRepo.On("AddBonusSeats", mock.Anything, tenantID, 1).Return(nil).Once()
	mockRepo.On("CreateTransaction", mock.Anything, mock.MatchedBy(func(tx *models.Transaction) bool {
		return tx.QuotaChange == 0 && tx.TenantID == tenantID
	})).Return(nil).Once()
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(500, nil).Once()
	// Deliberately NOT mocking AddQuota or UpdateTenantSubscription.

	body, _ := json.Marshal(map[string]string{
		"razorpay_order_id":   orderID,
		"razorpay_payment_id": paymentID,
		"razorpay_signature":  signature,
		"package_id":          "addon-seat-starter",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/razorpay/verify", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()

	handler.VerifyRazorpayPayment(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}
