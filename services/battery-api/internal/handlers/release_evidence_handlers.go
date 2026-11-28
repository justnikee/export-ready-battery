package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func (h *Handler) RegisterReleaseEvidenceRoutes(mux *http.ServeMux, read, write func(http.Handler) http.Handler) {
	register := func(pattern string, protected http.Handler) {
		mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "private, no-store")
			protected.ServeHTTP(w, r)
		})
	}
	register("GET /api/v1/batches/{id}/release-evidence", read(h.listReleaseEvidence(false)))
	register("GET /api/v1/traceability/packs/{id}/release-evidence", read(h.listReleaseEvidence(true)))
	register("POST /api/v1/batches/{id}/release-evidence", write(http.HandlerFunc(h.appendReleaseEvidence)))
	register("POST /api/v1/release-evidence/{id}/download", read(http.HandlerFunc(h.downloadReleaseEvidence)))
}

func (h *Handler) listReleaseEvidence(byPack bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scope, ok := traceScope(w, r)
		if !ok {
			return
		}
		id, ok := releaseEvidenceID(w, r)
		if !ok {
			return
		}
		items, err := h.repo.ListReleaseEvidence(r.Context(), scope.tenantID, id, byPack, scope.limit+1, scope.offset)
		if err != nil {
			respondReleaseEvidenceError(w, err)
			return
		}
		respondJSON(w, http.StatusOK, newTracePage(items, scope.limit))
	})
}

func (h *Handler) appendReleaseEvidence(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	batchID, ok := releaseEvidenceID(w, r)
	if !ok {
		return
	}
	actorID, err := uuid.Parse(middleware.GetUserID(r.Context()))
	if err != nil || actorID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "Workspace authentication required")
		return
	}
	if err := h.repo.CheckReleaseEvidenceBatch(r.Context(), scope.tenantID, batchID); err != nil {
		respondReleaseEvidenceError(w, err)
		return
	}

	if !parseMultipartForm(w, r, limits.MaxReleaseEvidenceBytes) {
		return
	}
	defer r.MultipartForm.RemoveAll()
	evidence, expected, err := parseReleaseEvidenceFields(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Attach a PDF file")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, limits.MaxReleaseEvidenceBytes+1))
	if err != nil {
		respondError(w, http.StatusBadRequest, "Could not read the PDF file")
		return
	}
	if int64(len(data)) > limits.MaxReleaseEvidenceBytes {
		respondError(w, http.StatusRequestEntityTooLarge, "PDF must be 5 MiB or smaller")
		return
	}
	if services.RequirePDF(data) != nil {
		respondError(w, http.StatusBadRequest, "Attach a valid PDF file")
		return
	}
	filename := path.Base(strings.ReplaceAll(header.Filename, "\\", "/"))
	if !validEvidenceText(filename, 255) || filename == "." || filename == ".." || filename == "/" {
		respondError(w, http.StatusBadRequest, "Enter a valid PDF filename")
		return
	}

	evidence.ID = uuid.New()
	evidence.BatchID = batchID
	evidence.ActorID = actorID
	evidence.FileName = filename
	evidence.FileSize = len(data)
	digest := sha256.Sum256(data)
	evidence.FileSHA256 = hex.EncodeToString(digest[:])
	key := releaseEvidenceKey(scope.tenantID, batchID, evidence.ID)
	storageCtx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	if h.storageService == nil || h.storageService.VerifyPrivateBucket(storageCtx, complianceDocsBucket) != nil {
		storageUnavailable(w)
		return
	}
	if err := h.storageService.UploadFileToBucket(storageCtx, complianceDocsBucket, key, data, "application/pdf"); err != nil {
		slog.Warn("Could not store private release evidence", "revision_id", evidence.ID)
		storageUnavailable(w)
		return
	}
	if err := h.repo.AppendReleaseEvidence(r.Context(), scope.tenantID, evidence, expected); err != nil {
		var dbErr *pgconn.PgError
		// Retain the object if a transport failure leaves the commit outcome unknown.
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrReleaseEvidenceRevision) ||
			errors.Is(err, repository.ErrReleaseEvidenceSample) || errors.Is(err, pgx.ErrTxCommitRollback) || errors.As(err, &dbErr) {
			cleanupCtx, done := context.WithTimeout(context.WithoutCancel(r.Context()), 10*time.Second)
			defer done()
			if cleanupErr := h.storageService.DeleteFileFromBucket(cleanupCtx, complianceDocsBucket, key); cleanupErr != nil {
				slog.Warn("Could not remove unrecorded release evidence", "revision_id", evidence.ID)
			}
		}
		respondReleaseEvidenceError(w, err)
		return
	}
	respondJSON(w, http.StatusCreated, map[string]any{"id": evidence.ID, "revision": expected + 1})
}

