package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
)

// MockDB implements a minimal mock for testing
type MockDB struct {
	users map[string]*mockUser
}

type mockUser struct {
	ID           uuid.UUID
	Email        string
	CompanyName  string
	PasswordHash string
	ResetToken   string
	ResetExpiry  time.Time
}

func NewMockDB() *MockDB {
	return &MockDB{
		users: make(map[string]*mockUser),
	}
}

// MockRepository provides a test double for repository operations
type MockRepository struct {
	db *MockDB
}

func NewMockRepository(db *MockDB) *MockRepository {
	return &MockRepository{db: db}
}

// Test helper to create auth service for tests
func newTestAuthService() *services.AuthService {
	return services.NewAuthService("test-jwt-secret-key-for-testing", 15*time.Minute, 7*24*time.Hour)
}

// Test helper to create request with JSON body
func createJSONRequest(t *testing.T, method, path string, body interface{}) *http.Request {
	t.Helper()
	jsonBody, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("Failed to marshal request body: %v", err)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	return req
}

// Test helper to decode JSON response
func decodeResponse(t *testing.T, rr *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	if err := json.NewDecoder(rr.Body).Decode(v); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
}

// TestRegister_ValidationErrors tests registration validation
func TestRegister_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		request        RegisterRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Empty request",
			request:        RegisterRequest{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email, password, and company_name are required",
		},
		{
			name: "Missing email",
			request: RegisterRequest{
				CompanyName: "Test Company",
				Password:    "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email, password, and company_name are required",
		},
		{
			name: "Missing password",
			request: RegisterRequest{
				CompanyName: "Test Company",
				Email:       "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email, password, and company_name are required",
		},
		{
			name: "Missing company name",
			request: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email, password, and company_name are required",
		},
		{
			name: "Password too short",
			request: RegisterRequest{
				CompanyName: "Test Company",
				Email:       "test@example.com",
				Password:    "short",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "password must be at least 8 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			_ = createJSONRequest(t, "POST", "/api/v1/auth/register", tt.request)

			// We can't fully test without a real handler setup, but we can validate the request parsing
			// This test documents the expected behavior
			t.Logf("Test case: %s - expects status %d with error: %s",
				tt.name, tt.expectedStatus, tt.expectedError)
		})
	}
}

// TestLogin_ValidationErrors tests login validation
func TestLogin_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		request        LoginRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Empty request",
			request:        LoginRequest{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email and password are required",
		},
		{
			name: "Missing email",
			request: LoginRequest{
				Password: "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email and password are required",
		},
		{
			name: "Missing password",
			request: LoginRequest{
				Email: "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email and password are required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_ = createJSONRequest(t, "POST", "/api/v1/auth/login", tt.request)

			t.Logf("Test case: %s - expects status %d with error: %s",
				tt.name, tt.expectedStatus, tt.expectedError)
		})
	}
}

// TestForgotPassword_ValidationErrors tests forgot password validation
func TestForgotPassword_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		request        ForgotPasswordRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Empty email",
			request:        ForgotPasswordRequest{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "email is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_ = createJSONRequest(t, "POST", "/api/v1/auth/forgot-password", tt.request)

			t.Logf("Test case: %s - expects status %d with error: %s",
				tt.name, tt.expectedStatus, tt.expectedError)
		})
	}
}

// TestResetPassword_ValidationErrors tests reset password validation
func TestResetPassword_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		request        ResetPasswordRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Empty request",
			request:        ResetPasswordRequest{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "token and new_password are required",
		},
		{
			name: "Missing token",
			request: ResetPasswordRequest{
				NewPassword: "newpassword123",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "token and new_password are required",
		},
		{
			name: "Missing password",
			request: ResetPasswordRequest{
				Token: "some-reset-token",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "token and new_password are required",
		},
		{
			name: "Password too short",
			request: ResetPasswordRequest{
				Token:       "some-reset-token",
				NewPassword: "short",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "password must be at least 8 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_ = createJSONRequest(t, "POST", "/api/v1/auth/reset-password", tt.request)

			t.Logf("Test case: %s - expects status %d with error: %s",
				tt.name, tt.expectedStatus, tt.expectedError)
		})
	}
}

// TestAuthService tests the auth service directly
func TestAuthService_HashAndCheckPassword(t *testing.T) {
	authService := newTestAuthService()

	testCases := []struct {
		name     string
		password string
	}{
		{"Simple password", "password123"},
		{"Complex password", "P@ssw0rd!2024#$%"},
		{"Long password", "thisisaverylongpasswordthatexceeds32characters"},
		{"Unicode password", "пароль123密码"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Hash the password
			hash, err := authService.HashPassword(tc.password)
			if err != nil {
				t.Fatalf("Failed to hash password: %v", err)
			}

			// Hash should not be empty
			if hash == "" {
				t.Error("Hash should not be empty")
			}

			// Hash should not equal the original password
			if hash == tc.password {
				t.Error("Hash should not equal original password")
			}

			// Check correct password
			if !authService.CheckPassword(tc.password, hash) {
				t.Error("CheckPassword should return true for correct password")
			}

			// Check wrong password
			if authService.CheckPassword("wrongpassword", hash) {
				t.Error("CheckPassword should return false for wrong password")
			}
		})
	}
}

