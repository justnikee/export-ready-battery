package handlers

import (
	"crypto/subtle"
	"log/slog"
	"net/http"

	"exportready-battery/internal/auth"
	"exportready-battery/internal/models"

	"github.com/google/uuid"
)

// GetPassport handles GET /api/v1/passports/{uuid}
//
// Three-Layer Data Access (EU 2023/1542 Art 78):
//
//	PUBLIC    — No auth header → PublicPassportView (consumer-safe)
//	PARTNER   — Authorization: Bearer <magic_link_token> → PartnerPassportView
//	REGULATOR — X-Regulator-Key: <key> → RegulatorPassportView (full + events)
func (h *Handler) GetPassport(w http.ResponseWriter, r *http.Request) {
	uuidStr := r.PathValue("uuid")
	passportUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID format")
		return
	}

	// Get passport with batch specs (needed by all tiers)
	passportWithSpecs, err := h.repo.GetPassportWithSpecs(r.Context(), passportUUID)
	if err != nil {
		if err.Error() == "passport not found" {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		slog.Error("Failed to get passport", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get passport")
		return
	}

	// Detect access tier
	tier := h.detectAccessTier(r, passportUUID)

	switch tier {
	case models.AccessTierRegulator:
		events, err := h.repo.GetPassportEvents(r.Context(), passportUUID)
		if err != nil {
			slog.Error("Failed to get passport events for regulator view", "error", err)
			// Degrade gracefully — return regulator view without events
			events = nil
		}
		respondJSON(w, http.StatusOK, models.BuildRegulatorView(passportWithSpecs, events))

	case models.AccessTierPartner:
		respondJSON(w, http.StatusOK, models.BuildPartnerView(passportWithSpecs))

	default:
		respondJSON(w, http.StatusOK, models.BuildPublicView(passportWithSpecs))
	}
}

// detectAccessTier determines the caller's access level from request headers.
//
// Priority: Regulator > Partner > Public
// - X-Regulator-Key header → matched against env REGULATOR_API_KEY
// - Authorization: Bearer <token> → validated as an unused magic-link token for this passport
// - No auth → public
func (h *Handler) detectAccessTier(r *http.Request, passportID uuid.UUID) models.AccessTier {
	// 1. Regulator check (highest priority)
	if regKey := r.Header.Get("X-Regulator-Key"); regKey != "" {
		if h.regulatorAPIKey != "" && subtle.ConstantTimeCompare([]byte(regKey), []byte(h.regulatorAPIKey)) == 1 {
			return models.AccessTierRegulator
		}
		// Invalid key — fall through to partner/public
	}

	// 2. Partner check via magic-link access_token
	if tokenString := extractBearerToken(r); tokenString != "" {
		tokenHash := auth.HashToken(tokenString)
		record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
		if err == nil && record != nil && record.PassportID == passportID {
			// Valid magic-link token for this passport → partner access
			return models.AccessTierPartner
		}
	}

	// 3. Default: public
	return models.AccessTierPublic
}

// extractBearerToken extracts the token from "Authorization: Bearer <token>"
func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}
	return ""
}