func parseReleaseEvidenceFields(r *http.Request) (models.ReleaseEvidenceRevision, int, error) {
	evidence := models.ReleaseEvidenceRevision{
		SourceSystem:   strings.TrimSpace(r.PostFormValue("source_system")),
		RecordRef:      strings.TrimSpace(r.PostFormValue("record_ref")),
		SourceRevision: strings.TrimSpace(r.PostFormValue("source_revision")),
		Disposition:    strings.TrimSpace(r.PostFormValue("disposition")),
		Reviewer:       strings.TrimSpace(r.PostFormValue("reviewer")),
		RecordedOn:     r.PostFormValue("recorded_on"),
		Scope:          r.PostFormValue("scope"),
	}
	if !validEvidenceText(evidence.SourceSystem, 120) || !validEvidenceText(evidence.RecordRef, 120) ||
		!validEvidenceText(evidence.SourceRevision, 80) || !validEvidenceText(evidence.Disposition, 120) ||
		!validEvidenceText(evidence.Reviewer, 120) {
		return evidence, 0, errors.New("Enter a source system, record ID, source revision, disposition and reviewer within the field limits")
	}
	if date, err := time.Parse(time.DateOnly, evidence.RecordedOn); err != nil || date.Year() < 1 {
		return evidence, 0, errors.New("Enter the record date as YYYY-MM-DD")
	}
	expected, err := strconv.ParseInt(r.PostFormValue("expected_revision"), 10, 32)
	if err != nil || expected < 0 || expected >= 2147483647 {
		return evidence, 0, errors.New("Invalid expected revision")
	}

	var seen = make(map[string]struct{})
	for _, line := range strings.Split(r.PostFormValue("sample_serials"), "\n") {
		serial := strings.TrimSpace(line)
		if serial == "" {
			continue
		}
		if !validEvidenceText(serial, 100) || len(seen) >= 100 {
			return evidence, 0, errors.New("Enter up to 100 valid sampled serial numbers")
		}
		if _, duplicate := seen[serial]; duplicate {
			return evidence, 0, errors.New("Each sampled serial number must appear once")
		}
		seen[serial] = struct{}{}
		evidence.SampleSerials = append(evidence.SampleSerials, serial)
	}
	if (evidence.Scope != "batch" && evidence.Scope != "sampled_packs") ||
		(evidence.Scope == "sampled_packs") != (len(seen) > 0) {
		return evidence, 0, errors.New("Choose the whole batch or enter its exact sampled pack serial numbers")
	}
	return evidence, int(expected), nil
}

func (h *Handler) downloadReleaseEvidence(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	id, ok := releaseEvidenceID(w, r)
	if !ok {
		return
	}
	evidence, err := h.repo.GetReleaseEvidenceDownload(r.Context(), scope.tenantID, id)
	if err != nil {
		respondReleaseEvidenceError(w, err)
		return
	}
	if h.storageService == nil {
		storageUnavailable(w)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	data, err := h.storageService.DownloadPrivateFileFromBucket(ctx, complianceDocsBucket,
		releaseEvidenceKey(scope.tenantID, evidence.BatchID, id), limits.MaxReleaseEvidenceBytes)
	digest := sha256.Sum256(data)
	if err != nil || len(data) != evidence.FileSize || hex.EncodeToString(digest[:]) != evidence.FileSHA256 {
		slog.Warn("Could not verify release evidence download", "revision_id", id)
		respondError(w, http.StatusServiceUnavailable, "The release evidence file is unavailable")
		return
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": evidence.FileName}))
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func releaseEvidenceKey(tenantID, batchID, id uuid.UUID) string {
	return tenantID.String() + "/release-evidence/" + batchID.String() + "/" + id.String()
}

func validEvidenceText(value string, max int) bool {
	return value != "" && utf8.ValidString(value) && utf8.RuneCountInString(value) <= max &&
		!strings.ContainsFunc(value, unicode.IsControl)
}

func releaseEvidenceID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil || id == uuid.Nil {
		respondError(w, http.StatusBadRequest, "Invalid release evidence request ID")
		return id, false
	}
	return id, true
}

func respondReleaseEvidenceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		respondError(w, http.StatusNotFound, "Record not found in this workspace")
	case errors.Is(err, repository.ErrReleaseEvidenceRevision):
		respondError(w, http.StatusConflict, "A newer revision exists. Refresh the evidence history and try again.")
	case errors.Is(err, repository.ErrReleaseEvidenceSample):
		respondError(w, http.StatusBadRequest, "Each sampled serial must match exactly one pack in this batch")
	default:
		slog.Error("Release evidence database operation failed", "error_type", fmt.Sprintf("%T", err))
		respondError(w, http.StatusInternalServerError, "Could not process release evidence")
	}
}
