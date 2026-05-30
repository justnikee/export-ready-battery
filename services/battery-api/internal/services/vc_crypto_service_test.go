package services

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewVCCryptoService_GeneratesKeyWhenEnvMissing(t *testing.T) {
	os.Unsetenv("VC_SIGNING_KEY")
	svc, err := NewVCCryptoService()
	require.NoError(t, err)
	require.NotNil(t, svc)

	assert.True(t, strings.HasPrefix(svc.DID(), "did:key:z"))
	assert.NotEmpty(t, svc.PublicKeyMultibase())
}

func TestNewVCCryptoService_LoadsKeyFromEnv(t *testing.T) {
	// Generate a fresh service to get a valid key
	os.Unsetenv("VC_SIGNING_KEY")
	genSvc, err := NewVCCryptoService()
	require.NoError(t, err)

	privB64 := base64.StdEncoding.EncodeToString([]byte(genSvc.privateKey))

	t.Setenv("VC_SIGNING_KEY", privB64)

	loadedSvc, err := NewVCCryptoService()
	require.NoError(t, err)
	assert.Equal(t, genSvc.DID(), loadedSvc.DID())
}

func TestSignCredentialAndVerify_RoundTrip(t *testing.T) {
	os.Unsetenv("VC_SIGNING_KEY")
	svc, err := NewVCCryptoService()
	require.NoError(t, err)

	subject := json.RawMessage(`{"id":"passport-123","serialNumber":"SN-001"}`)

	proof, err := svc.SignCredentialWithID("urn:uuid:test-id-123", subject)
	require.NoError(t, err)
	require.NotNil(t, proof)

	assert.Equal(t, "Ed25519Signature2020", proof.Type)
	assert.Equal(t, "assertionMethod", proof.ProofPurpose)
	assert.True(t, strings.HasPrefix(proof.VerificationMethod, svc.DID()+"#"))
	assert.True(t, strings.HasPrefix(proof.ProofValue, "z"))

	// Verify the signature
	err = svc.VerifyCredential("urn:uuid:test-id-123", subject, proof)
	require.NoError(t, err)
}

func TestVerifyCredential_InvalidSignature(t *testing.T) {
	os.Unsetenv("VC_SIGNING_KEY")
	svc, err := NewVCCryptoService()
	require.NoError(t, err)

	subject := json.RawMessage(`{"id":"passport-123"}`)
	proof, err := svc.SignCredentialWithID("urn:uuid:test-id", subject)
	require.NoError(t, err)

	// Tamper with the subject
	tamperedSubject := json.RawMessage(`{"id":"passport-456"}`)
	err = svc.VerifyCredential("urn:uuid:test-id", tamperedSubject, proof)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "signature verification failed")
}

func TestGetDIDDocument(t *testing.T) {
	os.Unsetenv("VC_SIGNING_KEY")
	svc, err := NewVCCryptoService()
	require.NoError(t, err)

	doc := svc.GetDIDDocument()
	require.NotNil(t, doc)

	assert.Equal(t, svc.DID(), doc.ID)
	assert.Len(t, doc.VerificationMethod, 1)
	assert.Equal(t, svc.verificationMethod, doc.VerificationMethod[0].ID)
	assert.Equal(t, "Ed25519VerificationKey2020", doc.VerificationMethod[0].Type)
	assert.Equal(t, svc.publicKeyMultibase, doc.VerificationMethod[0].PublicKeyMultibase)
	assert.Contains(t, doc.Authentication, svc.verificationMethod)
	assert.Contains(t, doc.AssertionMethod, svc.verificationMethod)
}

func TestSignCredential_GeneratesValidProof(t *testing.T) {
	os.Unsetenv("VC_SIGNING_KEY")
	svc, err := NewVCCryptoService()
	require.NoError(t, err)

	subject := json.RawMessage(`{"id":"passport-789"}`)
	proof, err := svc.SignCredential(subject)
	require.NoError(t, err)

	assert.Equal(t, "Ed25519Signature2020", proof.Type)
	assert.NotEmpty(t, proof.Created)
	assert.NotEmpty(t, proof.ProofValue)
}
