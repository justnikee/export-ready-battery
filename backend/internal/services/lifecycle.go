package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrUnknownAction           = errors.New("unknown transition action")
	ErrActionNotAllowed        = errors.New("action not allowed from current status")
	ErrRoleNotAllowed          = errors.New("actor role not allowed for action")
	ErrMissingActorContext     = errors.New("missing actor context")
	ErrInvalidActorContext     = errors.New("invalid actor context")
	ErrInvalidEvidence         = errors.New("invalid evidence")
	ErrInvalidMaintenanceEvent = errors.New("invalid maintenance event")
	ErrInvalidReasonCode       = errors.New("invalid reason code")
	ErrBulkEligibilityFailed   = errors.New("bulk eligibility check failed")
	ErrMagicLinkTokenInvalid   = errors.New("magic link token invalid")
	ErrTransitionPersistFailed = errors.New("failed to persist lifecycle transition")
)

// LifecycleService handles passport lifecycle transitions and event logging
type LifecycleService struct {
	repo       LifecycleRepository
	webhookSvc *OutboundWebhookService // optional — nil disables outbound webhooks
}

// WithWebhooks attaches an outbound webhook service; returns self for chaining.
func (s *LifecycleService) WithWebhooks(svc *OutboundWebhookService) *LifecycleService {
	s.webhookSvc = svc
	return s
}

// LifecycleRepository defines the data access required for lifecycle operations.
type LifecycleRepository interface {
	GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error)
	GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error)
	GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error)
	ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error
	GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error)
	CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error
	UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, ownerIdentifier string) error
	AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error
	CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error
	UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, updatedAt time.Time) error
	AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error
	GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error)
	AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error
	// GetPassportIDsByBatch returns all non-terminal passport UUIDs in a batch, scoped to tenant.
	GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error)
	ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, limit, offset int) ([]*repository.PassportListItem, int, error)
}

// NewLifecycleService creates a new lifecycle service
func NewLifecycleService(repo LifecycleRepository) *LifecycleService {
	return &LifecycleService{repo: repo}
}

// TransitionRequest represents a request to apply a lifecycle action
type TransitionRequest struct {
	PassportID         uuid.UUID           `json:"passport_id"`
	Action             string              `json:"action"`
	ActorContext       models.ActorContext `json:"actor_context"`
	IPAddress          string              `json:"ip_address,omitempty"`
	MagicLinkTokenHash string              `json:"-"`
	// Optional owner identifier (email or external ID)
	CurrentOwnerIdentifier string          `json:"current_owner_identifier,omitempty"`
	Evidence               models.Evidence `json:"evidence,omitempty"`
	// Reason code and admin note for discretionary actions (required for ACTIVATE by ADMIN)
	ReasonCode string `json:"reason_code,omitempty"` // e.g. "MANUAL_OVERRIDE", "BATCH_QC_PASS"
	AdminNote  string `json:"admin_note,omitempty"`  // free-text, max 500 chars
	// Optional document attachment — handler resolves hash+label before calling ApplyTransition
	DocumentID    *uuid.UUID `json:"-"` // pre-validated document UUID
	DocumentHash  string     `json:"-"` // SHA-256 hex, fetched by handler
	DocumentLabel string     `json:"-"` // human-readable label, fetched by handler
	// Optional GPS location (WGS-84) from the field device — best-effort, never blocks transition.
	// GDPR: constitutes personal data; access is scoped to Regulator-tier by access_views.go.
	Location *models.GeoPoint `json:"location,omitempty"`
}

// TransitionResult contains the result of an applied lifecycle action
type TransitionResult struct {
	Success        bool             `json:"success"`
	Passport       *models.Passport `json:"passport,omitempty"`
	PreviousStatus string           `json:"previous_status"`
	NewStatus      string           `json:"new_status"`
	Action         string           `json:"action"`
	EventID        uuid.UUID        `json:"event_id"`
	Error          string           `json:"error,omitempty"`
}

