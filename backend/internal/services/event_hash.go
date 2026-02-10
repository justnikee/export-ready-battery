package services

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// EventHashData represents the data used to generate the event hash
// This must be deterministic - always use the same field order
type EventHashData struct {
	ID           uuid.UUID              `json:"id"`
	PassportID   uuid.UUID              `json:"passport_id"`
	EventType    string                 `json:"event_type"`
	Action       string                 `json:"action,omitempty"`
	Actor        string                 `json:"actor"`
	ActorType    string                 `json:"actor_type,omitempty"`
	ActorRole    string                 `json:"actor_role,omitempty"`
	ActorID      string                 `json:"actor_identifier,omitempty"`
	Source       string                 `json:"source,omitempty"`
	StatusFrom   string                 `json:"status_from,omitempty"`
	StatusTo     string                 `json:"status_to,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	PreviousHash string                 `json:"previous_hash"`
}

// GenerateEventHash creates a SHA-256 hash for tamper detection
// The hash includes all event data plus the previous event's hash for chain integrity
func GenerateEventHash(data EventHashData) (string, error) {
	// Serialize to JSON for deterministic hashing
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal event data: %w", err)
	}

	// Generate SHA-256 hash
	hash := sha256.Sum256(jsonBytes)
	return hex.EncodeToString(hash[:]), nil
}

// VerifyEventHash checks if an event's hash is valid
func VerifyEventHash(data EventHashData, expectedHash string) bool {
	computedHash, err := GenerateEventHash(data)
	if err != nil {
		return false
	}
	return computedHash == expectedHash
}

// ChainEvent represents an event in the chain with its data and stored hash
type ChainEvent struct {
	Data EventHashData
	Hash string
}

// VerifyEventChain verifies the integrity of a chain of events
// Returns (valid, failedIndex) - if valid is false, failedIndex indicates which event failed
func VerifyEventChain(events []ChainEvent) (bool, int) {
	if len(events) == 0 {
		return true, -1
	}

	for i, event := range events {
		// Verify this event's stored hash matches computed hash
		computedHash, err := GenerateEventHash(event.Data)
		if err != nil {
			return false, i
		}
		if event.Hash != computedHash {
			return false, i
		}

		// For events after the first, verify chain link
		if i > 0 {
			if event.Data.PreviousHash != events[i-1].Hash {
				return false, i
			}
		}
	}

	return true, -1 // All valid
}
