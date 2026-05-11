package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
)

// ============================================================================
// chainTestRepo — fakeLifecycleRepo variant that stores events for audit chain
// tests. GetPassportEvents returns stored events in insertion order.
// ============================================================================

type chainTestRepo struct {
	fakeLifecycleRepo
	events map[uuid.UUID][]*models.PassportEvent
}

func newChainTestRepo() *chainTestRepo {
	return &chainTestRepo{
		fakeLifecycleRepo: *newFakeLifecycleRepo(),
		events:            make(map[uuid.UUID][]*models.PassportEvent),
	}
}

func (c *chainTestRepo) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	if err := c.fakeLifecycleRepo.ApplyLifecycleTransition(ctx, params); err != nil {
		return err
	}
	if params.Event != nil {
		c.events[params.PassportID] = append(c.events[params.PassportID], params.Event)
	}
	return nil
}

func (c *chainTestRepo) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	return c.events[passportID], nil
}

// ============================================================================
// Actor helpers
// ============================================================================

func systemActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypeSystem,
		ActorID:   "system",
		ActorRole: models.ActorRoleSystem,
		Source:    models.ActionSourceInternal,
	}
}

func operatorActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   "op1",
		ActorRole: models.ActorRoleInternalOperator,
		Source:    models.ActionSourceInternal,
	}
}

func logisticsActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypePartner,
		ActorID:   "logistics1",
		ActorRole: models.ActorRoleLogistics,
		Source:    models.ActionSourceMagicLink,
	}
}

func technicianActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypePartner,
		ActorID:   "tech1",
		ActorRole: models.ActorRoleTechnician,
		Source:    models.ActionSourceMagicLink,
	}
}

func recyclerActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypePartner,
		ActorID:   "recycler1",
		ActorRole: models.ActorRoleRecycler,
		Source:    models.ActionSourceMagicLink,
	}
}

func adminActor() models.ActorContext {
	return models.ActorContext{
		ActorType: models.ActorTypeUser,
		ActorID:   "admin1",
		ActorRole: models.ActorRoleAdmin,
		Source:    models.ActionSourceInternal,
	}
}

// ============================================================================
// Evidence helpers
// ============================================================================

func shipEvidence() models.Evidence {
	return models.Evidence{
		models.EvidenceShipmentReference: "SHIP-2026-001",
		models.EvidenceShipmentDate:      "2026-03-01",
	}
}

func installEvidence() models.Evidence {
	return models.Evidence{
		models.EvidenceInstallationDate: "2026-04-01",
		models.EvidenceInstallerID:      "installer-abc",
	}
}

func recycleEvidence() models.Evidence {
	return models.Evidence{
		models.EvidenceRecyclerEprID:        "EPR/REC/2024/001",
		models.EvidenceRecyclingDate:        "2026-06-01",
		models.EvidenceCertificateReference: "CERT-REC-001",
	}
}

func closeEvidence() models.Evidence {
	return models.Evidence{
		models.EvidenceCertificateReference: "CERT-CLOSE-001",
	}
}

func recallEvidence() models.Evidence {
	return models.Evidence{
		models.EvidenceRecallReason:    "Safety defect in cell group 3",
		models.EvidenceRecallReference: "RECALL-2026-007",
	}
}

// ============================================================================
// passport factory — inserts a passport with given status into the repo
// ============================================================================

func insertPassport(repo *fakeLifecycleRepo, status string) *models.Passport {
	p := &models.Passport{
		UUID:    uuid.New(),
		BatchID: uuid.New(),
		Status:  status,
	}
	repo.passports[p.UUID] = p
	return p
}

func insertPassportChain(repo *chainTestRepo, status string) *models.Passport {
	p := &models.Passport{
		UUID:    uuid.New(),
		BatchID: uuid.New(),
		Status:  status,
	}
	repo.fakeLifecycleRepo.passports[p.UUID] = p
	return p
}

// ============================================================================
// PHASE 3 — Happy Path Transitions
// ============================================================================

