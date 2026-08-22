package handlers

import (
	"net/http"

	"github.com/anvayalabs/battery-api/internal/models"
)

// rejectIfNotProductionReady writes 403 and returns true when QR ZIP / label
// PDFs must not be issued for this batch status (L-23).
func rejectIfNotProductionReady(w http.ResponseWriter, status string) bool {
	if models.CanIssueProductionIdentifiers(status) {
		return false
	}
	respondError(w, http.StatusForbidden, models.ProductionArtifactsDraftMessage)
	return true
}

func isProductionArtifactJob(jobType models.ExportJobType) bool {
	return jobType == models.ExportJobTypeQRZip || jobType == models.ExportJobTypeLabelPDF
}
