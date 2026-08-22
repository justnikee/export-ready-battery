package models

import "testing"

func TestCanIssueProductionIdentifiers(t *testing.T) {
	if CanIssueProductionIdentifiers(BatchStatusDraft) {
		t.Fatal("DRAFT must not issue QR or labels")
	}
	if CanIssueProductionIdentifiers("") {
		t.Fatal("empty status must not issue QR or labels")
	}
	if !CanIssueProductionIdentifiers(BatchStatusActive) {
		t.Fatal("ACTIVE must allow QR and labels")
	}
	if !CanIssueProductionIdentifiers(BatchStatusArchived) {
		t.Fatal("ARCHIVED (already activated) must allow QR and labels")
	}
}
