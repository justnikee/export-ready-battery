package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	otsCalendarURL = "https://alice.btc.calendar.opentimestamps.org/digest"
	otsUpgradeURL  = "https://alice.btc.calendar.opentimestamps.org/upgrade"
)

// OpenTimestampsService submits file hashes to the OpenTimestamps calendar
// for Bitcoin blockchain anchoring.
type OpenTimestampsService struct {
	client *http.Client
}

// NewOpenTimestampsService creates a service with sensible timeouts.
func NewOpenTimestampsService() *OpenTimestampsService {
	return &OpenTimestampsService{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Stamp submits a SHA-256 hash (32 raw bytes) to the OpenTimestamps calendar.
// It returns the serialized OTS proof bytes, which may be incomplete (pending
// Bitcoin confirmation). Use UpgradeProof later to get the completed proof.
func (s *OpenTimestampsService) Stamp(ctx context.Context, hash []byte) ([]byte, error) {
	if len(hash) != 32 {
		return nil, fmt.Errorf("expected 32-byte SHA-256 hash, got %d bytes", len(hash))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, otsCalendarURL, bytes.NewReader(hash))
	if err != nil {
		return nil, fmt.Errorf("failed to create OTS request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to contact OTS calendar: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OTS calendar returned %d: %s", resp.StatusCode, string(body))
	}

	proof, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read OTS proof: %w", err)
	}

	return proof, nil
}

// UpgradeProof submits an existing OTS proof to the calendar's /upgrade endpoint
// to add the Bitcoin block header attestation. Returns the upgraded proof bytes.
func (s *OpenTimestampsService) UpgradeProof(ctx context.Context, proof []byte) ([]byte, error) {
	if len(proof) == 0 {
		return nil, fmt.Errorf("proof is empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, otsUpgradeURL, bytes.NewReader(proof))
	if err != nil {
		return nil, fmt.Errorf("failed to create upgrade request: %w", err)
	}
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to contact OTS calendar for upgrade: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("proof not yet confirmed in Bitcoin — try again later")
	}
	if resp.StatusCode == http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OTS calendar rejected proof: %s", string(body))
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OTS calendar returned %d: %s", resp.StatusCode, string(body))
	}

	upgraded, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read upgraded proof: %w", err)
	}

	return upgraded, nil
}

// HashToHex converts a raw hash to its hex string representation.
func HashToHex(hash []byte) string {
	return fmt.Sprintf("%x", hash)
}

// EncodeProof base64-encodes OTS proof bytes for storage.
func EncodeProof(proof []byte) string {
	return base64.StdEncoding.EncodeToString(proof)
}

// DecodeProof base64-decodes a stored OTS proof.
func DecodeProof(encoded string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(encoded)
}
