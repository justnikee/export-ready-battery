package models

import "testing"

func TestIsValidActionSource_IncludesAPIKey(t *testing.T) {
	if !IsValidActionSource(ActionSourceAPIKey) {
		t.Fatal("API_KEY must be a valid action source for external M2M transitions")
	}
	if !IsValidActionSource(ActionSourceInternal) {
		t.Fatal("INTERNAL should remain valid")
	}
	if !IsValidActionSource(ActionSourceMagicLink) {
		t.Fatal("MAGIC_LINK should remain valid")
	}
	if IsValidActionSource(ActionSource("BOGUS")) {
		t.Fatal("unknown source must be rejected")
	}
}

func TestValidateActorContext_ExternalAPIKey(t *testing.T) {
	ok := ActorContext{
		ActorType: ActorTypeExternal,
		ActorID:   "tenant-or-key-id",
		ActorRole: ActorRoleLogistics,
		Source:    ActionSourceAPIKey,
	}
	if err := ValidateActorContext(ok); err != nil {
		t.Fatalf("expected EXTERNAL+API_KEY to be valid, got %v", err)
	}

	// System role is not allowed for external actors
	badRole := ok
	badRole.ActorRole = ActorRoleSystem
	if err := ValidateActorContext(badRole); err == nil {
		t.Fatal("expected SYSTEM role on EXTERNAL actor to fail")
	}

	// Wrong source for EXTERNAL
	badSource := ok
	badSource.Source = ActionSourceInternal
	if err := ValidateActorContext(badSource); err == nil {
		t.Fatal("expected INTERNAL source on EXTERNAL actor to fail")
	}
}

func TestGetAllowedActionsForRole_ActivateDiscoverableForAdmin(t *testing.T) {
	actions := GetAllowedActionsForRole(PassportStatusCreated, ActorRoleAdmin, ProductTypeBattery)
	found := false
	for _, a := range actions {
		if a == ActionActivate {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected ACTIVATE for ADMIN on CREATED, got %v", actions)
	}

	memberActions := GetAllowedActionsForRole(PassportStatusCreated, ActorRoleInternalOperator, ProductTypeBattery)
	foundMember := false
	for _, a := range memberActions {
		if a == ActionActivate {
			foundMember = true
			break
		}
	}
	if !foundMember {
		t.Fatalf("expected ACTIVATE for INTERNAL_OPERATOR on CREATED, got %v", memberActions)
	}
}

func TestGetAllowedActionsForRole_IncludesCircularityActions(t *testing.T) {
	actions := GetAllowedActionsForRole(PassportStatusInService, ActorRoleRecycler, ProductTypeBattery)
	want := map[TransitionAction]bool{
		ActionRecycle:       false,
		ActionRemanufacture: false,
		ActionReuse:         false,
		ActionRepurpose:     false,
	}
	for _, a := range actions {
		if _, ok := want[a]; ok {
			want[a] = true
		}
	}
	for action, seen := range want {
		if !seen {
			t.Errorf("expected %s in allowed actions for recycler IN_SERVICE, got %v", action, actions)
		}
	}
}

func TestRequiredEvidenceFields_RecycleMatchesValidator(t *testing.T) {
	fields := RequiredEvidenceFields(ActionRecycle)
	if len(fields) != 3 {
		t.Fatalf("RECYCLE requires 3 evidence keys, got %v", fields)
	}
	if len(RequiredEvidenceFields(ActionActivate)) != 0 {
		t.Fatal("ACTIVATE must not require evidence keys")
	}
}

func TestBatteryTransitionMap_CloseFromCircularityStates(t *testing.T) {
	def, ok := GetTransitionDefinition(ActionClose, ProductTypeBattery)
	if !ok {
		t.Fatal("CLOSE must be defined")
	}
	need := []string{PassportStatusRemanufactured, PassportStatusReused, PassportStatusRepurposed}
	for _, status := range need {
		found := false
		for _, from := range def.AllowedFrom {
			if from == status {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("CLOSE must allow from %s, AllowedFrom=%v", status, def.AllowedFrom)
		}
	}
}
