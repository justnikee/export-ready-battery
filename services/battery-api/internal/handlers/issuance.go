package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

func (h *Handler) issuanceSnapshot(ctx context.Context, batch *models.Batch, tenant *models.Tenant, tree []*repository.ComponentTreeNode) (json.RawMessage, error) {
	if err := validateBatchDocumentRefs(tenant.ID, batch.DeclarationOfConformityPath, batch.Specs.PLICertificateURL); err != nil {
		return nil, repository.ErrIssuanceChanged
	}
	batch.Specs.Components = convertComponentTree(tree)
	return services.BuildBatchSnapshot(batch, tenant)
}
func (h *Handler) snapshotPreparer(ctx context.Context) repository.PrepareIssuance {
	return func(batch *models.Batch, tenant *models.Tenant, tree []*repository.ComponentTreeNode) (json.RawMessage, error) {
		return h.issuanceSnapshot(ctx, batch, tenant, tree)
	}
}
func respondIssuanceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, repository.ErrInsufficientQuota):
		respondError(w, http.StatusPaymentRequired, "Insufficient quota")
	case errors.Is(err, repository.ErrIssuanceChanged):
		respondError(w, http.StatusConflict, err.Error())
	default:
		slog.Error("Issuance transaction failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Issuance failed; no partial changes were saved")
	}
}
