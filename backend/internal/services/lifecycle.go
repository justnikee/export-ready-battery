package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
)

// LifecycleService handles passport lifecycle transitions and event logging
type LifecycleService struct {
	repo *repository.Repository
}

// NewLifecycleService creates a new lifecycle service
func NewLifecycleService(repo *repository.Repository) *LifecycleService {
	return &LifecycleService{repo: repo}
}

// TransitionRequest represents a request to transition a passport's status
type TransitionRequest struct {
	PassportID uuid.UUID              `json:"passport_id"`
	ToStatus   string                 `json:"to_status"`
	Actor      string                 `json:"actor"`                // Who is making this change: user email, system, API key name
	ActorRole  string                 `json:"actor_role,omitempty"` // Role: MANUFACTURER, LOGISTICS, TECHNICIAN, RECYCLER
	ActorType  string                 `json:"actor_type,omitempty"` // SYSTEM | USER | PARTNER
	ActorID    string                 `json:"actor_identifier,omitempty"`
	Source     string                 `json:"source,omitempty"` // INTERNAL | MAGIC_LINK | API
	IPAddress  string                 `json:"ip_address,omitempty"`
	// Optional owner identifier (email or external ID)
	CurrentOwnerIdentifier string                 `json:"current_owner_identifier,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`   // Additional context: "carrier": "FedEx", "mechanic": "John Doe"
}

// TransitionResult contains the result of a status transition
type TransitionResult struct {
	Success        bool             `json:"success"`
	Passport       *models.Passport `json:"passport,omitempty"`
	PreviousStatus string           `json:"previous_status"`
	NewStatus      string           `json:"new_status"`
	EventID        uuid.UUID        `json:"event_id"`
	Error          string           `json:"error,omitempty"`
}

