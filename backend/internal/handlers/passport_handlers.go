package handlers

import (
	"log"
	"net/http"

	"github.com/google/uuid"
)

// GetPassport handles GET /api/v1/passports/{uuid}
// This endpoint is public and used for QR code scanning
func (h *Handler) GetPassport(w http.ResponseWriter, r *http.Request) {
	uuidStr := r.PathValue("uuid")
	passportUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID format")
		return
	}

	// Get passport with batch specs (for the public passport page)
	passportWithSpecs, err := h.repo.GetPassportWithSpecs(r.Context(), passportUUID)
	if err != nil {
		if err.Error() == "passport not found" {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		log.Printf("Failed to get passport: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get passport")
		return
	}

	respondJSON(w, http.StatusOK, passportWithSpecs)
}
