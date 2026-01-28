package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"exportready-battery/internal/db"
	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
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
}

// LoginRequest is the request body for login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is the response for auth operations
type AuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	TenantID     string `json:"tenant_id"`
	Email        string `json:"email"`
	CompanyName  string `json:"company_name"`
	ExpiresIn    int    `json:"expires_in"` // seconds
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

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "email, password, and company_name are required")
		return
	}

	if len(req.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	// Check if email already exists
	var exists bool
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM public.tenants WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		log.Printf("Failed to check email existence: %v", err)
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
		log.Printf("Failed to hash password: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// Create tenant
	tenantID := uuid.New()
	_, err = h.db.Pool.Exec(r.Context(),
		`INSERT INTO public.tenants (id, company_name, email, password_hash, created_at) 
		 VALUES ($1, $2, $3, $4, $5)`,
		tenantID, req.CompanyName, req.Email, passwordHash, time.Now())
	if err != nil {
		log.Printf("Failed to create tenant: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}

	// Generate tokens
	token, err := h.authService.GenerateToken(tenantID.String(), req.Email)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken(tenantID.String(), req.Email)
	if err != nil {
		log.Printf("Failed to generate refresh token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusCreated, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		TenantID:     tenantID.String(),
		Email:        req.Email,
		CompanyName:  req.CompanyName,
		ExpiresIn:    900, // 15 minutes in seconds
	})
}

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
	var companyName, passwordHash string
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, company_name, password_hash FROM public.tenants WHERE email = $1`,
		req.Email).Scan(&tenantID, &companyName, &passwordHash)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		log.Printf("Failed to get tenant: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	// Check password
	if !h.authService.CheckPassword(req.Password, passwordHash) {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Update last login
	h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET last_login = $1 WHERE id = $2",
		time.Now(), tenantID)

	// Generate tokens
	token, err := h.authService.GenerateToken(tenantID.String(), req.Email)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken(tenantID.String(), req.Email)
	if err != nil {
		log.Printf("Failed to generate refresh token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		TenantID:     tenantID.String(),
		Email:        req.Email,
		CompanyName:  companyName,
		ExpiresIn:    900,
	})
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate refresh token
	claims, err := h.authService.ValidateToken(req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	// Generate new access token
	token, err := h.authService.GenerateToken(claims.TenantID, claims.Email)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":      token,
		"expires_in": 900,
	})
}

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
	err := h.db.Pool.QueryRow(r.Context(),
		"SELECT id FROM public.tenants WHERE email = $1", req.Email).Scan(&tenantID)
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
		log.Printf("Failed to generate reset token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	// Save reset token to database
	expires := h.authService.GetResetTokenExpiry()
	_, err = h.db.Pool.Exec(r.Context(),
		"UPDATE public.tenants SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
		resetToken, expires, tenantID)
	if err != nil {
		log.Printf("Failed to save reset token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	// Send password reset email (or log to console if not configured)
	if err := h.emailService.SendPasswordResetEmail(req.Email, resetToken); err != nil {
		log.Printf("Failed to send reset email: %v", err)
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
		log.Printf("Failed to find reset token: %v", err)
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
		log.Printf("Failed to hash password: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Update password and clear reset token
	_, err = h.db.Pool.Exec(r.Context(),
		`UPDATE public.tenants 
		 SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
		 WHERE id = $2`,
		passwordHash, tenantID)
	if err != nil {
		log.Printf("Failed to update password: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset successfully",
	})
}

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
		log.Printf("Failed to update profile: %v", err)
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
		log.Printf("Failed to get tenant: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get user info")
		return
	}

	// Fetch login email and last login
	var loginEmail string
	var lastLogin *time.Time
	err = h.db.Pool.QueryRow(r.Context(), "SELECT email, last_login FROM public.tenants WHERE id = $1", id).Scan(&loginEmail, &lastLogin)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"id":                      tenant.ID,
		"tenant_id":               tenant.ID.String(),
		"company_name":            tenant.CompanyName,
		"email":                   loginEmail,
		"address":                 tenant.Address,
		"logo_url":                tenant.LogoURL,
		"support_email":           tenant.SupportEmail,
		"website":                 tenant.Website,
		"created_at":              tenant.CreatedAt,
		"last_login":              lastLogin,
		"quota_balance":           tenant.QuotaBalance,
		"epr_registration_number": tenant.EPRRegistrationNumber,
		"bis_r_number":            tenant.BISRNumber,
		"iec_code":                tenant.IECCode,
		// Certificate Document Paths
		"epr_certificate_path": tenant.EPRCertificatePath,
		"bis_certificate_path": tenant.BISCertificatePath,
		"pli_certificate_path": tenant.PLICertificatePath,
		// Document Verification Status
		"epr_status": tenant.EPRStatus,
		"bis_status": tenant.BISStatus,
		"pli_status": tenant.PLIStatus,
		// Onboarding Status
		"onboarding_completed": tenant.OnboardingCompleted,
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
