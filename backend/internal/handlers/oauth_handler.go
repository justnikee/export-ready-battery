package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"anvayalabs-battery/internal/db"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"
)

// OAuthHandler handles OAuth authentication endpoints
type OAuthHandler struct {
	db           *db.DB
	repo         *repository.Repository
	authService  *services.AuthService
	oauthService *services.OAuthService
	frontendURL  string
}

// NewOAuthHandler creates a new OAuth handler
func NewOAuthHandler(database *db.DB, repo *repository.Repository, authService *services.AuthService, oauthService *services.OAuthService, frontendURL string) *OAuthHandler {
	return &OAuthHandler{
		db:           database,
		repo:         repo,
		authService:  authService,
		oauthService: oauthService,
		frontendURL:  frontendURL,
	}
}

// generateState generates a random state token for CSRF protection
func generateState() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func parseOAuthProductType(raw string) (models.ProductType, error) {
	if raw == "" {
		return models.DefaultProductType(), nil
	}

	pt := models.ProductType(raw)
	if !pt.IsValid() || pt == models.ProductTypeElectronics {
		return "", fmt.Errorf("invalid product type")
	}

	return pt, nil
}

func productLoginPath(pt models.ProductType) string {
	if pt == models.ProductTypeTextile {
		return "/textile/login"
	}

	return "/battery/login"
}

