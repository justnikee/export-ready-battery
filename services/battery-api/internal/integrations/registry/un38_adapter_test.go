package registry

import (
	"context"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestUN38Adapter_AllowlistIsFormatValidNotRegistry(t *testing.T) {
	a := newUN38Adapter("")
	res, err := a.Verify(context.Background(), "RPT-123456", map[string]string{
		"un38_lab_name":  "TUV SUD India",
		"un38_test_date": "2026-01-15",
	})
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.Status != models.RegistryStatusFormatValid {
		t.Fatalf("status = %s, want format_valid", res.Status)
	}
	if res.TrustTier != models.TrustTierFormatValid {
		t.Fatalf("trust = %s, want format_valid", res.TrustTier)
	}
}

func TestUN38Adapter_UnknownLabIsNotVerified(t *testing.T) {
	a := newUN38Adapter("")
	res, err := a.Verify(context.Background(), "RPT-123456", map[string]string{
		"un38_lab_name": "Unknown Garage Lab",
	})
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.Status != models.RegistryStatusFailed {
		t.Fatalf("status = %s, want failed", res.Status)
	}
	if res.TrustTier != models.TrustTierSelfDeclared {
		t.Fatalf("trust = %s", res.TrustTier)
	}
}
