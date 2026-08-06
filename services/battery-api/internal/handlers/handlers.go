package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/events"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
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
	emailService         *services.EmailService         // Email service for invites
	dataAccessService    *services.DataAccessService    // Data Access Tokens
	regulatorAPIKey      string                         // Art 78 env bootstrap key (global; prefer DB keys)
	regulatorKeyService  *services.RegulatorKeyService  // S-12 scoped regulator credentials + audit

	// Phase 3: pluggable engines
	batchService           *services.BatchService           // Schema validation + compliance runner
	batchCreationValidator *services.BatchCreationValidator // Batch creation pre-flight validation
	passportService        *services.PassportService        // Serial number generation
	eventBus               *events.Bus                      // Domain event bus

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

	// Per-IP, per-passport hourly cap on public scan recording
	scanRateLimiter *scanRateLimiter
}

// Option is a functional option for configuring a Handler.
type Option func(*Handler)

// WithBatchService injects the BatchService (schema validation + compliance).
func WithBatchService(svc *services.BatchService) Option {
	return func(h *Handler) { h.batchService = svc }
}

// WithBatchCreationValidator injects the BatchCreationValidator.
func WithBatchCreationValidator(v *services.BatchCreationValidator) Option {
	return func(h *Handler) { h.batchCreationValidator = v }
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

// WithRegulatorKeyService injects S-12 scoped regulator credential validation + audit.
func WithRegulatorKeyService(svc *services.RegulatorKeyService) Option {
	return func(h *Handler) { h.regulatorKeyService = svc }
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
		scanRateLimiter:   newScanRateLimiter(),
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

// sanitizeDBError converts raw database/driver errors into safe, user-facing
// messages without leaking connection details. It keeps PostgreSQL constraint
// and syntax errors intact because they tell the caller exactly what field
// violated a rule.
func sanitizeDBError(err error) string {
	if err == nil {
		return ""
	}
	msg := err.Error()
	lower := strings.ToLower(msg)

	// Hide internal connection or auth failures
	if strings.Contains(lower, "connection refused") ||
		strings.Contains(lower, "dial tcp") ||
		strings.Contains(lower, "no such host") ||
		strings.Contains(lower, "authentication failed") ||
		strings.Contains(lower, "password authentication") {
		return "database connection failed — please try again in a moment"
	}

	// Surface known PostgreSQL constraint / syntax / type errors
	if strings.Contains(lower, "pq:") ||
		strings.Contains(lower, "violates") ||
		strings.Contains(lower, "constraint") ||
		strings.Contains(lower, "invalid input syntax") ||
		strings.Contains(lower, "cannot cast") ||
		strings.Contains(lower, "value too long") {
		// Strip the wrapped "failed to create batch: " prefix if present
		idx := strings.Index(msg, "pq: ")
		if idx >= 0 {
			return msg[idx+4:]
		}
		return msg
	}

	// Default: keep the original message (safe for application-level errors)
	return msg
}

// checkIfOnboardingCompleted verifies the tenant has completed onboarding.
// If onboarding_completed is false, it writes a 403 Forbidden response and returns false.
// Call this at the top of handlers that require a fully onboarded tenant.
func (h *Handler) checkIfOnboardingCompleted(w http.ResponseWriter, r *http.Request) bool {
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return false
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid tenant ID")
		return false
	}

	tenant, err := h.repo.GetTenant(r.Context(), tenantID)
	if err != nil {
		slog.Error("Failed to retrieve tenant for onboarding check", "tenant_id", tenantIDStr, "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve tenant details")
		return false
	}

	if !tenant.OnboardingCompleted {
		respondError(w, http.StatusForbidden, "complete_onboarding_first")
		return false
	}

	if services.IsSubscriptionExpired(tenant.PlanStatus, tenant.SubscriptionExpiresAt) {
		respondSubscriptionExpired(w)
		return false
	}

	return true
}

// respondSubscriptionExpired writes the standard 402 for a lapsed subscription.
// Shared by RequireOnboardingComplete (writes) and RequireFeature (Growth-feature
// routes, including reads) so both gates return an identical error shape.
func respondSubscriptionExpired(w http.ResponseWriter) {
	respondJSON(w, http.StatusPaymentRequired, map[string]interface{}{
		"error":       "subscription_expired",
		"message":     "Your subscription has expired. Please upgrade or renew your plan.",
		"upgrade_url": "/dashboard/billing",
	})
}

// RequireOnboardingComplete returns middleware that blocks requests from tenants
// who have not completed onboarding. Chain this AFTER authMiddleware.Protect.
func (h *Handler) RequireOnboardingComplete(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !h.checkIfOnboardingCompleted(w, r) {
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireFeature returns middleware that blocks requests when the tenant's plan
// does not include the given feature, or the tenant's subscription has expired.
// Chain this AFTER authMiddleware.Protect. Returns 402 Payment Required — either
// `subscription_expired` (renew) or `upgrade_required` (with required plan +
// upgrade URL) — distinct from a 403 role denial.
func (h *Handler) RequireFeature(feature services.Feature) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenantIDStr := middleware.GetTenantID(r.Context())
			tenantID, err := uuid.Parse(tenantIDStr)
			if err != nil {
				respondError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			plan, planStatus, expiresAt, err := h.repo.GetTenantSubscriptionStatus(r.Context(), tenantID)
			if err != nil {
				slog.Error("Failed to load tenant plan for feature gate", "tenant_id", tenantIDStr, "feature", feature, "error", err)
				respondError(w, http.StatusInternalServerError, "Failed to verify plan entitlement")
				return
			}
			// Expiry applies regardless of plan: a lapsed Growth subscription must
			// not retain indefinite access to Growth-only routes (including reads,
			// which RequireOnboardingComplete never covers).
			if services.IsSubscriptionExpired(planStatus, expiresAt) {
				respondSubscriptionExpired(w)
				return
			}
			if !services.PlanIncludes(plan, feature) {
				respondJSON(w, http.StatusPaymentRequired, map[string]interface{}{
					"error":         "upgrade_required",
					"feature":       string(feature),
					"required_plan": services.RequiredPlan(feature),
					"current_plan":  services.NormalizePlan(plan),
					"upgrade_url":   "/dashboard/billing",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RazorpayService returns the Razorpay service for webhook handler initialization
func (h *Handler) RazorpayService() *services.RazorpayService {
	return h.razorpayService
}
