package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

// S-14: public register responses must not reveal whether an email is already taken.
const (
	registerSelfSuccessMessage   = "Registration successful. Please check your email to verify your account before logging in."
	registerInviteSuccessMessage = "Account created. You can now log in."
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	db             *db.DB
	repo           *repository.Repository
	authService    *services.AuthService
	emailService   *services.EmailService
	storageService *services.StorageService // used to re-sign logo_url (private bucket) before returning it
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(database *db.DB, repo *repository.Repository, authService *services.AuthService, emailService *services.EmailService, storageService *services.StorageService) *AuthHandler {
	return &AuthHandler{
		db:             database,
		repo:           repo,
		authService:    authService,
		emailService:   emailService,
		storageService: storageService,
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

func (h *AuthHandler) saveRefreshJTI(ctx context.Context, userID uuid.UUID, jti string) error {
	expires := time.Now().Add(h.authService.GetRefreshExpiry())
	_, err := h.db.Pool.Exec(ctx,
		`UPDATE public.users SET refresh_token_jti = $1, refresh_token_expires = $2 WHERE id = $3`,
		jti, expires, userID)
	return err
}

// resolvePrimaryMembership picks the tenant + role a user acts as. A user can
// belong to several tenants; we default to their OWNER membership, else the
// oldest active one. Tenant switching (choosing a non-default) is a fast follow.
func (h *AuthHandler) resolvePrimaryMembership(ctx context.Context, userID uuid.UUID) (uuid.UUID, string, error) {
	var tenantID uuid.UUID
	var role string
	err := h.db.Pool.QueryRow(ctx,
		`SELECT tenant_id, role FROM team_members
		 WHERE user_id = $1 AND status = 'ACTIVE'
		 ORDER BY (role = 'OWNER') DESC, created_at ASC
		 LIMIT 1`,
		userID).Scan(&tenantID, &role)
	return tenantID, role, err
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
		HttpOnly: true,   // Not accessible via document.cookie
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
// Helper: set / clear the HttpOnly auth-token cookie
// ─────────────────────────────────────────────────────────────────────────────

func setAuthCookie(w http.ResponseWriter, token string, expiry time.Duration) {
	maxAge := int(expiry.Seconds())
	secure := os.Getenv("APP_ENV") == "production"
	sameSite := http.SameSiteStrictMode
	if !secure {
		// SameSite=Strict blocks the cookie during top-level navigations in dev
		// (e.g. after Google OAuth redirect), so use Lax in local dev.
		sameSite = http.SameSiteLaxMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/", // Sent to all endpoints (needed by proxy middleware)
		MaxAge:   maxAge,
		HttpOnly: true,   // Not accessible via document.cookie
		Secure:   secure, // HTTPS only in production
		SameSite: sameSite,
	})
}

func clearAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
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

	// S-13: shared password policy (length, letter+digit, common-password blocklist).
	if err := services.ValidatePassword(req.Password, req.Email); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.ProductType == "" {
		req.ProductType = string(models.DefaultProductType())
	}
	productType := models.ProductType(req.ProductType)
	if !productType.IsValid() {
		respondError(w, http.StatusBadRequest, "product_type must be BATTERY or ELECTRONICS")
		return
	}

	// Hash password first so success and "email taken" paths take similar time (S-14).
	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// Identity uniqueness is enforced on `users` now, not `tenants`.
	var existingUserID *uuid.UUID
	var userIDScan uuid.UUID
	err = h.db.Pool.QueryRow(r.Context(),
		"SELECT id FROM public.users WHERE email = $1", req.Email).Scan(&userIDScan)
	switch {
	case err == nil:
		existingUserID = &userIDScan
	case err == pgx.ErrNoRows:
		// new identity
	default:
		slog.Error("Failed to check email existence", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// ── S-14: existing email — never return 409 "Email already registered". ──
	if existingUserID != nil {
		h.handleRegisterExistingEmail(w, r, req, isInviteFlow, productType, *existingUserID)
		return
	}

	// ── Invite flow: create the identity and JOIN the inviter's org. No new tenant. ──
	if isInviteFlow {
		invite, invErr := h.repo.GetTeamMemberByToken(r.Context(), req.InviteToken)
		if invErr != nil || invite == nil || invite.Email != req.Email {
			respondError(w, http.StatusBadRequest, "Invalid or expired invitation")
			return
		}
		userID := uuid.New()
		if _, err = h.db.Pool.Exec(r.Context(),
			`INSERT INTO public.users (id, email, password_hash, email_verified, created_at)
			 VALUES ($1, $2, $3, true, $4)`,
			userID, req.Email, passwordHash, time.Now()); err != nil {
			// Race: another request created the user — treat as existing (S-14).
			if isUniqueViolation(err) {
				h.handleRegisterExistingEmail(w, r, req, true, productType, uuid.Nil)
				return
			}
			slog.Error("Failed to create user (invite)", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to register")
			return
		}
		// Activate the invited membership + any other pending invites for this email,
		// linking them all to the new user identity.
		if err := h.repo.UpdateTeamMemberStatus(r.Context(), invite.ID, models.TeamStatusActive, &userID); err != nil {
			slog.Error("Failed to activate invite membership", "error", err)
			respondError(w, http.StatusInternalServerError, "Failed to register")
			return
		}

		// Log audit event
		auditLog := &models.TeamAuditLog{
			ID:           uuid.New(),
			TenantID:     invite.TenantID,
			ActorEmail:   invite.Email,
			SubjectEmail: invite.Email,
			Action:       "ACCEPT",
			NewRole:      &invite.Role,
			CreatedAt:    time.Now(),
		}
		if err := h.repo.CreateTeamAuditLog(r.Context(), auditLog); err != nil {
			slog.Error("Failed to create team audit log for register invite", "tenant_id", invite.TenantID, "actor", invite.Email, "error", err)
		}

		if others, oErr := h.repo.GetPendingInvitesByEmail(r.Context(), req.Email); oErr == nil {
			for _, inv := range others {
				if err := h.repo.UpdateTeamMemberStatus(r.Context(), inv.ID, models.TeamStatusActive, &userID); err != nil {
					slog.Warn("Failed to activate pending invite", "team_id", inv.TenantID, "error", err)
				} else {
					// Log audit event for other accepted memberships
					otherAuditLog := &models.TeamAuditLog{
						ID:           uuid.New(),
						TenantID:     inv.TenantID,
						ActorEmail:   inv.Email,
						SubjectEmail: inv.Email,
						Action:       "ACCEPT",
						NewRole:      &inv.Role,
						CreatedAt:    time.Now(),
					}
					_ = h.repo.CreateTeamAuditLog(r.Context(), otherAuditLog)
				}
			}
		}
		respondJSON(w, http.StatusCreated, map[string]string{
			"message": registerInviteSuccessMessage,
		})
		return
	}

	// ── Self-signup: new org. Create tenant + user + OWNER membership atomically. ──
	verificationToken, err := h.authService.GenerateResetToken()
	if err != nil {
		slog.Error("Failed to generate verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	verificationExpires := time.Now().Add(24 * time.Hour)

	tenantID := uuid.New()
	userID := uuid.New()

	tx, err := h.db.Pool.Begin(r.Context())
	if err != nil {
		slog.Error("Failed to begin registration tx", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	defer tx.Rollback(r.Context())

	if _, err = tx.Exec(r.Context(),
		`INSERT INTO public.tenants (id, company_name, email, product_type, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		tenantID, req.CompanyName, req.Email, productType, time.Now()); err != nil {
		slog.Error("Failed to create tenant", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	if _, err = tx.Exec(r.Context(),
		`INSERT INTO public.users
			(id, email, password_hash, email_verified, email_verification_token, email_verification_expires, created_at)
		 VALUES ($1, $2, $3, false, $4, $5, $6)`,
		userID, req.Email, passwordHash, verificationToken, verificationExpires, time.Now()); err != nil {
		// Race with concurrent register — same generic response as "already exists" (S-14).
		if isUniqueViolation(err) {
			_ = tx.Rollback(r.Context())
			h.handleRegisterExistingEmail(w, r, req, false, productType, uuid.Nil)
			return
		}
		slog.Error("Failed to create user", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	if _, err = tx.Exec(r.Context(),
		`INSERT INTO team_members (id, tenant_id, email, role, status, user_id, created_at, accepted_at)
		 VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', $4, $5, $5)`,
		uuid.New(), tenantID, req.Email, userID, time.Now()); err != nil {
		slog.Error("Failed to create owner membership", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	if err = tx.Commit(r.Context()); err != nil {
		slog.Error("Failed to commit registration", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	if err := h.emailService.SendVerificationEmail(req.Email, verificationToken, productType); err != nil {
		slog.Warn("Failed to send verification email", "error", err)
	}
	respondJSON(w, http.StatusAccepted, map[string]string{
		"message": registerSelfSuccessMessage,
	})
}

// handleRegisterExistingEmail is the S-14 anti-enumeration path when the email
// is already a user. Always returns the same client-visible success shape as a
// fresh registration; notifies the real owner out-of-band via email.
func (h *AuthHandler) handleRegisterExistingEmail(
	w http.ResponseWriter,
	r *http.Request,
	req RegisterRequest,
	isInviteFlow bool,
	productType models.ProductType,
	existingUserID uuid.UUID,
) {
	// Resolve user id if caller only knew the email (unique-violation race).
	if existingUserID == uuid.Nil {
		var id uuid.UUID
		if err := h.db.Pool.QueryRow(r.Context(),
			"SELECT id FROM public.users WHERE email = $1", req.Email).Scan(&id); err == nil {
			existingUserID = id
		}
	}

	if isInviteFlow {
		// Valid invite for this email: attach existing identity to the org.
		// Invalid invite: same error as unknown-token path (does not say "email taken").
		invite, invErr := h.repo.GetTeamMemberByToken(r.Context(), req.InviteToken)
		if invErr != nil || invite == nil || invite.Email != req.Email {
			respondError(w, http.StatusBadRequest, "Invalid or expired invitation")
			return
		}
		if existingUserID != uuid.Nil {
			if err := h.repo.UpdateTeamMemberStatus(r.Context(), invite.ID, models.TeamStatusActive, &existingUserID); err != nil {
				slog.Error("Failed to activate invite for existing user", "error", err)
				respondError(w, http.StatusInternalServerError, "Failed to register")
				return
			}
			auditLog := &models.TeamAuditLog{
				ID:           uuid.New(),
				TenantID:     invite.TenantID,
				ActorEmail:   invite.Email,
				SubjectEmail: invite.Email,
				Action:       "ACCEPT",
				NewRole:      &invite.Role,
				CreatedAt:    time.Now(),
			}
			_ = h.repo.CreateTeamAuditLog(r.Context(), auditLog)
		}
		respondJSON(w, http.StatusCreated, map[string]string{
			"message": registerInviteSuccessMessage,
		})
		return
	}

	// Self-signup duplicate: tell the real owner via email; HTTP looks like success.
	if h.emailService != nil {
		if err := h.emailService.SendAccountExistsEmail(req.Email, productType); err != nil {
			slog.Warn("Failed to send account-exists notice", "error", err)
		}
	} else {
		slog.Info("Register attempt for existing email (no email service)", "email", req.Email)
	}
	respondJSON(w, http.StatusAccepted, map[string]string{
		"message": registerSelfSuccessMessage,
	})
}

// isUniqueViolation reports PostgreSQL unique_violation (23505).
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
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

	var userID uuid.UUID
	var email string
	var alreadyVerified bool
	var expires time.Time
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, email, email_verified, email_verification_expires FROM public.users
		 WHERE email_verification_token = $1`,
		token).Scan(&userID, &email, &alreadyVerified, &expires)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusBadRequest, "Invalid or already used verification token")
			return
		}
		slog.Error("Failed to find verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	// Idempotent: re-clicking an already-used link (page refresh, double
	// request) is treated as success — the email is verified either way.
	if alreadyVerified {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message":          "Email already verified. You can log in.",
			"email":            email,
			"already_verified": true,
		})
		return
	}

	if time.Now().After(expires) {
		respondError(w, http.StatusBadRequest, "Verification token has expired. Please request a new one.")
		return
	}

	// Keep the token in place (instead of nulling it) so retries of the same
	// link hit the already-verified branch above. Post-verification, the token
	// has no remaining power — verifying is its only effect.
	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.users
		 SET email_verified = true
		 WHERE id = $1`,
		userID)
	if err != nil {
		slog.Error("Failed to verify email", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Email verified successfully. You can now log in.",
		"email":   email,
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

	// Lookup identity — do NOT reveal if email exists
	var userID uuid.UUID
	var emailVerified bool
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT id, email_verified FROM public.users WHERE email = $1", req.Email).
		Scan(&userID, &emailVerified)
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

	// Best-effort product type for the email template (via the user's org).
	productType := models.DefaultProductType()
	if tid, _, mErr := h.resolvePrimaryMembership(r.Context(), userID); mErr == nil {
		if pt, ptErr := h.getTenantProductType(r.Context(), tid); ptErr == nil {
			productType = pt
		}
	}

	newToken, err := h.authService.GenerateResetToken()
	if err != nil {
		slog.Error("Failed to generate verification token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to resend verification")
		return
	}
	newExpires := time.Now().Add(24 * time.Hour)

	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.users
		 SET email_verification_token = $1, email_verification_expires = $2
		 WHERE id = $3`,
		newToken, newExpires, userID)
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

	// Identity now lives in `users`; a user's tenant + role come from their
	// active team_members membership (not hardcoded).
	var userID uuid.UUID
	var passwordHash *string
	var oauthProvider *string
	var emailVerified bool
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, password_hash, oauth_provider, email_verified FROM public.users WHERE email = $1`,
		req.Email).Scan(&userID, &passwordHash, &oauthProvider, &emailVerified)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		slog.Error("Failed to get user", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	// No password set: either an OAuth-only account or a not-yet-accepted invite.
	if passwordHash == nil || *passwordHash == "" {
		if oauthProvider != nil && *oauthProvider != "" {
			respondError(w, http.StatusBadRequest, "This account uses social sign-in. Please use Google or Microsoft to log in.")
			return
		}
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
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

	// Resolve which tenant + role this user acts as.
	tenantID, role, err := h.resolvePrimaryMembership(r.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusForbidden, "Your account is not a member of any organization. Ask an admin to re-send your invite.")
			return
		}
		slog.Error("Failed to resolve membership", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	// Load org display fields + product type for the response.
	var companyName string
	var productType models.ProductType
	if err := h.db.Pool.QueryRow(r.Context(),
		`SELECT company_name, COALESCE(product_type, 'BATTERY') FROM public.tenants WHERE id = $1`,
		tenantID).Scan(&companyName, &productType); err != nil {
		slog.Error("Failed to load tenant for login", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	// Update last login (per-user)
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.users SET last_login = $1 WHERE id = $2",
		time.Now(), userID)

	// Generate tokens
	token, err := h.authService.GenerateToken(tenantID.String(), userID.String(), req.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, jti, err := h.authService.GenerateRefreshToken(tenantID.String(), userID.String(), req.Email, role, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Persist JTI for revocation (per-user session)
	if err := h.saveRefreshJTI(r.Context(), userID, jti); err != nil {
		slog.Error("Failed to save refresh JTI", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Set refresh token as HttpOnly cookie (not accessible to JS)
	setRefreshCookie(w, refreshToken, h.authService.GetRefreshExpiry())
	// Set auth token as HttpOnly cookie for proxy middleware
	setAuthCookie(w, token, h.authService.GetTokenExpiry())

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

	// The refresh session is per-user. Old tokens (pre-users-migration) have no
	// user_id — reject them so the client re-logs in cleanly.
	if claims.UserID == "" {
		respondError(w, http.StatusUnauthorized, "Session outdated, please log in again")
		return
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token claims")
		return
	}
	tenantID, err := uuid.Parse(claims.TenantID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token claims")
		return
	}

	// Validate JTI against the user's stored session (revocation check).
	var storedJTI *string
	err = h.db.Pool.QueryRow(r.Context(),
		"SELECT refresh_token_jti FROM public.users WHERE id = $1", userID).
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
	token, err := h.authService.GenerateToken(claims.TenantID, claims.UserID, claims.Email, claims.Role, productType)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Rotate refresh token (issue new JTI, invalidate old one)
	newRefreshToken, newJTI, err := h.authService.GenerateRefreshToken(claims.TenantID, claims.UserID, claims.Email, claims.Role, productType)
	if err != nil {
		slog.Error("Failed to generate refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	if err := h.saveRefreshJTI(r.Context(), userID, newJTI); err != nil {
		slog.Error("Failed to rotate refresh JTI", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Rotate the cookie with the new refresh token
	setRefreshCookie(w, newRefreshToken, h.authService.GetRefreshExpiry())
	// Rotate auth token cookie
	setAuthCookie(w, token, h.authService.GetTokenExpiry())

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
	userIDStr := middleware.GetUserID(r.Context())
	if userIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Revoke by clearing the user's stored session JTI
	_, err = h.db.Pool.Exec(r.Context(),
		"UPDATE public.users SET refresh_token_jti = NULL, refresh_token_expires = NULL WHERE id = $1",
		userID)
	if err != nil {
		slog.Error("Failed to revoke refresh token", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to logout")
		return
	}

	// Clear the HttpOnly refresh cookie on the client
	clearRefreshCookie(w)
	// Clear auth token cookie
	clearAuthCookie(w)

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

	// Check if the identity exists
	var userID uuid.UUID
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT id FROM public.users WHERE email = $1", req.Email).Scan(&userID)
	if err != nil {
		// Don't reveal if email exists or not
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "If the email exists, a reset link will be sent",
		})
		return
	}

	// Best-effort product type for the email template (via the user's org).
	productType := models.DefaultProductType()
	if tid, _, mErr := h.resolvePrimaryMembership(r.Context(), userID); mErr == nil {
		if pt, ptErr := h.getTenantProductType(r.Context(), tid); ptErr == nil {
			productType = pt
		}
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
		"UPDATE public.users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
		resetToken, expires, userID)
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

	// Find user by reset token
	var userID uuid.UUID
	var userEmail string
	var expires time.Time
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, email, reset_token_expires FROM public.users
		 WHERE reset_token = $1 AND reset_token IS NOT NULL`,
		req.Token).Scan(&userID, &userEmail, &expires)
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

	// S-13: password policy (with email so local-part reuse is rejected).
	if err := services.ValidatePassword(req.NewPassword, userEmail); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Hash new password
	passwordHash, err := h.authService.HashPassword(req.NewPassword)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Update password, clear reset token, and revoke the active session
	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.users
		 SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
		     refresh_token_jti = NULL, refresh_token_expires = NULL
		 WHERE id = $2`,
		passwordHash, userID)
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

	if req.BatteryProfileUpdate == nil {
		req.BatteryProfileUpdate = &models.BatteryProfileUpdate{}
	}

	// Normalize req.LogoURL so DB stores canonical public storage reference
	// before saving to database, avoiding storing transient signed query tokens.
	if req.LogoURL != "" && h.storageService != nil {
		if path, ok := h.storageService.ExtractStoragePath(req.LogoURL, complianceDocsBucket); ok {
			req.LogoURL = h.storageService.PublicURL(complianceDocsBucket, path)
		}
	}

	updatedTenant, err := h.repo.UpdateTenantProfile(r.Context(), tenantID, req)
	if err != nil {
		slog.Error("Failed to update profile", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Re-sign logo_url for response so frontend receives a fresh signed URL
	if freshURL, err := resolveFreshBucketURL(r.Context(), h.storageService, updatedTenant.LogoURL); err == nil && freshURL != "" {
		updatedTenant.LogoURL = freshURL
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

	// Fetch login email and last login from the authenticated user (identity).
	var loginEmail string
	var lastLogin *time.Time
	if userIDStr := middleware.GetUserID(r.Context()); userIDStr != "" {
		if userID, perr := uuid.Parse(userIDStr); perr == nil {
			if qerr := h.db.Pool.QueryRow(r.Context(), "SELECT email, last_login FROM public.users WHERE id = $1", userID).Scan(&loginEmail, &lastLogin); qerr != nil {
				slog.Warn("Failed to get user login details", "error", qerr)
			}
		}
	}
	// Fallback for any legacy token without user_id: use the tenant's email.
	if loginEmail == "" {
		if qerr := h.db.Pool.QueryRow(r.Context(), "SELECT email FROM public.tenants WHERE id = $1", id).Scan(&loginEmail); qerr != nil {
			slog.Warn("Failed to get tenant email fallback", "error", qerr)
		}
	}

	// Subscription plan + computed feature entitlements (frontend gates nav/pages on these).
	var planType string
	if qerr := h.db.Pool.QueryRow(r.Context(), "SELECT COALESCE(plan_type, 'STARTER') FROM public.tenants WHERE id = $1", id).Scan(&planType); qerr != nil {
		planType = services.PlanStarter
	}
	planType = services.NormalizePlan(planType)

	// logo_url + compliance certs live in the private compliance-docs bucket
	// (canonical public-URL-shaped refs). Re-sign on every read (S-10) or
	// browsers get 404 / unauthenticated access if the bucket were public.
	logoURL, err := resolveFreshBucketURL(r.Context(), h.storageService, tenant.LogoURL)
	if err != nil {
		slog.Warn("Failed to resolve logo URL", "tenant_id", id, "error", err)
		logoURL = tenant.LogoURL
	}

	eprPath, _ := resolveFreshBucketURL(r.Context(), h.storageService, tenant.BatteryProfile.EPRCertificatePath)
	bisPath, _ := resolveFreshBucketURL(r.Context(), h.storageService, tenant.BatteryProfile.BISCertificatePath)
	pliPath, _ := resolveFreshBucketURL(r.Context(), h.storageService, tenant.BatteryProfile.PLICertificatePath)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"id":                                   tenant.ID,
		"tenant_id":                            tenant.ID.String(),
		"plan_type":                            planType,
		"entitlements":                         services.EntitlementsForPlan(planType),
		"company_name":                         tenant.CompanyName,
		"product_type":                         tenant.ProductType,
		"email":                                loginEmail,
		"address":                              tenant.Address,
		"logo_url":                             logoURL,
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
		// Short-lived signed URLs (1h) for private compliance-docs objects
		"epr_certificate_path": eprPath,
		"bis_certificate_path": bisPath,
		"pli_certificate_path": pliPath,
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

// GetReadiness handles GET /api/v1/auth/readiness
// Returns tenant-level compliance readiness per selected market.
// Safe to call during onboarding — does not require a batch.
func (h *AuthHandler) GetReadiness(w http.ResponseWriter, r *http.Request) {
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

	tenant, err := h.repo.GetTenant(r.Context(), id)
	if err != nil {
		if err.Error() == "tenant not found" {
			respondError(w, http.StatusNotFound, "Tenant not found")
			return
		}
		slog.Error("Failed to get tenant for readiness check", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get tenant info")
		return
	}

	// Determine which markets to check from the tenant's data_visibility
	var markets []models.MarketRegion
	if len(tenant.DataVisibility) > 0 {
		var dv struct {
			PrimaryMarket string `json:"primary_market"`
		}
		if err := json.Unmarshal(tenant.DataVisibility, &dv); err == nil && dv.PrimaryMarket != "" {
			switch dv.PrimaryMarket {
			case "india":
				markets = append(markets, models.MarketRegionIndia)
			case "eu":
				markets = append(markets, models.MarketRegionEU)
			case "both":
				markets = append(markets, models.MarketRegionIndia, models.MarketRegionEU)
			}
		}
	}
	// Default to India if no primary_market is set
	if len(markets) == 0 {
		markets = append(markets, models.MarketRegionIndia)
	}

	svc := services.NewOnboardingReadinessService(h.repo)
	result := svc.CheckReadiness(r.Context(), tenant, markets)

	respondJSON(w, http.StatusOK, result)
}

// PostReadiness handles POST /api/v1/auth/readiness
// Accepts draft profile data in the body, overlays it onto the tenant profile,
// and returns readiness scores without persisting anything to the database.
// This powers the real-time compliance preview during onboarding.
func (h *AuthHandler) PostReadiness(w http.ResponseWriter, r *http.Request) {
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

	tenant, err := h.repo.GetTenant(r.Context(), id)
	if err != nil {
		if err.Error() == "tenant not found" {
			respondError(w, http.StatusNotFound, "Tenant not found")
			return
		}
		slog.Error("Failed to get tenant for readiness check", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get tenant info")
		return
	}

	// Decode draft profile data from request body
	var draft struct {
		PrimaryMarket                     string `json:"primary_market"`
		CompanyName                       string `json:"company_name"`
		Address                           string `json:"address"`
		EPRRegistrationNumber             string `json:"epr_registration_number"`
		BISRNumber                        string `json:"bis_r_number"`
		IECCode                           string `json:"iec_code"`
		EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name"`
		EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address"`
		EUContactEmail                    string `json:"eu_contact_email"`
		MorthManufacturerCode             string `json:"morth_manufacturer_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&draft); err != nil {
		// Partial decode is fine — we overlay whatever fields were sent
		// Continue with defaults
	}

	// Overlay draft values onto the tenant profile (in-memory only)
	if draft.CompanyName != "" {
		tenant.CompanyName = draft.CompanyName
	}
	if draft.Address != "" {
		tenant.Address = draft.Address
	}
	if draft.EPRRegistrationNumber != "" {
		tenant.BatteryProfile.EPRRegistrationNumber = draft.EPRRegistrationNumber
	}
	if draft.BISRNumber != "" {
		tenant.BatteryProfile.BISRNumber = draft.BISRNumber
	}
	if draft.IECCode != "" {
		tenant.BatteryProfile.IECCode = draft.IECCode
	}
	if draft.EUAuthorizedRepresentativeName != "" {
		tenant.BatteryProfile.EUAuthorizedRepresentativeName = draft.EUAuthorizedRepresentativeName
	}
	if draft.EUAuthorizedRepresentativeAddress != "" {
		tenant.BatteryProfile.EUAuthorizedRepresentativeAddress = draft.EUAuthorizedRepresentativeAddress
	}
	if draft.EUContactEmail != "" {
		tenant.BatteryProfile.EUContactEmail = draft.EUContactEmail
	}
	if draft.MorthManufacturerCode != "" {
		tenant.BatteryProfile.MorthManufacturerCode = draft.MorthManufacturerCode
	}

	// Determine markets from draft or fallback to tenant data_visibility
	var markets []models.MarketRegion
	switch draft.PrimaryMarket {
	case "india":
		markets = append(markets, models.MarketRegionIndia)
	case "eu":
		markets = append(markets, models.MarketRegionEU)
	case "both":
		markets = append(markets, models.MarketRegionIndia, models.MarketRegionEU)
	default:
		if len(tenant.DataVisibility) > 0 {
			var dv struct {
				PrimaryMarket string `json:"primary_market"`
			}
			if err := json.Unmarshal(tenant.DataVisibility, &dv); err == nil && dv.PrimaryMarket != "" {
				switch dv.PrimaryMarket {
				case "india":
					markets = append(markets, models.MarketRegionIndia)
				case "eu":
					markets = append(markets, models.MarketRegionEU)
				case "both":
					markets = append(markets, models.MarketRegionIndia, models.MarketRegionEU)
				}
			}
		}
		if len(markets) == 0 {
			markets = append(markets, models.MarketRegionIndia)
		}
	}

	svc := services.NewOnboardingReadinessService(h.repo)
	result := svc.CheckReadiness(r.Context(), tenant, markets)

	respondJSON(w, http.StatusOK, result)
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
