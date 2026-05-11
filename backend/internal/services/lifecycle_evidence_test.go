package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"anvayalabs-battery/internal/models"

	"github.com/google/uuid"
)

func TestApplyTransition_EvidenceValidation(t *testing.T) {
	cases := []struct {
		name      string
		status    string
		action    models.TransitionAction
		actor     models.ActorContext
		evidence  models.Evidence
		expectErr error
	}{
		{
			name:   "ship missing shipment_reference",
			status: models.PassportStatusActive,
			action: models.ActionShip,
			actor: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "operator@example.com",
				ActorRole: models.ActorRoleInternalOperator,
				Source:    models.ActionSourceInternal,
			},
			evidence: models.Evidence{
				models.EvidenceShipmentDate: "2026-01-15",
			},
			expectErr: ErrInvalidEvidence,
		},
		{
			name:   "install missing installer_id",
			status: models.PassportStatusShipped,
			action: models.ActionInstall,
			actor: models.ActorContext{
				ActorType: models.ActorTypePartner,
				ActorID:   "tech@example.com",
				ActorRole: models.ActorRoleTechnician,
				Source:    models.ActionSourceMagicLink,
			},
			evidence: models.Evidence{
				models.EvidenceInstallationDate: "2026-01-15",
			},
			expectErr: ErrInvalidEvidence,
		},
		{
			name:   "recycle missing certificate_reference",
			status: models.PassportStatusInService,
			action: models.ActionRecycle,
			actor: models.ActorContext{
				ActorType: models.ActorTypePartner,
				ActorID:   "recycler@example.com",
				ActorRole: models.ActorRoleRecycler,
				Source:    models.ActionSourceMagicLink,
			},
			evidence: models.Evidence{
				models.EvidenceRecyclerEprID: "EPR-123",
				models.EvidenceRecyclingDate: "2026-01-15",
			},
			expectErr: ErrInvalidEvidence,
		},
		{
			name:   "recall missing recall_reason",
			status: models.PassportStatusActive,
			action: models.ActionRecall,
			actor: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "admin@example.com",
				ActorRole: models.ActorRoleAdmin,
				Source:    models.ActionSourceInternal,
			},
			evidence: models.Evidence{
				models.EvidenceRecallReference: "RC-2026-001",
			},
			expectErr: ErrInvalidEvidence,
		},
		{
			name:   "valid evidence passes",
			status: models.PassportStatusActive,
			action: models.ActionShip,
			actor: models.ActorContext{
				ActorType: models.ActorTypeUser,
				ActorID:   "operator@example.com",
				ActorRole: models.ActorRoleInternalOperator,
				Source:    models.ActionSourceInternal,
			},
			evidence: models.Evidence{
				models.EvidenceShipmentReference: "REF-200",
				models.EvidenceShipmentDate:      time.Now().Format(time.RFC3339),
			},
			expectErr: nil,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := newFakeLifecycleRepo()
			passportID := uuid.New()
			repo.passports[passportID] = &models.Passport{
				UUID:      passportID,
				BatchID:   uuid.New(),
				Status:    tc.status,
				CreatedAt: time.Now(),
			}
			service := NewLifecycleService(repo)

			_, err := service.ApplyTransition(context.Background(), TransitionRequest{
				PassportID:   passportID,
				Action:       string(tc.action),
				ActorContext: tc.actor,
				Evidence:     tc.evidence,
			})

			if tc.expectErr == nil {
				if err != nil {
					t.Fatalf("expected success, got %v", err)
				}
				return
			}

			if !errors.Is(err, tc.expectErr) {
				t.Fatalf("expected %v, got %v", tc.expectErr, err)
			}
		})
	}
}
