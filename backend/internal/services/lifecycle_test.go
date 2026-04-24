package services_test

import (
	"context"
	"testing"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupLifecycleService(t *testing.T) (*services.LifecycleService, *repository.MockRepository) {
	mockRepo := new(repository.MockRepository)
	service := services.NewLifecycleService(mockRepo)
	return service, mockRepo
}

func TestApplyTransition_Success_Ship(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()

	passportID := uuid.New()
	passport := &models.Passport{
		UUID:      passportID,
		Status:    models.PassportStatusActive, // Ship allowed from Active
		CreatedAt: time.Now(),
	}

	req := services.TransitionRequest{
		PassportID: passportID,
		Action:     string(models.ActionShip),
		ActorContext: models.ActorContext{
			ActorID:   "user1",
			ActorType: models.ActorTypeUser,
			ActorRole: models.ActorRoleInternalOperator,
			Source:    models.ActionSourceInternal,
		},
		Evidence: models.Evidence{
			models.EvidenceShipmentDate:      time.Now().Format(time.RFC3339),
			models.EvidenceShipmentReference: "SHIP123",
		},
	}

	mockRepo.On("GetPassportByUUID", ctx, passportID).Return(passport, nil)

	// Return empty list of events for previous hash calculation
	mockRepo.On("GetPassportEvents", ctx, passportID).Return([]*models.PassportEvent{}, nil)

	// Expect ApplyLifecycleTransition
	mockRepo.On("ApplyLifecycleTransition", ctx, mock.MatchedBy(func(p models.TransitionPersistence) bool {
		return p.PassportID == passportID &&
			p.NewStatus == models.PassportStatusShipped &&
			p.Event != nil &&
			p.Event.ID != uuid.Nil && // Ensure EventID is generated
			p.Event.EventType == models.PassportEventShipped
	})).Return(nil)

	result, err := service.ApplyTransition(ctx, req)

	assert.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, models.PassportStatusShipped, result.NewStatus)
	assert.NotEmpty(t, result.EventID)

	mockRepo.AssertExpectations(t)
}

func TestApplyTransition_PassportNotFound(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()

	passportID := uuid.New()
	req := services.TransitionRequest{
		PassportID: passportID,
		Action:     string(models.ActionShip),
		ActorContext: models.ActorContext{
			ActorID:   "user1", // Need valid context or it fails earlier
			ActorType: models.ActorTypeUser,
			ActorRole: models.ActorRoleInternalOperator,
			Source:    models.ActionSourceInternal,
		},
	}

	mockRepo.On("GetPassportByUUID", ctx, passportID).Return(nil, assert.AnError)

	result, err := service.ApplyTransition(ctx, req)

	assert.Error(t, err)
	assert.False(t, result.Success)
	assert.Contains(t, result.Error, "Passport not found")

	mockRepo.AssertExpectations(t)
}

func TestApplyTransition_InvalidRole(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()

	passportID := uuid.New()
	passport := &models.Passport{
		UUID:   passportID,
		Status: models.PassportStatusActive,
	}

	req := services.TransitionRequest{
		PassportID: passportID,
		Action:     string(models.ActionShip),
		ActorContext: models.ActorContext{
			ActorID:   "recycler1",
			ActorType: models.ActorTypeUser,
			ActorRole: models.ActorRoleRecycler, // Recycler cannot ship
			Source:    models.ActionSourceInternal,
		},
		// Evidence might be checked before role? No, role checked early.
	}

	mockRepo.On("GetPassportByUUID", ctx, passportID).Return(passport, nil)

	result, err := service.ApplyTransition(ctx, req)

	assert.Error(t, err)
	assert.Equal(t, services.ErrRoleNotAllowed, err)
	assert.False(t, result.Success)

	mockRepo.AssertExpectations(t)
}

func TestApplyTransition_InvalidActionTransition(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()

	passportID := uuid.New()
	passport := &models.Passport{
		UUID:   passportID,
		Status: models.PassportStatusCreated, // Cannot SHIP from CREATED directly
	}

	req := services.TransitionRequest{
		PassportID: passportID,
		Action:     string(models.ActionShip),
		ActorContext: models.ActorContext{
			ActorID:   "user1",
			ActorType: models.ActorTypeUser,
			ActorRole: models.ActorRoleInternalOperator,
			Source:    models.ActionSourceInternal,
		},
	}

	mockRepo.On("GetPassportByUUID", ctx, passportID).Return(passport, nil)

	result, err := service.ApplyTransition(ctx, req)

	assert.Error(t, err)
	assert.Equal(t, services.ErrActionNotAllowed, err)
	assert.False(t, result.Success)

	mockRepo.AssertExpectations(t)
}

func TestVerifyPassportAuditChain_Valid(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()
	passportID := uuid.New()

	// Mock GetPassportEvents returning empty list (valid chain)
	mockRepo.On("GetPassportEvents", ctx, passportID).Return([]*models.PassportEvent{}, nil)

	valid, idx, err := service.VerifyPassportAuditChain(ctx, passportID)
	assert.NoError(t, err)
	assert.True(t, valid)
	assert.Equal(t, -1, idx)
}

