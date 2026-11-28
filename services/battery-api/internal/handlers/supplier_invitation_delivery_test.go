package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

func TestSupplierInvitationDeliveryStatus(t *testing.T) {
	for _, tc := range []struct {
		name   string
		mailer *services.EmailService
	}{
		{"unconfigured", nil},
		{"disabled", services.NewEmailService("https://fixture.example.test")},
	} {
		t.Run(tc.name, func(t *testing.T) {
			repo := newFakeSupplierRepo()
			tenantID := uuid.New()
			repo.seedTenant(&models.Tenant{ID: tenantID, CompanyName: "Fixture buyer"})
			h := &Handler{repo: repo, emailService: tc.mailer}
			const recipient = "supplier@example.test"
			req := httptest.NewRequest(http.MethodPost, "/api/v1/suppliers/invitations",
				strings.NewReader(`{"email":"supplier@example.test","company_name":"Fixture supplier"}`))
			req = setAuthContext(req, tenantID, "buyer@example.test", models.ProductTypeBattery)
			res := httptest.NewRecorder()
			h.InviteSupplier(res, req)

			if res.Code != http.StatusCreated || res.Header().Get("Cache-Control") != "private, no-store" {
				t.Fatalf("invite returned status %d, cache policy %q", res.Code, res.Header().Get("Cache-Control"))
			}
			var body struct {
				EmailSent *bool  `json:"email_sent"`
				Token     string `json:"invitation_token"`
				Message   string `json:"message"`
			}
			if err := json.Unmarshal(res.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if body.EmailSent == nil || *body.EmailSent {
				t.Fatal("unavailable email delivery must be reported as unsuccessful")
			}
			if !strings.Contains(body.Message, "email could not be sent") ||
				!strings.Contains(body.Message, "Copy the invitation link") {
				t.Fatal("failed delivery did not explain the result and manual fallback")
			}
			supplier, err := repo.GetSupplierByEmail(t.Context(), tenantID, recipient)
			if err != nil || body.Token == "" || supplier.InvitationToken != body.Token || supplier.Status != "invited" {
				t.Fatal("the saved supplier and its manual invitation were not available")
			}
		})
	}
}