// GoogleRedirect handles GET /api/v1/auth/google
func (h *OAuthHandler) GoogleRedirect(w http.ResponseWriter, r *http.Request) {
	if !h.oauthService.GoogleEnabled() {
		respondError(w, http.StatusServiceUnavailable, "Google OAuth is not configured")
		return
	}

	productType, err := parseOAuthProductType(r.URL.Query().Get("product_type"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product_type. Must be BATTERY or TEXTILE")
		return
	}

	state, err := generateState()
	if err != nil {
		slog.Error("Failed to generate OAuth state", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to initiate OAuth")
		return
	}

	// Store state in a short-lived cookie (5 minutes).
	// Secure must be true in production (HTTPS) — without it the browser
	// will NOT send the cookie back on the callback, causing a state mismatch.
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_product_type",
		Value:    string(productType),
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	authURL := h.oauthService.GetGoogleAuthURL(state)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// GoogleCallback handles GET /api/v1/auth/google/callback
func (h *OAuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	h.handleOAuthCallback(w, r, "google")
}

// MicrosoftRedirect handles GET /api/v1/auth/microsoft
func (h *OAuthHandler) MicrosoftRedirect(w http.ResponseWriter, r *http.Request) {
	if !h.oauthService.MicrosoftEnabled() {
		respondError(w, http.StatusServiceUnavailable, "Microsoft OAuth is not configured")
		return
	}

	productType, err := parseOAuthProductType(r.URL.Query().Get("product_type"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product_type. Must be BATTERY or TEXTILE")
		return
	}

	state, err := generateState()
	if err != nil {
		slog.Error("Failed to generate OAuth state", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to initiate OAuth")
		return
	}

	// Store state in a short-lived cookie (5 minutes).
	// Secure must be true in production (HTTPS) — without it the browser
	// will NOT send the cookie back on the callback, causing a state mismatch.
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_product_type",
		Value:    string(productType),
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	authURL := h.oauthService.GetMicrosoftAuthURL(state)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// MicrosoftCallback handles GET /api/v1/auth/microsoft/callback
func (h *OAuthHandler) MicrosoftCallback(w http.ResponseWriter, r *http.Request) {
	h.handleOAuthCallback(w, r, "microsoft")
}

// handleOAuthCallback is the shared callback logic for Google and Microsoft
func (h *OAuthHandler) handleOAuthCallback(w http.ResponseWriter, r *http.Request, provider string) {
	// Check for OAuth error
	if errParam := r.URL.Query().Get("error"); errParam != "" {
		errDesc := r.URL.Query().Get("error_description")
		slog.Warn("OAuth error from provider", "provider", provider, "error", errParam, "description", errDesc)
		h.redirectWithError(w, r, "Authentication was cancelled or failed")
		return
	}

	// Validate state (CSRF protection)
	state := r.URL.Query().Get("state")
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != state || state == "" {
		slog.Warn("OAuth state mismatch", "provider", provider)
		h.redirectWithError(w, r, "Invalid OAuth state. Please try again.")
		return
	}

	productType := models.DefaultProductType()
	if productCookie, err := r.Cookie("oauth_product_type"); err == nil {
		parsedProductType, parseErr := parseOAuthProductType(productCookie.Value)
		if parseErr == nil {
			productType = parsedProductType
		}
	}

	// Clear state cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_product_type",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	// Exchange code for profile
	code := r.URL.Query().Get("code")
	if code == "" {
		h.redirectWithError(w, r, "No authorization code received")
		return
	}

	var profile *services.OAuthProfile
	switch provider {
	case "google":
		profile, err = h.oauthService.ExchangeGoogleCode(r.Context(), code)
	case "microsoft":
		profile, err = h.oauthService.ExchangeMicrosoftCode(r.Context(), code)
	default:
		h.redirectWithError(w, r, "Unknown OAuth provider")
		return
	}

	if err != nil {
		slog.Error("Failed to exchange OAuth code", "provider", provider, "error", err)
		h.redirectWithError(w, r, "Failed to authenticate with "+provider)
		return
	}

	// Find or create tenant
	tenantID, companyName, err := h.findOrCreateTenant(r.Context(), profile, productType)
	if err != nil {
		slog.Error("Failed to find/create tenant for OAuth", "provider", provider, "error", err)
		h.redirectWithError(w, r, "Failed to create account")
		return
	}

	// Update last login
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET last_login = $1 WHERE id = $2",
		time.Now(), tenantID)

	// Generate tokens (OAuth users are pre-verified owners)
	const oauthRole = "owner"
	token, err := h.authService.GenerateToken(tenantID.String(), profile.Email, oauthRole, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	refreshToken, jti, err := h.authService.GenerateRefreshToken(tenantID.String(), profile.Email, oauthRole, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	// Persist JTI for refresh token revocation
	expires := time.Now().Add(h.authService.GetRefreshExpiry())
	h.db.Pool.Exec(r.Context(),
		`UPDATE public.tenants SET refresh_token_jti = $1, refresh_token_expires = $2 WHERE id = $3`,
		jti, expires, tenantID)

	// Set the refresh token in an HttpOnly cookie (same helper used by Login/Refresh)
	// This must be done BEFORE the redirect so the Set-Cookie header is sent
	// with this response. Passing tokens in URLs leaks them to browser history
	// and server access logs.
	setRefreshCookie(w, refreshToken, h.authService.GetRefreshExpiry())

	// Redirect to frontend callback page — no refresh_token in URL
	callbackURL := fmt.Sprintf("%s/auth/callback?token=%s&tenant_id=%s&email=%s&company_name=%s&product_type=%s",
		h.frontendURL,
		url.QueryEscape(token),
		url.QueryEscape(tenantID.String()),
		url.QueryEscape(profile.Email),
		url.QueryEscape(companyName),
		url.QueryEscape(string(productType)),
	)

	http.Redirect(w, r, callbackURL, http.StatusTemporaryRedirect)
}

// findOrCreateTenant finds an existing tenant by email or creates a new one for OAuth users
func (h *OAuthHandler) findOrCreateTenant(ctx context.Context, profile *services.OAuthProfile, productType models.ProductType) (uuid.UUID, string, error) {
	// First, try to find existing tenant by email
	var tenantID uuid.UUID
	var companyName string
	err := h.db.Pool.QueryRow(ctx,
		"SELECT id, company_name FROM public.tenants WHERE email = $1",
		profile.Email).Scan(&tenantID, &companyName)

	if err == nil {
		// Existing tenant found — update OAuth provider info if not set
		h.db.Pool.Exec(ctx,
			`UPDATE public.tenants SET oauth_provider = $1, oauth_provider_id = $2 
			 WHERE id = $3 AND oauth_provider IS NULL`,
			profile.Provider, profile.ProviderID, tenantID)
		return tenantID, companyName, nil
	}

	if err != pgx.ErrNoRows {
		return uuid.UUID{}, "", fmt.Errorf("failed to query tenant: %w", err)
	}

	// New user — create tenant
	// Use the name from OAuth as company_name fallback (user will complete in onboarding)
	tenantID = uuid.New()
	companyName = profile.Name // Could be user's display name; onboarding will ask for real company name

	_, err = h.db.Pool.Exec(ctx,
		`INSERT INTO public.tenants (id, company_name, email, product_type, oauth_provider, oauth_provider_id, email_verified, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
		tenantID, companyName, profile.Email, productType, profile.Provider, profile.ProviderID, time.Now())
	if err != nil {
		return uuid.UUID{}, "", fmt.Errorf("failed to create tenant: %w", err)
	}

	// Check and link pending team invitations
	pendingInvites, err := h.repo.GetPendingInvitesByEmail(ctx, profile.Email)
	if err == nil {
		for _, invite := range pendingInvites {
			if err := h.repo.UpdateTeamMemberStatus(ctx, invite.ID, models.TeamStatusActive, &tenantID); err != nil {
				slog.Warn("Failed to activate pending invite", "team_id", invite.TenantID, "error", err)
			}
		}
	}

	return tenantID, companyName, nil
}

// redirectWithError redirects to the frontend login page with an error message
func (h *OAuthHandler) redirectWithError(w http.ResponseWriter, r *http.Request, message string) {
	productType := models.DefaultProductType()
	if productCookie, err := r.Cookie("oauth_product_type"); err == nil {
		parsedProductType, parseErr := parseOAuthProductType(productCookie.Value)
		if parseErr == nil {
			productType = parsedProductType
		}
	}

	errorURL := fmt.Sprintf("%s%s?error=%s", h.frontendURL, productLoginPath(productType), url.QueryEscape(message))
	http.Redirect(w, r, errorURL, http.StatusTemporaryRedirect)
}
