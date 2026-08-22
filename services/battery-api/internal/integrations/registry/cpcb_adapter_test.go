package registry

import (
	"context"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

func TestCPCBAdapter_ValidFormatIsNotLedgerVerified(t *testing.T) {
	a := newCPCBAdapter("https://eprbatterycpcb.in", new(repository.MockRepository))
	res, err := a.Verify(context.Background(), "B-29016/2024-25/CPCB", nil)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.Status != models.RegistryStatusFormatValid {
		t.Fatalf("status = %s, want format_valid", res.Status)
	}
	if res.TrustTier != models.TrustTierFormatValid {
		t.Fatalf("trust = %s, want format_valid", res.TrustTier)
	}
	if res.Status == models.RegistryStatusVerified || res.TrustTier == models.TrustTierRegistry {
		t.Fatal("format-only CPCB check must not claim registry verification")
	}
	if got, _ := res.VerifiedData["verification_type"].(string); got != "format_only" {
		t.Fatalf("verification_type = %v", res.VerifiedData["verification_type"])
	}
}

func TestCPCBAdapter_LooseStringIsNotValid(t *testing.T) {
	a := newCPCBAdapter("https://eprbatterycpcb.in", new(repository.MockRepository))
	res, err := a.Verify(context.Background(), "EPR-12345", nil)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.Status != models.RegistryStatusFailed {
		t.Fatalf("status = %s, want failed", res.Status)
	}
	if res.TrustTier != models.TrustTierSelfDeclared {
		t.Fatalf("trust = %s, want self_declared", res.TrustTier)
	}
}

func TestCPCBAdapter_MissingNumber(t *testing.T) {
	a := newCPCBAdapter("https://eprbatterycpcb.in", new(repository.MockRepository))
	res, err := a.Verify(context.Background(), "", nil)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.Status != models.RegistryStatusNotFound {
		t.Fatalf("status = %s, want not_found", res.Status)
	}
}
