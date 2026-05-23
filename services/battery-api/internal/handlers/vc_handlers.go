package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
)

// GenerateVCHandle handles POST /api/v1/passports/{id}/vc
//
// Scaffold: generates a W3C Verifiable Credential payload from passport data.
// Does NOT perform real cryptographic signing yet — the proof field is a placeholder.
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

	// Placeholder proof — real LD-Proof signing is a future phase
	proof := map[string]interface{}{
		"type":        "Ed25519Signature2020",
		"created":     "",
		"proofPurpose": "assertionMethod",
		"verificationMethod": "",
		"proofValue":  "",
		"note":        "PLACEHOLDER — real cryptographic signing not yet implemented",
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
}
