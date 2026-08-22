package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// ValidDocumentTypes for upload
var ValidDocumentTypes = map[string]string{
	"epr": "epr_certificate_path",
	"bis": "bis_certificate_path",
	"pli": "pli_certificate_path",
}

// MaxUploadSize is EPR/BIS/PLI cert upload ceiling (≤ global 10MB body — P-06).
const MaxUploadSize = limits.MaxCertUploadBytes

const complianceDocsBucket = "compliance-docs"

// storageUnavailable returns a standard error when Supabase is not configured.
func storageUnavailable(w http.ResponseWriter) {
	respondError(w, http.StatusServiceUnavailable, "Cloud storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
}

// isHTTPURL checks if a string looks like an HTTP(S) URL.
func isHTTPURL(s string) bool {
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}

// UploadDocument handles POST /api/v1/settings/upload-document
// Accepts multipart form with 'file' (PDF) and 'document_type' (epr/bis/pli)
func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	if !parseMultipartForm(w, r, MaxUploadSize) {
		return
	}

	documentType := strings.ToLower(r.FormValue("document_type"))
	if _, valid := ValidDocumentTypes[documentType]; !valid {
		respondError(w, http.StatusBadRequest, "Invalid document_type. Must be 'epr', 'bis', or 'pli'")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	if header.Size > MaxUploadSize {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("Failed to read uploaded file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// S-11: magic-byte check — do not trust Content-Type or .pdf extension alone.
	if err := services.RequirePDF(fileBytes); err != nil {
		respondError(w, http.StatusBadRequest, "Only valid PDF files are allowed (file content must start with %PDF-)")
		return
	}

	// Upload to private compliance-docs bucket (S-10).
	// DB stores a canonical public-URL-shaped reference only — never a signed
	// URL (those expire). Reads re-sign via resolveFreshBucketURL / ViewDocument.
	storagePath := fmt.Sprintf("%s/certificates/%s.pdf", tenantID.String(), documentType)
	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, "application/pdf"); err != nil {
		slog.Error("Failed to upload certificate to storage", "error", err, "tenant_id", tenantID, "doc_type", documentType)
		respondError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	canonicalRef := h.storageService.PublicURL(complianceDocsBucket, storagePath)

	if err := h.repo.UpdateCertificatePath(r.Context(), tenantID, documentType, canonicalRef); err != nil {
		slog.Error("Failed to update tenant certificate path", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	// Fresh signed URL for the immediate client response only (1h).
	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, storagePath, 1*time.Hour)
	if err != nil {
		slog.Error("Failed to sign certificate URL for response", "error", err, "tenant_id", tenantID)
		signedURL = "" // client should use GET /settings/documents/{type}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"url":           signedURL,
		"path":          canonicalRef, // opaque storage reference — not browser-openable without signing
		"document_type": documentType,
		"message":       fmt.Sprintf("%s certificate uploaded successfully", strings.ToUpper(documentType)),
	})
}

var stagingDocKinds = map[string]bool{
	"pli": true, // CA certificate for audited DVA (batch-level)
	"doc": true, // Declaration of Conformity
}

// UploadStagingComplianceDoc handles POST /api/v1/uploads/compliance-doc
// Wizard uploads before a batch exists. Stores a canonical private-bucket
// reference (S-10) after PDF magic-byte sniff (S-11). The client must persist
// `path`, never the short-lived `url`.
func (h *Handler) UploadStagingComplianceDoc(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	if !parseMultipartForm(w, r, MaxUploadSize) {
		return
	}

	kind := strings.ToLower(strings.TrimSpace(r.FormValue("kind")))
	if !stagingDocKinds[kind] {
		respondError(w, http.StatusBadRequest, "Invalid kind. Must be 'pli' or 'doc'")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	if header.Size > MaxUploadSize {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("staging compliance upload: failed to read file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	if err := services.RequirePDF(fileBytes); err != nil {
		respondError(w, http.StatusBadRequest, "Only valid PDF files are allowed (file content must start with %PDF-)")
		return
	}

	storagePath := fmt.Sprintf("%s/batch-staging/%s/%s.pdf", tenantID.String(), kind, uuid.New().String())
	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, "application/pdf"); err != nil {
		slog.Error("staging compliance upload: storage failed", "error", err, "tenant_id", tenantID, "kind", kind)
		respondError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	canonicalRef := h.storageService.PublicURL(complianceDocsBucket, storagePath)
	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, storagePath, 1*time.Hour)
	if err != nil {
		slog.Error("staging compliance upload: sign failed", "error", err)
		signedURL = ""
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"path":    canonicalRef,
		"url":     signedURL,
		"kind":    kind,
	})
}

// ViewStagingComplianceDoc handles GET /api/v1/uploads/compliance-doc?path=
// Re-signs a tenant-owned staging (or later batch-attached) compliance object.
func (h *Handler) ViewStagingComplianceDoc(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	raw := strings.TrimSpace(r.URL.Query().Get("path"))
	if raw == "" {
		respondError(w, http.StatusBadRequest, "path is required")
		return
	}

	storagePath, ok := h.storageService.ExtractStoragePath(raw, complianceDocsBucket)
	if !ok {
		respondError(w, http.StatusBadRequest, "Invalid document path")
		return
	}
	prefix := tenantID.String() + "/"
	if !strings.HasPrefix(storagePath, prefix) || strings.Contains(storagePath, "..") {
		respondError(w, http.StatusNotFound, "Document not found")
		return
	}

	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, storagePath, 1*time.Hour)
	if err != nil || signedURL == "" {
		slog.Error("staging compliance view: sign failed", "error", err, "tenant_id", tenantID)
		respondError(w, http.StatusNotFound, "Document not found")
		return
	}

	if strings.Contains(r.Header.Get("Accept"), "application/json") {
		respondJSON(w, http.StatusOK, map[string]interface{}{"url": signedURL})
		return
	}
	http.Redirect(w, r, signedURL, http.StatusTemporaryRedirect)
}

// ViewDocument handles GET /api/v1/settings/documents/{type}
// Re-signs a private-bucket certificate and redirects (S-10). Never exposes a
// long-lived public object URL.
func (h *Handler) ViewDocument(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	documentType := strings.ToLower(r.PathValue("type"))
	if _, valid := ValidDocumentTypes[documentType]; !valid {
		respondError(w, http.StatusBadRequest, "Invalid document type. Must be 'epr', 'bis', or 'pli'")
		return
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Tenant not found")
		return
	}

	var stored string
	switch documentType {
	case "epr":
		stored = tenant.BatteryProfile.EPRCertificatePath
	case "bis":
		stored = tenant.BatteryProfile.BISCertificatePath
	case "pli":
		stored = tenant.BatteryProfile.PLICertificatePath
	}

	if stored == "" {
		respondError(w, http.StatusNotFound, fmt.Sprintf("No %s certificate uploaded", strings.ToUpper(documentType)))
		return
	}

	// Prefer the deterministic private path; fall back to extracting from a
	// legacy public/signed URL stored before S-10.
	storagePath := fmt.Sprintf("%s/certificates/%s.pdf", tenantID.String(), documentType)
	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, storagePath, 1*time.Hour)
	if err != nil {
		// Legacy: stored value may be a full Supabase URL with a different path shape
		signedURL, err = resolveFreshBucketURL(r.Context(), h.storageService, stored)
		if err != nil || signedURL == "" {
			slog.Error("Failed to sign certificate for view", "error", err, "tenant_id", tenantID, "doc_type", documentType)
			respondError(w, http.StatusNotFound, "Certificate file not found")
			return
		}
	}

	// JSON preferred by SPA when Accept: application/json; otherwise redirect
	// (axios blob clients that follow redirects still get the PDF).
	if strings.Contains(r.Header.Get("Accept"), "application/json") {
		respondJSON(w, http.StatusOK, map[string]interface{}{"url": signedURL})
		return
	}
	http.Redirect(w, r, signedURL, http.StatusTemporaryRedirect)
}

// UploadLogo handles POST /api/v1/settings/upload-logo
// Accepts multipart form with 'file' (PNG/JPEG image, max 2MB)
func (h *Handler) UploadLogo(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return
	}

	maxLogoSize := limits.MaxLogoUploadBytes
	if !parseMultipartForm(w, r, maxLogoSize) {
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	if header.Size > maxLogoSize {
		respondError(w, http.StatusRequestEntityTooLarge, "File too large. Maximum size is 2MB")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("Failed to read uploaded logo", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// S-11: sniff image magic bytes (ignore client Content-Type / extension).
	var allowedExt string
	var contentType string
	switch services.DetectImageType(fileBytes) {
	case services.ImagePNG:
		allowedExt = ".png"
		contentType = "image/png"
	case services.ImageJPEG:
		allowedExt = ".jpg"
		contentType = "image/jpeg"
	default:
		respondError(w, http.StatusBadRequest, "Only valid PNG and JPEG images are allowed")
		return
	}

	storagePath := fmt.Sprintf("%s/logo%s", tenantID.String(), allowedExt)
	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, contentType); err != nil {
		slog.Error("Failed to upload logo to storage", "error", err, "tenant_id", tenantID)
		respondError(w, http.StatusInternalServerError, "Failed to upload logo to cloud storage")
		return
	}

	// The compliance-docs bucket is private, so this "public" URL shape is only
	// ever a canonical reference — stored as-is, and re-signed on every read
	// (see resolveFreshBucketURL). Storing it directly would 404 in a browser.
	publicURL := h.storageService.PublicURL(complianceDocsBucket, storagePath)

	if err := h.repo.UpdateLogoURL(r.Context(), tenantID, publicURL); err != nil {
		slog.Error("Failed to update tenant logo URL", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	// Sign it fresh for the immediate response, so the settings-page preview
	// shows the logo right away without waiting for a subsequent /auth/me refresh.
	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, storagePath, 1*time.Hour)
	if err != nil {
		slog.Error("Failed to sign logo URL for response", "error", err, "tenant_id", tenantID)
		signedURL = publicURL // best-effort fallback; /auth/me will still resolve it correctly
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"logo_url": signedURL,
		"message":  "Logo uploaded successfully",
	})
}

// ---------------------------------------------------------------------------
// Passport event document upload / download (Phase 2 — EU Art. 10 chain custody)
// ---------------------------------------------------------------------------

const (
	// maxPassportDocSize equals global body limit (P-06).
	maxPassportDocSize = limits.MaxPassportDocBytes
)

// allowedDocMIMEs maps sniffed content-types that are permitted for event documents.
var allowedDocMIMEs = map[string]bool{
	"application/pdf": true,
	"image/jpeg":      true,
	"image/png":       true,
	"image/tiff":      true,
}

// UploadPassportDocument handles POST /api/v1/documents/upload
func (h *Handler) UploadPassportDocument(w http.ResponseWriter, r *http.Request) {
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	if !parseMultipartForm(w, r, maxPassportDocSize) {
		return
	}

	passportIDStr := r.FormValue("passport_id")
	if passportIDStr == "" {
		respondError(w, http.StatusBadRequest, "passport_id is required")
		return
	}
	passportID, err := uuid.Parse(passportIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport_id")
		return
	}

	// Tenancy: passport must belong to the caller's tenant via its batch.
	passport, err := h.repo.GetPassport(r.Context(), passportID)
	if err != nil || passport == nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}
	if _, err := h.repo.GetBatch(r.Context(), passport.BatchID, tenantID); err != nil {
		respondError(w, http.StatusNotFound, "Passport not found")
		return
	}

	label := strings.TrimSpace(r.FormValue("label"))

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded — use the 'file' multipart field")
		return
	}
	defer file.Close()

	if header.Size > maxPassportDocSize {
		respondError(w, http.StatusBadRequest, "File too large (max 10 MiB)")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("document upload: failed to read file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read uploaded file")
		return
	}

	// S-11: magic-byte sniff (PDF/JPEG/PNG/TIFF) — not client MIME/filename.
	mimeBase, ok := services.DetectAllowedDocMIME(fileBytes)
	if !ok || !allowedDocMIMEs[mimeBase] {
		respondError(w, http.StatusUnsupportedMediaType,
			"Unsupported file type. Allowed: PDF, JPEG, PNG, TIFF")
		return
	}

	sum := sha256.Sum256(fileBytes)
	hashHex := hex.EncodeToString(sum[:])

	docID := uuid.New()
	storagePath := fmt.Sprintf("%s/passport-docs/%s", tenantID.String(), docID.String())

	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, mimeBase); err != nil {
		slog.Error("document upload: storage upload failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	actor := middleware.GetEmail(r.Context())
	doc := &repository.PassportDocument{
		ID:          docID,
		TenantID:    tenantID,
		PassportID:  passportID,
		Filename:    header.Filename,
		ContentType: mimeBase,
		SizeBytes:   int64(len(fileBytes)),
		SHA256Hash:  hashHex,
		StoragePath: storagePath,
		Label:       label,
		UploadedBy:  actor,
		UploadedAt:  time.Now().UTC(),
	}

	if err := h.repo.InsertPassportDocument(r.Context(), doc); err != nil {
		// Clean up orphaned object in Supabase on DB failure
		_ = h.storageService.DeleteFileFromBucket(r.Context(), complianceDocsBucket, storagePath)
		slog.Error("document upload: DB insert failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to record document")
		return
	}

	slog.Info("passport document uploaded",
		"document_id", docID, "passport_id", passportID,
		"tenant_id", tenantID, "size", len(fileBytes), "hash", hashHex)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"document_id":  docID,
		"sha256_hash":  hashHex,
		"filename":     header.Filename,
		"size_bytes":   len(fileBytes),
		"content_type": mimeBase,
		"label":        label,
		"uploaded_at":  doc.UploadedAt,
	})
}

