package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// getBcryptCost returns the bcrypt cost from BCRYPT_COST env var, defaulting to bcrypt.DefaultCost.
func getBcryptCost() int {
	if v := os.Getenv("BCRYPT_COST"); v != "" {
		if c, err := strconv.Atoi(v); err == nil && c >= bcrypt.MinCost && c <= bcrypt.MaxCost {
			return c
		}
	}
	return bcrypt.DefaultCost
}

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrTokenExpired       = errors.New("token has expired")
)

// AuthService handles authentication operations
type AuthService struct {
	jwtSecret     []byte
	jwtExpiry     time.Duration
	refreshExpiry time.Duration
}

// NewAuthService creates a new auth service
func NewAuthService(jwtSecret string, jwtExpiry, refreshExpiry time.Duration) *AuthService {
	return &AuthService{
		jwtSecret:     []byte(jwtSecret),
		jwtExpiry:     jwtExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// Claims represents JWT claims
type Claims struct {
	TenantID string `json:"tenant_id"`
	Email    string `json:"email"`
	Role     string `json:"role"` // RBAC: owner | operator | viewer
	jwt.RegisteredClaims
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), getBcryptCost())
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword compares a password with its hash
func (s *AuthService) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateToken generates a JWT access token with role embedded
func (s *AuthService) GenerateToken(tenantID, email, role string) (string, error) {
	claims := &Claims{
		TenantID: tenantID,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "anvayalabs-battery",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// GenerateRefreshToken generates a refresh token with a unique JTI for revocation.
// Returns (tokenString, jti, error). Callers MUST persist the jti in the DB.
func (s *AuthService) GenerateRefreshToken(tenantID, email, role string) (string, string, error) {
	jti := uuid.New().String()
	claims := &Claims{
		TenantID: tenantID,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "anvayalabs-battery",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", "", err
	}
	return tokenStr, jti, nil
}

// GetRefreshExpiry returns the duration of refresh token validity
func (s *AuthService) GetRefreshExpiry() time.Duration {
	return s.refreshExpiry
}

// ValidateToken validates a JWT token and returns the claims
func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GenerateResetToken generates a secure random reset token
func (s *AuthService) GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GetResetTokenExpiry returns the expiry time for reset tokens (1 hour)
func (s *AuthService) GetResetTokenExpiry() time.Time {
	return time.Now().Add(1 * time.Hour)
}