// ApplyTransition handles a single passport lifecycle action with validation and event logging
func (s *LifecycleService) ApplyTransition(ctx context.Context, req TransitionRequest) (*TransitionResult, error) {
	// Get current passport
	passport, err := s.repo.GetPassportByUUID(ctx, req.PassportID)
	if err != nil {
		return &TransitionResult{
			Success: false,
			Error:   "Passport not found",
		}, err
	}

	previousStatus := passport.Status

	if req.ActorContext.ActorID == "" || req.ActorContext.ActorType == "" || req.ActorContext.ActorRole == "" || req.ActorContext.Source == "" {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Error:          "Missing actor context",
		}, ErrMissingActorContext
	}
	if err := models.ValidateActorContext(req.ActorContext); err != nil {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Error:          "Invalid actor context",
		}, ErrInvalidActorContext
	}

	// Validate action exists
	action := models.TransitionAction(req.Action)
	if !models.IsValidAction(req.Action) {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Error:          fmt.Sprintf("Unknown action: %s", req.Action),
		}, ErrUnknownAction
	}

	// Validate actor role is allowed for action
	if !models.IsRoleAllowedForAction(action, req.ActorContext.ActorRole) {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Action:         string(action),
			Error:          fmt.Sprintf("Role %s is not permitted to perform %s", req.ActorContext.ActorRole, action),
		}, ErrRoleNotAllowed
	}

	// Validate action allowed from current state
	if !models.IsActionAllowedFrom(action, previousStatus) {
		allowedActions := models.GetAllowedActions(previousStatus)
		allowedStrings := make([]string, 0, len(allowedActions))
		for _, a := range allowedActions {
			allowedStrings = append(allowedStrings, string(a))
		}
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Action:         string(action),
			Error:          fmt.Sprintf("Action %s not allowed from %s. Allowed actions: %v", action, previousStatus, allowedStrings),
		}, ErrActionNotAllowed
	}

	definition, _ := models.GetTransitionDefinition(action)
	toStatus := definition.To

	validation, err := models.ValidateEvidence(action, req.Evidence)
	if err != nil {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Action:         string(action),
			Error:          err.Error(),
		}, ErrInvalidEvidence
	}

	// Validate reason code requirement (e.g. ACTIVATE always requires one)
	if err := models.ValidateReasonCode(action, req.ReasonCode); err != nil {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Action:         string(action),
			Error:          err.Error(),
		}, ErrInvalidReasonCode
	}

	// Set appropriate timestamp based on target status
	now := time.Now()
	var shippedAt *time.Time
	var installedAt *time.Time
	var recycledAt *time.Time
	var recyclingStatus string
	var recyclerEprID string
	var recyclingDate *time.Time
	switch toStatus {
	case models.PassportStatusShipped:
		if dt, ok := validation.Dates[models.EvidenceShipmentDate]; ok {
			shippedAt = &dt
		} else {
			shippedAt = &now
		}
	case models.PassportStatusInService:
		if dt, ok := validation.Dates[models.EvidenceInstallationDate]; ok {
			installedAt = &dt
		} else {
			installedAt = &now
		}
	case models.PassportStatusRecycled:
		if dt, ok := validation.Dates[models.EvidenceRecyclingDate]; ok {
			recycledAt = &dt
			recyclingDate = &dt
		} else {
			recycledAt = &now
			recyclingDate = &now
		}
		recyclerEprID = validation.Evidence[models.EvidenceRecyclerEprID]
		recyclingStatus = "RECYCLED"
	}

	// Log the event
	eventType := s.getEventTypeForStatus(toStatus)
	metadata := make(map[string]interface{})
	metadata["previous_status"] = previousStatus
	metadata["new_status"] = toStatus
	metadata["action"] = string(action)
	if len(validation.Evidence) > 0 {
		metadata["evidence"] = validation.Evidence
	}
	if req.CurrentOwnerIdentifier != "" {
		metadata["current_owner_identifier"] = req.CurrentOwnerIdentifier
	}
	if req.ReasonCode != "" {
		metadata["reason_code"] = req.ReasonCode
	}
	if req.AdminNote != "" {
		metadata["admin_note"] = req.AdminNote
	}
	// Document attachment metadata (hash included in event for tamper-proof chain)
	if req.DocumentID != nil {
		metadata["document_id"] = req.DocumentID.String()
		if req.DocumentHash != "" {
			metadata["document_hash"] = req.DocumentHash
		}
		if req.DocumentLabel != "" {
			metadata["document_label"] = req.DocumentLabel
		}
	}
	// GPS location (stored in event metadata before hash so it's tamper-proof)
	if req.Location != nil {
		metadata["lat"] = req.Location.Lat
		metadata["lng"] = req.Location.Lng
		metadata["accuracy_meters"] = req.Location.AccuracyMeters
	}

	// Get previous event hash for chain integrity
	var previousHash string
	prevEvents, err := s.repo.GetPassportEvents(ctx, passport.UUID)
	if err == nil && len(prevEvents) > 0 {
		// Get the most recent event's hash
		previousHash = prevEvents[len(prevEvents)-1].Hash
	}

	event := &models.PassportEvent{
		ID:           uuid.New(),
		PassportID:   passport.UUID,
		EventType:    eventType,
		Action:       action,
		Actor:        req.ActorContext.ActorID,
		ActorType:    string(req.ActorContext.ActorType),
		ActorRole:    req.ActorContext.ActorRole,
		ActorID:      req.ActorContext.ActorID,
		Source:       string(req.ActorContext.Source),
		StatusFrom:   previousStatus,
		StatusTo:     toStatus,
		IPAddress:    req.IPAddress,
		Metadata:     metadata,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	// Generate tamper-proof hash
	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Action:       string(event.Action),
		Actor:        event.Actor,
		ActorType:    event.ActorType,
		ActorRole:    string(event.ActorRole),
		ActorID:      event.ActorID,
		Source:       event.Source,
		StatusFrom:   event.StatusFrom,
		StatusTo:     event.StatusTo,
		IPAddress:    event.IPAddress,
		Metadata:     event.Metadata,
		CreatedAt:    event.CreatedAt,
		PreviousHash: previousHash,
	}
	if hash, err := GenerateEventHash(hashData); err == nil {
		event.Hash = hash
	}

	if err := s.repo.ApplyLifecycleTransition(ctx, models.TransitionPersistence{
		PassportID:         passport.UUID,
		PreviousStatus:     previousStatus,
		NewStatus:          toStatus,
		ShippedAt:          shippedAt,
		InstalledAt:        installedAt,
		RecycledAt:         recycledAt,
		RecyclingStatus:    recyclingStatus,
		RecyclerEprID:      recyclerEprID,
		RecyclingDate:      recyclingDate,
		Event:              event,
		MagicLinkTokenHash: req.MagicLinkTokenHash,
	}); err != nil {
		if errors.Is(err, models.ErrMagicLinkTokenInvalid) {
			return &TransitionResult{
				Success:        false,
				PreviousStatus: previousStatus,
				Action:         string(action),
				Error:          "Magic link token is invalid or already used",
			}, ErrMagicLinkTokenInvalid
		}
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Action:         string(action),
			Error:          "Failed to persist lifecycle transition",
		}, ErrTransitionPersistFailed
	}

	passport.Status = toStatus
	if shippedAt != nil {
		passport.ShippedAt = shippedAt
	}
	if installedAt != nil {
		passport.InstalledAt = installedAt
	}
	if recycledAt != nil {
		passport.RecycledAt = recycledAt
	}
	if recyclingStatus != "" {
		passport.RecyclingStatus = recyclingStatus
	}
	if recyclerEprID != "" {
		passport.RecyclerEprID = recyclerEprID
	}
	if recyclingDate != nil {
		passport.RecyclingDate = recyclingDate
	}

	// Update current owner identifier if provided
	if req.CurrentOwnerIdentifier != "" {
		_ = s.repo.UpdatePassportOwner(ctx, passport.UUID, req.CurrentOwnerIdentifier)
		entry := map[string]interface{}{
			"current_owner_identifier": req.CurrentOwnerIdentifier,
			"timestamp":                now,
			"actor":                    req.ActorContext.ActorID,
			"source":                   string(req.ActorContext.Source),
		}
		if entryJSON, err := json.Marshal([]interface{}{entry}); err == nil {
			_ = s.repo.AppendOwnershipHistory(ctx, passport.UUID, entryJSON)
		}
	}
	// Append GPS fix to geolocation_history for field actions (INSTALL, SHIP).
	// Non-fatal — transition is already committed.
	if req.Location != nil {
		geoEntry := map[string]interface{}{
			"lat":             req.Location.Lat,
			"lng":             req.Location.Lng,
			"accuracy_meters": req.Location.AccuracyMeters,
			"timestamp":       now,
			"actor":           req.ActorContext.ActorID,
			"event_id":        event.ID,
		}
		if entryJSON, err := json.Marshal([]interface{}{geoEntry}); err == nil {
			_ = s.repo.AppendGeolocationHistory(ctx, passport.UUID, entryJSON)
		}
	}

	// Fire outbound webhook (non-blocking)
	tenantID, _ := s.repo.GetBatchTenantID(ctx, passport.BatchID)
	result := &TransitionResult{
		Success:        true,
		Passport:       passport,
		PreviousStatus: previousStatus,
		NewStatus:      toStatus,
		Action:         string(action),
		EventID:        event.ID,
	}
	s.dispatchWebhook(ctx, result, tenantID)
	return result, nil
}

