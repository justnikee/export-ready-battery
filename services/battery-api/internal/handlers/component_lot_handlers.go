package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

func (h *Handler) RegisterComponentLotImportRoutes(mux *http.ServeMux, write func(http.Handler) http.Handler) {
	mux.Handle("POST /api/v1/component-lot-imports/validate", write(h.componentLotImport(false)))
	mux.Handle("POST /api/v1/component-lot-imports", write(h.componentLotImport(true)))
}

func (h *Handler) componentLotImport(commit bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "private, no-store")
		tenantID, tenantErr := uuid.Parse(middleware.GetTenantID(r.Context()))
		actorID, actorErr := uuid.Parse(middleware.GetUserID(r.Context()))
		if tenantErr != nil || actorErr != nil || tenantID == uuid.Nil || actorID == uuid.Nil {
			respondError(w, http.StatusUnauthorized, "Workspace authentication required")
			return
		}
		// Allow a small amount of space for multipart metadata; the file itself
		// has a separate hard limit and is processed entirely in memory.
		const maxFormBytes = services.ComponentLotCSVMaxBytes + (16 << 10)
		r.Body = http.MaxBytesReader(w, r.Body, maxFormBytes)
		if !parseMultipartForm(w, r, maxFormBytes) {
			return
		}
		defer r.MultipartForm.RemoveAll()
		token := r.FormValue("validation_token")
		if commit {
			if _, err := hex.DecodeString(token); len(token) != sha256.Size*2 || err != nil {
				respondError(w, http.StatusBadRequest, "Validate the CSV before importing it.")
				return
			}
		} else {
			token = ""
		}
		file, header, err := r.FormFile("file")
		if err != nil || len(r.MultipartForm.File["file"]) != 1 {
			if file != nil {
				file.Close()
			}
			respondError(w, http.StatusBadRequest, "Select one CSV file.")
			return
		}
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, services.ComponentLotCSVMaxBytes+1))
		if err != nil {
			respondError(w, http.StatusBadRequest, "The CSV could not be read.")
			return
		}
		if len(data) > services.ComponentLotCSVMaxBytes {
			respondError(w, http.StatusRequestEntityTooLarge, "Use a CSV of 1 MiB or smaller.")
			return
		}
		name := path.Base(strings.ReplaceAll(header.Filename, `\`, "/"))
		if !utf8.ValidString(name) || utf8.RuneCountInString(name) > 255 || strings.ContainsFunc(name, unicode.IsControl) || name == "." || name == ".." || name == "/" {
			respondError(w, http.StatusBadRequest, "Use a valid CSV file name of up to 255 characters.")
			return
		}
		rows, issues, err := services.ParseComponentLotCSV(data)
		if err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		digest := sha256.Sum256(data)
		result, err := h.repo.ProcessComponentLotImport(r.Context(), tenantID, actorID, models.ComponentLotImportInput{
			FileName: name, FileSHA256: hex.EncodeToString(digest[:]), Rows: rows, Issues: issues, ExpectedToken: token,
		})
		switch {
		case errors.Is(err, repository.ErrLotImportChanged):
			respondError(w, http.StatusConflict, "The file or its pack links changed. Validate the CSV again before importing.")
		case err != nil:
			slog.Error("Component lot import failed", "tenant_id", tenantID, "commit", commit)
			respondError(w, http.StatusInternalServerError, "Could not process the CSV. Try again.")
		case commit && len(result.Issues) > 0:
			respondJSON(w, http.StatusUnprocessableEntity, result)
		default:
			respondJSON(w, http.StatusOK, result)
		}
	}
}