func TestApplyTransition_AllHappyPaths(t *testing.T) {
	cases := []struct {
		name       string
		fromStatus string
		action     string
		actor      models.ActorContext
		evidence   models.Evidence
		reasonCode string
		wantStatus string
	}{
		{
			name:       "CREATED→ACTIVATE→ACTIVE (System)",
			fromStatus: models.PassportStatusCreated,
			action:     string(models.ActionActivate),
			actor:      systemActor(),
			evidence:   nil,
			reasonCode: "BATCH_QC_PASS",
			wantStatus: models.PassportStatusActive,
		},
		{
			name:       "ACTIVE→SHIP→SHIPPED (InternalOperator)",
			fromStatus: models.PassportStatusActive,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
			wantStatus: models.PassportStatusShipped,
		},
		{
			name:       "ACTIVE→SHIP→SHIPPED (Logistics)",
			fromStatus: models.PassportStatusActive,
			action:     string(models.ActionShip),
			actor:      logisticsActor(),
			evidence:   shipEvidence(),
			wantStatus: models.PassportStatusShipped,
		},
		{
			name:       "SHIPPED→INSTALL→IN_SERVICE (Technician)",
			fromStatus: models.PassportStatusShipped,
			action:     string(models.ActionInstall),
			actor:      technicianActor(),
			evidence:   installEvidence(),
			wantStatus: models.PassportStatusInService,
		},
		{
			name:       "IN_SERVICE→RECYCLE→RECYCLED (Recycler)",
			fromStatus: models.PassportStatusInService,
			action:     string(models.ActionRecycle),
			actor:      recyclerActor(),
			evidence:   recycleEvidence(),
			wantStatus: models.PassportStatusRecycled,
		},
		{
			name:       "RECYCLED→CLOSE→END_OF_LIFE (Recycler)",
			fromStatus: models.PassportStatusRecycled,
			action:     string(models.ActionClose),
			actor:      recyclerActor(),
			evidence:   closeEvidence(),
			wantStatus: models.PassportStatusEndOfLife,
		},
		{
			name:       "RECYCLED→CLOSE→END_OF_LIFE (System)",
			fromStatus: models.PassportStatusRecycled,
			action:     string(models.ActionClose),
			actor:      systemActor(),
			evidence:   closeEvidence(),
			wantStatus: models.PassportStatusEndOfLife,
		},
		{
			name:       "ACTIVE→RECALL→RECALLED (Admin)",
			fromStatus: models.PassportStatusActive,
			action:     string(models.ActionRecall),
			actor:      adminActor(),
			evidence:   recallEvidence(),
			wantStatus: models.PassportStatusRecalled,
		},
		{
			name:       "SHIPPED→RECALL→RECALLED (Admin)",
			fromStatus: models.PassportStatusShipped,
			action:     string(models.ActionRecall),
			actor:      adminActor(),
			evidence:   recallEvidence(),
			wantStatus: models.PassportStatusRecalled,
		},
		{
			name:       "IN_SERVICE→RECALL→RECALLED (Admin)",
			fromStatus: models.PassportStatusInService,
			action:     string(models.ActionRecall),
			actor:      adminActor(),
			evidence:   recallEvidence(),
			wantStatus: models.PassportStatusRecalled,
		},
		{
			name:       "RECALLED→RECYCLE→RECYCLED (Recycler)",
			fromStatus: models.PassportStatusRecalled,
			action:     string(models.ActionRecycle),
			actor:      recyclerActor(),
			evidence:   recycleEvidence(),
			wantStatus: models.PassportStatusRecycled,
		},
		{
			name:       "RECALLED→CLOSE→END_OF_LIFE (Recycler)",
			fromStatus: models.PassportStatusRecalled,
			action:     string(models.ActionClose),
			actor:      recyclerActor(),
			evidence:   closeEvidence(),
			wantStatus: models.PassportStatusEndOfLife,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := newFakeLifecycleRepo()
			svc := NewLifecycleService(repo)
			passport := insertPassport(repo, tc.fromStatus)

			result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
				PassportID:   passport.UUID,
				Action:       tc.action,
				ActorContext: tc.actor,
				Evidence:     tc.evidence,
				ReasonCode:   tc.reasonCode,
			})
			if err != nil {
				t.Fatalf("expected success, got error: %v", err)
			}
			if !result.Success {
				t.Fatalf("expected Success=true, got Error=%q", result.Error)
			}
			if result.NewStatus != tc.wantStatus {
				t.Errorf("expected NewStatus=%q, got %q", tc.wantStatus, result.NewStatus)
			}
			if result.PreviousStatus != tc.fromStatus {
				t.Errorf("expected PreviousStatus=%q, got %q", tc.fromStatus, result.PreviousStatus)
			}
			if result.EventID == uuid.Nil {
				t.Error("expected non-nil EventID")
			}
			// Passport status should be updated in memory
			if passport.Status != tc.wantStatus {
				t.Errorf("expected passport.Status=%q, got %q", tc.wantStatus, passport.Status)
			}
		})
	}
}

