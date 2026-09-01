package handlers

import (
	"net/http"
	"testing"
)

func TestResolveOAuthPublicBase_PrefersForwardedHostWhenAllowed(t *testing.T) {
	r := &http.Request{Header: http.Header{
		"X-Forwarded-Host":  []string{"export-ready.vercel.app"},
		"X-Forwarded-Proto": []string{"https"},
	}}
	got := resolveOAuthPublicBase(r, "https://130.210.34.184.nip.io", []string{"https://export-ready.vercel.app"})
	want := "https://export-ready.vercel.app"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestResolveOAuthPublicBase_RejectsUnknownForwardedHost(t *testing.T) {
	r := &http.Request{Header: http.Header{
		"X-Forwarded-Host": []string{"evil.example"},
	}}
	got := resolveOAuthPublicBase(r, "https://export-ready.vercel.app", []string{"https://export-ready.vercel.app"})
	if got != "https://export-ready.vercel.app" {
		t.Fatalf("spoofed host must fall back to FRONTEND_URL, got %q", got)
	}
}

func TestOAuthOriginAllowed(t *testing.T) {
	if !oauthOriginAllowed("https://export-ready.vercel.app/", "https://export-ready.vercel.app", nil) {
		t.Fatal("frontend URL must be allowed")
	}
	if oauthOriginAllowed("https://evil.example", "https://export-ready.vercel.app", []string{"https://export-ready.vercel.app"}) {
		t.Fatal("unknown origin must be rejected")
	}
}