// dispatchWebhook fires an outbound webhook after a successful lifecycle transition.
// It is a no-op when no webhook service is wired.
func (s *LifecycleService) dispatchWebhook(ctx context.Context, result *TransitionResult, tenantID uuid.UUID) {
	if s.webhookSvc == nil {
		return
	}
	payload := map[string]interface{}{
		"passport_id":     result.Passport.UUID,
		"serial_number":   result.Passport.SerialNumber,
		"action":          result.Action,
		"previous_status": string(result.PreviousStatus),
		"new_status":      string(result.NewStatus),
		"event_id":        result.EventID,
	}
	// fire-and-forget — Dispatch internally spawns a goroutine
	s.webhookSvc.Dispatch(ctx, tenantID, "lifecycle."+result.Action, result.Passport.UUID, payload)
}

// GetPassportForTransition retrieves a passport for transition validation
func (s *LifecycleService) GetPassportForTransition(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	return s.repo.GetPassportByUUID(ctx, passportID)
}

// VerifyPassportTenantOwnership checks that a passport's batch belongs to the given tenant.
// Returns nil if the passport belongs to the tenant, or an error if not.
func (s *LifecycleService) VerifyPassportTenantOwnership(ctx context.Context, passportID uuid.UUID, tenantID uuid.UUID) error {
	passport, err := s.repo.GetPassportByUUID(ctx, passportID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}
	batchTenantID, err := s.repo.GetBatchTenantID(ctx, passport.BatchID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}
	if batchTenantID != tenantID {
		return fmt.Errorf("passport not found: unauthorized")
	}
	return nil
}

// BulkTransitionRequest represents a request to transition multiple passports
type BulkTransitionRequest struct {
	// PassportIDs is an explicit list; mutually exclusive with BatchID.
	PassportIDs []uuid.UUID `json:"passport_ids,omitempty"`
	// BatchID triggers a server-side passport ID lookup scoped to TenantID.
	BatchID      *uuid.UUID          `json:"batch_id,omitempty"`
	SelectAll    bool                `json:"select_all,omitempty"`
	StateFilter  string              `json:"state_filter,omitempty"`
	SearchQuery  string              `json:"search_query,omitempty"`
	Strict       bool                `json:"strict,omitempty"`
	TenantID     uuid.UUID           `json:"-"` // used for BatchID scoping only
	Action       string              `json:"action"`
	ActorContext models.ActorContext `json:"actor_context"`
	Evidence     models.Evidence     `json:"evidence,omitempty"`
	// IPAddress of the originating HTTP request, threaded into each audit event.
	IPAddress  string `json:"-"`
	ReasonCode string `json:"reason_code,omitempty"`
	AdminNote  string `json:"admin_note,omitempty"`
}