// TransitionPassport handles a single passport status transition with validation and event logging
func (s *LifecycleService) TransitionPassport(ctx context.Context, req TransitionRequest) (*TransitionResult, error) {
	// Get current passport
	passport, err := s.repo.GetPassportByUUID(ctx, req.PassportID)
	if err != nil {
		return &TransitionResult{
			Success: false,
			Error:   "Passport not found",
		}, err
	}

	previousStatus := passport.Status

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	// Normalize actor metadata
	if req.Source == "" {
		req.Source = "INTERNAL"
	}
	if req.ActorType == "" {
		if req.Source == "MAGIC_LINK" {
			req.ActorType = "PARTNER"
		} else if req.Actor == "system" || req.Actor == "" {
			req.ActorType = "SYSTEM"
		} else {
			req.ActorType = "USER"
		}
	}
	if req.ActorID == "" {
		req.ActorID = req.Actor
	}

	// Validate transition is allowed by state machine
	if !models.IsValidTransition(previousStatus, req.ToStatus) {
		allowed := models.GetAllowedTransitions(previousStatus)
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Error:          fmt.Sprintf("Invalid transition from %s to %s. Allowed: %v", previousStatus, req.ToStatus, allowed),
		}, errors.New("invalid status transition")
	}

	// Validate role-based permission (if ActorRole is provided)
	if req.ActorRole != "" && req.ActorRole != "MANUFACTURER" {
		// Non-manufacturers must have specific permission for this transition
		if !models.IsValidRoleTransition(req.ActorRole, previousStatus, req.ToStatus) {
			return &TransitionResult{
				Success:        false,
				PreviousStatus: previousStatus,
				Error:          fmt.Sprintf("Role %s is not permitted to transition from %s to %s", req.ActorRole, previousStatus, req.ToStatus),
			}, errors.New("role not permitted for this transition")
		}
	}

	// Set appropriate timestamp based on target status
	now := time.Now()
	switch req.ToStatus {
	case models.PassportStatusShipped:
		passport.ShippedAt = &now
	case models.PassportStatusInService:
		passport.InstalledAt = &now
	case models.PassportStatusReturned:
		passport.ReturnedAt = &now
	}

	// India-specific: enforce recycler EPR ID for RECYCLED status
	if req.ToStatus == models.PassportStatusRecycled {
		region, regionErr := s.repo.GetBatchMarketRegion(ctx, passport.BatchID)
		if regionErr == nil && (region == models.MarketRegionIndia || region == models.MarketRegionGlobal) {
			recyclerEprID, _ := metadata["recycler_epr_id"].(string)
			if recyclerEprID == "" {
				return &TransitionResult{
					Success:        false,
					PreviousStatus: previousStatus,
					Error:          "recycler_epr_id is required to close recycling (India compliance)",
				}, errors.New("missing recycler_epr_id")
			}
			// Update recycling fields on passport
			if err := s.repo.SetRecyclingInfo(ctx, passport.UUID, "RECYCLED", recyclerEprID, now); err != nil {
				return &TransitionResult{
					Success:        false,
					PreviousStatus: previousStatus,
					Error:          "Failed to update recycling info",
				}, err
			}
		}
	}

	// Update passport status
	passport.Status = req.ToStatus
	if err := s.repo.UpdatePassportStatus(ctx, passport.UUID, req.ToStatus); err != nil {
		return &TransitionResult{
			Success:        false,
			PreviousStatus: previousStatus,
			Error:          "Failed to update passport status",
		}, err
	}

	// Log the event
	eventType := s.getEventTypeForStatus(req.ToStatus)
	metadata["previous_status"] = previousStatus
	metadata["new_status"] = req.ToStatus
	if req.CurrentOwnerIdentifier != "" {
		metadata["current_owner_identifier"] = req.CurrentOwnerIdentifier
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
		Actor:        req.Actor,
		ActorType:    req.ActorType,
		ActorID:      req.ActorID,
		Source:       req.Source,
		StatusFrom:   previousStatus,
		StatusTo:     req.ToStatus,
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
		Actor:        event.Actor,
		ActorType:    event.ActorType,
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

	if err := s.repo.CreatePassportEvent(ctx, event); err != nil {
		// Log but don't fail the transition
		fmt.Printf("Warning: Failed to log passport event: %v\n", err)
	}

	// Update current owner identifier if provided
	if req.CurrentOwnerIdentifier != "" {
		_ = s.repo.UpdatePassportOwner(ctx, passport.UUID, req.CurrentOwnerIdentifier)
		entry := map[string]interface{}{
			"current_owner_identifier": req.CurrentOwnerIdentifier,
			"timestamp":                now,
			"actor":                    req.Actor,
			"source":                   req.Source,
		}
		if entryJSON, err := json.Marshal([]interface{}{entry}); err == nil {
			_ = s.repo.AppendOwnershipHistory(ctx, passport.UUID, entryJSON)
		}
	}

	return &TransitionResult{
		Success:        true,
		Passport:       passport,
		PreviousStatus: previousStatus,
		NewStatus:      req.ToStatus,
		EventID:        event.ID,
	}, nil
}

// GetPassportForTransition retrieves a passport for transition validation
func (s *LifecycleService) GetPassportForTransition(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	return s.repo.GetPassportByUUID(ctx, passportID)
}

