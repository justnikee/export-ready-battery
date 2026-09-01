package services

import (
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestProductLink_FlattenedFrontendRoutes(t *testing.T) {
	svc := NewEmailService("https://export-ready.vercel.app")

	got := svc.productLink(models.ProductTypeBattery, "verify-email", "tok-1")
	want := "https://export-ready.vercel.app/verify-email?token=tok-1"
	if got != want {
		t.Fatalf("verify-email link = %q, want %q", got, want)
	}

	got = svc.productLink(models.ProductTypeBattery, "reset-password", "tok-2")
	want = "https://export-ready.vercel.app/reset-password?token=tok-2"
	if got != want {
		t.Fatalf("reset-password link = %q, want %q", got, want)
	}

	got = svc.productLink(models.ProductTypeBattery, "accept-invite", "tok-3")
	want = "https://export-ready.vercel.app/accept-invite?token=tok-3"
	if got != want {
		t.Fatalf("accept-invite link = %q, want %q", got, want)
	}

	if strings.Contains(got, "/battery/") {
		t.Fatalf("flattened routes must not include /battery/ prefix: %q", got)
	}
}

func TestProductLink_TrimsTrailingSlashOnBaseURL(t *testing.T) {
	svc := NewEmailService("https://app.example.com/")
	got := svc.productLink(models.ProductTypeBattery, "login", "abc")
	want := "https://app.example.com/login?token=abc"
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestFrontendPageURL_LoginAndForgot(t *testing.T) {
	svc := NewEmailService("https://export-ready.vercel.app")
	if got := svc.frontendPageURL("login"); got != "https://export-ready.vercel.app/login" {
		t.Fatalf("login = %q", got)
	}
	if got := svc.frontendPageURL("forgot-password"); got != "https://export-ready.vercel.app/forgot-password" {
		t.Fatalf("forgot = %q", got)
	}
}
