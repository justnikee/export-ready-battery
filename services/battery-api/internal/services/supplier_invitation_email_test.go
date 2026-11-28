package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

type supplierEmailTransport func(*http.Request) (*http.Response, error)

func (f supplierEmailTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func TestSupplierInvitationEmailLinks(t *testing.T) {
	tenantID := uuid.New()
	service := NewResendEmailService("test-key", "sender@example.test", "Anviora", "http://localhost:3000/")
	var email ResendEmailRequest
	service.client.Transport = supplierEmailTransport(func(r *http.Request) (*http.Response, error) {
		if err := json.NewDecoder(r.Body).Decode(&email); err != nil {
			return nil, err
		}
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"id":"test"}`))}, nil
	})
	if err := service.SendSupplierInvitationEmail(t.Context(), "supplier@example.test", "Test buyer", "Test supplier", "test-invite", tenantID); err != nil {
		t.Fatal(err)
	}
	loginLink := "http://localhost:3000/supplier/login?tenant_id=" + tenantID.String()
	acceptLink := "http://localhost:3000/supplier/accept?token=test-invite"
	if !strings.Contains(email.HTML, `href="`+loginLink+`"`) || !strings.Contains(email.Text, "\n"+loginLink+"\n") {
		t.Fatal("the email versions must both contain the buyer's supplier login link")
	}
	if !strings.Contains(email.HTML, `href="`+acceptLink+`"`) || !strings.Contains(email.Text, "\n"+acceptLink+"\n") {
		t.Fatal("the email versions must both contain the invitation acceptance link")
	}
}

func TestDisabledEmailFallbackDoesNotLogCredentials(t *testing.T) {
	var logs bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&logs, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })

	service := NewEmailService("https://fixture.example.test")
	const recipient = "supplier@example.test"
	const passwordToken = "fixture-password-reset-token"
	const verificationToken = "fixture-verification-token"
	const inviteToken = "fixture-supplier-invite-token"
	const otp = "128963"
	_ = service.SendPasswordResetEmail(recipient, passwordToken, models.ProductTypeBattery)
	_ = service.SendVerificationEmail(recipient, verificationToken, models.ProductTypeBattery)
	_ = service.SendMagicLinkOTP(recipient, "RECALL", otp)
	if err := service.SendSupplierInvitationEmail(t.Context(), recipient, "Buyer", "Supplier", inviteToken, uuid.New()); !errors.Is(err, ErrEmailDeliveryDisabled) {
		t.Fatalf("disabled supplier invitation returned %v", err)
	}
	if !strings.Contains(logs.String(), "delivery disabled") {
		t.Fatal("expected a safe disabled-delivery diagnostic")
	}
	for _, secret := range []string{passwordToken, verificationToken, inviteToken, otp} {
		if strings.Contains(logs.String(), secret) {
			t.Fatal("disabled email fallback logged a credential")
		}
	}
}

func TestSupplierInvitationProviderFailuresAreSanitized(t *testing.T) {
	const apiKey = "fixture-resend-key"
	const inviteToken = "fixture-invite-token"
	for _, tc := range []struct {
		name   string
		status int
		body   string
		want   string
	}{
		{"provider rejection", 429, `{"message":"` + apiKey + "/" + inviteToken + `"}`, "email provider returned HTTP 429"},
		{"missing acknowledgment", http.StatusOK, `{}`, "invalid email provider response"},
		{"transport failure", 0, apiKey + "/" + inviteToken, "could not reach the email provider"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			service := NewResendEmailService(apiKey, "sender@example.test", "Anviora", "https://fixture.example.test")
			service.client.Transport = supplierEmailTransport(func(r *http.Request) (*http.Response, error) {
				if tc.status == 0 {
					return nil, errors.New(tc.body)
				}
				return &http.Response{StatusCode: tc.status, Body: io.NopCloser(strings.NewReader(tc.body))}, nil
			})
			err := service.SendSupplierInvitationEmail(t.Context(), "supplier@example.test", "Buyer", "Supplier", inviteToken, uuid.New())
			if err == nil || err.Error() != tc.want {
				t.Fatal("email failure did not return the expected sanitized error")
			}
		})
	}
}