// BulkTransitionRequest represents a request to transition multiple passports
type BulkTransitionRequest struct {
	PassportIDs []uuid.UUID            `json:"passport_ids"`
	ToStatus    string                 `json:"to_status"`
	Actor       string                 `json:"actor"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// BulkTransitionResult contains results for bulk transitions
type BulkTransitionResult struct {
	Total     int      `json:"total"`
	Succeeded int      `json:"succeeded"`
	Failed    int      `json:"failed"`
	FailedIDs []string `json:"failed_ids,omitempty"`
	Errors    []string `json:"errors,omitempty"`
}

// BulkTransitionPassports handles bulk passport status transitions with validation
func (s *LifecycleService) BulkTransitionPassports(ctx context.Context, req BulkTransitionRequest) (*BulkTransitionResult, error) {
	result := &BulkTransitionResult{
		Total:     len(req.PassportIDs),
		FailedIDs: []string{},
		Errors:    []string{},
	}

	for _, passportID := range req.PassportIDs {
		transitionReq := TransitionRequest{
			PassportID: passportID,
			ToStatus:   req.ToStatus,
			Actor:      req.Actor,
			Metadata:   req.Metadata,
		}

		transitionResult, err := s.TransitionPassport(ctx, transitionReq)
		if err != nil || !transitionResult.Success {
			result.Failed++
			result.FailedIDs = append(result.FailedIDs, passportID.String())
			if transitionResult != nil {
				result.Errors = append(result.Errors, transitionResult.Error)
			} else {
				result.Errors = append(result.Errors, err.Error())
			}
		} else {
			result.Succeeded++
		}
	}

	return result, nil
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
	case models.PassportStatusReturned:
		return models.PassportEventReturned
	case models.PassportStatusReturnRequested:
		return "RETURN_REQUESTED" // Should align with a constant, but string literal for now or add const
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

// TransferPassport handles ownership transfer with audit logging
func (s *LifecycleService) TransferPassport(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID, actor string) error {
	// Get current passport to log previous owner
	passport, err := s.repo.GetPassportByUUID(ctx, passportID)
	if err != nil {
		return fmt.Errorf("passport not found: %w", err)
	}

	// Store previous owner for audit
	var previousOwnerID string
	if passport.OwnerID != nil {
		previousOwnerID = passport.OwnerID.String()
	}

	// Update owner in DB
	if err := s.repo.UpdatePassportOwnerID(ctx, passportID, newOwnerID); err != nil {
		return fmt.Errorf("failed to update owner: %w", err)
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
		Actor:        event.Actor,
		ActorType:    event.ActorType,
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

	if err := s.repo.CreatePassportEvent(ctx, event); err != nil {
		return fmt.Errorf("failed to log transfer event: %w", err)
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

// CreateLifecycleEvents creates genesis events for newly created passports
func (s *LifecycleService) CreateLifecycleEvents(ctx context.Context, passports []*models.Passport, eventType, actor, actorType, source string) error {
	if len(passports) == 0 {
		return nil
	}

	events := make([]*models.PassportEvent, len(passports))

	for i, p := range passports {
		// Genesis events have no previous hash (they are the first in the chain)
		previousHash := ""

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
			Actor:        event.Actor,
			ActorType:    event.ActorType,
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
			return fmt.Errorf("failed to generate hash for passport %s: %w", p.SerialNumber, err)
		}
		event.Hash = hash

		events[i] = event
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
				Actor:        e.Actor,
				ActorType:    e.ActorType,
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

// UpdateStateOfHealth updates SoH and logs an immutable event
func (s *LifecycleService) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, actor, actorType, source, ip string) error {
	if soh < 0 || soh > 100 {
		return fmt.Errorf("state_of_health must be between 0 and 100")
	}

	now := time.Now()
	if err := s.repo.UpdateStateOfHealth(ctx, passportID, soh, now); err != nil {
		return err
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
		Actor:        event.Actor,
		ActorType:    event.ActorType,
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

// LogRepairEvent appends repair event data and logs an immutable event
func (s *LifecycleService) LogRepairEvent(ctx context.Context, passportID uuid.UUID, payload map[string]interface{}, actor, actorType, source, ip string) error {
	now := time.Now()
	if payload == nil {
		payload = map[string]interface{}{}
	}
	payload["timestamp"] = now

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
		Actor:        actor,
		ActorType:    actorType,
		ActorID:      actor,
		Source:       source,
		IPAddress:    ip,
		Metadata:     payload,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Actor:        event.Actor,
		ActorType:    event.ActorType,
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

// LogReplacementEvent appends replacement event data and logs an immutable event
func (s *LifecycleService) LogReplacementEvent(ctx context.Context, passportID uuid.UUID, payload map[string]interface{}, actor, actorType, source, ip string) error {
	now := time.Now()
	if payload == nil {
		payload = map[string]interface{}{}
	}
	payload["timestamp"] = now

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
		Actor:        actor,
		ActorType:    actorType,
		ActorID:      actor,
		Source:       source,
		IPAddress:    ip,
		Metadata:     payload,
		CreatedAt:    now,
		PreviousHash: previousHash,
	}

	hashData := EventHashData{
		ID:           event.ID,
		PassportID:   event.PassportID,
		EventType:    event.EventType,
		Actor:        event.Actor,
		ActorType:    event.ActorType,
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
