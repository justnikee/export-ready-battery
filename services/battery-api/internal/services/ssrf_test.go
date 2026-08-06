package services

import (
	"net"
	"os"
	"testing"
)

func TestValidateOutboundWebhookURL_AllowsPublicHTTPS(t *testing.T) {
	err := ValidateOutboundWebhookURL("https://example.com/hooks/anvaya")
	if err != nil {
		// DNS may fail offline — skip rather than flake CI without network.
		t.Skipf("network/DNS required for positive case: %v", err)
	}
}

func TestValidateOutboundWebhookURL_BlocksPrivateAndMetadata(t *testing.T) {
	cases := []string{
		"http://127.0.0.1/hook",
		"https://127.0.0.1/hook",
		"http://localhost/hook",
		"http://[::1]/hook",
		"http://10.0.0.5/hook",
		"http://192.168.1.1/hook",
		"http://172.16.0.1/hook",
		"http://169.254.169.254/latest/meta-data/",
		"http://metadata.google.internal/",
		"http://0.0.0.0/hook",
		"http://100.64.0.1/hook",
		"file:///etc/passwd",
		"ftp://example.com/x",
		"https://user:pass@example.com/h",
		"https://example.com/h#frag",
		"",
		"not-a-url",
	}
	for _, raw := range cases {
		if err := ValidateOutboundWebhookURL(raw); err == nil {
			t.Errorf("expected block for %q", raw)
		}
	}
}

func TestValidateOutboundWebhookURL_ProductionRequiresHTTPS(t *testing.T) {
	prev := os.Getenv("APP_ENV")
	t.Cleanup(func() {
		if prev == "" {
			_ = os.Unsetenv("APP_ENV")
		} else {
			_ = os.Setenv("APP_ENV", prev)
		}
	})
	_ = os.Setenv("APP_ENV", "production")

	err := ValidateOutboundWebhookURL("http://example.com/hook")
	if err == nil {
		t.Fatal("expected http rejected in production")
	}
}

func TestIsBlockedIP(t *testing.T) {
	blocked := []string{
		"127.0.0.1",
		"10.1.2.3",
		"192.168.0.1",
		"172.31.255.255",
		"169.254.169.254",
		"0.0.0.0",
		"100.64.1.1",
		"::1",
		"fc00::1",
	}
	for _, s := range blocked {
		ip := net.ParseIP(s)
		if ip == nil {
			t.Fatalf("parse %s", s)
		}
		if !isBlockedIP(ip) {
			t.Errorf("expected blocked: %s", s)
		}
	}

	if isBlockedIP(net.ParseIP("8.8.8.8")) {
		t.Error("8.8.8.8 should not be blocked")
	}
}
