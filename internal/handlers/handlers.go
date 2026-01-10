package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"exportready-battery/internal/db"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	db *db.DB
}

// New creates a new Handler with the given database connection
func New(database *db.DB) *Handler {
	return &Handler{db: database}
}

// CreateBatch handles POST /api/v1/batches
func (h *Handler) CreateBatch(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement batch creation
	respondJSON(w, http.StatusCreated, map[string]string{
		"message": "CreateBatch endpoint - implementation pending",
	})
}

// ListBatches handles GET /api/v1/batches
func (h *Handler) ListBatches(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement batch listing
	respondJSON(w, http.StatusOK, map[string]string{
		"message": "ListBatches endpoint - implementation pending",
	})
}

// GetBatch handles GET /api/v1/batches/{id}
func (h *Handler) GetBatch(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// TODO: Implement fetching single batch
	respondJSON(w, http.StatusOK, map[string]string{
		"message":  "GetBatch endpoint - implementation pending",
		"batch_id": id,
	})
}

// UploadCSV handles POST /api/v1/batches/{id}/upload
func (h *Handler) UploadCSV(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// TODO: Implement CSV upload and processing
	respondJSON(w, http.StatusAccepted, map[string]string{
		"message":  "UploadCSV endpoint - implementation pending",
		"batch_id": id,
	})
}

// GetPassport handles GET /api/v1/passports/{uuid}
func (h *Handler) GetPassport(w http.ResponseWriter, r *http.Request) {
	uuid := r.PathValue("uuid")
	// TODO: Implement passport retrieval
	respondJSON(w, http.StatusOK, map[string]string{
		"message":       "GetPassport endpoint - implementation pending",
		"passport_uuid": uuid,
	})
}

// DownloadQRCodes handles GET /api/v1/batches/{id}/download
func (h *Handler) DownloadQRCodes(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// TODO: Implement QR code ZIP download
	respondJSON(w, http.StatusOK, map[string]string{
		"message":  "DownloadQRCodes endpoint - implementation pending",
		"batch_id": id,
	})
}

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}

// respondError sends an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
