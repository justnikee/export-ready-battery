package tally

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/anvayalabs/textile-api/internal/middleware"
	"github.com/anvayalabs/textile-api/internal/repository"
	"github.com/google/uuid"
)

// Handler provides Tally ERP integration endpoints.
type Handler struct {
	repo repository.RepositoryInterface
}

// NewHandler creates a new Tally handler.
func NewHandler(repo repository.RepositoryInterface) *Handler {
	return &Handler{repo: repo}
}

// Import handles POST /api/v1/integrations/tally/import
// Accepts a Tally Prime XML export and returns a textile lot draft.
func (h *Handler) Import(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, _ := uuid.Parse(tenantIDStr)

	// Limit upload size to 10 MB
	r.Body = http.MaxBytesReader(w, r.Body, 10*1024*1024)

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":   "Missing file",
			"details": err.Error(),
		})
		h.logImport(r.Context(), tenantID, "", "error", "Missing file: "+err.Error(), 0, 0, nil)
		return
	}
	defer file.Close()

	doc, err := ParseTallyXML(file)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":   "Failed to parse Tally XML",
			"details": err.Error(),
		})
		h.logImport(r.Context(), tenantID, fileHeader.Filename, "error", err.Error(), 0, 0, nil)
		return
	}

	draft := MapToTextileBatchDraft(doc)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"draft":       draft,
		"vouchers":    len(doc.Vouchers),
		"stock_items": len(doc.StockItems),
		"message":     "Tally import parsed successfully. Review the draft before creating a lot.",
	})

	h.logImport(r.Context(), tenantID, fileHeader.Filename, "success", "", len(doc.Vouchers), len(doc.StockItems), nil)
}

// History handles GET /api/v1/integrations/tally/history
// Returns paginated import history for the authenticated tenant.
func (h *Handler) History(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid tenant"})
		return
	}

	limit := 20
	offset := 0
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && o >= 0 {
		offset = o
	}

	logs, total, err := h.repo.GetTallyImportLogsByTenant(r.Context(), tenantID, limit, offset)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch import history"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *Handler) logImport(ctx context.Context, tenantID uuid.UUID, fileName, status, errorMsg string, vouchers, stockItems int, lotID *uuid.UUID) {
	var errMsg *string
	if errorMsg != "" {
		errMsg = &errorMsg
	}
	_ = h.repo.CreateTallyImportLog(ctx, &repository.TallyImportLog{
		TenantID:        tenantID,
		FileName:        fileName,
		Status:          status,
		ErrorMessage:    errMsg,
		VouchersCount:   vouchers,
		StockItemsCount: stockItems,
		CreatedLotID:    lotID,
	})
}