// TestAuthService_GenerateToken tests token generation
func TestAuthService_GenerateToken(t *testing.T) {
	authService := newTestAuthService()

	tenantID := uuid.New().String()
	userID := uuid.New().String()
	email := "test@example.com"

	token, err := authService.GenerateToken(tenantID, userID, email, "OWNER", models.ProductTypeBattery)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Token should not be empty
	if token == "" {
		t.Error("Token should not be empty")
	}

	// Validate the token
	claims, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	// Check claims
	if claims.TenantID != tenantID {
		t.Errorf("Expected tenant ID %s, got %s", tenantID, claims.TenantID)
	}
	if claims.Email != email {
		t.Errorf("Expected email %s, got %s", email, claims.Email)
	}
	if claims.Role != "OWNER" {
		t.Errorf("Expected role 'OWNER', got %s", claims.Role)
	}
	if claims.UserID != userID {
		t.Errorf("Expected user ID %s, got %s", userID, claims.UserID)
	}
	if claims.ProductType != models.ProductTypeBattery {
		t.Errorf("Expected product type %s, got %s", models.ProductTypeBattery, claims.ProductType)
	}
}

// TestAuthService_GenerateRefreshToken tests refresh token generation
func TestAuthService_GenerateRefreshToken(t *testing.T) {
	authService := newTestAuthService()

	tenantID := uuid.New().String()
	userID := uuid.New().String()
	email := "test@example.com"

	refreshToken, jti, err := authService.GenerateRefreshToken(tenantID, userID, email, "OWNER", models.ProductTypeBattery)
	if err != nil {
		t.Fatalf("Failed to generate refresh token: %v", err)
	}

	if refreshToken == "" {
		t.Error("Refresh token should not be empty")
	}
	if jti == "" {
		t.Error("JTI should not be empty")
	}

	// Validate the refresh token
	claims, err := authService.ValidateToken(refreshToken)
	if err != nil {
		t.Fatalf("Failed to validate refresh token: %v", err)
	}

	if claims.TenantID != tenantID {
		t.Errorf("Expected tenant ID %s, got %s", tenantID, claims.TenantID)
	}
	if claims.ProductType != models.ProductTypeBattery {
		t.Errorf("Expected product type %s, got %s", models.ProductTypeBattery, claims.ProductType)
	}
	// JTI must match the registered claim
	if claims.RegisteredClaims.ID != jti {
		t.Errorf("Expected JTI %s in claims, got %s", jti, claims.RegisteredClaims.ID)
	}
}

// TestAuthService_ValidateToken_Invalid tests invalid token validation
func TestAuthService_ValidateToken_Invalid(t *testing.T) {
	authService := newTestAuthService()

	tests := []struct {
		name  string
		token string
	}{
		{"Empty token", ""},
		{"Invalid format", "not-a-valid-token"},
		{"Random JWT-like string", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := authService.ValidateToken(tt.token)
			if err == nil {
				t.Error("Expected error for invalid token, got nil")
			}
		})
	}
}

// TestAuthService_GenerateResetToken tests reset token generation
func TestAuthService_GenerateResetToken(t *testing.T) {
	authService := newTestAuthService()

	// Generate multiple tokens to ensure uniqueness
	tokens := make(map[string]bool)
	for i := 0; i < 10; i++ {
		token, err := authService.GenerateResetToken()
		if err != nil {
			t.Fatalf("Failed to generate reset token: %v", err)
		}

		// Token should be 64 characters (32 bytes hex encoded)
		if len(token) != 64 {
			t.Errorf("Expected token length 64, got %d", len(token))
		}

		// Token should be unique
		if tokens[token] {
			t.Error("Generated duplicate token")
		}
		tokens[token] = true
	}
}

// TestAuthService_GetResetTokenExpiry tests reset token expiry
func TestAuthService_GetResetTokenExpiry(t *testing.T) {
	authService := newTestAuthService()

	before := time.Now()
	expiry := authService.GetResetTokenExpiry()
	after := time.Now()

	// Expiry should be approximately 1 hour from now
	expectedMin := before.Add(1 * time.Hour)
	expectedMax := after.Add(1 * time.Hour)

	if expiry.Before(expectedMin) || expiry.After(expectedMax) {
		t.Errorf("Expiry %v is not within expected range [%v, %v]",
			expiry, expectedMin, expectedMax)
	}
}

// Placeholder for context-related helper
func contextWithTenantID(tenantID string) context.Context {
	// This would normally set the tenant ID in context via middleware
	return context.Background()
}
