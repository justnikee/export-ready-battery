package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/microsoft"
)

// OAuthProfile represents the user profile returned by an OAuth provider
type OAuthProfile struct {
	Email      string
	Name       string
	ProviderID string
	Provider   string // "google" or "microsoft"
}

// OAuthService handles OAuth2 flows for Google and Microsoft
type OAuthService struct {
	googleConfig     *oauth2.Config
	microsoftConfig  *oauth2.Config
	googleEnabled    bool
	microsoftEnabled bool
}

// NewOAuthService creates a new OAuth service.
// publicBaseURL is the browser-facing origin (FRONTEND_URL). The Google
// callback is /api/v1/auth/google/callback on that origin and is rewritten
// to battery-api so Set-Cookie stays first-party.
func NewOAuthService(googleClientID, googleClientSecret, microsoftClientID, microsoftClientSecret, publicBaseURL string) *OAuthService {
	svc := &OAuthService{}
	publicBaseURL = strings.TrimRight(publicBaseURL, "/")

	if googleClientID != "" && googleClientSecret != "" {
		svc.googleConfig = &oauth2.Config{
			ClientID:     googleClientID,
			ClientSecret: googleClientSecret,
			RedirectURL:  publicBaseURL + "/api/v1/auth/google/callback",
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		}
		svc.googleEnabled = true
	}

	if microsoftClientID != "" && microsoftClientSecret != "" {
		svc.microsoftConfig = &oauth2.Config{
			ClientID:     microsoftClientID,
			ClientSecret: microsoftClientSecret,
			RedirectURL:  publicBaseURL + "/api/v1/auth/microsoft/callback",
			Scopes:       []string{"openid", "email", "profile", "User.Read"},
			Endpoint:     microsoft.AzureADEndpoint("common"),
		}
		svc.microsoftEnabled = true
	}

	return svc
}

// GoogleEnabled returns whether Google OAuth is configured
func (s *OAuthService) GoogleEnabled() bool {
	return s.googleEnabled
}

// MicrosoftEnabled returns whether Microsoft OAuth is configured
func (s *OAuthService) MicrosoftEnabled() bool {
	return s.microsoftEnabled
}

// GetGoogleAuthURL returns the Google OAuth consent URL
func (s *OAuthService) GetGoogleAuthURL(state string) string {
	if !s.googleEnabled {
		return ""
	}
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// GetMicrosoftAuthURL returns the Microsoft OAuth consent URL
func (s *OAuthService) GetMicrosoftAuthURL(state string) string {
	if !s.microsoftEnabled {
		return ""
	}
	return s.microsoftConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// ExchangeGoogleCode exchanges a Google auth code for a user profile
func (s *OAuthService) ExchangeGoogleCode(ctx context.Context, code string) (*OAuthProfile, error) {
	if !s.googleEnabled {
		return nil, fmt.Errorf("Google OAuth not configured")
	}

	token, err := s.googleConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange Google code: %w", err)
	}

	// Fetch user info from Google
	client := s.googleConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get Google user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Google response: %w", err)
	}

	var googleUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal(body, &googleUser); err != nil {
		return nil, fmt.Errorf("failed to parse Google user info: %w", err)
	}

	if googleUser.Email == "" {
		return nil, fmt.Errorf("Google did not return an email address")
	}

	return &OAuthProfile{
		Email:      googleUser.Email,
		Name:       googleUser.Name,
		ProviderID: googleUser.ID,
		Provider:   "google",
	}, nil
}

// ExchangeMicrosoftCode exchanges a Microsoft auth code for a user profile
func (s *OAuthService) ExchangeMicrosoftCode(ctx context.Context, code string) (*OAuthProfile, error) {
	if !s.microsoftEnabled {
		return nil, fmt.Errorf("Microsoft OAuth not configured")
	}

	token, err := s.microsoftConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange Microsoft code: %w", err)
	}

	// Fetch user info from Microsoft Graph
	client := s.microsoftConfig.Client(ctx, token)
	resp, err := client.Get("https://graph.microsoft.com/v1.0/me")
	if err != nil {
		return nil, fmt.Errorf("failed to get Microsoft user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Microsoft response: %w", err)
	}

	var msUser struct {
		ID                string `json:"id"`
		DisplayName       string `json:"displayName"`
		Mail              string `json:"mail"`
		UserPrincipalName string `json:"userPrincipalName"`
	}
	if err := json.Unmarshal(body, &msUser); err != nil {
		return nil, fmt.Errorf("failed to parse Microsoft user info: %w", err)
	}

	// Microsoft may return email in 'mail' or 'userPrincipalName'
	email := msUser.Mail
	if email == "" {
		email = msUser.UserPrincipalName
	}
	if email == "" {
		return nil, fmt.Errorf("Microsoft did not return an email address")
	}

	return &OAuthProfile{
		Email:      email,
		Name:       msUser.DisplayName,
		ProviderID: msUser.ID,
		Provider:   "microsoft",
	}, nil
}
