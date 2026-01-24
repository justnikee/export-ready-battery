package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// ActorRole defines the type of external user
type ActorRole string

const (
	ActorRoleManufacturer ActorRole = "MANUFACTURER"
	ActorRoleLogistics    ActorRole = "LOGISTICS"
	ActorRoleTechnician   ActorRole = "TECHNICIAN"
	ActorRoleRecycler     ActorRole = "RECYCLER"
	ActorRoleCustomer     ActorRole = "CUSTOMER"
)

// IsValidActorRole checks if the role is valid
func IsValidActorRole(role string) bool {
	switch ActorRole(role) {
	case ActorRoleManufacturer, ActorRoleLogistics, ActorRoleTechnician, ActorRoleRecycler, ActorRoleCustomer:
		return true
	}
	return false
}

// MagicLinkClaims contains the JWT claims for magic link tokens
type MagicLinkClaims struct {
	PassportID string `json:"passport_id"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	TokenID    string `json:"token_id"` // For revocation tracking
	jwt.RegisteredClaims
}

// MagicLinkToken represents a generated magic link token
type MagicLinkToken struct {
	Token     string    `json:"token"`
	TokenHash string    `json:"token_hash"` // For DB storage
	ExpiresAt time.Time `json:"expires_at"`
	TokenID   string    `json:"token_id"`
}

// GenerateMagicToken creates a 1-hour JWT for passport access
// The token is scoped to a specific passport and includes the actor's email and role
func GenerateMagicToken(passportID, email, role, secret string) (*MagicLinkToken, error) {
	if passportID == "" {
		return nil, errors.New("passport_id is required")
	}
	if email == "" {
		return nil, errors.New("email is required")
	}
	if !IsValidActorRole(role) {
		return nil, errors.New("invalid actor role")
	}

	tokenID := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour)

	claims := MagicLinkClaims{
		PassportID: passportID,
		Email:      email,
		Role:       role,
		TokenID:    tokenID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "exportready-battery",
			Subject:   email,
			ID:        tokenID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	// Generate hash for DB storage
	hash := sha256.Sum256([]byte(tokenString))
	tokenHash := hex.EncodeToString(hash[:])

	return &MagicLinkToken{
		Token:     tokenString,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		TokenID:   tokenID,
	}, nil
}

// ValidateMagicToken parses and validates the JWT
// Returns the claims if valid, error otherwise
func ValidateMagicToken(tokenString, secret string) (*MagicLinkClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MagicLinkClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*MagicLinkClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// ValidateMagicTokenForPassport validates the token AND ensures it matches the passport
func ValidateMagicTokenForPassport(tokenString, secret, passportID string) (*MagicLinkClaims, error) {
	claims, err := ValidateMagicToken(tokenString, secret)
	if err != nil {
		return nil, err
	}

	// Ensure the token is for this specific passport
	if claims.PassportID != passportID {
		return nil, errors.New("token is not valid for this passport")
	}

	return claims, nil
}

// HashToken generates a SHA256 hash of a token for DB storage
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
