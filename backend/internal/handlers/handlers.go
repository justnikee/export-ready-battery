package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"exportready-battery/internal/db"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	repo       *repository.Repository
	csvService *services.CSVService
	qrService  *services.QRService
	geoService *services.GeoIPService
}

// New creates a new Handler with the given database connection
func New(database *db.DB, baseURL string, geoDBPath string) *Handler {
	return &Handler{
		repo:       repository.New(database),
		csvService: services.NewCSVService(),
		qrService:  services.NewQRService(baseURL),
		geoService: services.NewGeoIPService(geoDBPath),
	}
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
