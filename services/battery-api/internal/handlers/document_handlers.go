package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// ValidDocumentTypes for upload
var ValidDocumentTypes = map[string]string{
	"epr": "epr_certificate_path",
	"bis": "bis_certificate_path",
	"pli": "pli_certificate_path",
}

const (
	MaxUploadSize = 5 << 20 // 5MB
)

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

	if err := r.ParseMultipartForm(MaxUploadSize); err != nil {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
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

	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" && !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		respondError(w, http.StatusBadRequest, "Only PDF files are allowed")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("Failed to read uploaded file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// Upload to Supabase Storage
	storagePath := fmt.Sprintf("%s/certificates/%s.pdf", tenantID.String(), documentType)
	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, "application/pdf"); err != nil {
		slog.Error("Failed to upload certificate to storage", "error", err, "tenant_id", tenantID, "doc_type", documentType)
		respondError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	publicURL := h.storageService.PublicURL(complianceDocsBucket, storagePath)

	if err := h.repo.UpdateCertificatePath(r.Context(), tenantID, documentType, publicURL); err != nil {
		slog.Error("Failed to update tenant certificate path", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"url":           publicURL,
		"document_type": documentType,
		"message":       fmt.Sprintf("%s certificate uploaded successfully", strings.ToUpper(documentType)),
	})
}

// ViewDocument handles GET /api/v1/settings/documents/{type}
// Redirects to the cloud storage URL (public or signed).
func (h *Handler) ViewDocument(w http.ResponseWriter, r *http.Request) {
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

	var certURL string
	switch documentType {
	case "epr":
		certURL = tenant.BatteryProfile.EPRCertificatePath
	case "bis":
		certURL = tenant.BatteryProfile.BISCertificatePath
	case "pli":
		certURL = tenant.BatteryProfile.PLICertificatePath
	}

	if certURL == "" {
		respondError(w, http.StatusNotFound, fmt.Sprintf("No %s certificate uploaded", strings.ToUpper(documentType)))
		return
	}

	// If it's already a public URL, redirect directly
	if isHTTPURL(certURL) {
		http.Redirect(w, r, certURL, http.StatusTemporaryRedirect)
		return
	}

	// Backward compatibility: local filesystem path
	if _, err := os.Stat(certURL); os.IsNotExist(err) {
		respondError(w, http.StatusNotFound, "Certificate file not found")
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s_certificate.pdf\"", documentType))
	http.ServeFile(w, r, certURL)
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

	maxLogoSize := int64(2 << 20) // 2MB
	if err := r.ParseMultipartForm(maxLogoSize); err != nil {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 2MB")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	if header.Size > maxLogoSize {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 2MB")
		return
	}

	contentType := header.Header.Get("Content-Type")
	ext := strings.ToLower(filepath.Ext(header.Filename))

	var allowedExt string
	switch {
	case contentType == "image/png" || ext == ".png":
		allowedExt = ".png"
	case contentType == "image/jpeg" || ext == ".jpg" || ext == ".jpeg":
		allowedExt = ".jpg"
	default:
		respondError(w, http.StatusBadRequest, "Only PNG and JPEG images are allowed")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("Failed to read uploaded logo", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	storagePath := fmt.Sprintf("%s/logo%s", tenantID.String(), allowedExt)
	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, contentType); err != nil {
		slog.Error("Failed to upload logo to storage", "error", err, "tenant_id", tenantID)
		respondError(w, http.StatusInternalServerError, "Failed to upload logo to cloud storage")
		return
	}

	publicURL := h.storageService.PublicURL(complianceDocsBucket, storagePath)

	if err := h.repo.UpdateLogoURL(r.Context(), tenantID, publicURL); err != nil {
		slog.Error("Failed to update tenant logo URL", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"logo_url": publicURL,
		"message":  "Logo uploaded successfully",
	})
}

// ---------------------------------------------------------------------------
// Passport event document upload / download (Phase 2 — EU Art. 10 chain custody)
// ---------------------------------------------------------------------------

const (
	// maxPassportDocSize is the server-side limit for passport event documents.
	maxPassportDocSize = 10 << 20 // 10 MiB
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

	if err := r.ParseMultipartForm(maxPassportDocSize); err != nil {
		respondError(w, http.StatusBadRequest, "File too large or malformed form (max 10 MiB)")
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

	sniffed := http.DetectContentType(fileBytes)
	mimeBase := strings.Split(sniffed, ";")[0]
	mimeBase = strings.TrimSpace(mimeBase)
	if !allowedDocMIMEs[mimeBase] {
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

	// Backward compatibility: local filesystem path
	if _, err := os.Stat(doc.StoragePath); err == nil {
		w.Header().Set("Content-Type", doc.ContentType)
		w.Header().Set("Content-Disposition",
			fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(doc.Filename)))
		http.ServeFile(w, r, doc.StoragePath)
		return
	}

	// Modern path: generate a signed URL from Supabase Storage
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
