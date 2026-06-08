package supplier

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/xuri/excelize/v2"
)

// CMRTImportResult holds the outcome of parsing a CMRT Excel file.
type CMRTImportResult struct {
	ReportingYear    int                `json:"reporting_year"`
	Smelters         []models.CMRTSmelter `json:"smelters"`
	UnknownSmelters  int                `json:"unknown_smelters"`
	RMIConformantPct int                `json:"rmi_conformant_pct"`
	ParsedAt         time.Time          `json:"parsed_at"`
}

// CMRTImporter parses Standard CMRT v6.x Excel templates.
type CMRTImporter struct{}

// NewCMRTImporter creates a new importer.
func NewCMRTImporter() *CMRTImporter {
	return &CMRTImporter{}
}

// Parse reads a CMRT Excel file from an io.Reader and extracts smelter data.
// reportingYear is the year the CMRT covers (e.g., 2025).
func (i *CMRTImporter) Parse(r io.Reader, reportingYear int) (*CMRTImportResult, error) {
	file, err := excelize.OpenReader(r)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer file.Close()

	// Try to find the smelter sheet
	sheetName := findSmelterSheet(file)
	if sheetName == "" {
		return nil, fmt.Errorf("could not find smelter list sheet in CMRT file")
	}

	rows, err := file.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read rows from sheet %q: %w", sheetName, err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("smelter sheet has no data rows")
	}

	// Detect column indices from header row
	header := rows[0]
	colMap := mapColumnIndices(header)

	nameIdx, hasName := colMap["smelter_name"]
	countryIdx, hasCountry := colMap["country"]
	mineralIdx, hasMineral := colMap["mineral"]
	refIdx := colMap["smelter_ref"]

	if !hasName || !hasCountry {
		return nil, fmt.Errorf("required columns missing: need at least Smelter Name and Country")
	}

	var smelters []models.CMRTSmelter
	unknownCount := 0
	conformantCount := 0

	for rowNum, row := range rows[1:] {
		name := getCell(row, nameIdx)
		if name == "" {
			continue // skip empty rows
		}

		country := getCell(row, countryIdx)
		mineral := ""
		if hasMineral {
			mineral = getCell(row, mineralIdx)
		}
		ref := ""
		if refIdx >= 0 && refIdx < len(row) {
			ref = strings.TrimSpace(row[refIdx])
		}

		// Validate against RMI list
		rmi := LookupRMISmelter(name)
		status := "unknown"
		if rmi != nil {
			status = rmi.Status
			if status == "conformant" || status == "active" {
				conformantCount++
			}
		} else {
			unknownCount++
		}

		// If mineral not provided in sheet, try to infer from RMI
		if mineral == "" && rmi != nil {
			mineral = rmi.Mineral
		}

		smelters = append(smelters, models.CMRTSmelter{
			Name:       name,
			Country:    country,
			Mineral:    mineral,
			SmelterRef: ref,
			RMIStatus:  status,
		})

		// Safety limit to avoid memory blow-up on malformed files
		if rowNum > 5000 {
			break
		}
	}

	total := len(smelters)
	conformantPct := 0
	if total > 0 {
		conformantPct = (conformantCount * 100) / total
	}

	return &CMRTImportResult{
		ReportingYear:    reportingYear,
		Smelters:         smelters,
		UnknownSmelters:  unknownCount,
		RMIConformantPct: conformantPct,
		ParsedAt:         time.Now(),
	}, nil
}

// findSmelterSheet attempts to locate the sheet containing smelter data.
func findSmelterSheet(f *excelize.File) string {
	candidates := []string{
		"Smelter List",
		"Smelters",
		"Standard Smelter Names",
		"SmelterName",
		"Sheet1", // fallback
	}
	for _, name := range candidates {
		idx, err := f.GetSheetIndex(name)
		if err == nil && idx >= 0 {
			return name
		}
	}
	// If none matched by name, return the first visible sheet
	for _, name := range f.GetSheetList() {
		return name
	}
	return ""
}

// mapColumnIndices maps header strings to column indices.
func mapColumnIndices(header []string) map[string]int {
	m := make(map[string]int)
	for i, h := range header {
		normalized := strings.ToLower(strings.TrimSpace(h))
		normalized = strings.ReplaceAll(normalized, "_", " ")
		switch normalized {
		case "smelter name", "standard smelter name", "smeltername", "name":
			m["smelter_name"] = i
		case "country", "smelter country", "country location":
			m["country"] = i
		case "mineral", "metal", "mineral mined":
			m["mineral"] = i
		case "smelter ref", "smelter reference", "smelter id", "cid":
			m["smelter_ref"] = i
		}
	}
	return m
}

// getCell safely returns a trimmed string from a row at the given index.
func getCell(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}
