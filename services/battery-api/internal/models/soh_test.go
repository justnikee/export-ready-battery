package models

import (
	"testing"
	"time"
)

func TestFactoryGateSoHFields(t *testing.T) {
	now := time.Date(2026, 8, 22, 12, 0, 0, 0, time.UTC)
	soh, ts := FactoryGateSoHFields(now)
	if soh == nil || *soh != FactoryGateSoH {
		t.Fatalf("soh = %v, want %v", soh, FactoryGateSoH)
	}
	if ts == nil || !ts.Equal(now) {
		t.Fatalf("timestamp = %v, want %v", ts, now)
	}
	soh2, _ := FactoryGateSoHFields(now)
	if soh == soh2 {
		t.Fatal("FactoryGateSoHFields must return a new pointer each call")
	}
}
