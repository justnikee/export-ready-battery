package services

import (
	"context"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

type fakeTelemetryRepo struct {
	passport *models.Passport
	history  []models.SoHHistoryEntry
}

func (f *fakeTelemetryRepo) InsertTelemetry(ctx context.Context, reading *repository.TelemetryReading) error {
	return nil
}
func (f *fakeTelemetryRepo) UpdatePassportDynamicFields(ctx context.Context, passportID uuid.UUID, soh *float64, cycleCount *int, temp *float64, voltage *float64, thermalIncrement int, recordedAt time.Time) error {
	return nil
}
func (f *fakeTelemetryRepo) GetTelemetryHistory(ctx context.Context, passportID uuid.UUID, limit, offset int, from, to *time.Time) ([]*repository.TelemetryReading, int, error) {
	return nil, 0, nil
}
func (f *fakeTelemetryRepo) GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	return f.passport, nil
}
func (f *fakeTelemetryRepo) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	return nil
}
func (f *fakeTelemetryRepo) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	f.history = append(f.history, entry)
	return nil
}

func TestIngest_AppendsSoHHistory(t *testing.T) {
	soh := 94.5
	passportID := uuid.New()
	deviceID := uuid.New()
	repo := &fakeTelemetryRepo{
		passport: &models.Passport{UUID: passportID, StateOfHealth: floatPtr(100)},
	}
	svc := NewTelemetryService(repo)

	_, err := svc.Ingest(context.Background(), IngestRequest{
		PassportID:    passportID,
		StateOfHealth: &soh,
		RecordedAt:    time.Now().UTC(),
		Source:        "bms-1",
	}, deviceID)
	if err != nil {
		t.Fatalf("Ingest: %v", err)
	}
	if len(repo.history) != 1 {
		t.Fatalf("expected 1 soh_history row, got %d", len(repo.history))
	}
	got := repo.history[0]
	if got.SoH != soh {
		t.Errorf("soh = %v, want %v", got.SoH, soh)
	}
	if got.ActorType != "DEVICE" || got.Source != "TELEMETRY" {
		t.Errorf("actor/source = %s/%s", got.ActorType, got.Source)
	}
	if got.PassportID != passportID {
		t.Errorf("passport_id = %s, want %s", got.PassportID, passportID)
	}
}

func TestIngest_RejectsOutOfRangeSoH(t *testing.T) {
	bad := 140.0
	repo := &fakeTelemetryRepo{passport: &models.Passport{UUID: uuid.New()}}
	svc := NewTelemetryService(repo)
	_, err := svc.Ingest(context.Background(), IngestRequest{
		PassportID:    repo.passport.UUID,
		StateOfHealth: &bad,
		RecordedAt:    time.Now().UTC(),
	}, uuid.New())
	if err == nil {
		t.Fatal("expected range error")
	}
	if len(repo.history) != 0 {
		t.Fatal("must not append history for invalid SoH")
	}
}

func floatPtr(v float64) *float64 { return &v }
