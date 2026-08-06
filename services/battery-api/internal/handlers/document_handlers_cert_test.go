package handlers

import (
	"testing"

	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// S-10: canonical cert storage path is tenant-scoped and type-specific.
func TestComplianceCertificateStoragePath(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
	for _, docType := range []string{"epr", "bis", "pli"} {
		path := tenantID.String() + "/certificates/" + docType + ".pdf"
		if path != "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/certificates/"+docType+".pdf" {
			t.Fatalf("unexpected path %s", path)
		}
		// Extractable as bare key for re-signing
		svc := &services.StorageService{}
		got, ok := svc.ExtractStoragePath(path, complianceDocsBucket)
		if !ok || got != path {
			t.Fatalf("ExtractStoragePath(%q) = %q, %v", path, got, ok)
		}
	}
}

func TestResolveFreshBucketURL_Empty(t *testing.T) {
	url, err := resolveFreshBucketURL(t.Context(), nil, "")
	if err != nil || url != "" {
		t.Fatalf("empty stored → empty, got %q err=%v", url, err)
	}
}

func TestResolveFreshBucketURL_NilStoragePassthrough(t *testing.T) {
	stored := "https://example.com/external.pdf"
	url, err := resolveFreshBucketURL(t.Context(), nil, stored)
	if err != nil || url != stored {
		t.Fatalf("nil storage should pass through, got %q err=%v", url, err)
	}
}
