package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"time"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// financialYearRegex validates format like "2025-26"
var financialYearRegex = regexp.MustCompile(`^\d{4}-\d{2}$`)

// CreateEPRCertificate adds a new EPR certificate to the ledger.
// POST /api/v1/epr/certificates
func (h *Handler) CreateEPRCertificate(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	var req models.CreateEPRCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.CertificateNumber == "" || req.RecyclerName == "" || req.WeightKg <= 0 || req.FinancialYear == "" || req.IssuedDate == "" {
		respondError(w, http.StatusBadRequest, "certificate_number, recycler_name, weight_kg (>0), financial_year, and issued_date are required")
		return
	}

	if !financialYearRegex.MatchString(req.FinancialYear) {
		respondError(w, http.StatusBadRequest, "financial_year must be in format YYYY-YY (e.g. 2025-26)")
		return
	}

	issuedDate, err := time.Parse("2006-01-02", req.IssuedDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "issued_date must be in YYYY-MM-DD format")
		return
	}

	cert := &models.EPRCertificate{
		TenantID:          tenantID,
		CertificateNumber: req.CertificateNumber,
		RecyclerName:      req.RecyclerName,
		RecyclerEprID:     req.RecyclerEprID,
		WeightKg:          req.WeightKg,
		BatteryType:       req.BatteryType,
		FinancialYear:     req.FinancialYear,
		IssuedDate:        issuedDate,
		DocumentPath:      req.DocumentPath,
		Notes:             req.Notes,
		Status:            models.EPRCertStatusActive,
	}

	if req.ExpiryDate != "" {
		exp, err := time.Parse("2006-01-02", req.ExpiryDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, "expiry_date must be in YYYY-MM-DD format")
			return
		}
		cert.ExpiryDate = &exp
	}

	if err := h.repo.CreateEPRCertificate(r.Context(), cert); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create EPR certificate")
		return
	}

	respondJSON(w, http.StatusCreated, cert)
}

// ListEPRCertificates returns all EPR certificates for the tenant.
// GET /api/v1/epr/certificates?financial_year=2025-26
func (h *Handler) ListEPRCertificates(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	financialYear := r.URL.Query().Get("financial_year")

	certs, err := h.repo.ListEPRCertificates(r.Context(), tenantID, financialYear)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list EPR certificates")
		return
	}

	if certs == nil {
		certs = []*models.EPRCertificate{}
	}

	respondJSON(w, http.StatusOK, certs)
}

// GetEPRLedger returns an obligation-vs-certificates summary for a financial year.
// GET /api/v1/epr/ledger?financial_year=2025-26
func (h *Handler) GetEPRLedger(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	financialYear := r.URL.Query().Get("financial_year")
	if financialYear == "" {
		// Default to current Indian FY: April 2025 → March 2026 = "2025-26"
		now := time.Now()
		year := now.Year()
		if now.Month() < time.April {
			year--
		}
		financialYear = fmt.Sprintf("%d-%02d", year, (year+1)%100)
	}

	// Get tenant + batches for obligation calculation
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load tenant")
		return
	}

	// EPR certificate aggregation is battery-specific (BWM Rules 2022). Default to battery; callers may override.
	productType := models.ProductTypeBattery
	if ptQuery := r.URL.Query().Get("product_type"); ptQuery != "" {
		productType = models.ProductType(ptQuery)
	}
	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, productType, 1000, 0)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load batches")
		return
	}

	// Get certificate totals
	certifiedKg, certCount, err := h.repo.GetEPRCertificateSummary(r.Context(), tenantID, financialYear)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load certificate summary")
		return
	}

	// Convert financial year "2025-26" → calendar year 2025 for obligation computation
	var calendarYear int
	fmt.Sscanf(financialYear, "%d-", &calendarYear)
	if calendarYear == 0 {
		calendarYear = time.Now().Year()
	}

	obligation := services.CalculateEPRObligation(tenant, batches, calendarYear, certifiedKg)

	summary := models.EPRLedgerSummary{
		FinancialYear:    financialYear,
		ObligationKg:     obligation.RequiredCollectionKg,
		CertifiedKg:      certifiedKg,
		CertificateCount: certCount,
	}

	if certifiedKg >= obligation.RequiredCollectionKg {
		summary.SurplusKg = certifiedKg - obligation.RequiredCollectionKg
		summary.ComplianceStatus = "COMPLIANT"
	} else {
		summary.DeficitKg = obligation.RequiredCollectionKg - certifiedKg
		if summary.DeficitKg <= obligation.RequiredCollectionKg*0.2 {
			summary.ComplianceStatus = "AT_RISK"
		} else {
			summary.ComplianceStatus = "DEFICIT"
		}
	}

	respondJSON(w, http.StatusOK, summary)
}

// RetireEPRCertificate marks a certificate as retired/used.
// PUT /api/v1/epr/certificates/{id}/retire
func (h *Handler) RetireEPRCertificate(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	certID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid certificate ID")
		return
	}

	if err := h.repo.RetireEPRCertificate(r.Context(), certID, tenantID); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "retired"})
}

// DeleteEPRCertificate removes a certificate from the ledger.
// DELETE /api/v1/epr/certificates/{id}
func (h *Handler) DeleteEPRCertificate(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	certID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid certificate ID")
		return
	}

	if err := h.repo.DeleteEPRCertificate(r.Context(), certID, tenantID); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