// ============================================================================
// PHASE 3 — Invalid Status Transitions
// ============================================================================

func TestApplyTransition_InvalidStatusTransitions(t *testing.T) {
	cases := []struct {
		name       string
		fromStatus string
		action     string
		actor      models.ActorContext
		evidence   models.Evidence
	}{
		{
			name:       "CREATED→SHIP rejected",
			fromStatus: models.PassportStatusCreated,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
		},
		{
			name:       "ACTIVE→INSTALL rejected",
			fromStatus: models.PassportStatusActive,
			action:     string(models.ActionInstall),
			actor:      technicianActor(),
			evidence:   installEvidence(),
		},
		{
			name:       "ACTIVE→RECYCLE rejected",
			fromStatus: models.PassportStatusActive,
			action:     string(models.ActionRecycle),
			actor:      recyclerActor(),
			evidence:   recycleEvidence(),
		},
		{
			name:       "SHIPPED→ACTIVATE rejected",
			fromStatus: models.PassportStatusShipped,
			action:     string(models.ActionActivate),
			actor:      systemActor(),
			evidence:   nil,
		},
		{
			name:       "SHIPPED→RECYCLE rejected",
			fromStatus: models.PassportStatusShipped,
			action:     string(models.ActionRecycle),
			actor:      recyclerActor(),
			evidence:   recycleEvidence(),
		},
		{
			name:       "IN_SERVICE→SHIP rejected",
			fromStatus: models.PassportStatusInService,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
		},
		{
			name:       "RECYCLED→SHIP rejected",
			fromStatus: models.PassportStatusRecycled,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
		},
		{
			name:       "END_OF_LIFE→SHIP rejected",
			fromStatus: models.PassportStatusEndOfLife,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
		},
		{
			name:       "RECALLED→SHIP rejected",
			fromStatus: models.PassportStatusRecalled,
			action:     string(models.ActionShip),
			actor:      operatorActor(),
			evidence:   shipEvidence(),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := newFakeLifecycleRepo()
			svc := NewLifecycleService(repo)
			passport := insertPassport(repo, tc.fromStatus)

			result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
				PassportID:   passport.UUID,
				Action:       tc.action,
				ActorContext: tc.actor,
				Evidence:     tc.evidence,
			})
			if !errors.Is(err, ErrActionNotAllowed) {
				t.Errorf("expected ErrActionNotAllowed, got %v (result.Error=%q)", err, result.Error)
			}
			if result.Success {
				t.Error("expected Success=false")
			}
		})
	}
}

// ============================================================================
// PHASE 3 — Unknown Action
// ============================================================================

func TestApplyTransition_UnknownAction(t *testing.T) {
	repo := newFakeLifecycleRepo()
	svc := NewLifecycleService(repo)
	passport := insertPassport(repo, models.PassportStatusActive)

	result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       "EXPLODE",
		ActorContext: operatorActor(),
	})
	if !errors.Is(err, ErrUnknownAction) {
		t.Errorf("expected ErrUnknownAction, got %v", err)
	}
	if result.Success {
		t.Error("expected Success=false")
	}
}

// ============================================================================
// PHASE 3 — Extra Evidence Key Rejected
// Evidence map with unexpected key must return ErrInvalidEvidence
// ============================================================================

func TestApplyTransition_ExtraEvidenceKeyRejected(t *testing.T) {
	repo := newFakeLifecycleRepo()
	svc := NewLifecycleService(repo)
	passport := insertPassport(repo, models.PassportStatusActive)

	evidenceWithExtra := models.Evidence{
		models.EvidenceShipmentReference: "SHIP-2026-001",
		models.EvidenceShipmentDate:      "2026-03-01",
		"unexpected_field":               "should be rejected",
	}

	result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       string(models.ActionShip),
		ActorContext: operatorActor(),
		Evidence:     evidenceWithExtra,
	})
	if !errors.Is(err, ErrInvalidEvidence) {
		t.Errorf("expected ErrInvalidEvidence for extra key, got %v", err)
	}
	if result.Success {
		t.Error("expected Success=false")
	}
}

