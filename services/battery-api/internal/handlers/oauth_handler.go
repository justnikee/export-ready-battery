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

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
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
	if !pt.IsValid() {
		return "", fmt.Errorf("invalid product type")
	}

	return pt, nil
}

func productLoginPath(_ models.ProductType) string {
	return "/login"
}

// GoogleRedirect handles GET /api/v1/auth/google
func (h *OAuthHandler) GoogleRedirect(w http.ResponseWriter, r *http.Request) {
	if !h.oauthService.GoogleEnabled() {
		respondError(w, http.StatusServiceUnavailable, "Google OAuth is not configured")
		return
	}

	productType, err := parseOAuthProductType(r.URL.Query().Get("product_type"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product_type. Must be BATTERY or ELECTRONICS")
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
		respondError(w, http.StatusBadRequest, "Invalid product_type. Must be BATTERY or ELECTRONICS")
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

	// Find or create the user identity + resolve their tenant and role.
	tenantID, userID, companyName, role, err := h.findOrCreateUser(r.Context(), profile, productType)
	if err != nil {
		slog.Error("Failed to find/create user for OAuth", "provider", provider, "error", err)
		h.redirectWithError(w, r, "Failed to create account")
		return
	}

	// Update last login (per-user)
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.users SET last_login = $1 WHERE id = $2",
		time.Now(), userID)

	// Generate tokens with identity + resolved role.
	token, err := h.authService.GenerateToken(tenantID.String(), userID.String(), profile.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	refreshToken, jti, err := h.authService.GenerateRefreshToken(tenantID.String(), userID.String(), profile.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	// Persist JTI for refresh token revocation (per-user session)
	expires := time.Now().Add(h.authService.GetRefreshExpiry())
	h.db.Pool.Exec(r.Context(),
		`UPDATE public.users SET refresh_token_jti = $1, refresh_token_expires = $2 WHERE id = $3`,
		jti, expires, userID)

	// Set HttpOnly cookies BEFORE redirect (S-06: do not put access JWT in the
	// callback URL — history, Referer, and proxy logs would capture it).
	setRefreshCookie(w, refreshToken, h.authService.GetRefreshExpiry())
	setAuthCookie(w, token, h.authService.GetTokenExpiry())

	// Frontend /auth/callback rehydrates the in-memory access token via
	// POST /auth/refresh (refresh_token cookie) — no secrets in the query string.
	callbackURL := fmt.Sprintf("%s/auth/callback?oauth=1&tenant_id=%s&email=%s&company_name=%s&product_type=%s",
		h.frontendURL,
		url.QueryEscape(tenantID.String()),
		url.QueryEscape(profile.Email),
		url.QueryEscape(companyName),
		url.QueryEscape(string(productType)),
	)

	http.Redirect(w, r, callbackURL, http.StatusTemporaryRedirect)
}

// findOrCreateTenant finds an existing tenant by email or creates a new one for OAuth users
// findOrCreateUser ensures an OAuth login has a user identity, links any pending
// invites, and resolves the tenant + role it should act as. Creates a fresh org
// (OWNER) only when the user belongs to none.
func (h *OAuthHandler) findOrCreateUser(ctx context.Context, profile *services.OAuthProfile, productType models.ProductType) (tenantID uuid.UUID, userID uuid.UUID, companyName string, role string, err error) {
	// 1. Ensure a user identity exists.
	uErr := h.db.Pool.QueryRow(ctx, "SELECT id FROM public.users WHERE email = $1", profile.Email).Scan(&userID)
	switch {
	case uErr == pgx.ErrNoRows:
		userID = uuid.New()
		if _, err = h.db.Pool.Exec(ctx,
			`INSERT INTO public.users (id, email, oauth_provider, oauth_provider_id, email_verified, created_at)
			 VALUES ($1, $2, $3, $4, true, $5)`,
			userID, profile.Email, profile.Provider, profile.ProviderID, time.Now()); err != nil {
			return uuid.UUID{}, uuid.UUID{}, "", "", fmt.Errorf("failed to create user: %w", err)
		}
	case uErr != nil:
		return uuid.UUID{}, uuid.UUID{}, "", "", fmt.Errorf("failed to query user: %w", uErr)
	default:
		h.db.Pool.Exec(ctx,
			`UPDATE public.users SET oauth_provider = $1, oauth_provider_id = $2, email_verified = true
			 WHERE id = $3 AND oauth_provider IS NULL`,
			profile.Provider, profile.ProviderID, userID)
	}

	// 2. Link any pending invites to this user identity.
	if invites, iErr := h.repo.GetPendingInvitesByEmail(ctx, profile.Email); iErr == nil {
		for _, inv := range invites {
			if e := h.repo.UpdateTeamMemberStatus(ctx, inv.ID, models.TeamStatusActive, &userID); e != nil {
				slog.Warn("Failed to activate pending invite", "team_id", inv.TenantID, "error", e)
			}
		}
	}

	// 3. Resolve an existing membership (OWNER-preferred).
	err = h.db.Pool.QueryRow(ctx,
		`SELECT tm.tenant_id, tm.role, t.company_name
		   FROM team_members tm JOIN public.tenants t ON t.id = tm.tenant_id
		  WHERE tm.user_id = $1 AND tm.status = 'ACTIVE'
		  ORDER BY (tm.role = 'OWNER') DESC, tm.created_at ASC LIMIT 1`,
		userID).Scan(&tenantID, &role, &companyName)
	if err == nil {
		return tenantID, userID, companyName, role, nil
	}
	if err != pgx.ErrNoRows {
		return uuid.UUID{}, uuid.UUID{}, "", "", fmt.Errorf("failed to resolve membership: %w", err)
	}

	// 4. No org yet → create a tenant + OWNER membership for this user.
	tenantID = uuid.New()
	companyName = profile.Name // display name; onboarding collects the real company name
	tx, txErr := h.db.Pool.Begin(ctx)
	if txErr != nil {
		return uuid.UUID{}, uuid.UUID{}, "", "", txErr
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx,
		`INSERT INTO public.tenants (id, company_name, email, product_type, oauth_provider, oauth_provider_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		tenantID, companyName, profile.Email, productType, profile.Provider, profile.ProviderID, time.Now()); err != nil {
		return uuid.UUID{}, uuid.UUID{}, "", "", fmt.Errorf("failed to create tenant: %w", err)
	}
	if _, err = tx.Exec(ctx,
		`INSERT INTO team_members (id, tenant_id, email, role, status, user_id, created_at, accepted_at)
		 VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', $4, $5, $5)`,
		uuid.New(), tenantID, profile.Email, userID, time.Now()); err != nil {
		return uuid.UUID{}, uuid.UUID{}, "", "", fmt.Errorf("failed to create owner membership: %w", err)
	}
	if err = tx.Commit(ctx); err != nil {
		return uuid.UUID{}, uuid.UUID{}, "", "", err
	}
	return tenantID, userID, companyName, models.TeamRoleOwner, nil
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
