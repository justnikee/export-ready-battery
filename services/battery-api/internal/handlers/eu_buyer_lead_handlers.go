package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/models"
)

// EUBuyerLeadRequest is the payload for POST /api/v1/leads/eu-buyer
type EUBuyerLeadRequest struct {
	BuyerCompanyName string `json:"buyer_company_name"`
	ContactName      string `json:"contact_name"`
	ContactEmail     string `json:"contact_email"`
	Country          string `json:"country"`
	IndianSuppliers  string `json:"indian_suppliers"`
	Message          string `json:"message"`
}

// CreateEUBuyerLead handles POST /api/v1/leads/eu-buyer
// No authentication required — public lead capture from the EU buyer landing
// page (STRAT-06). Distinct from RequestAccess (Indian manufacturer signup),
// which requires GSTIN/IEC that an EU buyer wouldn't have.
func (h *Handler) CreateEUBuyerLead(w http.ResponseWriter, r *http.Request) {
	var req EUBuyerLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.BuyerCompanyName = strings.TrimSpace(req.BuyerCompanyName)
	req.ContactName = strings.TrimSpace(req.ContactName)
	req.ContactEmail = strings.TrimSpace(strings.ToLower(req.ContactEmail))
	req.Country = strings.TrimSpace(req.Country)

	if req.BuyerCompanyName == "" {
		respondError(w, http.StatusBadRequest, "Company name is required")
		return
	}
	if req.ContactName == "" {
		respondError(w, http.StatusBadRequest, "Contact name is required")
		return
	}
	if req.ContactEmail == "" || !strings.Contains(req.ContactEmail, "@") {
		respondError(w, http.StatusBadRequest, "Valid contact email is required")
		return
	}
	if req.Country == "" {
		respondError(w, http.StatusBadRequest, "Country is required")
		return
	}

	lead := &models.EUBuyerLead{
		BuyerCompanyName: req.BuyerCompanyName,
		ContactName:      req.ContactName,
		ContactEmail:     req.ContactEmail,
		Country:          req.Country,
		IndianSuppliers:  req.IndianSuppliers,
		Message:          req.Message,
		Status:           "new",
	}

	if err := h.repo.CreateEUBuyerLead(r.Context(), lead); err != nil {
		slog.Error("Failed to create EU buyer lead", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to submit your interest. Please try again.")
		return
	}

	slog.Info("EU buyer lead received", "company", req.BuyerCompanyName, "country", req.Country)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":      lead.ID,
		"message": "Thanks for your interest. We'll be in touch shortly.",
	})
}
