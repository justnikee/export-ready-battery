package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
)

var (
	ErrPassportNotFound   = errors.New("passport not found")
	ErrInvalidTelemetry   = errors.New("telemetry reading must include at least one measurement")
	ErrRecordedAtInFuture = errors.New("recorded_at cannot be in the future")
)

// TelemetryRepository defines the data access required for telemetry operations
type TelemetryRepository interface {
	InsertTelemetry(ctx context.Context, reading *repository.TelemetryReading) error
	UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error
	GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*repository.TelemetryReading, int, error)
	GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error)
	CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error
}

// TelemetryService handles BMS telemetry ingestion and auto-event generation
type TelemetryService struct {
	repo TelemetryRepository
}

// NewTelemetryService creates a new telemetry service
func NewTelemetryService(repo TelemetryRepository) *TelemetryService {
	return &TelemetryService{repo: repo}
}

// IngestRequest represents a single telemetry reading from a BMS device
type IngestRequest struct {
	PassportID    uuid.UUID `json:"passport_id"`
	StateOfHealth *float64  `json:"state_of_health,omitempty"` // 0-100 %
	CycleCount    *int      `json:"cycle_count,omitempty"`
	Temperature   *float64  `json:"temperature,omitempty"` // Celsius
	Voltage       *float64  `json:"voltage,omitempty"`     // Volts
	Current       *float64  `json:"current,omitempty"`     // Amps
	ThermalEvent  bool      `json:"thermal_event"`
	ThermalType   string    `json:"thermal_type,omitempty"` // OVERHEAT, THERMAL_RUNAWAY_WARNING, COOLING_FAILURE
	Source        string    `json:"source,omitempty"`       // Device/firmware identifier
	RecordedAt    time.Time `json:"recorded_at"`            // When reading was taken
}

// IngestResult contains the result of ingesting a telemetry reading
type IngestResult struct {
	ReadingID     uuid.UUID `json:"reading_id"`
	PassportID    uuid.UUID `json:"passport_id"`
	EventsCreated []string  `json:"events_created,omitempty"` // Auto-generated event types
}

// BatchIngestRequest represents multiple telemetry readings
type BatchIngestRequest struct {
	Readings []IngestRequest `json:"readings"`
}

// BatchIngestResult contains the results of batch ingestion
type BatchIngestResult struct {
	Accepted int             `json:"accepted"`
	Rejected int             `json:"rejected"`
	Results  []*IngestResult `json:"results"`
	Errors   []string        `json:"errors,omitempty"`
}

// Ingest validates, stores, and auto-generates lifecycle events for a single telemetry reading
func (s *TelemetryService) Ingest(ctx context.Context, req IngestRequest, deviceTokenID uuid.UUID) (*IngestResult, error) {
	// Validate: at least one measurement must be present
	if req.StateOfHealth == nil && req.CycleCount == nil && req.Temperature == nil &&
		req.Voltage == nil && req.Current == nil && !req.ThermalEvent {
		return nil, ErrInvalidTelemetry
	}

	// Validate recorded_at not in the future (allow 5 min clock skew)
	if req.RecordedAt.After(time.Now().UTC().Add(5 * time.Minute)) {
		return nil, ErrRecordedAtInFuture
	}

	// Verify passport exists
	passport, err := s.repo.GetPassportByUUID(ctx, req.PassportID)
	if err != nil {
		return nil, fmt.Errorf("failed to look up passport: %w", err)
	}
	if passport == nil {
		return nil, ErrPassportNotFound
	}

	// Store the reading
	readingID := uuid.New()
	reading := &repository.TelemetryReading{
		ID:            readingID,
		PassportID:    req.PassportID,
		DeviceTokenID: deviceTokenID,
		StateOfHealth: req.StateOfHealth,
		CycleCount:    req.CycleCount,
		Temperature:   req.Temperature,
		Voltage:       req.Voltage,
		Current:       req.Current,
		ThermalEvent:  req.ThermalEvent,
		ThermalType:   req.ThermalType,
		Source:        req.Source,
		RecordedAt:    req.RecordedAt,
		CreatedAt:     time.Now().UTC(),
	}

	if err := s.repo.InsertTelemetry(ctx, reading); err != nil {
		return nil, fmt.Errorf("failed to store telemetry reading: %w", err)
	}

	// Update passport summary fields
	thermalIncrement := 0
	if req.ThermalEvent {
		thermalIncrement = 1
	}
	if err := s.repo.UpdatePassportDynamicFields(ctx, req.PassportID,
		req.StateOfHealth, req.CycleCount, req.Temperature, req.Voltage,
		thermalIncrement, req.RecordedAt,
	); err != nil {
		slog.Warn("Failed to update passport dynamic fields", "passport_id", req.PassportID, "error", err)
	}

	// Auto-generate lifecycle events
	result := &IngestResult{
		ReadingID:  readingID,
		PassportID: req.PassportID,
	}

	autoEvents := s.generateAutoEvents(ctx, passport, req)
	for _, event := range autoEvents {
		if err := s.repo.CreatePassportEvent(ctx, event); err != nil {
			slog.Warn("Failed to create auto-event", "event_type", event.EventType, "passport_id", req.PassportID, "error", err)
		} else {
			result.EventsCreated = append(result.EventsCreated, event.EventType)
		}
	}

	return result, nil
}

