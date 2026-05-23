package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// APIKeyService handles API key generation and validation
type APIKeyService struct{}

// NewAPIKeyService creates a new API key service
func NewAPIKeyService() *APIKeyService {
	return &APIKeyService{}
}

// KeyPrefix is the prefix for all API keys
const KeyPrefix = "er_sk_live_"

// GenerateKey generates a new API key with the format: er_sk_live_{32 random chars}
func (s *APIKeyService) GenerateKey() (fullKey string, prefix string, err error) {
	// Generate 32 random bytes (will become 64 hex chars, we'll use 32)
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	randomPart := hex.EncodeToString(randomBytes)
	fullKey = KeyPrefix + randomPart

	// Prefix for display: er_sk_live_ + first 4 chars + ****
	prefix = KeyPrefix + randomPart[:4] + "****"

	return fullKey, prefix, nil
}

// HashKey creates a bcrypt hash of the API key
func (s *APIKeyService) HashKey(key string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(key), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash key: %w", err)
	}
	return string(hash), nil
}

// ValidateKey validates an API key against its hash
func (s *APIKeyService) ValidateKey(key, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(key))
	return err == nil
}

// ExtractPrefix extracts the display prefix from a full key
func (s *APIKeyService) ExtractPrefix(fullKey string) string {
	if !strings.HasPrefix(fullKey, KeyPrefix) {
		return ""
	}

	randomPart := strings.TrimPrefix(fullKey, KeyPrefix)
	if len(randomPart) < 4 {
		return ""
	}

	return KeyPrefix + randomPart[:4] + "****"
}

// IsValidKeyFormat checks if a key has the correct format
func (s *APIKeyService) IsValidKeyFormat(key string) bool {
	if !strings.HasPrefix(key, KeyPrefix) {
		return false
	}

	randomPart := strings.TrimPrefix(key, KeyPrefix)
	return len(randomPart) == 32 // 16 bytes = 32 hex chars
}
