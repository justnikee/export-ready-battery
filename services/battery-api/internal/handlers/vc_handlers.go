package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
)

// GenerateVCHandle handles POST /api/v1/passports/{id}/vc
//
// Generates a W3C Verifiable Credential payload from passport data and
// cryptographically signs it using the platform Ed25519 key (did:key).
// If VC signing is not configured, falls back to a draft placeholder.
func (h *Handler) GenerateVCHandle(w http.ResponseWriter, r *http.Request) {
	passportIDStr := r.PathValue("id")
	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport ID")
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	passport, err := h.repo.GetPassport(r.Context(), passportID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	// SECURITY: ensure tenant owns this passport
	batch, err := h.repo.GetBatch(r.Context(), passport.BatchID, tenantID)
	if err != nil || batch == nil {
		respondError(w, http.StatusForbidden, "Passport does not belong to tenant")
		return
	}

	// Build credential subject from passport + batch snapshot
	subject := map[string]interface{}{
		"id":              passport.UUID.String(),
		"serialNumber":    passport.SerialNumber,
		"batchID":         passport.BatchID.String(),
		"manufactureDate": passport.ManufactureDate.Format("2006-01-02"),
		"status":          passport.Status,
		"productType":     passport.ProductType,
	}

	if passport.BatchSnapshot != nil {
		var snapshot map[string]interface{}
		if err := json.Unmarshal(passport.BatchSnapshot, &snapshot); err == nil {
			subject["batchSnapshot"] = snapshot
		}
	}

	credentialSubject, _ := json.Marshal(subject)

	// If crypto service is unavailable, return a draft placeholder (backward compatibility)
	if h.vcCryptoService == nil {
		proof := map[string]interface{}{
			"type":               "Ed25519Signature2020",
			"created":            "",
			"proofPurpose":       "assertionMethod",
			"verificationMethod": "",
			"proofValue":         "",
			"note":               "PLACEHOLDER — VC signing not configured",
		}
		proofJSON, _ := json.Marshal(proof)

		vc := models.PassportVC{
			PassportID:        passport.UUID,
			VCType:            "BatteryPassportCredential",
			IssuerDID:         "did:example:anvayalabs",
			CredentialSubject: credentialSubject,
			Proof:             proofJSON,
			Status:            "draft",
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"vc":      vc,
			"message": "Verifiable Credential payload generated (draft — not cryptographically signed)",
		})
		return
	}

	// Real cryptographic signing
	vcID := "urn:uuid:" + uuid.New().String()
	proof, err := h.vcCryptoService.SignCredentialWithID(vcID, credentialSubject)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to sign credential")
		return
	}

	proofJSON, err := json.Marshal(proof)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to marshal proof")
		return
	}

	vc := models.PassportVC{
		PassportID:        passport.UUID,
		VCType:            "BatteryPassportCredential",
		IssuerDID:         h.vcCryptoService.DID(),
		CredentialSubject: credentialSubject,
		Proof:             proofJSON,
		Status:            "issued",
	}

	if err := h.repo.CreatePassportVC(r.Context(), &vc); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to store signed VC")
		return
	}

	// Assemble the full W3C VC document for the response
	vcDoc := map[string]interface{}{
		"@context": []string{
			"https://www.w3.org/2018/credentials/v1",
			"https://w3id.org/security/suites/ed25519-2020/v1",
		},
		"id":                vcID,
		"type":              []string{"VerifiableCredential", "BatteryPassportCredential"},
		"issuer":            h.vcCryptoService.DID(),
		"issuanceDate":      proof.Created,
		"credentialSubject": subject,
		"proof":             proof,
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"vc":      vcDoc,
		"message": "Verifiable Credential cryptographically signed and stored",
	})
}

// GetDIDDocumentHandle handles GET /api/v1/did.json
// Returns the platform's did:key DID document for external verifiers.
func (h *Handler) GetDIDDocumentHandle(w http.ResponseWriter, r *http.Request) {
	if h.vcCryptoService == nil {
		respondError(w, http.StatusServiceUnavailable, "VC signing not configured")
		return
	}

	doc := h.vcCryptoService.GetDIDDocument()
	respondJSON(w, http.StatusOK, doc)
}

// Ensure VCCryptoService interface compatibility at compile time
var _ interface {
	SignCredentialWithID(string, json.RawMessage) (*services.LDProof, error)
	DID() string
	GetDIDDocument() *services.DIDDocument
} = (*services.VCCryptoService)(nil)
