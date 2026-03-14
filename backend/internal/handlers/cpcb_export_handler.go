package handlers

import (
	"fmt"
	"net/http"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// ExportCPCBForm3 generates and downloads a CPCB Form 3 annual return CSV.
// GET /api/v1/epr/cpcb-export?financial_year=2025-26
func (h *Handler) ExportCPCBForm3(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	financialYear := r.URL.Query().Get("financial_year")
	if financialYear == "" {
		financialYear = services.DefaultFinancialYear()
	}

	calendarYear, err := services.ParseFinancialYear(financialYear)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid financial_year format (expected YYYY-YY)")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load tenant")
		return
	}

	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	certificates, err := h.repo.ListEPRCertificates(r.Context(), tenantID, financialYear)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load certificates")
		return
	}

	csvData, err := services.GenerateCPCBForm3CSV(tenant, batches, certificates, financialYear, calendarYear)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate CPCB export")
		return
	}

	filename := fmt.Sprintf("CPCB_Form3_%s.csv", financialYear)
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	w.Write(csvData)
}
