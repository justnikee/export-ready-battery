package services

import "testing"

func TestNewOAuthService_RedirectURLUsesPublicFrontendOrigin(t *testing.T) {
	svc := NewOAuthService("id", "secret", "", "", "https://export-ready.vercel.app/")
	if !svc.GoogleEnabled() {
		t.Fatal("expected Google OAuth enabled")
	}
	got := svc.googleConfig.RedirectURL
	want := "https://export-ready.vercel.app/api/v1/auth/google/callback"
	if got != want {
		t.Fatalf("RedirectURL = %q, want %q", got, want)
	}
}
