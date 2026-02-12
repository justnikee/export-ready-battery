package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/db"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
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

// GoogleRedirect handles GET /api/v1/auth/google
func (h *OAuthHandler) GoogleRedirect(w http.ResponseWriter, r *http.Request) {
	if !h.oauthService.GoogleEnabled() {
		respondError(w, http.StatusServiceUnavailable, "Google OAuth is not configured")
		return
	}

	state, err := generateState()
	if err != nil {
		log.Printf("Failed to generate OAuth state: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to initiate OAuth")
		return
	}

	// Store state in a short-lived cookie (5 minutes)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
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

	state, err := generateState()
	if err != nil {
		log.Printf("Failed to generate OAuth state: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to initiate OAuth")
		return
	}

	// Store state in a short-lived cookie (5 minutes)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
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
		log.Printf("OAuth error from %s: %s - %s", provider, errParam, errDesc)
		h.redirectWithError(w, r, "Authentication was cancelled or failed")
		return
	}

	// Validate state (CSRF protection)
	state := r.URL.Query().Get("state")
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != state || state == "" {
		log.Printf("OAuth state mismatch for %s", provider)
		h.redirectWithError(w, r, "Invalid OAuth state. Please try again.")
		return
	}

	// Clear state cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
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
		log.Printf("Failed to exchange %s code: %v", provider, err)
		h.redirectWithError(w, r, "Failed to authenticate with "+provider)
		return
	}

	// Find or create tenant
	tenantID, companyName, err := h.findOrCreateTenant(r.Context(), profile)
	if err != nil {
		log.Printf("Failed to find/create tenant for %s OAuth: %v", provider, err)
		h.redirectWithError(w, r, "Failed to create account")
		return
	}

	// Update last login
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET last_login = $1 WHERE id = $2",
		time.Now(), tenantID)

	// Generate tokens
	token, err := h.authService.GenerateToken(tenantID.String(), profile.Email)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken(tenantID.String(), profile.Email)
	if err != nil {
		log.Printf("Failed to generate refresh token: %v", err)
		h.redirectWithError(w, r, "Failed to generate authentication token")
		return
	}

	// Redirect to frontend callback page with tokens
	callbackURL := fmt.Sprintf("%s/auth/callback?token=%s&refresh_token=%s&tenant_id=%s&email=%s&company_name=%s",
		h.frontendURL,
		url.QueryEscape(token),
		url.QueryEscape(refreshToken),
		url.QueryEscape(tenantID.String()),
		url.QueryEscape(profile.Email),
		url.QueryEscape(companyName),
	)

	http.Redirect(w, r, callbackURL, http.StatusTemporaryRedirect)
}

// findOrCreateTenant finds an existing tenant by email or creates a new one for OAuth users
func (h *OAuthHandler) findOrCreateTenant(ctx context.Context, profile *services.OAuthProfile) (uuid.UUID, string, error) {
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
		`INSERT INTO public.tenants (id, company_name, email, oauth_provider, oauth_provider_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		tenantID, companyName, profile.Email, profile.Provider, profile.ProviderID, time.Now())
	if err != nil {
		return uuid.UUID{}, "", fmt.Errorf("failed to create tenant: %w", err)
	}

	// Check and link pending team invitations
	pendingInvites, err := h.repo.GetPendingInvitesByEmail(ctx, profile.Email)
	if err == nil {
		for _, invite := range pendingInvites {
			if err := h.repo.UpdateTeamMemberStatus(ctx, invite.ID, models.TeamStatusActive, &tenantID); err != nil {
				log.Printf("Failed to activate pending invite for team %s: %v", invite.TenantID, err)
			}
		}
	}

	return tenantID, companyName, nil
}

// redirectWithError redirects to the frontend login page with an error message
func (h *OAuthHandler) redirectWithError(w http.ResponseWriter, r *http.Request, message string) {
	errorURL := fmt.Sprintf("%s/login?error=%s", h.frontendURL, url.QueryEscape(message))
	http.Redirect(w, r, errorURL, http.StatusTemporaryRedirect)
}
