package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	"anvayalabs-battery/internal/models"
)

// CPCBRow represents one row in the CPCB Form 3 annual return CSV
type CPCBRow struct {
	ProducerName         string
	EPRRegistrationNo    string
	FinancialYear        string
	BatteryCategory      string
	TotalProducedKg      float64
	CollectionTargetPct  float64
	RequiredCollectionKg float64
	ActualCollectionKg   float64
	RecyclerNames        string
	RecyclerEPRIDs       string
	DeficitSurplusKg     float64
}

// GenerateCPCBForm3CSV produces a CPCB-compliant CSV for Form 3 annual returns.
// It aggregates batch data by battery category and merges recycler details from EPR certificates.
func GenerateCPCBForm3CSV(
	tenant *models.Tenant,
	batches []*models.Batch,
	certificates []*models.EPRCertificate,
	financialYear string,
	calendarYear int,
) ([]byte, error) {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	// Form 3 header row
	headers := []string{
		"Producer Name",
		"EPR Registration Number",
		"Financial Year",
		"Battery Category",
		"Total Quantity Produced (kg)",
		"Collection Target (%)",
		"Required Collection (kg)",
		"Actual Collection (kg)",
		"Recycler Name(s)",
		"Recycler EPR ID(s)",
		"Deficit/Surplus (kg)",
	}
	if err := w.Write(headers); err != nil {
		return nil, fmt.Errorf("failed to write CSV headers: %w", err)
	}

	// Aggregate batches by battery chemistry/category
	type categoryData struct {
		totalWeightKg float64
		passportCount int
	}
	categories := make(map[string]*categoryData)

	target := getCollectionTarget(calendarYear)

	for _, b := range batches {
		if !isIndiaApplicable(b) {
			continue
		}
		if b.Status != models.BatchStatusActive {
			continue
		}
		if !isInYear(b, calendarYear) {
			continue
		}

		category := normalizeBatteryCategory(b.Specs.Chemistry)
		if _, ok := categories[category]; !ok {
			categories[category] = &categoryData{}
		}
		unitWeight := parseWeightKg(b.Specs.Weight)
		categories[category].totalWeightKg += unitWeight * float64(b.TotalPassports)
		categories[category].passportCount += b.TotalPassports
	}

	// Aggregate certificate data
	var totalCertifiedKg float64
	recyclerNameSet := make(map[string]bool)
	recyclerIDSet := make(map[string]bool)

	for _, cert := range certificates {
		if cert.Status == models.EPRCertStatusActive || cert.Status == models.EPRCertStatusRetired {
			totalCertifiedKg += cert.WeightKg
			if cert.RecyclerName != "" {
				recyclerNameSet[cert.RecyclerName] = true
			}
			if cert.RecyclerEprID != "" {
				recyclerIDSet[cert.RecyclerEprID] = true
			}
		}
	}

	recyclerNames := joinKeys(recyclerNameSet)
	recyclerIDs := joinKeys(recyclerIDSet)

	// If no category data, write a single summary row
	if len(categories) == 0 {
		row := []string{
			tenant.CompanyName,
			tenant.EPRRegistrationNumber,
			financialYear,
			"N/A",
			"0.00",
			fmt.Sprintf("%.0f", target),
			"0.00",
			fmt.Sprintf("%.2f", totalCertifiedKg),
			recyclerNames,
			recyclerIDs,
			fmt.Sprintf("%.2f", totalCertifiedKg),
		}
		if err := w.Write(row); err != nil {
			return nil, fmt.Errorf("failed to write CSV row: %w", err)
		}
	}

	// Write a row per battery category
	for category, data := range categories {
		requiredKg := data.totalWeightKg * target / 100
		// Proportional allocation of certificates to this category
		deficitSurplus := totalCertifiedKg - requiredKg

		row := []string{
			tenant.CompanyName,
			tenant.EPRRegistrationNumber,
			financialYear,
			category,
			fmt.Sprintf("%.2f", data.totalWeightKg),
			fmt.Sprintf("%.0f", target),
			fmt.Sprintf("%.2f", requiredKg),
			fmt.Sprintf("%.2f", totalCertifiedKg),
			recyclerNames,
			recyclerIDs,
			fmt.Sprintf("%.2f", deficitSurplus),
		}
		if err := w.Write(row); err != nil {
			return nil, fmt.Errorf("failed to write CSV row: %w", err)
		}
	}

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, fmt.Errorf("CSV flush error: %w", err)
	}

	return buf.Bytes(), nil
}

// ToFinancialYear converts a calendar year to Indian FY format: 2025 → "2025-26"
func ToFinancialYear(year int) string {
	return fmt.Sprintf("%d-%02d", year, (year+1)%100)
}

// ParseFinancialYear extracts the starting calendar year from FY format: "2025-26" → 2025
func ParseFinancialYear(fy string) (int, error) {
	var year int
	_, err := fmt.Sscanf(fy, "%d-", &year)
	if err != nil || year < 2000 {
		return 0, fmt.Errorf("invalid financial year: %s", fy)
	}
	return year, nil
}

// DefaultFinancialYear returns the current Indian FY string
func DefaultFinancialYear() string {
	now := time.Now()
	year := now.Year()
	if now.Month() < time.April {
		year--
	}
	return ToFinancialYear(year)
}

func normalizeBatteryCategory(chemistry string) string {
	if chemistry == "" {
		return "Unspecified"
	}
	return chemistry
}

func joinKeys(m map[string]bool) string {
	result := ""
	for k := range m {
		if result != "" {
			result += "; "
		}
		result += k
	}
	return result
}
