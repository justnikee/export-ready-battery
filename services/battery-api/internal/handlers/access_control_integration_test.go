package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
	razorpay "github.com/razorpay/razorpay-go"
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
	mockRepo.On("ActivateBatchAtomic", mock.Anything, batchID, tenantID, mock.Anything).Return(0, repository.ErrInsufficientQuota).Once()

	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/batches/"+batchID.String()+"/activate", nil)
	req1.SetPathValue("id", batchID.String())
	req1 = setAuthContext(req1, tenantID, "user@example.com", models.ProductTypeBattery)
	rr1 := httptest.NewRecorder()

	handler.ActivateBatch(rr1, req1)

	if rr1.Code != http.StatusPaymentRequired {
		t.Errorf("expected 402 for insufficient quota, got %d: %s", rr1.Code, rr1.Body.String())
	}

	// Case 2: Batch has 5 passports, tenant has balance of 5 -> should succeed and deduct 5
	mockRepo.On("ActivateBatchAtomic", mock.Anything, batchID, tenantID, mock.Anything).Return(0, nil).Once()
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

func TestRequireOnboardingComplete_ExpiredSubscription(t *testing.T) {
	repo := new(repository.MockRepository)
	h := newTestHandler(repo)
	id := uuid.New()
	repo.On("GetTenant", mock.Anything, id).Return(&models.Tenant{ID: id, OnboardingCompleted: true, PlanStatus: "EXPIRED"}, nil).Once()
	gate := h.RequireOnboardingComplete(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }))
	req := setAuthContext(httptest.NewRequest(http.MethodPost, "/api/v1/batches", nil), id, "user@example.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	gate.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expired plan blocked purchased credits: %d %s", rr.Code, rr.Body.String())
	}
	repo.AssertExpectations(t)
}

// signRazorpayPayload computes the same HMAC-SHA256(order_id + "|" + payment_id)
// signature RazorpayService.VerifyPayment expects, using the given key secret.
func signRazorpayPayload(orderID, paymentID, keySecret string) string {
	h := hmac.New(sha256.New, []byte(keySecret))
	h.Write([]byte(orderID + "|" + paymentID))
	return hex.EncodeToString(h.Sum(nil))
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func capturedPaymentService(t *testing.T, tenantID uuid.UUID, packageID, orderID, paymentID string) *services.RazorpayService {
	t.Helper()
	pkg, ok := services.GetPackage(packageID)
	if !ok {
		t.Fatal("unknown test package")
	}
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v1/payments/" + paymentID:
			json.NewEncoder(w).Encode(map[string]interface{}{"id": paymentID, "order_id": orderID, "status": "captured", "amount": pkg.PricePaise, "currency": "INR"})
		case "/v1/orders/" + orderID:
			json.NewEncoder(w).Encode(map[string]interface{}{"id": orderID, "amount": pkg.PricePaise, "currency": "INR", "notes": map[string]string{"tenant_id": tenantID.String(), "package_id": packageID}})
		default:
			http.NotFound(w, r)
		}
	})
	client := razorpay.NewClient("test_key_id", "test_key_secret")
	client.Request.HTTPClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, r)
		return &http.Response{StatusCode: rr.Code, Header: rr.Header(), Body: io.NopCloser(strings.NewReader(rr.Body.String())), Request: r}, nil
	})}
	return services.NewRazorpayServiceWithClient(client, "test_key_id", "test_key_secret")
}

func TestVerifyRazorpayPayment_GrantKinds(t *testing.T) {
	for _, tc := range []struct {
		name, pkg          string
		quota, seats, days int
		plan               string
	}{
		{"quota add-on", "addon-passports-500-starter", 500, 0, 0, ""},
		{"annual tier", "starter-annual", 6000, 0, 365, "STARTER"},
		{"seat add-on", "addon-seat-starter", 0, 1, 0, ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			repo := new(repository.MockRepository)
			h := newTestHandler(repo)
			id := uuid.New()
			order, payment := "order_test123", "pay_test456"
			h.razorpayService = capturedPaymentService(t, id, tc.pkg, order, payment)
			repo.On("ApplyPaymentGrant", mock.Anything, mock.MatchedBy(func(g repository.PaymentGrant) bool {
				return g.TenantID == id && g.PaymentID == payment && g.QuotaUnits == tc.quota && g.SeatBonus == tc.seats && g.PlanType == tc.plan && g.BillingCycleDays == tc.days
			})).Return(repository.PaymentGrantResult{Applied: true, QuotaBalance: 7000}, nil).Once()
			body, _ := json.Marshal(map[string]string{"razorpay_order_id": order, "razorpay_payment_id": payment, "razorpay_signature": signRazorpayPayload(order, payment, "test_key_secret"), "package_id": tc.pkg})
			req := setAuthContext(httptest.NewRequest(http.MethodPost, "/api/v1/billing/razorpay/verify", bytes.NewReader(body)), id, "user@example.com", models.ProductTypeBattery)
			rr := httptest.NewRecorder()
			h.VerifyRazorpayPayment(rr, req)
			if rr.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
			}
			repo.AssertExpectations(t)
		})
	}
}

func TestVerifyRazorpayPayment_RejectsBrowserPackageSwap(t *testing.T) {
	repo := new(repository.MockRepository)
	h := newTestHandler(repo)
	id := uuid.New()
	order, payment := "order_test123", "pay_test456"
	h.razorpayService = capturedPaymentService(t, id, "addon-passports-500-starter", order, payment)
	body, _ := json.Marshal(map[string]string{"razorpay_order_id": order, "razorpay_payment_id": payment, "razorpay_signature": signRazorpayPayload(order, payment, "test_key_secret"), "package_id": "growth-annual"})
	req := setAuthContext(httptest.NewRequest(http.MethodPost, "/api/v1/billing/razorpay/verify", bytes.NewReader(body)), id, "user@example.com", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	h.VerifyRazorpayPayment(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
	repo.AssertNotCalled(t, "ApplyPaymentGrant", mock.Anything, mock.Anything)
}