// BulkTransitionResult contains results for bulk transitions
type BulkTransitionResult struct {
	Total               int            `json:"total"`
	Succeeded           int            `json:"succeeded"`
	Failed              int            `json:"failed"`
	FailedIDs           []string       `json:"failed_ids,omitempty"`
	Errors              []string       `json:"errors,omitempty"`
	ErrorSummary        map[string]int `json:"error_summary,omitempty"`
	FailedStatusSummary map[string]int `json:"failed_status_summary,omitempty"`
}

func newBulkTransitionResult(total int) *BulkTransitionResult {
	return &BulkTransitionResult{
		Total:               total,
		FailedIDs:           []string{},
		Errors:              []string{},
		ErrorSummary:        map[string]int{},
		FailedStatusSummary: map[string]int{},
	}
}

func (r *BulkTransitionResult) addFailure(passportID uuid.UUID, errMsg string, status string) {
	r.Failed++
	r.FailedIDs = append(r.FailedIDs, passportID.String())
	r.Errors = append(r.Errors, errMsg)
	r.ErrorSummary[errMsg]++
	if status != "" {
		r.FailedStatusSummary[status]++
	}
}

func formatActionNotAllowedError(action models.TransitionAction, currentStatus string) string {
	allowedActions := models.GetAllowedActions(currentStatus)
	allowedStrings := make([]string, 0, len(allowedActions))
	for _, allowedAction := range allowedActions {
		allowedStrings = append(allowedStrings, string(allowedAction))
	}
	return fmt.Sprintf("Action %s not allowed from %s. Allowed actions: %v", action, currentStatus, allowedStrings)
}

func (s *LifecycleService) resolveBulkPassportIDs(ctx context.Context, req BulkTransitionRequest) ([]uuid.UUID, error) {
	if req.SelectAll {
		const pageSize = 500

		batchFilter := ""
		if req.BatchID != nil {
			batchFilter = req.BatchID.String()
		}

		passportIDs := make([]uuid.UUID, 0)
		offset := 0
		for {
			items, total, err := s.repo.ListPassportsByTenant(ctx, req.TenantID, req.StateFilter, req.SearchQuery, batchFilter, pageSize, offset)
			if err != nil {
				return nil, fmt.Errorf("failed to list passports: %w", err)
			}
			if len(items) == 0 {
				return passportIDs, nil
			}

			for _, item := range items {
				parsedID, err := uuid.Parse(item.UUID)
				if err != nil {
					return nil, fmt.Errorf("failed to parse passport id %q: %w", item.UUID, err)
				}
				passportIDs = append(passportIDs, parsedID)
			}

			offset += len(items)
			if offset >= total {
				break
			}
		}

		return passportIDs, nil
	}

	if req.BatchID != nil {
		batchIDs, err := s.repo.GetPassportIDsByBatch(ctx, *req.BatchID, req.TenantID)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve batch passports: %w", err)
		}
		return batchIDs, nil
	}

	return req.PassportIDs, nil
}

func (s *LifecycleService) prevalidateBulkTransition(ctx context.Context, passportIDs []uuid.UUID, req BulkTransitionRequest) *BulkTransitionResult {
	action := models.TransitionAction(req.Action)
	result := &BulkTransitionResult{
		Total: len(passportIDs),
	}
	result = newBulkTransitionResult(len(passportIDs))

	for _, passportID := range passportIDs {
		if req.TenantID != uuid.Nil {
			if err := s.VerifyPassportTenantOwnership(ctx, passportID, req.TenantID); err != nil {
				result.addFailure(passportID, err.Error(), "")
				continue
			}
		}

		passport, err := s.repo.GetPassportByUUID(ctx, passportID)
		if err != nil {
			result.addFailure(passportID, fmt.Sprintf("passport not found: %v", err), "")
			continue
		}

		if !models.IsActionAllowedFrom(action, passport.Status) {
			result.addFailure(passportID, formatActionNotAllowedError(action, passport.Status), passport.Status)
			continue
		}

		result.Succeeded++
	}

	return result
}

type RepairEventInput struct {
	RepairDate        string `json:"repair_date"`
	TechnicianID      string `json:"technician_id"`
	ComponentRepaired string `json:"component_repaired"`
	RepairNotes       string `json:"repair_notes"`
}

type ReplacementEventInput struct {
	ReplacementDate    string `json:"replacement_date"`
	TechnicianID       string `json:"technician_id"`
	ComponentReplaced  string `json:"component_replaced"`
	ReplacementReason  string `json:"replacement_reason"`
	NewComponentSerial string `json:"new_component_serial,omitempty"`
}

