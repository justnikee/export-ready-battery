package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// Only uploaded batch documents may be attached. Legacy signed/public storage
// URLs are accepted by extracting their key; unrelated URLs and certificate
// keys fail closed and must be re-uploaded through the staging endpoint.
func batchDocumentKey(tenantID uuid.UUID, kind, ref string) (string, error) {
	if ref == "" {
		return "", nil
	}
	key, ok := (&services.StorageService{}).ExtractStoragePath(ref, complianceDocsBucket)
	prefix := tenantID.String() + "/batch-staging/" + kind + "/"
	if !ok || tenantID == uuid.Nil || !strings.HasPrefix(key, prefix) || strings.ContainsAny(key, "%\\?#") || strings.Contains(key, "..") {
		return "", fmt.Errorf("invalid %s document reference: upload a tenant-owned batch document", kind)
	}
	name := strings.TrimPrefix(key, prefix)
	if strings.Contains(name, "/") || !strings.HasSuffix(name, ".pdf") || name == ".pdf" {
		return "", fmt.Errorf("invalid %s document reference", kind)
	}
	return key, nil
}

func validateBatchDocumentRefs(tenantID uuid.UUID, doc, pli string) error {
	if _, err := batchDocumentKey(tenantID, "doc", doc); err != nil {
		return err
	}
	_, err := batchDocumentKey(tenantID, "pli", pli)
	return err
}

func (h *Handler) resolveBatchDocumentURL(ctx context.Context, tenantID uuid.UUID, kind, ref string) (string, error) {
	key, err := batchDocumentKey(tenantID, kind, ref)
	if err != nil || key == "" {
		return "", err
	}
	if h.storageService == nil {
		return "", fmt.Errorf("storage unavailable")
	}
	return h.storageService.CreateSignedURLForBucket(ctx, complianceDocsBucket, key, time.Hour)
}
