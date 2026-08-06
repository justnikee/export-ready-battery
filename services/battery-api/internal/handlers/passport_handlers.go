package handlers

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/auth"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"

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
		respondError(w, http.StatusInternalServerError, "Failed to get passport: "+sanitizeDBError(err))
		return
	}

	tenantID := uuid.Nil
	if passportWithSpecs.Tenant != nil {
		tenantID = passportWithSpecs.Tenant.ID
	}

	// Detect access tier (S-12: regulator keys are scoped + audited)
	tier := h.detectAccessTier(r, passportUUID, tenantID, string(passportWithSpecs.MarketRegion))

	// S5 Security fix: Parse tenant's DataVisibility config for view filtering
	var displayConfig models.DisplayConfig
	if passportWithSpecs.Tenant != nil {
		displayConfig = models.ParseDisplayConfig(passportWithSpecs.Tenant.DataVisibility)
	}

	// S-10: re-sign private-bucket cert refs on the source tenant so all view
	// builders (public/partner/regulator) emit short-lived signed URLs.
	h.signTenantCertPathsInPlace(r.Context(), passportWithSpecs.Tenant)

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
		partnerView := models.BuildPartnerView(passportWithSpecs)
		models.ApplyDisplayConfigToPartnerView(partnerView, displayConfig)
		respondJSON(w, http.StatusOK, partnerView)

	default:
		publicView := models.BuildPublicView(passportWithSpecs)
		models.ApplyDisplayConfigToPublicView(publicView, displayConfig)
		respondJSON(w, http.StatusOK, publicView)
	}
}

// signTenantCertPathsInPlace mutates the tenant profile cert paths to short-lived
// signed URLs for private compliance-docs objects (S-10).
func (h *Handler) signTenantCertPathsInPlace(ctx context.Context, tenant *models.Tenant) {
	if tenant == nil || h.storageService == nil {
		return
	}
	if u, err := resolveFreshBucketURL(ctx, h.storageService, tenant.BatteryProfile.EPRCertificatePath); err == nil && u != "" {
		tenant.BatteryProfile.EPRCertificatePath = u
	}
	if u, err := resolveFreshBucketURL(ctx, h.storageService, tenant.BatteryProfile.BISCertificatePath); err == nil && u != "" {
		tenant.BatteryProfile.BISCertificatePath = u
	}
	if u, err := resolveFreshBucketURL(ctx, h.storageService, tenant.BatteryProfile.PLICertificatePath); err == nil && u != "" {
		tenant.BatteryProfile.PLICertificatePath = u
	}
}

// detectAccessTier determines the caller's access level from request headers.
//
// Priority: Regulator > Partner > Public
// - X-Regulator-Key → DB-backed scoped regulator keys (S-12), then env REGULATOR_API_KEY bootstrap
// - ?access_token=<token> → data_access_tokens (REGULATOR only if token.tenant_id matches passport tenant)
// - Authorization: Bearer <token> → magic-link token for this passport → partner
// - No auth → public
func (h *Handler) detectAccessTier(r *http.Request, passportID, tenantID uuid.UUID, market string) models.AccessTier {
	clientIP := middleware.ClientIP(r)
	userAgent := r.UserAgent()

	// 1. Regulator check (highest priority) — S-12 scoped + audited
	if regKey := r.Header.Get("X-Regulator-Key"); regKey != "" {
		if h.regulatorKeyService != nil {
			result := h.regulatorKeyService.AuthorizeRegulatorKey(
				r.Context(), regKey, passportID, tenantID, market, clientIP, userAgent,
			)
			if result.Allowed {
				return models.AccessTierRegulator
			}
			// Present-but-invalid/out-of-scope key: fall through (do not leak via hard 401)
		} else if h.regulatorAPIKey != "" {
			// Minimal fallback if service not wired: env key only (global)
			result := services.NewRegulatorKeyService(nil, h.regulatorAPIKey).AuthorizeRegulatorKey(
				r.Context(), regKey, passportID, tenantID, market, clientIP, userAgent,
			)
			if result.Allowed {
				return models.AccessTierRegulator
			}
		}
	}

	// 2. Data Access Token (query param ?access_token=...)
	if accessToken := r.URL.Query().Get("access_token"); accessToken != "" && h.dataAccessService != nil {
		token, err := h.dataAccessService.ValidateToken(r.Context(), accessToken)
		if err == nil && token != nil {
			// S-12: REGULATOR data-access tokens are tenant-scoped — never global.
			if token.AccessTier == "REGULATOR" {
				if tenantID != uuid.Nil && token.TenantID == tenantID {
					if h.regulatorKeyService != nil {
						h.regulatorKeyService.LogDataAccessRegulator(
							r.Context(), token.Label, passportID, tenantID, market, clientIP, userAgent,
						)
					}
					return models.AccessTierRegulator
				}
				// Wrong tenant → treat as unauthenticated for this passport
				return models.AccessTierPublic
			}
			// PARTNER data-access tokens are also tenant-scoped
			if tenantID != uuid.Nil && token.TenantID != tenantID {
				return models.AccessTierPublic
			}
			return models.AccessTierPartner
		}
	}

	// 3. Partner check via magic-link access_token
	if tokenString := extractBearerToken(r); tokenString != "" {
		tokenHash := auth.HashToken(tokenString)
		record, err := h.repo.GetMagicLinkTokenByHash(r.Context(), tokenHash)
		if err == nil && record != nil && record.PassportID == passportID {
			// Valid magic-link token for this passport → partner access
			return models.AccessTierPartner
		}
	}

	// 4. Default: public
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
