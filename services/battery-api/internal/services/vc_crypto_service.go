package services

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/multiformats/go-multibase"
)

// LDProof represents a W3C Linked Data Proof (Ed25519Signature2020).
type LDProof struct {
	Type               string `json:"type"`
	Created            string `json:"created"`
	ProofPurpose       string `json:"proofPurpose"`
	VerificationMethod string `json:"verificationMethod"`
	ProofValue         string `json:"proofValue"`
}

// DIDDocument represents a minimal did:key DID document.
type DIDDocument struct {
	Context            []string             `json:"@context"`
	ID                 string               `json:"id"`
	VerificationMethod []VerificationMethod `json:"verificationMethod"`
	Authentication     []string             `json:"authentication"`
	AssertionMethod    []string             `json:"assertionMethod"`
}

// VerificationMethod represents a DID verification method.
type VerificationMethod struct {
	ID                 string `json:"id"`
	Type               string `json:"type"`
	Controller         string `json:"controller"`
	PublicKeyMultibase string `json:"publicKeyMultibase"`
}

// VCCryptoService handles Ed25519 key management, DID generation, and VC signing.
type VCCryptoService struct {
	privateKey         ed25519.PrivateKey
	publicKey          ed25519.PublicKey
	did                string
	publicKeyMultibase string
	verificationMethod string
}

// ed25519PubMulticodecPrefix is the varint-encoded multicodec code for Ed25519 public key (0xed).
var ed25519PubMulticodecPrefix = []byte{0xed, 0x01}

// NewVCCryptoService creates a new VC crypto service.
// It loads the signing key from the VC_SIGNING_KEY environment variable (base64).
// If the variable is not set, it generates a new key pair and logs the base64 private key.
func NewVCCryptoService() (*VCCryptoService, error) {
	var priv ed25519.PrivateKey

	keyEnv := os.Getenv("VC_SIGNING_KEY")
	if keyEnv != "" {
		decoded, err := base64.StdEncoding.DecodeString(keyEnv)
		if err != nil {
			return nil, fmt.Errorf("invalid VC_SIGNING_KEY base64: %w", err)
		}
		switch len(decoded) {
		case ed25519.SeedSize:
			priv = ed25519.NewKeyFromSeed(decoded)
		case ed25519.PrivateKeySize:
			priv = ed25519.PrivateKey(decoded)
		default:
			return nil, fmt.Errorf("invalid VC_SIGNING_KEY length: expected %d or %d, got %d", ed25519.SeedSize, ed25519.PrivateKeySize, len(decoded))
		}
		slog.Info("Loaded VC signing key from VC_SIGNING_KEY environment variable")
	} else {
		_, privGen, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to generate Ed25519 key: %w", err)
		}
		priv = privGen
		encoded := base64.StdEncoding.EncodeToString(priv)
		slog.Warn("VC_SIGNING_KEY not set; generated a new Ed25519 key pair", "private_key_base64", encoded)
	}

	pub := priv.Public().(ed25519.PublicKey)

	// Build multibase-encoded public key with Ed25519 multicodec prefix.
	multicodecPub := append(ed25519PubMulticodecPrefix, pub...)
	pubKeyMultibase, err := multibase.Encode(multibase.Base58BTC, multicodecPub)
	if err != nil {
		return nil, fmt.Errorf("failed to multibase encode public key: %w", err)
	}

	did := "did:key:" + pubKeyMultibase
	vm := did + "#" + pubKeyMultibase

	return &VCCryptoService{
		privateKey:         priv,
		publicKey:          pub,
		did:                did,
		publicKeyMultibase: pubKeyMultibase,
		verificationMethod: vm,
	}, nil
}

// DID returns the did:key identifier.
func (s *VCCryptoService) DID() string {
	return s.did
}

// PublicKeyMultibase returns the multibase-encoded public key (with prefix).
func (s *VCCryptoService) PublicKeyMultibase() string {
	return s.publicKeyMultibase
}