// ============================================================================
// PHASE 3 — DB persist failure
// ============================================================================

func TestApplyTransition_PersistFailure(t *testing.T) {
	repo := newFakeLifecycleRepo()
	repo.applyErr = errors.New("db connection lost")
	svc := NewLifecycleService(repo)
	passport := insertPassport(repo, models.PassportStatusActive)

	result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       string(models.ActionShip),
		ActorContext: operatorActor(),
		Evidence:     shipEvidence(),
	})
	if !errors.Is(err, ErrTransitionPersistFailed) {
		t.Errorf("expected ErrTransitionPersistFailed, got %v", err)
	}
	if result.Success {
		t.Error("expected Success=false")
	}
	// Passport status must NOT have changed
	if passport.Status != models.PassportStatusActive {
		t.Errorf("expected passport status unchanged, got %q", passport.Status)
	}
}

// ============================================================================
// PHASE 3 — Missing ActorContext
// ============================================================================

func TestApplyTransition_MissingActorContext(t *testing.T) {
	repo := newFakeLifecycleRepo()
	svc := NewLifecycleService(repo)
	passport := insertPassport(repo, models.PassportStatusActive)

	result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       string(models.ActionShip),
		ActorContext: models.ActorContext{}, // empty
		Evidence:     shipEvidence(),
	})
	if !errors.Is(err, ErrMissingActorContext) {
		t.Errorf("expected ErrMissingActorContext, got %v", err)
	}
	if result.Success {
		t.Error("expected Success=false")
	}
}

// ============================================================================
// PHASE 3 — Passport Not Found
// ============================================================================

func TestApplyTransition_PassportNotFound(t *testing.T) {
	repo := newFakeLifecycleRepo()
	svc := NewLifecycleService(repo)

	result, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   uuid.New(), // not in repo
		Action:       string(models.ActionShip),
		ActorContext: operatorActor(),
		Evidence:     shipEvidence(),
	})
	if err == nil {
		t.Fatal("expected error for missing passport, got nil")
	}
	if result.Success {
		t.Error("expected Success=false")
	}
	if result.Error != "Passport not found" {
		t.Errorf("expected 'Passport not found', got %q", result.Error)
	}
}

// ============================================================================
// PHASE 4 — Audit Chain: VerifyEventChain direct tests
// ============================================================================

func makeChainEvent(passportID uuid.UUID, action, statusFrom, statusTo, prevHash string) ChainEvent {
	data := EventHashData{
		ID:           uuid.New(),
		PassportID:   passportID,
		EventType:    "STATUS_CHANGED",
		Action:       action,
		Actor:        "system",
		ActorType:    "SYSTEM",
		ActorRole:    "SYSTEM",
		ActorID:      "system",
		Source:       "INTERNAL",
		StatusFrom:   statusFrom,
		StatusTo:     statusTo,
		CreatedAt:    time.Now(),
		PreviousHash: prevHash,
	}
	hash, _ := GenerateEventHash(data)
	return ChainEvent{Data: data, Hash: hash}
}

func TestVerifyEventChain_Empty(t *testing.T) {
	valid, idx := VerifyEventChain(nil)
	if !valid {
		t.Error("empty chain should be valid")
	}
	if idx != -1 {
		t.Errorf("expected idx=-1, got %d", idx)
	}
}

func TestVerifyEventChain_SingleEventValid(t *testing.T) {
	passportID := uuid.New()
	genesisHash := "GENESIS:" + passportID.String() + ":SN-001"
	ev := makeChainEvent(passportID, "ACTIVATE", "CREATED", "ACTIVE", genesisHash)

	valid, idx := VerifyEventChain([]ChainEvent{ev})
	if !valid {
		t.Errorf("expected valid, got invalid at idx=%d", idx)
	}
}

func TestVerifyEventChain_MultiEventValid(t *testing.T) {
	passportID := uuid.New()
	genesisHash := "GENESIS:" + passportID.String() + ":SN-001"

	ev0 := makeChainEvent(passportID, "ACTIVATE", "CREATED", "ACTIVE", genesisHash)
	ev1 := makeChainEvent(passportID, "SHIP", "ACTIVE", "SHIPPED", ev0.Hash)
	ev2 := makeChainEvent(passportID, "INSTALL", "SHIPPED", "IN_SERVICE", ev1.Hash)

	valid, idx := VerifyEventChain([]ChainEvent{ev0, ev1, ev2})
	if !valid {
		t.Errorf("expected valid chain, got invalid at idx=%d", idx)
	}
}

