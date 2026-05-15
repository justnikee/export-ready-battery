package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"

	"github.com/google/uuid"
)

type fakeLifecycleRepo struct {
	passports map[uuid.UUID]*models.Passport
	applyErr  error
	applied   []models.TransitionPersistence
}

func newFakeLifecycleRepo() *fakeLifecycleRepo {
	return &fakeLifecycleRepo{
		passports: make(map[uuid.UUID]*models.Passport),
	}
}

func (f *fakeLifecycleRepo) GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	passport, ok := f.passports[passportID]
	if !ok {
		return nil, errors.New("passport not found")
	}
	return passport, nil
}

func (f *fakeLifecycleRepo) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) {
	return models.MarketRegionGlobal, nil
}

func (f *fakeLifecycleRepo) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) {
	return uuid.Nil, nil
}

func (f *fakeLifecycleRepo) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, productType models.ProductType, limit, offset int) ([]*repository.PassportListItem, int, error) {
	return []*repository.PassportListItem{}, 0, nil
}

func (f *fakeLifecycleRepo) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	if f.applyErr != nil {
		return f.applyErr
	}
	passport, ok := f.passports[params.PassportID]
	if !ok {
		return errors.New("passport not found")
	}
	passport.Status = params.NewStatus
	if params.ShippedAt != nil {
		passport.ShippedAt = params.ShippedAt
	}
	if params.InstalledAt != nil {
		passport.InstalledAt = params.InstalledAt
	}
	if params.RecycledAt != nil {
		passport.RecycledAt = params.RecycledAt
	}
	if params.RecyclingStatus != "" {
		passport.RecyclingStatus = params.RecyclingStatus
	}
	if params.RecyclerEprID != "" {
		passport.RecyclerEprID = params.RecyclerEprID
	}
	if params.RecyclingDate != nil {
		passport.RecyclingDate = params.RecyclingDate
	}
	f.applied = append(f.applied, params)
	return nil
}

func (f *fakeLifecycleRepo) UpdatePassportStatus(ctx context.Context, passportID uuid.UUID, status string) error {
	passport, ok := f.passports[passportID]
	if !ok {
		return errors.New("passport not found")
	}
	passport.Status = status
	return nil
}

func (f *fakeLifecycleRepo) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	return nil, nil
}

func (f *fakeLifecycleRepo) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	return nil
}

func (f *fakeLifecycleRepo) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, ownerIdentifier string) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error {
	return nil
}

func (f *fakeLifecycleRepo) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	return nil
}

func (f *fakeLifecycleRepo) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, updatedAt time.Time) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	return nil
}

func (f *fakeLifecycleRepo) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	return nil, nil
}

func (f *fakeLifecycleRepo) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}

func TestApplyTransition_RoleEnforcement(t *testing.T) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   uuid.New(),
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}

	service := NewLifecycleService(repo)
	shipEvidence := models.Evidence{
		models.EvidenceShipmentReference: "REF-100",
		models.EvidenceShipmentDate:      time.Now().Format(time.RFC3339),
	}

	t.Run("missing actor role", func(t *testing.T) {
		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionShip),
		})
		if !errors.Is(err, ErrMissingActorContext) {
			t.Fatalf("expected ErrMissingActorContext, got %v", err)
		}
	})

	t.Run("user attempts recall", func(t *testing.T) {
		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionRecall),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "operator@example.com",
				ActorRole: models.ActorRoleInternalOperator,
				Source:    models.ActionSourceInternal,
			},
		})
		if !errors.Is(err, ErrRoleNotAllowed) {
			t.Fatalf("expected ErrRoleNotAllowed, got %v", err)
		}
	})

	t.Run("customer role rejected", func(t *testing.T) {
		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionShip),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "customer@example.com",
				ActorRole: models.ActorRole("CUSTOMER"),
				Source:    models.ActionSourceInternal,
			},
		})
		if !errors.Is(err, ErrInvalidActorContext) {
			t.Fatalf("expected ErrInvalidActorContext, got %v", err)
		}
	})

	t.Run("logistics attempts install", func(t *testing.T) {
		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionInstall),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypePartner,
				ActorID:   "logistics@example.com",
				ActorRole: models.ActorRoleLogistics,
				Source:    models.ActionSourceMagicLink,
			},
		})
		if !errors.Is(err, ErrRoleNotAllowed) {
			t.Fatalf("expected ErrRoleNotAllowed, got %v", err)
		}
	})

	t.Run("correct role allowed", func(t *testing.T) {
		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionShip),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "operator@example.com",
				ActorRole: models.ActorRoleInternalOperator,
				Source:    models.ActionSourceInternal,
			},
			Evidence: shipEvidence,
		})
		if err != nil {
			t.Fatalf("expected success, got %v", err)
		}
	})

	t.Run("admin allowed to ship", func(t *testing.T) {
		repo := newFakeLifecycleRepo()
		passportID := uuid.New()
		repo.passports[passportID] = &models.Passport{
			UUID:      passportID,
			BatchID:   uuid.New(),
			Status:    models.PassportStatusActive,
			CreatedAt: time.Now(),
		}
		service := NewLifecycleService(repo)

		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionShip),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "admin@example.com",
				ActorRole: models.ActorRoleAdmin,
				Source:    models.ActionSourceInternal,
			},
			Evidence: shipEvidence,
		})
		if err != nil {
			t.Fatalf("expected admin ship success, got %v", err)
		}
	})

	t.Run("audit failure aborts transition", func(t *testing.T) {
		repo := newFakeLifecycleRepo()
		passportID := uuid.New()
		repo.passports[passportID] = &models.Passport{
			UUID:      passportID,
			BatchID:   uuid.New(),
			Status:    models.PassportStatusActive,
			CreatedAt: time.Now(),
		}
		repo.applyErr = errors.New("db error")
		service := NewLifecycleService(repo)

		_, err := service.ApplyTransition(context.Background(), TransitionRequest{
			PassportID: passportID,
			Action:     string(models.ActionShip),
			ActorContext: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "operator@example.com",
				ActorRole: models.ActorRoleInternalOperator,
				Source:    models.ActionSourceInternal,
			},
			Evidence: shipEvidence,
		})
		if !errors.Is(err, ErrTransitionPersistFailed) {
			t.Fatalf("expected ErrTransitionPersistFailed, got %v", err)
		}
		if repo.passports[passportID].Status != models.PassportStatusActive {
			t.Fatalf("passport status should remain ACTIVE on audit failure")
		}
	})
}
