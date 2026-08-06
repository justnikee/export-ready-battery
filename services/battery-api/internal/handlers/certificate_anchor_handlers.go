package handlers

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/anvayalabs/battery-api/internal/jobs"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// CreateCertificateAnchorRequest is the body for POST /batches/{id}/anchors.
type CreateCertificateAnchorRequest struct {
	CertType string `json:"cert_type"` // BIS, UN38.3, IEC_62133, MSDS, DOC, PLI
	FileURL  string `json:"file_url"`
	FileHash string `json:"file_hash"` // SHA-256 hex
}

// CreateCertificateAnchor handles POST /api/v1/batches/{id}/anchors.
// Stores the certificate hash and submits it to OpenTimestamps for Bitcoin anchoring.
func (h *Handler) CreateCertificateAnchor(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Verify batch belongs to tenant
	_, err = h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	var req CreateCertificateAnchorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.CertType == "" || req.FileURL == "" || req.FileHash == "" {
		respondError(w, http.StatusBadRequest, "cert_type, file_url, and file_hash are required")
		return
	}

	// Validate hash is valid hex
	hashBytes, err := hex.DecodeString(req.FileHash)
	if err != nil || len(hashBytes) != 32 {
		respondError(w, http.StatusBadRequest, "file_hash must be a 64-character hex SHA-256")
		return
	}

	anchor := &models.CertificateAnchor{
		ID:        uuid.New().String(),
		BatchID:   batchID.String(),
		TenantID:  tenantID.String(),
		CertType:  req.CertType,
		FileURL:   req.FileURL,
		FileHash:  req.FileHash,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	if err := h.repo.CreateCertificateAnchor(r.Context(), anchor); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to store anchor")
		return
	}

	// Submit to OpenTimestamps asynchronously (fire-and-forget)
	go func() {
		otsSvc := services.NewOpenTimestampsService()
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
		defer cancel()

		proof, err := otsSvc.Stamp(ctx, hashBytes)
		if err != nil {
			_ = h.repo.UpdateCertificateAnchorStatus(r.Context(), anchor.ID, "failed", nil, nil, nil)
			return
		}

		proofB64 := services.EncodeProof(proof)
		now := time.Now()
		_ = h.repo.UpdateCertificateAnchorStatus(r.Context(), anchor.ID, "anchored", &proofB64, nil, &now)
	}()

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":     anchor.ID,
		"status": "pending",
		"message": "Certificate hash submitted for blockchain anchoring. Check back in a few minutes for the completed proof.",
	})
}

// GetCertificateAnchors handles GET /api/v1/batches/{id}/anchors.
func (h *Handler) GetCertificateAnchors(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	batchIDStr := r.PathValue("id")
	batchID, err := uuid.Parse(batchIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID")
		return
	}

	// Verify batch belongs to tenant
	_, err = h.repo.GetBatch(r.Context(), batchID, tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Batch not found")
		return
	}

	anchors, err := h.repo.GetCertificateAnchorsByBatch(r.Context(), batchID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve anchors")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"anchors": anchors,
	})
}

// GetTenantCertificateAnchors handles GET /api/v1/anchors — the cross-batch
// Certificate Anchors browser, optionally filtered by cert_type and/or status.
func (h *Handler) GetTenantCertificateAnchors(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	certType := r.URL.Query().Get("cert_type")
	status := r.URL.Query().Get("status")

	limit := ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	offset := ParseQueryOffset(r)

	anchors, err := h.repo.GetCertificateAnchorsByTenant(r.Context(), tenantID, certType, status, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve anchors")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"anchors": anchors,
	})
}

// UpgradeCertificateAnchors handles POST /api/v1/jobs/upgrade-anchors.
// Platform-admin only (X-Admin-API-Key / ADMIN_API_KEY) — S-03.
// The in-process anchor upgrade ticker still runs without HTTP; this is a manual trigger.
func (h *Handler) UpgradeCertificateAnchors(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	if err := jobs.UpgradePendingAnchors(ctx, h.repo); err != nil {
		respondError(w, http.StatusInternalServerError, "Anchor upgrade job failed")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Anchor upgrade job completed successfully",
	})
}
