package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"anvayalabs-battery/internal/db"
	"anvayalabs-battery/internal/events"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	repo              repository.RepositoryInterface
	csvService        *services.CSVService
	qrService         *services.QRService
	geoService        *services.GeoIPService
	pdfService        *services.PDFService
	razorpayService   *services.RazorpayService
	validationService *services.ValidationService // India compliance validation
	lifecycleService  *services.LifecycleService  // Passport lifecycle & audit
	emailService      *services.EmailService      // Email service for invites
	dataAccessService *services.DataAccessService // Data Access Tokens
	regulatorAPIKey   string                      // Art 78 regulator access key

	// Phase 3: pluggable engines
	batchService    *services.BatchService    // Schema validation + compliance runner
	passportService *services.PassportService // Serial number generation
	eventBus        *events.Bus               // Domain event bus
}

// Option is a functional option for configuring a Handler.
type Option func(*Handler)

// WithBatchService injects the BatchService (schema validation + compliance).
func WithBatchService(svc *services.BatchService) Option {
	return func(h *Handler) { h.batchService = svc }
}

// WithPassportService injects the PassportService (serial generation).
func WithPassportService(svc *services.PassportService) Option {
	return func(h *Handler) { h.passportService = svc }
}

// WithEventBus injects the domain event bus.
func WithEventBus(bus *events.Bus) Option {
	return func(h *Handler) { h.eventBus = bus }
}

// New creates a new Handler with the given database connection.
// Pass functional Option values to inject Phase 3 engines.
func New(database *db.DB, baseURL string, geoDBPath string, razorpayKeyID, razorpayKeySecret string, emailService *services.EmailService, dataAccessService *services.DataAccessService, regulatorAPIKey string, opts ...Option) *Handler {
	var razorpayService *services.RazorpayService
	if razorpayKeyID != "" && razorpayKeySecret != "" {
		razorpayService = services.NewRazorpayService(razorpayKeyID, razorpayKeySecret)
	}

	repo := repository.New(database)

	h := &Handler{
		repo:              repo,
		csvService:        services.NewCSVService(),
		qrService:         services.NewQRService(baseURL),
		geoService:        services.NewGeoIPService(geoDBPath),
		pdfService:        services.NewPDFService(baseURL),
		razorpayService:   razorpayService,
		validationService: services.NewValidationService(),
		lifecycleService:  services.NewLifecycleService(repo),
		emailService:      emailService,
		dataAccessService: dataAccessService,
		regulatorAPIKey:   regulatorAPIKey,
	}

	for _, opt := range opts {
		opt(h)
	}
	return h
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