// BulkTransitionPassports handles bulk passport status transitions with validation
func (s *LifecycleService) BulkTransitionPassports(ctx context.Context, req BulkTransitionRequest) (*BulkTransitionResult, error) {
	if !models.IsValidAction(req.Action) {
		return nil, ErrUnknownAction
	}
	if req.ActorContext.ActorID == "" || req.ActorContext.ActorType == "" || req.ActorContext.ActorRole == "" || req.ActorContext.Source == "" {
		return nil, ErrMissingActorContext
	}
	if err := models.ValidateActorContext(req.ActorContext); err != nil {
		return nil, ErrInvalidActorContext
	}
	if !models.IsRoleAllowedForAction(models.TransitionAction(req.Action), req.ActorContext.ActorRole) {
		return nil, ErrRoleNotAllowed
	}
	if _, err := models.ValidateEvidence(models.TransitionAction(req.Action), req.Evidence); err != nil {
		return nil, ErrInvalidEvidence
	}
	if err := models.ValidateReasonCode(models.TransitionAction(req.Action), req.ReasonCode); err != nil {
		return nil, ErrInvalidReasonCode
	}

	passportIDs, err := s.resolveBulkPassportIDs(ctx, req)
	if err != nil {
		return nil, err
	}

	if req.Strict {
		precheck := s.prevalidateBulkTransition(ctx, passportIDs, req)
		if precheck.Failed > 0 {
			return precheck, ErrBulkEligibilityFailed
		}
	}

	result := newBulkTransitionResult(len(passportIDs))

	for _, passportID := range passportIDs {
		if req.TenantID != uuid.Nil {
			if err := s.VerifyPassportTenantOwnership(ctx, passportID, req.TenantID); err != nil {
				result.addFailure(passportID, err.Error(), "")
				continue
			}
		}

		transitionReq := TransitionRequest{
			PassportID:   passportID,
			Action:       req.Action,
			ActorContext: req.ActorContext,
			Evidence:     req.Evidence,
			IPAddress:    req.IPAddress, // propagate real client IP to every event in the chain
			ReasonCode:   req.ReasonCode,
			AdminNote:    req.AdminNote,
		}

		transitionResult, err := s.ApplyTransition(ctx, transitionReq)
		if err != nil || !transitionResult.Success {
			failureStatus := ""
			failureError := ""
			if transitionResult != nil {
				failureError = transitionResult.Error
				failureStatus = transitionResult.PreviousStatus
			} else {
				failureError = err.Error()
			}
			result.addFailure(passportID, failureError, failureStatus)
		} else {
			result.Succeeded++
		}
	}

	return result, nil
}

// GetBulkAllowedActionsForFilter returns the actor-aware lifecycle actions that
// are valid for every passport in the tenant-scoped filtered dataset.
func (s *LifecycleService) GetBulkAllowedActionsForFilter(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, role models.ActorRole) ([]models.TransitionAction, error) {
	const pageSize = 500

	var intersection []models.TransitionAction
	initialized := false
	offset := 0

	for {
		items, total, err := s.repo.ListPassportsByTenant(ctx, tenantID, status, search, batchID, pageSize, offset)
		if err != nil {
			return nil, fmt.Errorf("failed to list passports: %w", err)
		}
		if len(items) == 0 {
			return []models.TransitionAction{}, nil
		}

		for _, item := range items {
			allowed := models.GetAllowedActionsForRole(item.Status, role)
			if !initialized {
				intersection = append([]models.TransitionAction{}, allowed...)
				initialized = true
				continue
			}
			intersection = intersectTransitionActions(intersection, allowed)
			if len(intersection) == 0 {
				return []models.TransitionAction{}, nil
			}
		}

		offset += len(items)
		if offset >= total || len(items) < pageSize {
			break
		}
	}

	if !initialized {
		return []models.TransitionAction{}, nil
	}

	return intersection, nil
}

func intersectTransitionActions(left, right []models.TransitionAction) []models.TransitionAction {
	if len(left) == 0 || len(right) == 0 {
		return []models.TransitionAction{}
	}

	rightSet := make(map[models.TransitionAction]struct{}, len(right))
	for _, action := range right {
		rightSet[action] = struct{}{}
	}

	intersection := make([]models.TransitionAction, 0, len(left))
	for _, action := range left {
		if _, ok := rightSet[action]; ok {
			intersection = append(intersection, action)
		}
	}

	return intersection
}

func parseLifecycleEventDate(value string) (time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, ErrInvalidMaintenanceEvent
	}
	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return parsed, nil
	}
	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return time.Time{}, ErrInvalidMaintenanceEvent
	}
	return parsed, nil
}

func isAllowedMaintenanceRole(role models.ActorRole) bool {
	switch role {
	case models.ActorRoleInternalOperator, models.ActorRoleTechnician, models.ActorRoleAdmin:
		return true
	default:
		return false
	}
}

// CalculateWarrantyRemaining calculates remaining warranty based on shipped date
func (s *LifecycleService) CalculateWarrantyRemaining(passport *models.Passport, warrantyMonths int) (int, bool) {
	if passport.ShippedAt == nil {
		return warrantyMonths, true // Not shipped yet, full warranty
	}

	elapsed := time.Since(*passport.ShippedAt)
	elapsedMonths := int(elapsed.Hours() / (24 * 30)) // Approximate months

	remaining := warrantyMonths - elapsedMonths
	if remaining < 0 {
		return 0, false // Warranty expired
	}

	return remaining, true
}

// getEventTypeForStatus maps status to appropriate event type
func (s *LifecycleService) getEventTypeForStatus(status string) string {
	switch status {
	case models.PassportStatusShipped:
		return models.PassportEventShipped
	case models.PassportStatusInService:
		return models.PassportEventInstalled
	case models.PassportStatusRecalled:
		return models.PassportEventRecalled
	case models.PassportStatusRecycled:
		return models.PassportEventRecycled
	case models.PassportStatusEndOfLife:
		return models.PassportEventEndOfLife
	default:
		return models.PassportEventStatusChanged
	}
}

