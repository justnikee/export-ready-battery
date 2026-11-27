package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// RegisterBatteryModelRoutes accepts the standard workspace read and write gates.
func (h *Handler) RegisterBatteryModelRoutes(mux *http.ServeMux, read, write func(http.Handler) http.Handler) {
	mux.Handle("GET /api/v1/battery-models", read(http.HandlerFunc(h.listBatteryModels)))
	mux.Handle("POST /api/v1/battery-models", write(http.HandlerFunc(h.createBatteryModel)))
	mux.Handle("GET /api/v1/battery-models/{modelID}", read(http.HandlerFunc(h.getBatteryModel)))
	mux.Handle("POST /api/v1/battery-models/{modelID}/revisions", write(http.HandlerFunc(h.createBatteryModelDraft)))
	mux.Handle("PUT /api/v1/battery-models/{modelID}/revisions/{revisionID}", write(http.HandlerFunc(h.updateBatteryModelDraft)))
	mux.Handle("POST /api/v1/battery-models/{modelID}/revisions/{revisionID}/release", write(http.HandlerFunc(h.releaseBatteryModelDraft)))
}

type batteryModelScope struct {
	tenantID, modelID, revisionID uuid.UUID
}

func modelScope(w http.ResponseWriter, r *http.Request) (batteryModelScope, bool) {
	w.Header().Set("Cache-Control", "private, no-store")
	tenantID, err := uuid.Parse(middleware.GetTenantID(r.Context()))
	if err != nil || tenantID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "Workspace authentication required")
		return batteryModelScope{}, false
	}
	scope := batteryModelScope{tenantID: tenantID}
	for _, param := range []struct {
		key string
		id  *uuid.UUID
	}{{"modelID", &scope.modelID}, {"revisionID", &scope.revisionID}} {
		if raw := r.PathValue(param.key); raw != "" {
			id, err := uuid.Parse(raw)
			if err != nil || id == uuid.Nil {
				respondError(w, http.StatusBadRequest, "Invalid model or revision ID")
				return batteryModelScope{}, false
			}
			*param.id = id
		}
	}
	return scope, true
}

func modelPage(r *http.Request) (page, limit, offset int) {
	limit = ParseQueryLimit(r, DefaultListLimit, MaxListLimit)
	page = 1
	if parsed, err := strconv.ParseInt(r.URL.Query().Get("page"), 10, 24); err == nil && parsed > 0 {
		page = int(parsed)
	}
	return page, limit, (page - 1) * limit
}

func (h *Handler) listBatteryModels(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	page, limit, offset := modelPage(r)
	items, total, err := h.repo.ListBatteryModels(r.Context(), scope.tenantID, limit, offset)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	pages := (total + limit - 1) / limit
	respondJSON(w, http.StatusOK, map[string]any{"models": items, "total": total, "page": page, "limit": limit, "total_pages": pages, "has_more": page < pages})
}

func (h *Handler) getBatteryModel(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	page, limit, offset := modelPage(r)
	model, revisions, total, err := h.repo.GetBatteryModel(r.Context(), scope.tenantID, scope.modelID, limit, offset)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	pages := (total + limit - 1) / limit
	respondJSON(w, http.StatusOK, map[string]any{"model": model, "revisions": revisions, "total": total, "page": page, "limit": limit, "total_pages": pages, "has_more": page < pages})
}

func (h *Handler) createBatteryModel(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	var req struct {
		Code string `json:"code"`
		Name string `json:"name"`
	}
	if !decodeModelRequest(w, r, &req) {
		return
	}
	req.Code, req.Name = strings.TrimSpace(req.Code), strings.TrimSpace(req.Name)
	if req.Code == "" || req.Name == "" || utf8.RuneCountInString(req.Code) > 80 || utf8.RuneCountInString(req.Name) > 160 {
		respondError(w, http.StatusBadRequest, "Enter a model code of up to 80 characters and a name of up to 160 characters")
		return
	}
	model, err := h.repo.CreateBatteryModel(r.Context(), scope.tenantID, req.Code, req.Name)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	respondJSON(w, http.StatusCreated, model)
}

func (h *Handler) createBatteryModelDraft(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	revision, err := h.repo.CreateBatteryModelDraft(r.Context(), scope.tenantID, scope.modelID)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	respondJSON(w, http.StatusCreated, revision)
}

