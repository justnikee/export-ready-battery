package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/events"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
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

	// VC signing
	vcCryptoService *services.VCCryptoService // Ed25519 DID + LD-Proof signing

	// Auth service for supplier portal JWT generation
	authService *services.AuthService

	// Alert service for proactive notifications
	alertService *services.AlertService

	// Registry verification service for external compliance checks
	registryVerificationService *services.RegistryVerificationService

	// Storage service for cloud file uploads (Supabase Storage)
	storageService *services.StorageService
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

// WithAuthService injects the AuthService for supplier portal JWT generation.
func WithAuthService(svc *services.AuthService) Option {
	return func(h *Handler) { h.authService = svc }
}

// WithAlertService injects the AlertService for proactive notifications.
func WithAlertService(svc *services.AlertService) Option {
	return func(h *Handler) { h.alertService = svc }
}

// WithRegistryVerificationService injects the RegistryVerificationService.
func WithRegistryVerificationService(svc *services.RegistryVerificationService) Option {
	return func(h *Handler) { h.registryVerificationService = svc }
}

// WithStorageService injects the StorageService for cloud uploads.
func WithStorageService(svc *services.StorageService) Option {
	return func(h *Handler) { h.storageService = svc }
}

// New creates a new Handler with the given database connection.
// Pass functional Option values to inject Phase 3 engines.
func New(database *db.DB, baseURL string, geoDBPath string, razorpayKeyID, razorpayKeySecret string, emailService *services.EmailService, dataAccessService *services.DataAccessService, regulatorAPIKey string, opts ...Option) *Handler {
	var razorpayService *services.RazorpayService
	if razorpayKeyID != "" && razorpayKeySecret != "" {
		razorpayService = services.NewRazorpayService(razorpayKeyID, razorpayKeySecret)
	}

	repo := repository.New(database)

	vcCryptoService, err := services.NewVCCryptoService()
	if err != nil {
		slog.Error("Failed to initialize VC crypto service", "error", err)
	}

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
		vcCryptoService:   vcCryptoService,
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
