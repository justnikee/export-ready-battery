package services

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

func makeTestPassport(serial string) *models.Passport {
	return &models.Passport{
		UUID:         uuid.New(),
		SerialNumber: serial,
	}
}

func makeTestEvent(action models.TransitionAction, statusTo string) *models.PassportEvent {
	return &models.PassportEvent{
		ID:        uuid.New(),
		Action:    action,
		Actor:     "owner@example.com",
		ActorRole: models.ActorRoleInternalOperator,
		StatusTo:  statusTo,
		CreatedAt: time.Now(),
	}
}

func TestBuildEPCISDocument_SinglePassport(t *testing.T) {
	passport := makeTestPassport("IN-TEN-LFP-2026-00001")
	events := []*models.PassportEvent{
		makeTestEvent(models.ActionActivate, models.PassportStatusActive),
		makeTestEvent(models.ActionShip, models.PassportStatusShipped),
	}

	doc := BuildEPCISDocument(passport.UUID, passport, events)

	if doc.Type != "EPCISDocument" {
		t.Fatalf("expected type EPCISDocument, got %s", doc.Type)
	}
	if len(doc.EPCISBody.EventList) != 2 {
		t.Fatalf("expected 2 events, got %d", len(doc.EPCISBody.EventList))
	}
	wantEPC := "urn:epc:id:giai:IN-TEN-LFP-2026-00001"
	for _, ev := range doc.EPCISBody.EventList {
		if len(ev.EPCList) != 1 || ev.EPCList[0] != wantEPC {
			t.Errorf("expected EPCList %v, got %v", []string{wantEPC}, ev.EPCList)
		}
	}
}

func TestBuildEPCISDocument_SkipsEventsWithoutAction(t *testing.T) {
	passport := makeTestPassport("IN-TEN-LFP-2026-00002")
	events := []*models.PassportEvent{
		{ID: uuid.New(), Action: "", CreatedAt: time.Now()}, // e.g. a SCANNED event, not a transition
		makeTestEvent(models.ActionActivate, models.PassportStatusActive),
	}

	doc := BuildEPCISDocument(passport.UUID, passport, events)

	if len(doc.EPCISBody.EventList) != 1 {
		t.Fatalf("expected non-transition events to be skipped, got %d events", len(doc.EPCISBody.EventList))
	}
}

func TestBuildBulkEPCISDocument_CombinesMultiplePassports(t *testing.T) {
	passportA := makeTestPassport("IN-TEN-LFP-2026-00001")
	passportB := makeTestPassport("IN-TEN-LFP-2026-00002")

	eventsByPassport := map[uuid.UUID][]*models.PassportEvent{
		passportA.UUID: {
			makeTestEvent(models.ActionActivate, models.PassportStatusActive),
			makeTestEvent(models.ActionShip, models.PassportStatusShipped),
		},
		passportB.UUID: {
			makeTestEvent(models.ActionActivate, models.PassportStatusActive),
		},
	}

	doc := BuildBulkEPCISDocument([]*models.Passport{passportA, passportB}, eventsByPassport)

	if len(doc.EPCISBody.EventList) != 3 {
		t.Fatalf("expected 3 combined events across both passports, got %d", len(doc.EPCISBody.EventList))
	}

	epcSet := make(map[string]int)
	for _, ev := range doc.EPCISBody.EventList {
		for _, epc := range ev.EPCList {
			epcSet[epc]++
		}
	}
	if epcSet["urn:epc:id:giai:IN-TEN-LFP-2026-00001"] != 2 {
		t.Errorf("expected 2 events for passport A, got %d", epcSet["urn:epc:id:giai:IN-TEN-LFP-2026-00001"])
	}
	if epcSet["urn:epc:id:giai:IN-TEN-LFP-2026-00002"] != 1 {
		t.Errorf("expected 1 event for passport B, got %d", epcSet["urn:epc:id:giai:IN-TEN-LFP-2026-00002"])
	}
}

func TestBuildBulkEPCISDocument_PassportWithNoEvents(t *testing.T) {
	passportA := makeTestPassport("IN-TEN-LFP-2026-00003")
	// No entry in eventsByPassport for this passport's UUID at all.
	doc := BuildBulkEPCISDocument([]*models.Passport{passportA}, map[uuid.UUID][]*models.PassportEvent{})

	if len(doc.EPCISBody.EventList) != 0 {
		t.Fatalf("expected 0 events for a passport with no events, got %d", len(doc.EPCISBody.EventList))
	}
}
