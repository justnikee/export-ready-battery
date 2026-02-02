package services

import (
	"context"
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
	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["previous_status"] = previousStatus
	metadata["new_status"] = req.ToStatus

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

	return nil
}

// CreateLifecycleEvents creates genesis events for newly created passports
func (s *LifecycleService) CreateLifecycleEvents(ctx context.Context, passports []*models.Passport, eventType string, actor string) error {
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
