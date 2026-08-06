package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestIsUniqueViolation(t *testing.T) {
	if isUniqueViolation(nil) {
		t.Fatal("nil must not be unique violation")
	}
	if isUniqueViolation(errors.New("other")) {
		t.Fatal("generic error must not match")
	}
	pgErr := &pgconn.PgError{Code: "23505"}
	if !isUniqueViolation(pgErr) {
		t.Fatal("23505 must match")
	}
	if !isUniqueViolation(errors.Join(errors.New("wrap"), pgErr)) {
		t.Fatal("wrapped 23505 must match")
	}
}

// S-14: duplicate self-signup must look like a successful registration, never 409.
func TestHandleRegisterExistingEmail_SelfSignupNoOracle(t *testing.T) {
	h := &AuthHandler{} // no email service — still must not 409
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", nil)

	h.handleRegisterExistingEmail(rr, req, RegisterRequest{
		Email:       "taken@example.com",
		Password:    "unused-here",
		CompanyName: "Acme",
	}, false, models.ProductTypeBattery, uuid.New())

	if rr.Code != http.StatusAccepted {
		t.Fatalf("expected 202 Accepted, got %d body=%s", rr.Code, rr.Body.String())
	}
	var body map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["message"] != registerSelfSuccessMessage {
		t.Fatalf("unexpected message: %q", body["message"])
	}
	if body["message"] == "Email already registered" || rr.Code == http.StatusConflict {
		t.Fatal("must not reveal email already registered")
	}
}

func TestRegisterSelfSuccessMessage_Stable(t *testing.T) {
	// Frontend shows "check your email" on any successful register response;
	// keep the message stable so UX stays consistent for new + existing emails.
	if registerSelfSuccessMessage == "" {
		t.Fatal("empty success message")
	}
	if registerInviteSuccessMessage == "" {
		t.Fatal("empty invite success message")
	}
}