// batchDocumentTypes maps the `type` query param to the field on the batch
// record that holds the (possibly stale, since these are 1-hour signed URLs
// captured at upload time) document URL.
var batchDocumentTypes = map[string]bool{
	"pli": true, // PLI/CA certificate (audited DVA mode) — tenant-only
	"doc": true, // Declaration of Conformity — public on the passport view too
}

// GetBatchDocumentURL handles GET /api/v1/batches/{id}/document-url?type=pli|doc
// Re-signs a fresh, short-lived URL for a certificate/DoC captured during
// batch creation, since the URL stored at upload time (from a client-side
// createSignedUrl call) expires after 1 hour.
func (h *Handler) GetBatchDocumentURL(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid batch ID format")
		return
	}

	docType := strings.ToLower(r.URL.Query().Get("type"))
	if !batchDocumentTypes[docType] {
		respondError(w, http.StatusBadRequest, "Invalid type. Must be 'pli' or 'doc'")
		return
	}

	batch, err := h.repo.GetBatch(r.Context(), id, tenantID)
	if err != nil {
		if err.Error() == "batch not found" {
			respondError(w, http.StatusNotFound, "Batch not found")
			return
		}
		slog.Error("Failed to get batch for document-url", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get batch")
		return
	}

	var storedURL string
	if docType == "pli" {
		storedURL = batch.Specs.PLICertificateURL
	} else {
		storedURL = batch.DeclarationOfConformityPath
	}

	freshURL, err := h.resolveFreshDocumentURL(r.Context(), storedURL)
	if err != nil {
		slog.Error("Failed to resolve document URL", "error", err, "batch_id", id, "type", docType)
		respondError(w, http.StatusInternalServerError, "Failed to generate document URL")
		return
	}
	if freshURL == "" {
		respondError(w, http.StatusNotFound, "No document uploaded")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"url": freshURL})
}

