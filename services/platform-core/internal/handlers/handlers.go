package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/platform-core/internal/repository"
	"github.com/anvayalabs/platform-core/internal/services"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	repo            repository.RepositoryInterface
	razorpayService *services.RazorpayService
	emailService    *services.EmailService
}

// New creates a new Handler with the given dependencies.
func New(repo repository.RepositoryInterface, razorpayKeyID, razorpayKeySecret string, emailService *services.EmailService) *Handler {
	var razorpayService *services.RazorpayService
	if razorpayKeyID != "" && razorpayKeySecret != "" {
		razorpayService = services.NewRazorpayService(razorpayKeyID, razorpayKeySecret)
	}

	return &Handler{
		repo:            repo,
		razorpayService: razorpayService,
		emailService:    emailService,
	}
}

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("Failed to encode JSON response", "error", err)
	}
}

// respondError sends an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// RazorpayService returns the Razorpay service for webhook handler initialization
func (h *Handler) RazorpayService() *services.RazorpayService {
	return h.razorpayService
}
