package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"github.com/anvayalabs/textile-api/internal/middleware"
	"github.com/anvayalabs/textile-api/internal/repository"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ValidDocumentTypes for upload
// Textile products do not use battery-specific certificates (EPR, BIS, PLI).
var ValidDocumentTypes = map[string]string{}

const (
	MaxUploadSize = 5 << 20 // 5MB
)

// UploadDocument handles POST /api/v1/settings/upload-document
// Accepts multipart form with 'file' (PDF) and 'document_type' (epr/bis/pli)
func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	// Get tenant ID from context (set by auth middleware)
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

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(MaxUploadSize); err != nil {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	// Get document type
	documentType := strings.ToLower(r.FormValue("document_type"))
	if _, valid := ValidDocumentTypes[documentType]; !valid {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("document upload for type %s is not supported for textile products", documentType))
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > MaxUploadSize {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 5MB")
		return
	}

	// Validate file type (must be PDF)
	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" && !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		respondError(w, http.StatusBadRequest, "Only PDF files are allowed")
		return
	}

	// Create uploads directory structure: ./uploads/{tenant_id}/
	uploadDir := filepath.Join(".", "uploads", tenantID.String())
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Error("Failed to create upload directory", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to process upload")
		return
	}

	// Save file as {document_type}.pdf
	filename := fmt.Sprintf("%s.pdf", documentType)
	filePath := filepath.Join(uploadDir, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		slog.Error("Failed to create file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file contents
	if _, err := io.Copy(dst, file); err != nil {
		slog.Error("Failed to write file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	slog.Info("Certificate saved", "type", documentType, "tenant_id", tenantID, "path", filePath)

	// Update tenant record with file path
	if err := h.repo.UpdateCertificatePath(r.Context(), tenantID, documentType, filePath); err != nil {
		slog.Error("Failed to update tenant certificate path", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"path":          filePath,
		"document_type": documentType,
		"message":       fmt.Sprintf("%s certificate uploaded successfully", strings.ToUpper(documentType)),
	})
}

// ViewDocument handles GET /api/v1/settings/documents/{type}
// Serves the uploaded PDF file for viewing
func (h *Handler) ViewDocument(w http.ResponseWriter, r *http.Request) {
	// Get document type from path
	documentType := strings.ToLower(r.PathValue("type"))
	if _, valid := ValidDocumentTypes[documentType]; !valid {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("document upload for type %s is not supported for textile products", documentType))
		return
	}

	respondError(w, http.StatusNotFound, fmt.Sprintf("No %s certificate uploaded", strings.ToUpper(documentType)))
	return
}

// UploadLogo handles POST /api/v1/settings/upload-logo
// Accepts multipart form with 'file' (PNG/JPEG image, max 2MB)
func (h *Handler) UploadLogo(w http.ResponseWriter, r *http.Request) {
	// Get tenant ID from context
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

	// Parse multipart form (max 2MB for images)
	maxLogoSize := int64(2 << 20) // 2MB
	if err := r.ParseMultipartForm(maxLogoSize); err != nil {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 2MB")
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded. Use 'file' field in multipart form")
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > maxLogoSize {
		respondError(w, http.StatusBadRequest, "File too large. Maximum size is 2MB")
		return
	}

	// Validate file type (must be PNG or JPEG)
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

	// Create uploads directory structure: ./uploads/{tenant_id}/
	uploadDir := filepath.Join(".", "uploads", tenantID.String())
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Error("Failed to create upload directory", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to process upload")
		return
	}

	// Save file as logo.{ext}
	filename := fmt.Sprintf("logo%s", allowedExt)
	filePath := filepath.Join(uploadDir, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		slog.Error("Failed to create file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file contents
	if _, err := io.Copy(dst, file); err != nil {
		slog.Error("Failed to write file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	slog.Info("Logo saved", "tenant_id", tenantID, "path", filePath)

	// Generate the public URL for the logo
	logoURL := fmt.Sprintf("/api/v1/uploads/%s/%s", tenantID.String(), filename)

	// Update tenant record with logo URL
	if err := h.repo.UpdateLogoURL(r.Context(), tenantID, logoURL); err != nil {
		slog.Error("Failed to update tenant logo URL", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to update record")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"logo_url": logoURL,
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
//
// Multipart fields:
//   - file        (required) — the binary payload, max 10 MiB
//   - passport_id (required) — UUID of the passport this document belongs to
//   - label       (optional) — human-readable label, e.g. "Bill of Lading"
//
// Security guarantees:
//   - MIME is sniffed from file bytes, never trusted from the client header
//   - Storage path uses a UUID, not the user-supplied filename (path traversal prevention)
//   - If the DB insert fails after the file is written, the file is deleted (no orphans)
func (h *Handler) UploadPassportDocument(w http.ResponseWriter, r *http.Request) {
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

	// Validate passport_id
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

	// Read entire file into memory (bounded by maxPassportDocSize parse limit above)
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("document upload: failed to read file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read uploaded file")
		return
	}

	// --- Security: detect MIME from bytes, never from client header ---
	sniffed := http.DetectContentType(fileBytes)
	// DetectContentType may return "application/pdf" or "text/plain; charset=utf-8"
	// for TIFF, trim parameters for comparison
	mimeBase := strings.Split(sniffed, ";")[0]
	mimeBase = strings.TrimSpace(mimeBase)
	if !allowedDocMIMEs[mimeBase] {
		respondError(w, http.StatusUnsupportedMediaType,
			"Unsupported file type. Allowed: PDF, JPEG, PNG, TIFF")
		return
	}

	// SHA-256 computed server-side
	sum := sha256.Sum256(fileBytes)
	hashHex := hex.EncodeToString(sum[:])

	// --- Security: use UUID as storage filename to prevent path traversal ---
	docID := uuid.New()
	uploadDir := filepath.Join(".", "uploads", "documents", tenantID.String())
	if err := os.MkdirAll(uploadDir, 0750); err != nil {
		slog.Error("document upload: mkdir failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to prepare storage")
		return
	}
	storagePath := filepath.Join(uploadDir, docID.String())

	if err := os.WriteFile(storagePath, fileBytes, 0640); err != nil {
		slog.Error("document upload: write failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to write file")
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
		// --- Security: clean up orphaned file on DB failure ---
		_ = os.Remove(storagePath)
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
//
// Returns the file stream with its original Content-Type, scoped to the
// authenticated tenant (a tenant cannot retrieve another tenant's documents).
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

	if _, err := os.Stat(doc.StoragePath); os.IsNotExist(err) {
		slog.Error("document file missing from storage", "document_id", docID, "path", doc.StoragePath)
		respondError(w, http.StatusNotFound, "Document file not found")
		return
	}

	w.Header().Set("Content-Type", doc.ContentType)
	w.Header().Set("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(doc.Filename)))
	http.ServeFile(w, r, doc.StoragePath)
}