// GetPublicPassportDocumentURL handles GET /api/v1/passports/{uuid}/document-url?type=doc
// Public/anonymous counterpart of GetBatchDocumentURL for the Declaration of
// Conformity link shown on the public passport page. Route is rate-limited
// the same way as GetPassport to prevent enumeration.
func (h *Handler) GetPublicPassportDocumentURL(w http.ResponseWriter, r *http.Request) {
	uuidStr := r.PathValue("uuid")
	passportUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid passport UUID format")
		return
	}

	docType := strings.ToLower(r.URL.Query().Get("type"))
	if docType != "doc" {
		respondError(w, http.StatusBadRequest, "Invalid type. Must be 'doc'")
		return
	}

	passportWithSpecs, err := h.repo.GetPassportWithSpecs(r.Context(), passportUUID)
	if err != nil {
		if err.Error() == "passport not found" {
			respondError(w, http.StatusNotFound, "Passport not found")
			return
		}
		slog.Error("Failed to get passport for document-url", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to get passport")
		return
	}

	freshURL, err := h.resolveFreshDocumentURL(r.Context(), passportWithSpecs.DeclarationOfConformityPath)
	if err != nil {
		slog.Error("Failed to resolve document URL", "error", err, "passport_uuid", passportUUID)
		respondError(w, http.StatusInternalServerError, "Failed to generate document URL")
		return
	}
	if freshURL == "" {
		respondError(w, http.StatusNotFound, "No document uploaded")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"url": freshURL})
}

