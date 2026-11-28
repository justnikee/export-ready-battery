package handlers

import (
	"context"
	"errors"
	"log/slog"
	"mime"
	"net/http"
	"path"
	"strings"
	"time"
	"unicode"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// DownloadSupplierDocument serves the file to the active supplier who uploaded it.
func (h *Handler) DownloadSupplierDocument(w http.ResponseWriter, r *http.Request) {
	supplierID, err := uuid.Parse(middleware.GetSupplierID(r.Context()))
	if err != nil || supplierID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "supplier authentication required")
		return
	}
	h.downloadSupplierDocument(w, r, &supplierID)
}

// DownloadTenantSupplierDocument serves readers in the owning manufacturer workspace.
func (h *Handler) DownloadTenantSupplierDocument(w http.ResponseWriter, r *http.Request) {
	h.downloadSupplierDocument(w, r, nil)
}

func (h *Handler) downloadSupplierDocument(w http.ResponseWriter, r *http.Request, supplierID *uuid.UUID) {
	// POST keeps the private response out of legacy supplier workers that cache GETs.
	w.Header().Set("Cache-Control", "private, no-store")
	tenantID, err := uuid.Parse(middleware.GetTenantID(r.Context()))
	if err != nil || tenantID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}
	documentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil || documentID == uuid.Nil {
		respondError(w, http.StatusBadRequest, "invalid document id")
		return
	}

	ctx := r.Context()
	doc, err := h.repo.GetSupplierDocumentForDownload(ctx, tenantID, documentID, supplierID)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(w, http.StatusNotFound, "Supplier document unavailable")
		return
	}
	if err != nil {
		slog.Error("Failed to look up supplier document download", "document_id", documentID)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve supplier document")
		return
	}
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	key, ok := supplierDocumentKey(tenantID, documentID, doc, h.storageService.PublicURL(complianceDocsBucket, ""))
	if !ok {
		respondError(w, http.StatusNotFound, "Supplier document unavailable")
		return
	}
	storageCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	data, err := h.storageService.DownloadPrivateFileFromBucket(storageCtx, complianceDocsBucket, key, limits.MaxSupplierDocBytes)
	if err != nil {
		slog.Warn("Could not retrieve private supplier document", "document_id", documentID)
		respondError(w, http.StatusServiceUnavailable, "Supplier document storage is unavailable")
		return
	}
	filename := path.Base(strings.ReplaceAll(doc.FileName, "\\", "/"))
	if filename == "." || filename == ".." || filename == "/" || strings.ContainsFunc(filename, unicode.IsControl) {
		filename = "supplier-document"
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": filename}))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func supplierDocumentPrefix(tenantID, supplierID uuid.UUID) string {
	return tenantID.String() + "/supplier-docs/" + supplierID.String() + "/"
}

func supplierDocumentKey(tenantID, documentID uuid.UUID, doc *models.SupplierDocument, publicPrefix string) (string, bool) {
	supplierID, err := uuid.Parse(doc.SupplierID)
	if err != nil || supplierID == uuid.Nil {
		return "", false
	}
	ownerPrefix := supplierDocumentPrefix(tenantID, supplierID)
	key, legacy := strings.CutPrefix(doc.FileURL, publicPrefix)
	if key == ownerPrefix+documentID.String() {
		return key, true
	}

	// The old uploader used doc_type + timestamp + normalized filename.
	// Recognize that exact shape only for this supplier and storage origin.
	if !legacy {
		return "", false
	}
	name, ok := strings.CutPrefix(key, ownerPrefix)
	if !ok || strings.ContainsAny(name, "/\\%?#") || strings.Contains(name, "..") ||
		strings.ContainsFunc(name, unicode.IsControl) || doc.FileName == "" {
		return "", false
	}
	stampedName, ok := strings.CutPrefix(name, doc.DocType+"_")
	const timestampLayout = "20060102_150405"
	if !ok || len(stampedName) <= len(timestampLayout) {
		return "", false
	}
	filename := strings.ReplaceAll(path.Base(doc.FileName), " ", "_")
	if stampedName[len(timestampLayout):] != "_"+filename {
		return "", false
	}
	if _, err := time.Parse(timestampLayout, stampedName[:len(timestampLayout)]); err != nil {
		return "", false
	}
	return key, true
}