// SignCredential creates a Linked Data Proof for the given credential subject.
// It constructs a minimal W3C Verifiable Credential payload, canonicalizes it via
// deterministic JSON serialization, and produces an Ed25519Signature2020 proof.
// The credential ID is generated automatically.
func (s *VCCryptoService) SignCredential(credentialSubject json.RawMessage) (*LDProof, error) {
	return s.SignCredentialWithID("urn:uuid:"+uuid.New().String(), credentialSubject)
}

// SignCredentialWithID creates a Linked Data Proof using an explicit credential ID.
// This allows the caller to correlate the proof with a specific VC document.
func (s *VCCryptoService) SignCredentialWithID(credentialID string, credentialSubject json.RawMessage) (*LDProof, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	canonicalBytes, err := s.canonicalizeCredential(credentialID, now, credentialSubject)
	if err != nil {
		return nil, err
	}

	signature := ed25519.Sign(s.privateKey, canonicalBytes)

	proofValue, err := multibase.Encode(multibase.Base58BTC, signature)
	if err != nil {
		return nil, fmt.Errorf("failed to encode signature: %w", err)
	}

	proof := &LDProof{
		Type:               "Ed25519Signature2020",
		Created:            now,
		ProofPurpose:       "assertionMethod",
		VerificationMethod: s.verificationMethod,
		ProofValue:         proofValue,
	}

	return proof, nil
}

// VerifyCredential verifies a Linked Data Proof for a credential.
// It reconstructs the canonical credential bytes and checks the Ed25519 signature.
func (s *VCCryptoService) VerifyCredential(credentialID string, credentialSubject json.RawMessage, proof *LDProof) error {
	if proof.Type != "Ed25519Signature2020" {
		return fmt.Errorf("unsupported proof type: %s", proof.Type)
	}

	canonicalBytes, err := s.canonicalizeCredential(credentialID, proof.Created, credentialSubject)
	if err != nil {
		return err
	}

	_, sigBytes, err := multibase.Decode(proof.ProofValue)
	if err != nil {
		return fmt.Errorf("failed to decode proofValue: %w", err)
	}

	if !ed25519.Verify(s.publicKey, canonicalBytes, sigBytes) {
		return fmt.Errorf("signature verification failed")
	}
	return nil
}

// GetDIDDocument returns the DID document for the platform's did:key.
func (s *VCCryptoService) GetDIDDocument() *DIDDocument {
	vm := VerificationMethod{
		ID:                 s.verificationMethod,
		Type:               "Ed25519VerificationKey2020",
		Controller:         s.did,
		PublicKeyMultibase: s.publicKeyMultibase,
	}
	return &DIDDocument{
		Context: []string{
			"https://www.w3.org/ns/did/v1",
			"https://w3id.org/security/suites/ed25519-2020/v1",
		},
		ID:                 s.did,
		VerificationMethod: []VerificationMethod{vm},
		Authentication:     []string{s.verificationMethod},
		AssertionMethod:    []string{s.verificationMethod},
	}
}

// canonicalizeCredential builds a deterministic JSON representation of the credential.
// Because Go structs marshal fields in declaration order, this provides stable
// canonicalization sufficient for the current implementation.
func (s *VCCryptoService) canonicalizeCredential(credentialID, issuanceDate string, credentialSubject json.RawMessage) ([]byte, error) {
	cred := struct {
		Context           []string        `json:"@context"`
		ID                string          `json:"id,omitempty"`
		Type              []string        `json:"type"`
		Issuer            string          `json:"issuer"`
		IssuanceDate      string          `json:"issuanceDate"`
		CredentialSubject json.RawMessage `json:"credentialSubject"`
	}{
		Context: []string{
			"https://www.w3.org/2018/credentials/v1",
			"https://w3id.org/security/suites/ed25519-2020/v1",
		},
		Type:              []string{"VerifiableCredential", "BatteryPassportCredential"},
		Issuer:            s.did,
		IssuanceDate:      issuanceDate,
		CredentialSubject: credentialSubject,
	}
	if credentialID != "" {
		cred.ID = credentialID
	}

	canonicalBytes, err := json.Marshal(cred)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize credential: %w", err)
	}
	return canonicalBytes, nil
}