// GetPassportEvents retrieves all events for a passport
func (s *LifecycleService) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	return s.repo.GetPassportEvents(ctx, passportID)
}

// TransferPassport handles ownership transfer with audit logging.
// tenantID is the authenticated caller's tenant — used to verify ownership before transfer.
func (s *LifecycleService) TransferPassport(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID, actor string, tenantID uuid.UUID) error {
	// Get current passport to log previous owner
	passport, err := s.repo.GetPassportByUUID(ctx, passportID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}

	// S1 Security fix: Verify the passport's batch belongs to the caller's tenant
	batchTenantID, err := s.repo.GetBatchTenantID(ctx, passport.BatchID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}
	if batchTenantID != tenantID {
		return fmt.Errorf("passport not found: unauthorized")
	}

	// Store previous owner for audit
	var previousOwnerID string
	if passport.OwnerID != nil {
		previousOwnerID = passport.OwnerID.String()
	}

	// Log TRANSFERRED event
	now := time.Now()
	metadata := map[string]interface{}{
		"previous_owner_id": previousOwnerID,
		"new_owner_id":      newOwnerID.String(),
	}

	// Get previous hash for chain integrity
	var previousHash string
	prevEvents, err := s.repo.GetPassportEvents(ctx, passport.UUID)
	if err == nil && len(prevEvents) > 0 {
		previousHash = prevEvents[len(prevEvents)-1].Hash
	}

	event := &models.PassportEvent{
		ID:           uuid.New(),
		PassportID:   passport.UUID,
		EventType:    models.PassportEventTransferred,
		Actor:        actor,
		ActorType:    "USER",
		ActorID:      actor,
		Source:       "INTERNAL",
		Metadata:     metadata,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	// Generate hash for tamper detection
	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Action:       string(event.Action),
		Actor:        event.Actor,
		ActorType:    event.ActorType,
		ActorRole:    string(event.ActorRole),
		ActorID:      event.ActorID,
		Source:       event.Source,
		StatusFrom:   event.StatusFrom,
		StatusTo:     event.StatusTo,
		IPAddress:    event.IPAddress,
		Metadata:     event.Metadata,
		CreatedAt:    event.CreatedAt,
		PreviousHash: previousHash,
	}
	if hash, err := GenerateEventHash(hashData); err == nil {
		event.Hash = hash
	}

	// Atomically update owner and log the event: create event first (idempotent on failure),
	// then update the owner. If the event write fails, the owner is unchanged and the error
	// surfaces. If the owner update fails, we log and surface an error — the orphaned event
	// is recorded but the DB state is consistent because the owner column was not changed.
	if err := s.repo.CreatePassportEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to log transfer event: %w", err)
	}

	// Update owner in DB (after event is persisted so audit trail is never missing)
	if err := s.repo.UpdatePassportOwnerID(ctx, passportID, newOwnerID); err != nil {
		return fmt.Errorf("failed to update owner: %w", err)
	}

	// Append ownership history entry (EU compliance)
	entry := map[string]interface{}{
		"previous_owner_id": previousOwnerID,
		"new_owner_id":      newOwnerID.String(),
		"timestamp":         now,
		"actor":             actor,
		"source":            "INTERNAL",
	}
	if entryJSON, err := json.Marshal([]interface{}{entry}); err == nil {
		_ = s.repo.AppendOwnershipHistory(ctx, passportID, entryJSON)
	}

	return nil
}

// BuildLifecycleEvents builds genesis events for newly created passports.
func (s *LifecycleService) BuildLifecycleEvents(passports []*models.Passport, eventType, actor, actorType, source string) ([]*models.PassportEvent, error) {
	if len(passports) == 0 {
		return nil, nil
	}

	events := make([]*models.PassportEvent, len(passports))

	for i, p := range passports {
		// S4 Security fix: Genesis events anchor the hash chain to the passport identity.
		// This binds the chain irrevocably to the passport, making chain replacement detectable.
		previousHash := "GENESIS:" + p.UUID.String() + ":" + p.SerialNumber

		event := &models.PassportEvent{
			ID:           uuid.New(),
			PassportID:   p.UUID,
			EventType:    eventType,
			Actor:        actor,
			ActorType:    actorType,
			ActorID:      actor,
			Source:       source,
			StatusFrom:   "",
			StatusTo:     p.Status,
			Metadata:     map[string]interface{}{"note": "Initial creation"},
			CreatedAt:    p.CreatedAt,
			PreviousHash: previousHash,
		}

		// Generate hash for tamper detection
		hashData := EventHashData{
			ID:           event.ID,
			PassportID:   event.PassportID,
			EventType:    event.EventType,
			Action:       string(event.Action),
			Actor:        event.Actor,
			ActorType:    event.ActorType,
			ActorRole:    string(event.ActorRole),
			ActorID:      event.ActorID,
			Source:       event.Source,
			StatusFrom:   event.StatusFrom,
			StatusTo:     event.StatusTo,
			IPAddress:    event.IPAddress,
			Metadata:     event.Metadata,
			CreatedAt:    event.CreatedAt,
			PreviousHash: previousHash,
		}

		hash, err := GenerateEventHash(hashData)
		if err != nil {
			return nil, fmt.Errorf("failed to generate hash for passport %s: %w", p.SerialNumber, err)
		}
		event.Hash = hash

		events[i] = event
	}

	return events, nil
}

