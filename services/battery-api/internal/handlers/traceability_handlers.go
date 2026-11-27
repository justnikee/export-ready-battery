package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (h *Handler) RegisterTraceabilityRoutes(mux *http.ServeMux, read func(http.Handler) http.Handler) {
	for path, handler := range map[string]http.HandlerFunc{
		"GET /api/v1/traceability/packs":      h.findTracePacks,
		"GET /api/v1/traceability/packs/{id}": h.getTracePack,
		"GET /api/v1/traceability/lots":       h.findTraceLots,
		"GET /api/v1/traceability/lots/{id}":  h.getTraceLot,
	} {
		protected := read(handler)
		mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "private, no-store")
			protected.ServeHTTP(w, r)
		})
	}
}

type traceRequest struct {
	tenantID      uuid.UUID
	limit, offset int
}

func traceScope(w http.ResponseWriter, r *http.Request) (traceRequest, bool) {
	tenantID, err := uuid.Parse(middleware.GetTenantID(r.Context()))
	if err != nil || tenantID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "Workspace authentication required")
		return traceRequest{}, false
	}
	return traceRequest{tenantID, ParseQueryLimit(r, DefaultListLimit, MaxListLimit), ParseQueryOffset(r)}, true
}

func traceQuery(w http.ResponseWriter, r *http.Request, field string, max int) (string, bool) {
	value := strings.TrimSpace(r.URL.Query().Get(field))
	if value == "" || !utf8.ValidString(value) || utf8.RuneCountInString(value) > max || strings.ContainsFunc(value, unicode.IsControl) {
		respondError(w, http.StatusBadRequest, "Enter a valid serial number or lot code")
		return "", false
	}
	return value, true
}

func traceID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil || id == uuid.Nil {
		respondError(w, http.StatusBadRequest, "Invalid pack or lot ID")
		return id, false
	}
	return id, true
}

type tracePage[T any] struct {
	Items   []T  `json:"items"`
	HasMore bool `json:"has_more"`
}

func newTracePage[T any](items []T, limit int) tracePage[T] {
	if items == nil {
		items = []T{}
	}
	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}
	return tracePage[T]{Items: items, HasMore: hasMore}
}

func respondTraceError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(w, http.StatusNotFound, "Record not found in this workspace")
		return
	}
	slog.Error("Traceability lookup failed", "error", err)
	respondError(w, http.StatusInternalServerError, "Could not load traceability records")
}

func (h *Handler) findTracePacks(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	serial, ok := traceQuery(w, r, "serial", 100)
	if !ok {
		return
	}
	items, err := h.repo.FindTracePacks(r.Context(), scope.tenantID, serial, scope.limit+1, scope.offset)
	if err != nil {
		respondTraceError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, newTracePage(items, scope.limit))
}

func (h *Handler) getTracePack(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	id, ok := traceID(w, r)
	if !ok {
		return
	}
	pack, items, err := h.repo.GetTracePack(r.Context(), scope.tenantID, id, scope.limit+1, scope.offset)
	if err != nil {
		respondTraceError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"pack": pack, "lots": newTracePage(items, scope.limit)})
}

func (h *Handler) findTraceLots(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	lotCode, ok := traceQuery(w, r, "code", 120)
	if !ok {
		return
	}
	items, err := h.repo.FindTraceLots(r.Context(), scope.tenantID, lotCode, scope.limit+1, scope.offset)
	if err != nil {
		respondTraceError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, newTracePage(items, scope.limit))
}

func (h *Handler) getTraceLot(w http.ResponseWriter, r *http.Request) {
	scope, ok := traceScope(w, r)
	if !ok {
		return
	}
	id, ok := traceID(w, r)
	if !ok {
		return
	}
	lot, items, err := h.repo.GetTraceLot(r.Context(), scope.tenantID, id, scope.limit+1, scope.offset)
	if err != nil {
		respondTraceError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"lot": lot, "impact": newTracePage(items, scope.limit)})
}