// resolveFreshDocumentURL re-signs storedURL if it's a Supabase object URL in
// the compliance-docs bucket, returning a new 1-hour signed URL. If storedURL
// doesn't look like a compliance-docs object URL (e.g. a legacy/external
// public URL), it's returned unchanged. Returns "" if storedURL is empty.
func (h *Handler) resolveFreshDocumentURL(ctx context.Context, storedURL string) (string, error) {
	return resolveFreshBucketURL(ctx, h.storageService, storedURL)
}

// resolveFreshBucketURL is the storage-service-agnostic core of
// resolveFreshDocumentURL, usable by handlers (like AuthHandler) that don't
// embed a *Handler. The compliance-docs bucket is private — any URL naively
// built as a "public" URL (e.g. the logo, uploaded via the same bucket) 404s
// unless re-signed on every read. This is that re-signing, shared in one place.
func resolveFreshBucketURL(ctx context.Context, storageService *services.StorageService, storedURL string) (string, error) {
	if storedURL == "" {
		return "", nil
	}
	if storageService == nil {
		return storedURL, nil
	}

	storagePath, ok := storageService.ExtractStoragePath(storedURL, complianceDocsBucket)
	if !ok {
		return storedURL, nil
	}

	return storageService.CreateSignedURLForBucket(ctx, complianceDocsBucket, storagePath, 1*time.Hour)
}

// GetPassportDocument handles GET /api/v1/documents/{document_id}
// Redirects to a signed cloud storage URL.
func (h *Handler) GetPassportDocument(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	docIDStr := r.PathValue("document_id")
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid document_id")
		return
	}

	doc, err := h.repo.GetPassportDocument(r.Context(), docID, tenantID)
	if err != nil || doc == nil {
		respondError(w, http.StatusNotFound, "Document not found")
		return
	}

	// If the stored path is already a full URL (legacy migration or external), redirect directly
	if isHTTPURL(doc.StoragePath) {
		http.Redirect(w, r, doc.StoragePath, http.StatusTemporaryRedirect)
		return
	}

	// Generate a signed URL from Supabase Storage
	if h.storageService == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud storage not configured")
		return
	}

	signedURL, err := h.storageService.CreateSignedURLForBucket(r.Context(), complianceDocsBucket, doc.StoragePath, 1*time.Hour)
	if err != nil {
		slog.Error("document download: failed to create signed URL", "error", err, "document_id", docID, "path", doc.StoragePath)
		respondError(w, http.StatusInternalServerError, "Failed to generate download URL")
		return
	}

	http.Redirect(w, r, signedURL, http.StatusTemporaryRedirect)
}