// IngestBatch processes multiple telemetry readings
func (s *TelemetryService) IngestBatch(ctx context.Context, req BatchIngestRequest, deviceTokenID uuid.UUID) *BatchIngestResult {
	result := &BatchIngestResult{}

	for i, reading := range req.Readings {
		res, err := s.Ingest(ctx, reading, deviceTokenID)
		if err != nil {
			result.Rejected++
			result.Errors = append(result.Errors, fmt.Sprintf("reading[%d]: %s", i, err.Error()))
		} else {
			result.Accepted++
			result.Results = append(result.Results, res)
		}
	}
	return result
}

// GetHistory retrieves paginated telemetry history for a passport
func (s *TelemetryService) GetHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*repository.TelemetryReading, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.GetTelemetryHistory(ctx, passportID, limit, offset, from, to)
}

// generateAutoEvents creates lifecycle events based on telemetry thresholds
func (s *TelemetryService) generateAutoEvents(ctx context.Context, passport *models.Passport, req IngestRequest) []*models.PassportEvent {
	var events []*models.PassportEvent
	now := time.Now().UTC()

	// SOH_DEGRADATION_WARNING when SoH drops below 80%
	if req.StateOfHealth != nil && *req.StateOfHealth < 80 && *req.StateOfHealth >= 50 {
		// Only generate if passport's previous SoH was >= 80 (avoid duplicate warnings)
		if passport.StateOfHealth == nil || *passport.StateOfHealth >= 80 {
			metadata := map[string]interface{}{
				"state_of_health": *req.StateOfHealth,
				"threshold":       80,
				"source":          "telemetry_auto",
			}
			events = append(events, s.buildEvent(req.PassportID, "SOH_DEGRADATION_WARNING", metadata, now))
		}
	}

	// SOH_CRITICAL when SoH drops below 50%
	if req.StateOfHealth != nil && *req.StateOfHealth < 50 {
		if passport.StateOfHealth == nil || *passport.StateOfHealth >= 50 {
			metadata := map[string]interface{}{
				"state_of_health": *req.StateOfHealth,
				"threshold":       50,
				"source":          "telemetry_auto",
			}
			events = append(events, s.buildEvent(req.PassportID, "SOH_CRITICAL", metadata, now))
		}
	}

	// THERMAL_EVENT on any thermal event
	if req.ThermalEvent {
		metadata := map[string]interface{}{
			"thermal_type": req.ThermalType,
			"temperature":  req.Temperature,
			"source":       "telemetry_auto",
		}
		events = append(events, s.buildEvent(req.PassportID, "THERMAL_EVENT", metadata, now))
	}

	// CYCLE_MILESTONE every 100 cycles
	if req.CycleCount != nil {
		currentCycles := 0
		if passport.CycleCount != nil {
			currentCycles = *passport.CycleCount
		}
		newCycles := *req.CycleCount
		// Check if we crossed a 100-cycle boundary
		if newCycles/100 > currentCycles/100 {
			milestone := (newCycles / 100) * 100
			metadata := map[string]interface{}{
				"cycle_count": newCycles,
				"milestone":   milestone,
				"source":      "telemetry_auto",
			}
			events = append(events, s.buildEvent(req.PassportID, "CYCLE_MILESTONE", metadata, now))
		}
	}

	return events
}

// buildEvent constructs a PassportEvent for auto-generated telemetry events
func (s *TelemetryService) buildEvent(passportID uuid.UUID, eventType string, metadata map[string]interface{}, now time.Time) *models.PassportEvent {
	metadataJSON, _ := json.Marshal(metadata)
	var metadataMap map[string]interface{}
	_ = json.Unmarshal(metadataJSON, &metadataMap)

	return &models.PassportEvent{
		ID:         uuid.New(),
		PassportID: passportID,
		EventType:  eventType,
		Actor:      "system",
		ActorType:  "bms_telemetry",
		Source:     "TELEMETRY",
		Metadata:   metadataMap,
		CreatedAt:  now,
	}
}