// CreateLifecycleEvents creates genesis events for newly created passports.
func (s *LifecycleService) CreateLifecycleEvents(ctx context.Context, passports []*models.Passport, eventType, actor, actorType, source string) error {
	events, err := s.BuildLifecycleEvents(passports, eventType, actor, actorType, source)
	if err != nil {
		return err
	}
	return s.repo.CreatePassportEventBatch(ctx, events)
}

// VerifyPassportAuditChain verifies the integrity of a passport's event chain
// Returns: (isValid, failedAtIndex, error)
// failedAtIndex is -1 if valid, or the index of the first broken link
func (s *LifecycleService) VerifyPassportAuditChain(ctx context.Context, passportID uuid.UUID) (bool, int, error) {
	events, err := s.repo.GetPassportEvents(ctx, passportID)
	if err != nil {
		return false, -1, err
	}

	if len(events) == 0 {
		// No events = valid (nothing to verify)
		return true, -1, nil
	}

	// Convert to ChainEvent format for verification
	chainEvents := make([]ChainEvent, len(events))
	for i, e := range events {
		chainEvents[i] = ChainEvent{
			Data: EventHashData{
				ID:           e.ID,
				PassportID:   e.PassportID,
				EventType:    e.EventType,
				Action:       string(e.Action),
				Actor:        e.Actor,
				ActorType:    e.ActorType,
				ActorRole:    string(e.ActorRole),
				ActorID:      e.ActorID,
				Source:       e.Source,
				StatusFrom:   e.StatusFrom,
				StatusTo:     e.StatusTo,
				IPAddress:    e.IPAddress,
				Metadata:     e.Metadata,
				CreatedAt:    e.CreatedAt,
				PreviousHash: e.PreviousHash,
			},
			Hash: e.Hash,
		}
	}

	valid, failedIdx := VerifyEventChain(chainEvents)
	return valid, failedIdx, nil
}

// UpdateStateOfHealth updates SoH, appends to soh_history, and logs an immutable event
func (s *LifecycleService) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, actor, actorType, source, ip string) error {
	if soh < 0 || soh > 100 {
		return fmt.Errorf("state_of_health must be between 0 and 100")
	}

	now := time.Now()
	if err := s.repo.UpdateStateOfHealth(ctx, passportID, soh, now); err != nil {
		return err
	}

	// Append a row to soh_history so callers can query the time-series without
	// replaying the passport event log.
	if err := s.repo.AppendSoHHistory(ctx, models.SoHHistoryEntry{
		ID:         uuid.New(),
		PassportID: passportID,
		SoH:        soh,
		RecordedAt: now,
		Actor:      actor,
		ActorType:  actorType,
		Source:     source,
	}); err != nil {
		slog.Warn("Failed to append SoH history entry", "passport_id", passportID, "error", err)
	}

	previousHash := ""
	prevEvents, err := s.repo.GetPassportEvents(ctx, passportID)
	if err == nil && len(prevEvents) > 0 {
		previousHash = prevEvents[len(prevEvents)-1].Hash
	}

	event := &models.PassportEvent{
		ID:           uuid.New(),
		PassportID:   passportID,
		EventType:    models.PassportEventSOHUpdated,
		Actor:        actor,
		ActorType:    actorType,
		ActorID:      actor,
		Source:       source,
		IPAddress:    ip,
		Metadata:     map[string]interface{}{"state_of_health": soh},
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Action:       string(event.Action),
		Actor:        event.Actor,
		ActorType:    event.ActorType,
		ActorRole:    string(event.ActorRole),
		ActorID:      event.ActorID,
		Source:       event.Source,
		StatusFrom:   event.StatusFrom,
		StatusTo:     event.StatusTo,
		IPAddress:    event.IPAddress,
		Metadata:     event.Metadata,
		CreatedAt:    event.CreatedAt,
		PreviousHash: previousHash,
	}
	if hash, err := GenerateEventHash(hashData); err == nil {
		event.Hash = hash
	}

	return s.repo.CreatePassportEvent(ctx, event)
}

// GetSoHHistory returns the full SoH time-series for a passport, newest first.
func (s *LifecycleService) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	return s.repo.GetSoHHistory(ctx, passportID)
}

