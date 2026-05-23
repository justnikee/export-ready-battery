package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
)

// SignupRequestRequest is the payload for POST /api/v1/auth/request-access
type SignupRequestRequest struct {
	CompanyName      string `json:"company_name"`
	Email            string `json:"email"`
	GSTIN            string `json:"gstin"`
	IECCode          string `json:"iec_code"`
	ProductType      string `json:"product_type"`
	EstimatedBatches string `json:"estimated_batches"`
	MarketRegion     string `json:"market_region"`
	Phone            string `json:"phone"`
}

// Free email providers that should be blocked for business signups
var freeEmailDomains = map[string]bool{
	"gmail.com": true, "yahoo.com": true, "hotmail.com": true,
	"outlook.com": true, "live.com": true, "rediffmail.com": true,
	"ymail.com": true, "icloud.com": true, "protonmail.com": true,
	"aol.com": true, "mail.com": true, "yandex.com": true, "zoho.com": true,
}

func isFreeEmail(email string) bool {
	parts := strings.Split(strings.ToLower(email), "@")
	if len(parts) != 2 {
		return true
	}
	return freeEmailDomains[parts[1]]
}

func validateGSTIN(gstin string) bool {
	if len(gstin) != 15 {
		return false
	}
	// Simple format check — full checksum validation is a future enhancement
	stateCodes := map[string]bool{
		"01": true, "02": true, "03": true, "04": true, "05": true, "06": true, "07": true, "08": true, "09": true, "10": true,
		"11": true, "12": true, "13": true, "14": true, "15": true, "16": true, "17": true, "18": true, "19": true, "20": true,
		"21": true, "22": true, "23": true, "24": true, "25": true, "26": true, "27": true, "28": true, "29": true, "30": true,
		"31": true, "32": true, "33": true, "34": true, "35": true, "36": true, "37": true, "38": true,
	}
	if !stateCodes[gstin[0:2]] {
		return false
	}
	// PAN-like pattern check for chars 2-12
	pan := gstin[2:12]
	for i, c := range pan {
		if i < 5 {
			if c < 'A' || c > 'Z' {
				return false
			}
		} else if i < 9 {
			if c < '0' || c > '9' {
				return false
			}
		} else {
			if c < 'A' || c > 'Z' {
				return false
			}
		}
	}
	return true
}

func validateIEC(iec string) bool {
	return len(iec) == 10
}

// RequestAccess handles POST /api/v1/auth/request-access
// No authentication required — this is the entry point for gated signup.
func (h *Handler) RequestAccess(w http.ResponseWriter, r *http.Request) {
	var req SignupRequestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validation
	req.CompanyName = strings.TrimSpace(req.CompanyName)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.GSTIN = strings.ToUpper(strings.TrimSpace(req.GSTIN))
	req.IECCode = strings.ToUpper(strings.TrimSpace(req.IECCode))

	if req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "Company name is required")
		return
	}
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		respondError(w, http.StatusBadRequest, "Valid business email is required")
		return
	}
	if isFreeEmail(req.Email) {
		respondError(w, http.StatusBadRequest, "Please use your company email address. Free email providers are not accepted.")
		return
	}
	if req.GSTIN == "" && req.IECCode == "" {
		respondError(w, http.StatusBadRequest, "GSTIN or IEC code is required to verify your business")
		return
	}
	if req.GSTIN != "" && !validateGSTIN(req.GSTIN) {
		respondError(w, http.StatusBadRequest, "Invalid GSTIN format")
		return
	}
	if req.IECCode != "" && !validateIEC(req.IECCode) {
		respondError(w, http.StatusBadRequest, "Invalid IEC format (must be 10 characters)")
		return
	}
	if req.ProductType == "" {
		respondError(w, http.StatusBadRequest, "Product type is required")
		return
	}

	// Check for existing pending/approved request
	existing, err := h.repo.GetSignupRequestByEmail(r.Context(), req.Email)
	if err == nil && existing != nil && (existing.Status == "pending" || existing.Status == "approved" || existing.Status == "auto_approved") {
		respondError(w, http.StatusConflict, "An application with this email is already under review. Please wait for our response.")
		return
	}

	// Auto-approval logic: valid GSTIN + company domain email = auto-approve
	status := "pending"
	if req.GSTIN != "" && validateGSTIN(req.GSTIN) && !isFreeEmail(req.Email) {
		status = "auto_approved"
	}

	signup := &models.SignupRequest{
		CompanyName:      req.CompanyName,
		Email:            req.Email,
		GSTIN:            req.GSTIN,
		IECCode:          req.IECCode,
		ProductType:      req.ProductType,
		EstimatedBatches: req.EstimatedBatches,
		MarketRegion:     req.MarketRegion,
		Phone:            req.Phone,
		Status:           status,
	}

	if err := h.repo.CreateSignupRequest(r.Context(), signup); err != nil {
		slog.Error("Failed to create signup request", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to submit application")
		return
	}

	slog.Info("Signup request received", "company", req.CompanyName, "email", req.Email, "status", status)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":      signup.ID,
		"status":  status,
		"message": "Application submitted successfully. You'll hear from us within 24 hours.",
	})
}

// ListSignupRequests handles GET /api/v1/admin/signup-requests
// Admin only — returns pending signup requests for review.
func (h *Handler) ListSignupRequests(w http.ResponseWriter, r *http.Request) {
	// Admin check
	role := middleware.GetRole(r.Context())
	if role != "owner" && role != "admin" {
		respondError(w, http.StatusForbidden, "Admin access required")
		return
	}

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "pending"
	}

	limit := 50
	offset := 0

	requests, total, err := h.repo.ListSignupRequests(r.Context(), status, limit, offset)
	if err != nil {
		slog.Error("Failed to list signup requests", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"requests": requests,
		"total":    total,
	})
}

// ApproveSignupRequest handles POST /api/v1/admin/signup-requests/{id}/approve
func (h *Handler) ApproveSignupRequest(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "owner" && role != "admin" {
		respondError(w, http.StatusForbidden, "Admin access required")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	adminIDStr := middleware.GetTenantID(r.Context())
	adminID, _ := uuid.Parse(adminIDStr)

	if err := h.repo.UpdateSignupRequestStatus(r.Context(), id, "approved", "", adminID); err != nil {
		slog.Error("Failed to approve signup request", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to approve request")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

// RejectSignupRequest handles POST /api/v1/admin/signup-requests/{id}/reject
func (h *Handler) RejectSignupRequest(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "owner" && role != "admin" {
		respondError(w, http.StatusForbidden, "Admin access required")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		body.Reason = "Application did not meet our qualification criteria"
	}

	adminIDStr := middleware.GetTenantID(r.Context())
	adminID, _ := uuid.Parse(adminIDStr)

	if err := h.repo.UpdateSignupRequestStatus(r.Context(), id, "rejected", body.Reason, adminID); err != nil {
		slog.Error("Failed to reject signup request", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to reject request")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "rejected"})
}
