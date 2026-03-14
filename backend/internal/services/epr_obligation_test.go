package services

import (
	"testing"
	"time"

	"exportready-battery/internal/models"
)

func makeEPRTenant(eprNumber string) *models.Tenant {
	return &models.Tenant{
		CompanyName:           "Test Batteries Pvt Ltd",
		EPRRegistrationNumber: eprNumber,
	}
}

func makeIndiaBatch(weight string, passports int, year int) *models.Batch {
	mfgDate := time.Date(year, 6, 1, 0, 0, 0, 0, time.UTC)
	return &models.Batch{
		Status:                 models.BatchStatusActive,
		MarketRegion:           models.MarketRegionIndia,
		TotalPassports:         passports,
		ManufacturingStartDate: &mfgDate,
		Specs: models.BatchSpec{
			Weight: weight,
		},
	}
}

func TestEPR_NoRegistration(t *testing.T) {
	tenant := makeEPRTenant("")
	batches := []*models.Batch{}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.Status != "NOT_REGISTERED" {
		t.Errorf("expected NOT_REGISTERED, got %s", result.Status)
	}
}

func TestEPR_NoData(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	batches := []*models.Batch{}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.Status != "NO_DATA" {
		t.Errorf("expected NO_DATA, got %s", result.Status)
	}
}

func TestEPR_BasicCalculation(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	batches := []*models.Batch{
		makeIndiaBatch("500g", 100, 2026), // 100 × 0.5kg = 50kg
		makeIndiaBatch("1.2kg", 50, 2026), // 50 × 1.2kg = 60kg
	}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.TotalBatches != 2 {
		t.Errorf("expected 2 batches, got %d", result.TotalBatches)
	}
	if result.TotalPassports != 150 {
		t.Errorf("expected 150 passports, got %d", result.TotalPassports)
	}
	// 50 + 60 = 110kg total
	if result.TotalWeightKg != 110.0 {
		t.Errorf("expected 110.0 kg, got %.2f", result.TotalWeightKg)
	}
	// 2026 target = 80%, required = 110 * 80 / 100 = 88kg
	if result.RequiredCollectionKg != 88.0 {
		t.Errorf("expected 88.0 kg required, got %.2f", result.RequiredCollectionKg)
	}
	if result.Status != "NON_COMPLIANT" {
		t.Errorf("expected NON_COMPLIANT (no collection data), got %s", result.Status)
	}
}

func TestEPR_SkipsEUBatches(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	euBatch := makeIndiaBatch("500g", 100, 2026)
	euBatch.MarketRegion = models.MarketRegionEU

	batches := []*models.Batch{euBatch}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.TotalBatches != 0 {
		t.Errorf("EU batches should be skipped, got %d batches", result.TotalBatches)
	}
	if result.Status != "NO_DATA" {
		t.Errorf("expected NO_DATA when only EU batches, got %s", result.Status)
	}
}

func TestEPR_SkipsDraftBatches(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	draft := makeIndiaBatch("500g", 100, 2026)
	draft.Status = models.BatchStatusDraft

	batches := []*models.Batch{draft}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.TotalBatches != 0 {
		t.Errorf("DRAFT batches should be skipped, got %d batches", result.TotalBatches)
	}
}

func TestEPR_IncludesGlobalBatches(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	globalBatch := makeIndiaBatch("1kg", 200, 2026)
	globalBatch.MarketRegion = models.MarketRegionGlobal

	batches := []*models.Batch{globalBatch}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.TotalBatches != 1 {
		t.Errorf("GLOBAL batches should be included for India EPR, got %d", result.TotalBatches)
	}
	if result.TotalWeightKg != 200.0 {
		t.Errorf("expected 200.0 kg, got %.2f", result.TotalWeightKg)
	}
}

func TestEPR_YearFilter(t *testing.T) {
	tenant := makeEPRTenant("EPR/WP/2024/00001")
	batches := []*models.Batch{
		makeIndiaBatch("500g", 100, 2025), // Different year
		makeIndiaBatch("500g", 100, 2026), // Target year
	}

	result := CalculateEPRObligation(tenant, batches, 2026, 0)

	if result.TotalBatches != 1 {
		t.Errorf("expected 1 batch for 2026, got %d (year filter failed)", result.TotalBatches)
	}
}

func TestEPR_CollectionTargetsByYear(t *testing.T) {
	tests := []struct {
		year     int
		expected float64
	}{
		{2023, 60},
		{2024, 70},
		{2025, 70},
		{2026, 80},
		{2030, 80}, // Default
	}

	for _, tc := range tests {
		target := getCollectionTarget(tc.year)
		if target != tc.expected {
			t.Errorf("year %d: expected target %.0f%%, got %.0f%%", tc.year, tc.expected, target)
		}
	}
}

func TestParseWeightKg(t *testing.T) {
	tests := []struct {
		input    string
		expected float64
	}{
		{"500g", 0.5},
		{"1.2kg", 1.2},
		{"1200 g", 1.2},
		{"2.5 kg", 2.5},
		{"", 0},
		{"invalid", 0},
	}

	for _, tc := range tests {
		result := parseWeightKg(tc.input)
		if result != tc.expected {
			t.Errorf("parseWeightKg(%q): expected %.3f, got %.3f", tc.input, tc.expected, result)
		}
	}
}