// LogRepairEvent appends repair event data and logs an immutable event.
func (s *LifecycleService) LogRepairEvent(ctx context.Context, passportID uuid.UUID, req RepairEventInput, actorContext models.ActorContext, ip string) error {
	if actorContext.ActorID == "" || actorContext.ActorType == "" || actorContext.ActorRole == "" || actorContext.Source == "" {
		return ErrMissingActorContext
	}
	if err := models.ValidateActorContext(actorContext); err != nil {
		return ErrInvalidActorContext
	}
	if !isAllowedMaintenanceRole(actorContext.ActorRole) {
		return ErrRoleNotAllowed
	}

	passport, err := s.repo.GetPassportByUUID(ctx, passportID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}
	if passport.Status != models.PassportStatusInService {
		return ErrActionNotAllowed
	}

	repairDate, err := parseLifecycleEventDate(req.RepairDate)
	if err != nil {
		return ErrInvalidMaintenanceEvent
	}
	technicianID := strings.TrimSpace(req.TechnicianID)
	componentRepaired := strings.TrimSpace(req.ComponentRepaired)
	repairNotes := strings.TrimSpace(req.RepairNotes)
	if technicianID == "" || componentRepaired == "" || repairNotes == "" {
		return ErrInvalidMaintenanceEvent
	}

	now := time.Now()
	payload := map[string]interface{}{
		"repair_date":        repairDate.Format(time.RFC3339),
		"timestamp":          repairDate.Format(time.RFC3339),
		"technician_id":      technicianID,
		"component_repaired": componentRepaired,
		"repair_notes":       repairNotes,
		"description":        fmt.Sprintf("%s repaired: %s", componentRepaired, repairNotes),
	}

	entryJSON, err := json.Marshal([]interface{}{payload})
	if err == nil {
		_ = s.repo.AppendRepairEvent(ctx, passportID, entryJSON)
	}

	previousHash := ""
	prevEvents, err := s.repo.GetPassportEvents(ctx, passportID)
	if err == nil && len(prevEvents) > 0 {
		previousHash = prevEvents[len(prevEvents)-1].Hash
	}

	event := &models.PassportEvent{
		ID:           uuid.New(),
		PassportID:   passportID,
		EventType:    models.PassportEventRepairLogged,
		Actor:        actorContext.ActorID,
		ActorType:    string(actorContext.ActorType),
		ActorRole:    actorContext.ActorRole,
		ActorID:      actorContext.ActorID,
		Source:       string(actorContext.Source),
		IPAddress:    ip,
		Metadata:     payload,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Action:       string(event.Action),
		Actor:        event.Actor,
		ActorType:    event.ActorType,
		ActorRole:    string(event.ActorRole),
		ActorID:      event.ActorID,
		Source:       event.Source,
		StatusFrom:   event.StatusFrom,
		StatusTo:     event.StatusTo,
		IPAddress:    event.IPAddress,
		Metadata:     event.Metadata,
		CreatedAt:    event.CreatedAt,
		PreviousHash: previousHash,
	}
	if hash, err := GenerateEventHash(hashData); err == nil {
		event.Hash = hash
	}

	return s.repo.CreatePassportEvent(ctx, event)
}

// LogReplacementEvent appends replacement event data and logs an immutable event.
func (s *LifecycleService) LogReplacementEvent(ctx context.Context, passportID uuid.UUID, req ReplacementEventInput, actorContext models.ActorContext, ip string) error {
	if actorContext.ActorID == "" || actorContext.ActorType == "" || actorContext.ActorRole == "" || actorContext.Source == "" {
		return ErrMissingActorContext
	}
	if err := models.ValidateActorContext(actorContext); err != nil {
		return ErrInvalidActorContext
	}
	if !isAllowedMaintenanceRole(actorContext.ActorRole) {
		return ErrRoleNotAllowed
	}

	passport, err := s.repo.GetPassportByUUID(ctx, passportID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}
	if passport.Status != models.PassportStatusInService {
		return ErrActionNotAllowed
	}

	replacementDate, err := parseLifecycleEventDate(req.ReplacementDate)
	if err != nil {
		return ErrInvalidMaintenanceEvent
	}
	technicianID := strings.TrimSpace(req.TechnicianID)
	componentReplaced := strings.TrimSpace(req.ComponentReplaced)
	replacementReason := strings.TrimSpace(req.ReplacementReason)
	newComponentSerial := strings.TrimSpace(req.NewComponentSerial)
	if technicianID == "" || componentReplaced == "" || replacementReason == "" {
		return ErrInvalidMaintenanceEvent
	}

	now := time.Now()
	payload := map[string]interface{}{
		"replacement_date":   replacementDate.Format(time.RFC3339),
		"timestamp":          replacementDate.Format(time.RFC3339),
		"technician_id":      technicianID,
		"component_replaced": componentReplaced,
		"replacement_reason": replacementReason,
		"description":        fmt.Sprintf("%s replaced: %s", componentReplaced, replacementReason),
	}
	if newComponentSerial != "" {
		payload["new_component_serial"] = newComponentSerial
	}

	entryJSON, err := json.Marshal([]interface{}{payload})
	if err == nil {
		_ = s.repo.AppendReplacementEvent(ctx, passportID, entryJSON)
	}

	previousHash := ""
	prevEvents, err := s.repo.GetPassportEvents(ctx, passportID)
	if err == nil && len(prevEvents) > 0 {
		previousHash = prevEvents[len(prevEvents)-1].Hash
	}

	event := &models.PassportEvent{
		ID:           uuid.New(),
		PassportID:   passportID,
		EventType:    models.PassportEventReplaceLogged,
		Actor:        actorContext.ActorID,
		ActorType:    string(actorContext.ActorType),
		ActorRole:    actorContext.ActorRole,
		ActorID:      actorContext.ActorID,
		Source:       string(actorContext.Source),
		IPAddress:    ip,
		Metadata:     payload,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Action:       string(event.Action),
		Actor:        event.Actor,
		ActorType:    event.ActorType,
		ActorRole:    string(event.ActorRole),
		ActorID:      event.ActorID,
		Source:       event.Source,
		StatusFrom:   event.StatusFrom,
		StatusTo:     event.StatusTo,
		IPAddress:    event.IPAddress,
		Metadata:     event.Metadata,
		CreatedAt:    event.CreatedAt,
		PreviousHash: previousHash,
	}
	if hash, err := GenerateEventHash(hashData); err == nil {
		event.Hash = hash
	}

	return s.repo.CreatePassportEvent(ctx, event)
}
