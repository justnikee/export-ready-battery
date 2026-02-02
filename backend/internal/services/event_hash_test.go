package services

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

// TestGenerateEventHash tests SHA-256 hash generation for audit events
func TestGenerateEventHash(t *testing.T) {
	testData := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440001"),
		EventType:    "STATUS_CHANGED",
		Actor:        "test@example.com",
		Metadata:     map[string]interface{}{"from": "manufactured", "to": "shipped"},
		CreatedAt:    time.Date(2026, 1, 30, 12, 0, 0, 0, time.UTC),
		PreviousHash: "",
	}

	hash, err := GenerateEventHash(testData)
	if err != nil {
		t.Fatalf("GenerateEventHash() error = %v", err)
	}

	// SHA-256 produces 64-character hex string
	if len(hash) != 64 {
		t.Errorf("Hash length = %d, want 64", len(hash))
	}

	// Verify determinism - same input should produce same hash
	hash2, err := GenerateEventHash(testData)
	if err != nil {
		t.Fatalf("GenerateEventHash() second call error = %v", err)
	}
	if hash != hash2 {
		t.Error("Hash should be deterministic - same inputs should produce same hash")
	}
}

// TestGenerateEventHash_DifferentInputs tests that different inputs produce different hashes
func TestGenerateEventHash_DifferentInputs(t *testing.T) {
	baseData := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440001"),
		EventType:    "STATUS_CHANGED",
		Actor:        "test@example.com",
		Metadata:     map[string]interface{}{"from": "manufactured", "to": "shipped"},
		CreatedAt:    time.Date(2026, 1, 30, 12, 0, 0, 0, time.UTC),
		PreviousHash: "",
	}

	baseHash, _ := GenerateEventHash(baseData)

	tests := []struct {
		name     string
		modifier func(EventHashData) EventHashData
	}{
		{
			name: "Different event type",
			modifier: func(d EventHashData) EventHashData {
				d.EventType = "CREATED"
				return d
			},
		},
		{
			name: "Different actor",
			modifier: func(d EventHashData) EventHashData {
				d.Actor = "other@example.com"
				return d
			},
		},
		{
			name: "Different timestamp",
			modifier: func(d EventHashData) EventHashData {
				d.CreatedAt = time.Date(2026, 1, 31, 12, 0, 0, 0, time.UTC)
				return d
			},
		},
		{
			name: "Different previous hash",
			modifier: func(d EventHashData) EventHashData {
				d.PreviousHash = "abc123def456"
				return d
			},
		},
		{
			name: "Different metadata",
			modifier: func(d EventHashData) EventHashData {
				d.Metadata = map[string]interface{}{"from": "shipped", "to": "installed"}
				return d
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			modifiedData := tt.modifier(baseData)
			modifiedHash, err := GenerateEventHash(modifiedData)
			if err != nil {
				t.Fatalf("GenerateEventHash() error = %v", err)
			}
			if modifiedHash == baseHash {
				t.Errorf("Modified data should produce different hash")
			}
		})
	}
}

// TestVerifyEventHash tests hash verification
func TestVerifyEventHash(t *testing.T) {
	testData := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440001"),
		EventType:    "STATUS_CHANGED",
		Actor:        "test@example.com",
		Metadata:     map[string]interface{}{"from": "manufactured", "to": "shipped"},
		CreatedAt:    time.Date(2026, 1, 30, 12, 0, 0, 0, time.UTC),
		PreviousHash: "",
	}

	// Generate the correct hash
	correctHash, _ := GenerateEventHash(testData)

	tests := []struct {
		name string
		hash string
		want bool
	}{
		{
			name: "Valid hash",
			hash: correctHash,
			want: true,
		},
		{
			name: "Invalid hash - wrong value",
			hash: "definitely_not_correct_hash_value_1234567890abcdef",
			want: false,
		},
		{
			name: "Invalid hash - empty",
			hash: "",
			want: false,
		},
		{
			name: "Invalid hash - tampered single char",
			hash: "a" + correctHash[1:],
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := VerifyEventHash(testData, tt.hash)
			if got != tt.want {
				t.Errorf("VerifyEventHash() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestVerifyEventChain tests chain integrity verification
func TestVerifyEventChain(t *testing.T) {
	// Create a valid chain of events
	now := time.Date(2026, 1, 30, 12, 0, 0, 0, time.UTC)

	event1Data := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440000"),
		EventType:    "CREATED",
		Actor:        "system",
		Metadata:     map[string]interface{}{},
		CreatedAt:    now,
		PreviousHash: "",
	}
	hash1, _ := GenerateEventHash(event1Data)

	event2Data := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440000"),
		EventType:    "STATUS_CHANGED",
		Actor:        "user@example.com",
		Metadata:     map[string]interface{}{"from": "manufactured", "to": "shipped"},
		CreatedAt:    now.Add(time.Hour),
		PreviousHash: hash1, // Links to first event
	}
	hash2, _ := GenerateEventHash(event2Data)

	event3Data := EventHashData{
		ID:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440003"),
		PassportID:   uuid.MustParse("660e8400-e29b-41d4-a716-446655440000"),
		EventType:    "STATUS_CHANGED",
		Actor:        "user@example.com",
		Metadata:     map[string]interface{}{"from": "shipped", "to": "installed"},
		CreatedAt:    now.Add(2 * time.Hour),
		PreviousHash: hash2, // Links to second event
	}
	hash3, _ := GenerateEventHash(event3Data)

	// Build valid chain
	validChain := []ChainEvent{
		{Data: event1Data, Hash: hash1},
		{Data: event2Data, Hash: hash2},
		{Data: event3Data, Hash: hash3},
	}

	t.Run("Valid chain", func(t *testing.T) {
		valid, idx := VerifyEventChain(validChain)
		if !valid {
			t.Errorf("VerifyEventChain() valid = false, want true (failed at index %d)", idx)
		}
	})

	t.Run("Tampered hash in chain", func(t *testing.T) {
		tamperedChain := []ChainEvent{
			{Data: event1Data, Hash: hash1},
			{Data: event2Data, Hash: "tampered_hash"},
			{Data: event3Data, Hash: hash3},
		}
		valid, idx := VerifyEventChain(tamperedChain)
		if valid {
			t.Error("VerifyEventChain() should detect tampered hash")
		}
		if idx != 1 {
			t.Errorf("VerifyEventChain() failed at index %d, want 1", idx)
		}
	})

	t.Run("Broken chain - wrong previous hash", func(t *testing.T) {
		brokenEvent2 := event2Data
		brokenEvent2.PreviousHash = "wrong_previous_hash"
		brokenHash2, _ := GenerateEventHash(brokenEvent2)

		brokenChain := []ChainEvent{
			{Data: event1Data, Hash: hash1},
			{Data: brokenEvent2, Hash: brokenHash2},
		}
		valid, idx := VerifyEventChain(brokenChain)
		if valid {
			t.Error("VerifyEventChain() should detect broken chain")
		}
		if idx != 1 {
			t.Errorf("VerifyEventChain() failed at index %d, want 1", idx)
		}
	})

	t.Run("Empty chain", func(t *testing.T) {
		valid, _ := VerifyEventChain([]ChainEvent{})
		if !valid {
			t.Error("Empty chain should be valid")
		}
	})

	t.Run("Single event chain", func(t *testing.T) {
		singleChain := []ChainEvent{
			{Data: event1Data, Hash: hash1},
		}
		valid, _ := VerifyEventChain(singleChain)
		if !valid {
			t.Error("Single event chain should be valid")
		}
	})
}
