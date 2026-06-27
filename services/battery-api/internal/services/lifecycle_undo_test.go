package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestUndoTransition_HappyPath_RevertsAndChainStaysValid(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusCreated)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionActivate),
		ActorContext: systemActor(), ReasonCode: "BATCH_QC_PASS",
	}); err != nil {
		t.Fatalf("ACTIVATE failed: %v", err)
	}
	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}
	if passport.Status != models.PassportStatusShipped {
		t.Fatalf("expected SHIPPED before undo, got %s", passport.Status)
	}

	result, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "Scanned wrong batch, reverting shipment")
	if err != nil {
		t.Fatalf("UndoTransition failed: %v", err)
	}
	if !result.Success {
		t.Fatalf("expected success, got %+v", result)
	}
	if result.NewStatus != models.PassportStatusActive {
		t.Fatalf("expected reverted status ACTIVE, got %s", result.NewStatus)
	}
	if passport.Status != models.PassportStatusActive {
		t.Fatalf("expected passport.Status ACTIVE after undo, got %s", passport.Status)
	}

	events := repo.events[passport.UUID]
	if len(events) != 3 {
		t.Fatalf("expected 3 events (ACTIVATE, SHIP, REVERSE_TRANSITION), got %d", len(events))
	}
	last := events[len(events)-1]
	if last.EventType != models.PassportEventReverseTransition {
		t.Fatalf("expected last event type REVERSE_TRANSITION, got %s", last.EventType)
	}
	if last.StatusFrom != models.PassportStatusShipped || last.StatusTo != models.PassportStatusActive {
		t.Fatalf("expected reverse event SHIPPED->ACTIVE, got %s->%s", last.StatusFrom, last.StatusTo)
	}

	// The reversed event must still be present, untouched — undo never deletes history.
	shipEvent := events[1]
	if shipEvent.EventType != models.PassportEventShipped {
		t.Fatalf("expected original SHIP event to remain in history, got %s", shipEvent.EventType)
	}

	valid, failedIdx, err := svc.VerifyPassportAuditChain(ctx, passport.UUID)
	if err != nil {
		t.Fatalf("VerifyPassportAuditChain error: %v", err)
	}
	if !valid {
		t.Fatalf("expected valid chain after undo, failed at index %d", failedIdx)
	}
}

func TestUndoTransition_RejectsNonAdmin(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusActive)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}

	_, err := svc.UndoTransition(ctx, passport.UUID, operatorActor(), "trying to undo as non-admin")
	if !errors.Is(err, ErrUndoNotAdmin) {
		t.Fatalf("expected ErrUndoNotAdmin, got %v", err)
	}
}

func TestUndoTransition_RequiresAdminNote(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusActive)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}

	_, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "   ")
	if !errors.Is(err, ErrUndoNoteRequired) {
		t.Fatalf("expected ErrUndoNoteRequired, got %v", err)
	}
}

func TestUndoTransition_RejectsAfterWindowExpired(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusActive)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}

	// Backdate the SHIP event past the 30-minute grace window.
	events := repo.events[passport.UUID]
	events[len(events)-1].CreatedAt = time.Now().Add(-31 * time.Minute)

	_, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "too late, should be rejected")
	if !errors.Is(err, ErrUndoWindowExpired) {
		t.Fatalf("expected ErrUndoWindowExpired, got %v", err)
	}
}

func TestUndoTransition_NoTransitionToUndo(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusCreated)

	_, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "nothing happened yet")
	if !errors.Is(err, ErrUndoNoTransition) {
		t.Fatalf("expected ErrUndoNoTransition, got %v", err)
	}
}

func TestUndoTransition_RejectsWhenStatusChangedSinceTransition(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusActive)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}

	// Simulate something else changing the passport's status after the SHIP
	// event was recorded (e.g. a direct DB fix) — undo must refuse rather
	// than silently clobber whatever state it's actually in now.
	passport.Status = models.PassportStatusRecalled

	_, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "status drifted, should be rejected")
	if !errors.Is(err, ErrUndoStatusChanged) {
		t.Fatalf("expected ErrUndoStatusChanged, got %v", err)
	}
}

func TestUndoTransition_PreviousHashChainsOffLastEvent(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	ctx := context.Background()
	passport := insertPassportChain(repo, models.PassportStatusActive)

	if _, err := svc.ApplyTransition(ctx, TransitionRequest{
		PassportID: passport.UUID, Action: string(models.ActionShip),
		ActorContext: operatorActor(), Evidence: shipEvidence(),
	}); err != nil {
		t.Fatalf("SHIP failed: %v", err)
	}
	shipHash := repo.events[passport.UUID][0].Hash

	result, err := svc.UndoTransition(ctx, passport.UUID, adminActor(), "verify hash chaining")
	if err != nil {
		t.Fatalf("UndoTransition failed: %v", err)
	}

	events := repo.events[passport.UUID]
	reverseEvent := events[len(events)-1]
	if reverseEvent.ID != result.EventID {
		t.Fatalf("result.EventID doesn't match the appended event")
	}
	if reverseEvent.PreviousHash != shipHash {
		t.Fatalf("expected reverse event's PreviousHash to chain off the SHIP event's hash")
	}
}