func TestUpdateStateOfHealth_AppendsHistoryOnceAndLogsEvent(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()
	passportID := uuid.New()
	soh := 94.5

	mockRepo.On("UpdateStateOfHealth", ctx, passportID, soh, mock.AnythingOfType("time.Time")).Return(nil).Once()
	mockRepo.On("AppendSoHHistory", ctx, mock.MatchedBy(func(entry models.SoHHistoryEntry) bool {
		return entry.PassportID == passportID && entry.SoH == soh && entry.Actor == "device-1" && entry.ActorType == "DEVICE" && entry.Source == "TELEMETRY"
	})).Return(nil).Once()
	mockRepo.On("GetPassportEvents", ctx, passportID).Return([]*models.PassportEvent{}, nil).Once()
	mockRepo.On("CreatePassportEvent", ctx, mock.MatchedBy(func(event *models.PassportEvent) bool {
		return event != nil &&
			event.PassportID == passportID &&
			event.EventType == models.PassportEventSOHUpdated &&
			event.Actor == "device-1" &&
			event.ActorType == "DEVICE" &&
			event.Source == "TELEMETRY" &&
			event.Metadata["state_of_health"] == soh
	})).Return(nil).Once()

	err := service.UpdateStateOfHealth(ctx, passportID, soh, "device-1", "DEVICE", "TELEMETRY", "127.0.0.1")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNumberOfCalls(t, "AppendSoHHistory", 1)
}

func TestBulkTransitionPassports_ExplicitIDsAreTenantScoped(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()

	tenantID := uuid.New()
	foreignTenantID := uuid.New()
	ownedPassportID := uuid.New()
	foreignPassportID := uuid.New()
	ownedBatchID := uuid.New()
	foreignBatchID := uuid.New()

	ownedPassport := &models.Passport{
		UUID:      ownedPassportID,
		BatchID:   ownedBatchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}
	foreignPassport := &models.Passport{
		UUID:      foreignPassportID,
		BatchID:   foreignBatchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}

	req := services.BulkTransitionRequest{
		PassportIDs: []uuid.UUID{ownedPassportID, foreignPassportID},
		TenantID:    tenantID,
		Action:      string(models.ActionShip),
		ActorContext: models.ActorContext{
			ActorID:   "user1",
			ActorType: models.ActorTypeUser,
			ActorRole: models.ActorRoleInternalOperator,
			Source:    models.ActionSourceInternal,
		},
		Evidence: models.Evidence{
			models.EvidenceShipmentDate:      time.Now().Format(time.RFC3339),
			models.EvidenceShipmentReference: "SHIP123",
		},
	}

	mockRepo.On("GetPassportByUUID", ctx, ownedPassportID).Return(ownedPassport, nil).Twice()
	mockRepo.On("GetBatchTenantID", ctx, ownedBatchID).Return(tenantID, nil).Twice()
	mockRepo.On("GetPassportEvents", ctx, ownedPassportID).Return([]*models.PassportEvent{}, nil).Once()
	mockRepo.On("ApplyLifecycleTransition", ctx, mock.MatchedBy(func(p models.TransitionPersistence) bool {
		return p.PassportID == ownedPassportID &&
			p.NewStatus == models.PassportStatusShipped &&
			p.Event != nil &&
			p.Event.EventType == models.PassportEventShipped
	})).Return(nil).Once()

	mockRepo.On("GetPassportByUUID", ctx, foreignPassportID).Return(foreignPassport, nil).Once()
	mockRepo.On("GetBatchTenantID", ctx, foreignBatchID).Return(foreignTenantID, nil).Once()

	result, err := service.BulkTransitionPassports(ctx, req)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Equal(t, 1, result.Succeeded)
	assert.Equal(t, 1, result.Failed)
	assert.Equal(t, []string{foreignPassportID.String()}, result.FailedIDs)
	assert.Contains(t, result.Errors, "passport not found: unauthorized")

	mockRepo.AssertExpectations(t)
	mockRepo.AssertNumberOfCalls(t, "ApplyLifecycleTransition", 1)
	mockRepo.AssertNumberOfCalls(t, "GetPassportEvents", 1)
}

func TestGetBulkAllowedActionsForFilter_IntersectsAcrossFilteredDataset(t *testing.T) {
	service, mockRepo := setupLifecycleService(t)
	ctx := context.Background()
	tenantID := uuid.New()

	items := []*repository.PassportListItem{
		{UUID: uuid.New().String(), Status: models.PassportStatusActive},
		{UUID: uuid.New().String(), Status: models.PassportStatusCreated},
	}
	mockRepo.On("ListPassportsByTenant", ctx, tenantID, "", "", "", 500, 0).Return(items, len(items), nil).Once()

	actions, err := service.GetBulkAllowedActionsForFilter(ctx, tenantID, "", "", "", models.ActorRoleInternalOperator)

	assert.NoError(t, err)
	assert.Empty(t, actions)
	mockRepo.AssertExpectations(t)
}