func TestVerifyEventChain_TamperedFirstEvent(t *testing.T) {
	passportID := uuid.New()
	genesisHash := "GENESIS:" + passportID.String() + ":SN-001"

	ev := makeChainEvent(passportID, "ACTIVATE", "CREATED", "ACTIVE", genesisHash)
	ev.Hash = "tampered-hash-000"

	valid, idx := VerifyEventChain([]ChainEvent{ev})
	if valid {
		t.Error("expected invalid for tampered hash")
	}
	if idx != 0 {
		t.Errorf("expected failure at idx=0, got %d", idx)
	}
}

func TestVerifyEventChain_MiddleEventTampered(t *testing.T) {
	passportID := uuid.New()
	genesisHash := "GENESIS:" + passportID.String() + ":SN-002"

	ev0 := makeChainEvent(passportID, "ACTIVATE", "CREATED", "ACTIVE", genesisHash)
	ev1 := makeChainEvent(passportID, "SHIP", "ACTIVE", "SHIPPED", ev0.Hash)
	ev2 := makeChainEvent(passportID, "INSTALL", "SHIPPED", "IN_SERVICE", ev1.Hash)

	// Tamper ev1's stored hash
	ev1.Hash = "tampered-middle-hash"

	valid, idx := VerifyEventChain([]ChainEvent{ev0, ev1, ev2})
	if valid {
		t.Error("expected invalid for tampered middle event")
	}
	if idx != 1 {
		t.Errorf("expected failure at idx=1, got %d", idx)
	}
}

func TestVerifyEventChain_LastEventTampered(t *testing.T) {
	passportID := uuid.New()
	genesisHash := "GENESIS:" + passportID.String() + ":SN-003"

	ev0 := makeChainEvent(passportID, "ACTIVATE", "CREATED", "ACTIVE", genesisHash)
	ev1 := makeChainEvent(passportID, "SHIP", "ACTIVE", "SHIPPED", ev0.Hash)
	ev2 := makeChainEvent(passportID, "INSTALL", "SHIPPED", "IN_SERVICE", ev1.Hash)

	ev2.Hash = "tampered-last-hash"

	valid, idx := VerifyEventChain([]ChainEvent{ev0, ev1, ev2})
	if valid {
		t.Error("expected invalid for tampered last event")
	}
	if idx != 2 {
		t.Errorf("expected failure at idx=2, got %d", idx)
	}
}

// ============================================================================
// PHASE 4 — VerifyPassportAuditChain via service (integration with chainTestRepo)
// ============================================================================

func TestVerifyPassportAuditChain_TwoTransitions(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	passport := insertPassportChain(repo, models.PassportStatusActive)

	// SHIP
	r1, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       string(models.ActionShip),
		ActorContext: operatorActor(),
		Evidence:     shipEvidence(),
	})
	if err != nil || !r1.Success {
		t.Fatalf("SHIP failed: %v / %q", err, r1.Error)
	}

	// INSTALL
	r2, err := svc.ApplyTransition(context.Background(), TransitionRequest{
		PassportID:   passport.UUID,
		Action:       string(models.ActionInstall),
		ActorContext: technicianActor(),
		Evidence:     installEvidence(),
	})
	if err != nil || !r2.Success {
		t.Fatalf("INSTALL failed: %v / %q", err, r2.Error)
	}

	valid, failedIdx, err := svc.VerifyPassportAuditChain(context.Background(), passport.UUID)
	if err != nil {
		t.Fatalf("VerifyPassportAuditChain error: %v", err)
	}
	if !valid {
		t.Errorf("expected valid chain, got invalid at idx=%d", failedIdx)
	}
}

func TestVerifyPassportAuditChain_Empty(t *testing.T) {
	repo := newChainTestRepo()
	svc := NewLifecycleService(repo)
	passport := insertPassportChain(repo, models.PassportStatusActive)

	valid, failedIdx, err := svc.VerifyPassportAuditChain(context.Background(), passport.UUID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !valid {
		t.Errorf("expected valid empty chain, got invalid at idx=%d", failedIdx)
	}
}