func (h *Handler) updateBatteryModelDraft(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	var req struct {
		Version int                        `json:"version"`
		Specs   *models.ModelRevisionSpecs `json:"specs"`
	}
	if !decodeModelRequest(w, r, &req) {
		return
	}
	if req.Version < 1 || req.Specs == nil {
		respondError(w, http.StatusBadRequest, "A draft version and specifications are required")
		return
	}
	if err := validateModelSpecs(req.Specs); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	revision, err := h.repo.UpdateBatteryModelDraft(r.Context(), scope.tenantID, scope.modelID, scope.revisionID, req.Version, *req.Specs)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, revision)
}

func (h *Handler) releaseBatteryModelDraft(w http.ResponseWriter, r *http.Request) {
	scope, ok := modelScope(w, r)
	if !ok {
		return
	}
	actorID, err := uuid.Parse(middleware.GetUserID(r.Context()))
	if err != nil || actorID == uuid.Nil {
		respondError(w, http.StatusUnauthorized, "Workspace user authentication required")
		return
	}
	var req struct {
		Version int `json:"version"`
	}
	if !decodeModelRequest(w, r, &req) {
		return
	}
	if req.Version < 1 {
		respondError(w, http.StatusBadRequest, "A draft version is required")
		return
	}
	revision, err := h.repo.ReleaseBatteryModelDraft(r.Context(), scope.tenantID, scope.modelID, scope.revisionID, actorID, req.Version)
	if err != nil {
		respondBatteryModelError(w, err)
		return
	}
	respondJSON(w, http.StatusOK, revision)
}

func decodeModelRequest(w http.ResponseWriter, r *http.Request, dst any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	decoder.DisallowUnknownFields()
	err := decoder.Decode(dst)
	if err == nil {
		err = decoder.Decode(new(any))
		if err == io.EOF {
			return true
		}
	}
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		respondError(w, http.StatusRequestEntityTooLarge, "Model request exceeds 64 KB")
	} else {
		respondError(w, http.StatusBadRequest, "Invalid model request")
	}
	return false
}

var (
	voltageValue  = regexp.MustCompile(`(?i)^([0-9]+(?:\.[0-9]+)?)\s*(V|mV)$`)
	capacityValue = regexp.MustCompile(`(?i)^([0-9]+(?:\.[0-9]+)?)\s*(Ah|mAh|Wh|kWh)$`)
)

func validModelMeasurement(value string, pattern *regexp.Regexp) bool {
	if value == "" {
		return true
	}
	if len(value) > 32 {
		return false
	}
	match := pattern.FindStringSubmatch(value)
	if match == nil {
		return false
	}
	number, err := strconv.ParseFloat(match[1], 64)
	return err == nil && number > 0
}

func validateModelSpecs(specs *models.ModelRevisionSpecs) error {
	specs.Chemistry = strings.TrimSpace(specs.Chemistry)
	specs.Voltage = strings.TrimSpace(specs.Voltage)
	specs.Capacity = strings.TrimSpace(specs.Capacity)
	if utf8.RuneCountInString(specs.Chemistry) > 80 {
		return errors.New("Chemistry must be 80 characters or fewer")
	}
	if !validModelMeasurement(specs.Voltage, voltageValue) {
		return errors.New("Enter a positive nominal voltage in V or mV, such as 48 V")
	}
	if !validModelMeasurement(specs.Capacity, capacityValue) {
		return errors.New("Enter a positive rated capacity in Ah, mAh, Wh, or kWh, such as 30 Ah")
	}
	if specs.BatteryCategory != "" && !specs.BatteryCategory.IsValid() {
		return errors.New("Choose a valid battery category")
	}
	if len(specs.IntendedBOM) > 100 {
		return errors.New("The intended bill of materials can contain up to 100 parts")
	}
	for i := range specs.IntendedBOM {
		part := &specs.IntendedBOM[i]
		part.PartNumber, part.Name = strings.TrimSpace(part.PartNumber), strings.TrimSpace(part.Name)
		if part.PartNumber == "" || part.Name == "" || utf8.RuneCountInString(part.PartNumber) > 80 ||
			utf8.RuneCountInString(part.Name) > 160 || part.Quantity < 1 || part.Quantity > 1_000_000 {
			return errors.New("Each part needs a part number, name, and whole quantity between 1 and 1,000,000")
		}
	}
	return nil
}

func respondBatteryModelError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		respondError(w, http.StatusNotFound, "Model or revision not found")
	case errors.Is(err, repository.ErrModelDraftIncomplete):
		respondError(w, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, repository.ErrBatteryModelCodeExists), errors.Is(err, repository.ErrModelDraftExists), errors.Is(err, repository.ErrModelRevisionChanged):
		respondError(w, http.StatusConflict, err.Error())
	default:
		slog.Error("Battery model operation failed", "error", err)
		respondError(w, http.StatusInternalServerError, "Could not complete the battery model request")
	}
}
