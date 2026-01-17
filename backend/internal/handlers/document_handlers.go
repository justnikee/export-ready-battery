package handlers

import (
	"exportready-battery/internal/middleware"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
		respondError(w, http.StatusBadRequest, "Invalid document_type. Must be 'epr', 'bis', or 'pli'")
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
		log.Printf("Failed to create upload directory: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to process upload")
		return
	}

	// Save file as {document_type}.pdf
	filename := fmt.Sprintf("%s.pdf", documentType)
	filePath := filepath.Join(uploadDir, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("Failed to create file: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file contents
	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("Failed to write file: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	log.Printf("Saved %s certificate for tenant %s at %s", documentType, tenantID, filePath)

	// Update tenant record with file path
	if err := h.repo.UpdateCertificatePath(r.Context(), tenantID, documentType, filePath); err != nil {
		log.Printf("Failed to update tenant certificate path: %v", err)
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

	// Get document type from path
	documentType := strings.ToLower(r.PathValue("type"))
	if _, valid := ValidDocumentTypes[documentType]; !valid {
		respondError(w, http.StatusBadRequest, "Invalid document type. Must be 'epr', 'bis', or 'pli'")
		return
	}

	// Get tenant to check if certificate exists
	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Tenant not found")
		return
	}

	// Get the certificate path based on document type
	var certPath string
	switch documentType {
	case "epr":
		certPath = tenant.EPRCertificatePath
	case "bis":
		certPath = tenant.BISCertificatePath
	case "pli":
		certPath = tenant.PLICertificatePath
	}

	if certPath == "" {
		respondError(w, http.StatusNotFound, fmt.Sprintf("No %s certificate uploaded", strings.ToUpper(documentType)))
		return
	}

	// Check if file exists
	if _, err := os.Stat(certPath); os.IsNotExist(err) {
		respondError(w, http.StatusNotFound, "Certificate file not found")
		return
	}

	// Serve the file
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s_certificate.pdf\"", documentType))
	http.ServeFile(w, r, certPath)
}
