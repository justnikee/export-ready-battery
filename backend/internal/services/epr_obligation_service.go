package services

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"exportready-battery/internal/models"
)

// BWM Rules 2022 — Extended Producer Responsibility collection targets (%)
// These are minimum collection targets as percentage of waste generated.
var eprCollectionTargets = map[int]float64{
	2023: 60,
	2024: 70,
	2025: 70,
	2026: 80,
	2027: 80,
}

// Default target for years beyond the defined schedule
const defaultCollectionTarget = 80.0

// Penalty rate per kg of deficit (₹/kg) — BWM Rules 2022 environmental compensation
const penaltyRatePerKg = 50.0

// EPRObligation represents the computed EPR obligation for a tenant in a given year.
type EPRObligation struct {
	Year                int     `json:"year"`
	EPRRegistrationNo   string  `json:"epr_registration_number"`
	CollectionTargetPct float64 `json:"collection_target_pct"`

	// Production / Sales data (computed from ACTIVE India/GLOBAL batches)
	TotalBatches   int     `json:"total_batches"`
	TotalPassports int     `json:"total_passports"`
	TotalWeightKg  float64 `json:"total_weight_kg"`

	// Obligation computation
	RequiredCollectionKg float64 `json:"required_collection_kg"`
	CollectedKg          float64 `json:"collected_kg"` // From recycled passports — placeholder for now
	DeficitKg            float64 `json:"deficit_kg"`
	PenaltyExposureINR   float64 `json:"penalty_exposure_inr"`

	// Status
	Status  string `json:"status"` // ON_TRACK, AT_RISK, NON_COMPLIANT
	Message string `json:"message"`
}

// CalculateEPRObligation computes EPR obligation for a tenant based on their India-market batches.
// This is a read-only computation — no DB writes.
func CalculateEPRObligation(
	tenant *models.Tenant,
	batches []*models.Batch,
	year int,
) EPRObligation {
	target := getCollectionTarget(year)

	result := EPRObligation{
		Year:                year,
		EPRRegistrationNo:   tenant.EPRRegistrationNumber,
		CollectionTargetPct: target,
	}

	if tenant.EPRRegistrationNumber == "" {
		result.Status = "NOT_REGISTERED"
		result.Message = "No EPR registration number on file. Register with CPCB to comply with BWM Rules 2022."
		return result
	}

	// Aggregate weight from ACTIVE India/GLOBAL batches manufactured in the target year
	var totalWeightKg float64
	var totalPassports int
	var batchCount int

	for _, b := range batches {
		if !isIndiaApplicable(b) {
			continue
		}
		if b.Status != models.BatchStatusActive {
			continue
		}
		if !isInYear(b, year) {
			continue
		}

		batchCount++
		totalPassports += b.TotalPassports
		totalWeightKg += parseWeightKg(b.Specs.Weight) * float64(b.TotalPassports)
	}

	result.TotalBatches = batchCount
	result.TotalPassports = totalPassports
	result.TotalWeightKg = math.Round(totalWeightKg*100) / 100

	// Required collection = total weight × target %
	result.RequiredCollectionKg = math.Round(totalWeightKg*target) / 100

	// CollectedKg: In production this would query recycled passport count × unit weight.
	// For now, placeholder at 0 — will be wired when recycling flow is complete.
	result.CollectedKg = 0

	result.DeficitKg = math.Max(0, result.RequiredCollectionKg-result.CollectedKg)
	result.PenaltyExposureINR = math.Round(result.DeficitKg*penaltyRatePerKg*100) / 100

	// Determine status
	switch {
	case result.TotalWeightKg == 0:
		result.Status = "NO_DATA"
		result.Message = "No activated India-market batches found for this year."
	case result.DeficitKg == 0:
		result.Status = "ON_TRACK"
		result.Message = "Collection target met. No deficit."
	case result.DeficitKg <= result.RequiredCollectionKg*0.2:
		result.Status = "AT_RISK"
		result.Message = fmt.Sprintf("%.1f kg deficit — within 20%% margin. Increase collection efforts.", result.DeficitKg)
	default:
		result.Status = "NON_COMPLIANT"
		result.Message = fmt.Sprintf("%.1f kg deficit. Penalty exposure: ₹%.0f. Immediate action required.", result.DeficitKg, result.PenaltyExposureINR)
	}

	return result
}

func getCollectionTarget(year int) float64 {
	if target, ok := eprCollectionTargets[year]; ok {
		return target
	}
	return defaultCollectionTarget
}

func isIndiaApplicable(b *models.Batch) bool {
	return b.MarketRegion == models.MarketRegionIndia || b.MarketRegion == models.MarketRegionGlobal
}

func isInYear(b *models.Batch, year int) bool {
	if b.ManufacturingStartDate != nil {
		return b.ManufacturingStartDate.Year() == year
	}
	return b.CreatedAt.Year() == year
}

// parseWeightKg extracts kg value from weight strings like "500g", "1.2kg", "1200 g"
func parseWeightKg(weight string) float64 {
	if weight == "" {
		return 0
	}

	w := strings.TrimSpace(strings.ToLower(weight))

	// Remove common suffixes
	isGrams := strings.HasSuffix(w, "g") && !strings.HasSuffix(w, "kg")
	isKg := strings.HasSuffix(w, "kg")

	// Strip unit suffix
	w = strings.TrimRight(w, "abcdefghijklmnopqrstuvwxyz ")
	w = strings.TrimSpace(w)

	val, err := strconv.ParseFloat(w, 64)
	if err != nil {
		return 0
	}

	switch {
	case isKg:
		return val
	case isGrams:
		return val / 1000.0
	default:
		// Assume grams if no unit
		return val / 1000.0
	}
}

// EPRYearlySummary provides a multi-year view for the dashboard.
func CalculateEPRMultiYear(
	tenant *models.Tenant,
	batches []*models.Batch,
) []EPRObligation {
	currentYear := time.Now().Year()
	years := []int{currentYear - 1, currentYear, currentYear + 1}

	results := make([]EPRObligation, 0, len(years))
	for _, y := range years {
		results = append(results, CalculateEPRObligation(tenant, batches, y))
	}
	return results
}
