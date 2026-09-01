package services

import (
	"strings"
	"testing"
)

func TestNewOAuthService_RedirectURLUsesPublicFrontendOrigin(t *testing.T) {
	svc := NewOAuthService("id", "secret", "", "", "https://export-ready.vercel.app/")
	if !svc.GoogleEnabled() {
		t.Fatal("expected Google OAuth enabled")
	}
	got := svc.GoogleCallbackURL("https://export-ready.vercel.app/")
	want := "https://export-ready.vercel.app/api/v1/auth/google/callback"
	if got != want {
		t.Fatalf("RedirectURL = %q, want %q", got, want)
	}
}

func TestGetGoogleAuthURL_UsesPerRequestPublicBase(t *testing.T) {
	svc := NewOAuthService("id", "secret", "", "", "https://fallback.example/")
	authURL := svc.GetGoogleAuthURL("state123", "https://export-ready.vercel.app")
	if !strings.Contains(authURL, "redirect_uri=https%3A%2F%2Fexport-ready.vercel.app%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback") {
		t.Fatalf("auth URL did not use Vercel callback, got %s", authURL)
	}
}
