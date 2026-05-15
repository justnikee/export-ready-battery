package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"anvayalabs-battery/internal/db"
	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	db           *db.DB
	repo         *repository.Repository
	authService  *services.AuthService
	emailService *services.EmailService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(database *db.DB, repo *repository.Repository, authService *services.AuthService, emailService *services.EmailService) *AuthHandler {
	return &AuthHandler{
		db:           database,
		repo:         repo,
		authService:  authService,
		emailService: emailService,
	}
}

// RegisterRequest is the request body for registration
type RegisterRequest struct {
	CompanyName string `json:"company_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	ProductType string `json:"product_type"`
	InviteToken string `json:"invite_token"` // optional — skips email verification
}

// LoginRequest is the request body for login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is the response for auth operations
type AuthResponse struct {
	Token       string `json:"token"`
	TenantID    string `json:"tenant_id"`
	Email       string `json:"email"`
	CompanyName string `json:"company_name"`
	ProductType string `json:"product_type,omitempty"`
	ExpiresIn   int    `json:"expires_in"` // seconds
}

// ForgotPasswordRequest is the request for password reset
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest is the request to reset password
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: persist refresh token JTI
// ─────────────────────────────────────────────────────────────────────────────

func (h *AuthHandler) saveRefreshJTI(ctx context.Context, tenantID uuid.UUID, jti string) error {
	expires := time.Now().Add(h.authService.GetRefreshExpiry())
	_, err := h.db.Pool.Exec(ctx,
		`UPDATE public.tenants SET refresh_token_jti = $1, refresh_token_expires = $2 WHERE id = $3`,
		jti, expires, tenantID)
	return err
}

func (h *AuthHandler) getTenantProductType(ctx context.Context, tenantID uuid.UUID) (models.ProductType, error) {
	var productType models.ProductType
	err := h.db.Pool.QueryRow(ctx,
		"SELECT COALESCE(product_type, 'BATTERY') FROM public.tenants WHERE id = $1",
		tenantID,
	).Scan(&productType)
	if err != nil {
		return "", err
	}
	if !productType.IsValid() {
		return models.DefaultProductType(), nil
	}
	return productType, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: set / clear the HttpOnly refresh-token cookie
// ─────────────────────────────────────────────────────────────────────────────

func setRefreshCookie(w http.ResponseWriter, token string, expiry time.Duration) {
	maxAge := int(expiry.Seconds())
	secure := os.Getenv("APP_ENV") == "production"
	sameSite := http.SameSiteStrictMode
	if !secure {
		// SameSite=Strict blocks the cookie during top-level navigations in dev
		// (e.g. after Google OAuth redirect), so use Lax in local dev.
		sameSite = http.SameSiteLaxMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/api/v1/auth", // Only sent to auth endpoints
		MaxAge:   maxAge,
		HttpOnly: true,  // Not accessible via document.cookie
		Secure:   secure, // HTTPS only in production
		SameSite: sameSite,
	})
}

func clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		MaxAge:   -1, // Immediate deletion
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	// If registering via invite, company_name is optional (they're joining an existing org)
	isInviteFlow := req.InviteToken != ""
	if !isInviteFlow && req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "email, password, and company_name are required")
		return
	}
	// Fallback company name for invite-based registrations
	if req.CompanyName == "" {
		req.CompanyName = req.Email
	}

	if len(req.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if req.ProductType == "" {
		req.ProductType = string(models.DefaultProductType())
	}
	productType := models.ProductType(req.ProductType)
	if !productType.IsValid() || productType == models.ProductTypeElectronics {
		respondError(w, http.StatusBadRequest, "product_type must be BATTERY or TEXTILE")
		return
	}

	// Check if email already exists
	var exists bool
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM public.tenants WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		slog.Error("Failed to check email existence", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	if exists {
		respondError(w, http.StatusConflict, "Email already registered")
		return
	}

	// Hash password
	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// If registering via invite, validate the invite token and mark email as pre-verified
	emailVerified := false
	if isInviteFlow {
		inviteMember, invErr := h.repo.GetTeamMemberByToken(r.Context(), req.InviteToken)
		if invErr == nil && inviteMember != nil && inviteMember.Email == req.Email {
			emailVerified = true
		}
	}

	// Generate email verification token (only used when not pre-verified)
	verificationToken, err := h.authService.GenerateResetToken()
	if err != nil {
		slog.Error("Failed to generate verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	verificationExpires := time.Now().Add(24 * time.Hour)

	// Create tenant
	tenantID := uuid.New()
	_, err = h.db.Pool.Exec(r.Context(),
		`INSERT INTO public.tenants
			(id, company_name, email, password_hash, product_type, email_verified, email_verification_token, email_verification_expires, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		tenantID, req.CompanyName, req.Email, passwordHash,
		productType, emailVerified, verificationToken, verificationExpires, time.Now())
	if err != nil {
		slog.Error("Failed to create tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// Check and link pending team invitations
	pendingInvites, err := h.repo.GetPendingInvitesByEmail(r.Context(), req.Email)
	if err == nil {
		for _, invite := range pendingInvites {
			if err := h.repo.UpdateTeamMemberStatus(r.Context(), invite.ID, models.TeamStatusActive, &tenantID); err != nil {
				slog.Warn("Failed to activate pending invite", "team_id", invite.TenantID, "error", err)
			}
		}
	} else {
		slog.Warn("Failed to check pending invites", "error", err)
	}

	// Send verification email only for non-invite registrations
	if !emailVerified {
		if err := h.emailService.SendVerificationEmail(req.Email, verificationToken, productType); err != nil {
			slog.Warn("Failed to send verification email", "error", err)
		}
		respondJSON(w, http.StatusAccepted, map[string]string{
			"message": "Registration successful. Please check your email to verify your account before logging in.",
		})
		return
	}

	// Invite flow: already verified — tell the frontend to go straight to login
	respondJSON(w, http.StatusCreated, map[string]string{
		"message": "Account created. You can now log in.",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// VerifyEmail
// ─────────────────────────────────────────────────────────────────────────────

// VerifyEmail handles GET /api/v1/auth/verify-email?token=xxx
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "token is required")
		return
	}

	var tenantID uuid.UUID
	var expires time.Time
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, email_verification_expires FROM public.tenants
		 WHERE email_verification_token = $1 AND email_verified = false`,
		token).Scan(&tenantID, &expires)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusBadRequest, "Invalid or already used verification token")
			return
		}
		slog.Error("Failed to find verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	if time.Now().After(expires) {
		respondError(w, http.StatusBadRequest, "Verification token has expired. Please request a new one.")
		return
	}

	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.tenants
		 SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL
		 WHERE id = $1`,
		tenantID)
	if err != nil {
		slog.Error("Failed to verify email", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Email verified successfully. You can now log in.",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ResendVerification
// ─────────────────────────────────────────────────────────────────────────────

// ResendVerification handles POST /api/v1/auth/resend-verification
func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		respondError(w, http.StatusBadRequest, "email is required")
		return
	}

	// Lookup tenant — do NOT reveal if email exists
	var tenantID uuid.UUID
	var emailVerified bool
	var productType models.ProductType
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT id, email_verified, COALESCE(product_type, 'BATTERY') FROM public.tenants WHERE email = $1", req.Email).
		Scan(&tenantID, &emailVerified, &productType)
	if err != nil {
		// Silently succeed to prevent email enumeration
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "If your email is registered and unverified, a new verification link has been sent.",
		})
		return
	}

	if emailVerified {
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "If your email is registered and unverified, a new verification link has been sent.",
		})
		return
	}

	newToken, err := h.authService.GenerateResetToken()
	if err != nil {
		slog.Error("Failed to generate verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to resend verification")
		return
	}
	newExpires := time.Now().Add(24 * time.Hour)

	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.tenants
		 SET email_verification_token = $1, email_verification_expires = $2
		 WHERE id = $3`,
		newToken, newExpires, tenantID)
	if err != nil {
		slog.Error("Failed to update verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to resend verification")
		return
	}

	if err := h.emailService.SendVerificationEmail(req.Email, newToken, productType); err != nil {
		slog.Warn("Failed to send verification email", "error", err)
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "If your email is registered and unverified, a new verification link has been sent.",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	// Get tenant by email
	var tenantID uuid.UUID
	var companyName string
	var productType models.ProductType
	var passwordHash *string
	var oauthProvider *string
	var emailVerified bool
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, company_name, COALESCE(product_type, 'BATTERY'), password_hash, oauth_provider, COALESCE(email_verified, true)
		 FROM public.tenants WHERE email = $1`,
		req.Email).Scan(&tenantID, &companyName, &productType, &passwordHash, &oauthProvider, &emailVerified)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		slog.Error("Failed to get tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	// Check if this is an OAuth-only account (no password set)
	if passwordHash == nil || *passwordHash == "" {
		respondError(w, http.StatusBadRequest, "This account uses social sign-in. Please use Google or Microsoft to log in.")
		return
	}

	// Check password
	if !h.authService.CheckPassword(req.Password, *passwordHash) {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Gate login behind email verification
	if !emailVerified {
		respondJSON(w, http.StatusForbidden, map[string]string{
			"error": "Please verify your email before logging in. Check your inbox or request a new verification link.",
			"code":  "email_not_verified",
		})
		return
	}

	// Update last login
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET last_login = $1 WHERE id = $2",
		time.Now(), tenantID)

	// Determine role: direct-tenant owners get "owner"
	role := "owner"

	// Generate tokens
	token, err := h.authService.GenerateToken(tenantID.String(), req.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, jti, err := h.authService.GenerateRefreshToken(tenantID.String(), req.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Persist JTI for revocation
	if err := h.saveRefreshJTI(r.Context(), tenantID, jti); err != nil {
		slog.Error("Failed to save refresh JTI", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Set refresh token as HttpOnly cookie (not accessible to JS)
	setRefreshCookie(w, refreshToken, h.authService.GetRefreshExpiry())

	respondJSON(w, http.StatusOK, AuthResponse{
		Token:       token,
		TenantID:    tenantID.String(),
		Email:       req.Email,
		CompanyName: companyName,
		ProductType: string(productType),
		ExpiresIn:   900,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh
// ─────────────────────────────────────────────────────────────────────────────

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	// Read refresh token from HttpOnly cookie (not from request body)
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Refresh token cookie missing")
		return
	}
	refreshTokenStr := cookie.Value

	// Validate JWT signature + expiry
	claims, err := h.authService.ValidateToken(refreshTokenStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	// Validate JTI against DB (revocation check)
	tenantID, err := uuid.Parse(claims.TenantID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token claims")
		return
	}

	var storedJTI *string
	err = h.db.Pool.QueryRow(r.Context(),
		"SELECT refresh_token_jti FROM public.tenants WHERE id = $1", tenantID).
		Scan(&storedJTI)
	if err != nil || storedJTI == nil || *storedJTI != claims.RegisteredClaims.ID {
		respondError(w, http.StatusUnauthorized, "Refresh token has been revoked")
		return
	}

	productType := claims.ProductType
	if !productType.IsValid() {
		productType, err = h.getTenantProductType(r.Context(), tenantID)
		if err != nil {
			slog.Error("Failed to resolve product type for refresh", "error", err, "tenant_id", tenantID)
			respondError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}
	}

	// Generate new access token
	token, err := h.authService.GenerateToken(claims.TenantID, claims.Email, claims.Role, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Rotate refresh token (issue new JTI, invalidate old one)
	newRefreshToken, newJTI, err := h.authService.GenerateRefreshToken(claims.TenantID, claims.Email, claims.Role, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	if err := h.saveRefreshJTI(r.Context(), tenantID, newJTI); err != nil {
		slog.Error("Failed to rotate refresh JTI", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Rotate the cookie with the new refresh token
	setRefreshCookie(w, newRefreshToken, h.authService.GetRefreshExpiry())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":      token,
		"expires_in": 900,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

// Logout handles POST /api/v1/auth/logout — revokes the current refresh token
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	// Revoke by clearing the stored JTI
	_, err = h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET refresh_token_jti = NULL, refresh_token_expires = NULL WHERE id = $1",
		tenantID)
	if err != nil {
		slog.Error("Failed to revoke refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to logout")
		return
	}

	// Clear the HttpOnly refresh cookie on the client
	clearRefreshCookie(w)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ForgotPassword / ResetPassword
// ─────────────────────────────────────────────────────────────────────────────

// ForgotPassword handles POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" {
		respondError(w, http.StatusBadRequest, "email is required")
		return
	}

	// Check if email exists
	var tenantID uuid.UUID
	var productType models.ProductType
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT id, COALESCE(product_type, 'BATTERY') FROM public.tenants WHERE email = $1", req.Email).Scan(&tenantID, &productType)
	if err != nil {
		// Don't reveal if email exists or not
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "If the email exists, a reset link will be sent",
		})
		return
	}

	// Generate reset token
	resetToken, err := h.authService.GenerateResetToken()
	if err != nil {
		slog.Error("Failed to generate reset token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	// Save reset token to database
	expires := h.authService.GetResetTokenExpiry()
	_, err = h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
		resetToken, expires, tenantID)
	if err != nil {
		slog.Error("Failed to save reset token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	// Send password reset email (or log to console if not configured)
	if err := h.emailService.SendPasswordResetEmail(req.Email, resetToken, productType); err != nil {
		slog.Warn("Failed to send reset email", "error", err)
		// Don't fail the request - still return success for security
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "If the email exists, a reset link will be sent",
	})
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		respondError(w, http.StatusBadRequest, "token and new_password are required")
		return
	}

	if len(req.NewPassword) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	// Find tenant by reset token
	var tenantID uuid.UUID
	var expires time.Time
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, reset_token_expires FROM public.tenants
		 WHERE reset_token = $1 AND reset_token IS NOT NULL`,
		req.Token).Scan(&tenantID, &expires)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusBadRequest, "Invalid or expired reset token")
			return
		}
		slog.Error("Failed to find reset token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Check if token expired
	if time.Now().After(expires) {
		respondError(w, http.StatusBadRequest, "Reset token has expired")
		return
	}

	// Hash new password
	passwordHash, err := h.authService.HashPassword(req.NewPassword)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Update password, clear reset token, and also revoke any active refresh token
	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.tenants
		 SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
		     refresh_token_jti = NULL, refresh_token_expires = NULL
		 WHERE id = $2`,
		passwordHash, tenantID)
	if err != nil {
		slog.Error("Failed to update password", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset successfully",
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateProfile / Me
// ─────────────────────────────────────────────────────────────────────────────

// UpdateProfile handles PUT /api/v1/auth/profile
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "company_name is required")
		return
	}

	updatedTenant, err := h.repo.UpdateTenantProfile(r.Context(), tenantID, req)
	if err != nil {
		slog.Error("Failed to update profile", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondJSON(w, http.StatusOK, updatedTenant)
}

// Me handles GET /api/v1/auth/me
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	id, err := uuid.Parse(tenantID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	// Use repository to get full tenant details including address/logo
	tenant, err := h.repo.GetTenant(r.Context(), id)
	if err != nil {
		if err.Error() == "tenant not found" {
			respondError(w, http.StatusNotFound, "Tenant not found")
			return
		}
		slog.Error("Failed to get tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get user info")
		return
	}

	// Fetch login email and last login
	var loginEmail string
	var lastLogin *time.Time
	err = h.db.Pool.QueryRow(r.Context(), "SELECT email, last_login FROM public.tenants WHERE id = $1", id).Scan(&loginEmail, &lastLogin)
	if err != nil {
		slog.Warn("Failed to get tenant login details", "error", err)
		// Continue with empty values rather than failing the entire request
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"id":                                   tenant.ID,
		"tenant_id":                            tenant.ID.String(),
		"company_name":                         tenant.CompanyName,
		"product_type":                         tenant.ProductType,
		"email":                                loginEmail,
		"address":                              tenant.Address,
		"logo_url":                             tenant.LogoURL,
		"support_email":                        tenant.SupportEmail,
		"website":                              tenant.Website,
		"created_at":                           tenant.CreatedAt,
		"last_login":                           lastLogin,
		"quota_balance":                        tenant.QuotaBalance,
		"epr_registration_number":              tenant.BatteryProfile.EPRRegistrationNumber,
		"bis_r_number":                         tenant.BatteryProfile.BISRNumber,
		"iec_code":                             tenant.BatteryProfile.IECCode,
		"eu_authorized_representative_name":    tenant.BatteryProfile.EUAuthorizedRepresentativeName,
		"eu_authorized_representative_address": tenant.BatteryProfile.EUAuthorizedRepresentativeAddress,
		"eu_contact_email":                     tenant.BatteryProfile.EUContactEmail,
		"morth_manufacturer_code":              tenant.BatteryProfile.MorthManufacturerCode,
		"morth_factory_codes":                  tenant.BatteryProfile.MorthFactoryCodes,
		"data_visibility":                      tenant.DataVisibility,
		"textile_facility_type":                tenant.TextileProfile.FacilityType,
		"textile_supply_chain_tier":            tenant.TextileProfile.SupplyChainTier,
		"textile_primary_markets":              tenant.TextileProfile.PrimaryMarkets,
		"textile_default_fiber_types":          tenant.TextileProfile.DefaultFiberTypes,
		"textile_certifications":               tenant.TextileProfile.Certifications,
		"textile_compliance_defaults":          tenant.TextileProfile.ComplianceDefaults,
		// Certificate Document Paths
		"epr_certificate_path": tenant.BatteryProfile.EPRCertificatePath,
		"bis_certificate_path": tenant.BatteryProfile.BISCertificatePath,
		"pli_certificate_path": tenant.BatteryProfile.PLICertificatePath,
		// Document Verification Status
		"epr_status": tenant.BatteryProfile.EPRStatus,
		"bis_status": tenant.BatteryProfile.BISStatus,
		"pli_status": tenant.BatteryProfile.PLIStatus,
		// Onboarding Status
		"onboarding_completed": tenant.OnboardingCompleted,
		// Role from JWT
		"role": middleware.GetRole(r.Context()),
	})
}

// helper to extract and validate tenant ID from context for protected routes
func (h *AuthHandler) validateTenantAccess(ctx context.Context, resourceTenantID uuid.UUID) error {
	authTenantID := middleware.GetTenantID(ctx)
	if authTenantID == "" {
		return fmt.Errorf("not authenticated")
	}
	if authTenantID != resourceTenantID.String() {
		return fmt.Errorf("access denied")
	}
	return nil
}
