package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// TrustedPartnerHandler handles trusted partner and partner code management
type TrustedPartnerHandler struct {
	repo *repository.Repository
}

// NewTrustedPartnerHandler creates a new trusted partner handler
func NewTrustedPartnerHandler(repo *repository.Repository) *TrustedPartnerHandler {
	return &TrustedPartnerHandler{repo: repo}
}

// ============================================================================
// TRUSTED PARTNERS (Tier A)
// ============================================================================

// CreateTrustedPartnerRequest is the request body for creating a trusted partner
type CreateTrustedPartnerRequest struct {
	CompanyName  string `json:"company_name"`
	EmailDomain  string `json:"email_domain"` // e.g., "recycler.eu"
	Role         string `json:"role"`         // TECHNICIAN, RECYCLER, LOGISTICS
	ContactEmail string `json:"contact_email,omitempty"`
	ContactPhone string `json:"contact_phone,omitempty"`
	Notes        string `json:"notes,omitempty"`
}

// CreateTrustedPartner handles POST /api/v1/partners/trusted
func (h *TrustedPartnerHandler) CreateTrustedPartner(w http.ResponseWriter, r *http.Request) {
	// Get tenant ID from context (set by auth middleware)
	tenantID, ok := r.Context().Value("tenant_id").(uuid.UUID)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Tenant ID not found in context")
		return
	}

	var req CreateTrustedPartnerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "company_name is required")
		return
	}
	if req.EmailDomain == "" {
		respondError(w, http.StatusBadRequest, "email_domain is required")
		return
	}
	if req.Role == "" {
		respondError(w, http.StatusBadRequest, "role is required")
		return
	}

	// Validate email domain format (should not include @)
	if strings.Contains(req.EmailDomain, "@") {
		respondError(w, http.StatusBadRequest, "email_domain should not include @. Example: 'recycler.eu'")
		return
	}

	partner := &repository.TrustedPartner{
		TenantID:     tenantID,
		CompanyName:  req.CompanyName,
		EmailDomain:  strings.ToLower(req.EmailDomain),
		Role:         req.Role,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
		Notes:        req.Notes,
		IsActive:     true,
	}

	if err := h.repo.CreateTrustedPartner(r.Context(), partner); err != nil {
		log.Printf("Failed to create trusted partner: %v", err)
		if strings.Contains(err.Error(), "unique_trusted_partner") {
			respondError(w, http.StatusConflict, "This email domain is already registered for this role")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create trusted partner")
		return
	}

	log.Printf("✅ Trusted partner created: %s (%s) for tenant %s", req.CompanyName, req.EmailDomain, tenantID)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"partner": partner,
	})
}

// ListTrustedPartners handles GET /api/v1/partners/trusted
func (h *TrustedPartnerHandler) ListTrustedPartners(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := r.Context().Value("tenant_id").(uuid.UUID)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Tenant ID not found in context")
		return
	}

	partners, err := h.repo.ListTrustedPartners(r.Context(), tenantID)
	if err != nil {
		log.Printf("Failed to list trusted partners: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to list trusted partners")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"partners": partners,
		"count":    len(partners),
	})
}

// DeleteTrustedPartner handles DELETE /api/v1/partners/trusted/{id}
func (h *TrustedPartnerHandler) DeleteTrustedPartner(w http.ResponseWriter, r *http.Request) {
	// Extract ID from path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	idStr := pathParts[len(pathParts)-1]

	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid partner ID")
		return
	}

	if err := h.repo.DeleteTrustedPartner(r.Context(), id); err != nil {
		log.Printf("Failed to delete trusted partner: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to delete trusted partner")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Trusted partner deleted",
	})
}

// ============================================================================
// PARTNER CODES (Tier B)
// ============================================================================

// CreatePartnerCodeRequest is the request body for creating a partner code
type CreatePartnerCodeRequest struct {
	Code        string     `json:"code"`        // e.g., "INSTALL-2026"
	Role        string     `json:"role"`        // What role this code grants
	Description string     `json:"description"` // e.g., "Q1 2026 Installation Partners"
	MaxUses     *int       `json:"max_uses"`    // NULL = unlimited
	ExpiresAt   *time.Time `json:"expires_at"`  // NULL = never expires
}

// CreatePartnerCode handles POST /api/v1/partners/codes
func (h *TrustedPartnerHandler) CreatePartnerCode(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := r.Context().Value("tenant_id").(uuid.UUID)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Tenant ID not found in context")
		return
	}

	var req CreatePartnerCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Code == "" {
		respondError(w, http.StatusBadRequest, "code is required")
		return
	}
	if req.Role == "" {
		respondError(w, http.StatusBadRequest, "role is required")
		return
	}

	// Validate code format (alphanumeric + hyphens only)
	code := strings.ToUpper(req.Code)
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-') {
			respondError(w, http.StatusBadRequest, "Code can only contain letters, numbers, and hyphens")
			return
		}
	}

	partnerCode := &repository.PartnerCode{
		TenantID:    tenantID,
		Code:        code,
		Role:        req.Role,
		Description: req.Description,
		MaxUses:     req.MaxUses,
		ExpiresAt:   req.ExpiresAt,
		IsActive:    true,
	}

	if err := h.repo.CreatePartnerCode(r.Context(), partnerCode); err != nil {
		log.Printf("Failed to create partner code: %v", err)
		if strings.Contains(err.Error(), "unique_partner_code") {
			respondError(w, http.StatusConflict, "This code already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create partner code")
		return
	}

	log.Printf("✅ Partner code created: %s (%s) for tenant %s", code, req.Role, tenantID)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"code":    partnerCode,
	})
}

// ListPartnerCodes handles GET /api/v1/partners/codes
func (h *TrustedPartnerHandler) ListPartnerCodes(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := r.Context().Value("tenant_id").(uuid.UUID)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Tenant ID not found in context")
		return
	}

	codes, err := h.repo.ListPartnerCodes(r.Context(), tenantID)
	if err != nil {
		log.Printf("Failed to list partner codes: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to list partner codes")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"codes":   codes,
		"count":   len(codes),
	})
}

// DeactivatePartnerCode handles DELETE /api/v1/partners/codes/{id}
func (h *TrustedPartnerHandler) DeactivatePartnerCode(w http.ResponseWriter, r *http.Request) {
	// Extract ID from path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		respondError(w, http.StatusBadRequest, "Invalid URL path")
		return
	}
	idStr := pathParts[len(pathParts)-1]

	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid code ID")
		return
	}

	if err := h.repo.DeactivatePartnerCode(r.Context(), id); err != nil {
		log.Printf("Failed to deactivate partner code: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to deactivate partner code")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Partner code deactivated",
	})
}
