package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"

	"exportready-battery/internal/models"
)

// ============================================================================
// COMPLIANCE DECLARATION PDF (EU 2023/1542 Art. 7 — Carbon Footprint)
// ============================================================================
//
// Generates a single-page A4 PDF containing:
//   1. Manufacturer & Batch Identity
//   2. Carbon Footprint Result (total, per kWh, breakdown)
//   3. Factors Audit Trail
//   4. Legal Declaration Text
//   5. Methodology Reference & Date

// cdPDF wraps gofpdf with helper methods for the compliance declaration.
type cdPDF struct {
	pdf      *gofpdf.Fpdf
	cursorY  float64
	pageW    float64
	pageH    float64
	marginL  float64
	marginR  float64
	marginT  float64
	marginB  float64
	contentW float64
}

func newCDPDF() *cdPDF {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	d := &cdPDF{
		pdf:     pdf,
		pageW:   210,
		pageH:   297,
		marginL: 18,
		marginR: 18,
		marginT: 20,
		marginB: 20,
	}
	d.contentW = d.pageW - d.marginL - d.marginR
	return d
}

// --- Colour palette ----------------------------------------------------------

func (d *cdPDF) colPrimary()   { d.pdf.SetTextColor(23, 37, 84) }    // navy
func (d *cdPDF) colSecondary() { d.pdf.SetTextColor(100, 116, 139) } // slate-500
func (d *cdPDF) colWhite()     { d.pdf.SetTextColor(255, 255, 255) }
func (d *cdPDF) colBlack()     { d.pdf.SetTextColor(33, 33, 33) }
func (d *cdPDF) colGreen()     { d.pdf.SetTextColor(22, 163, 74) }

func (d *cdPDF) fillPrimary() { d.pdf.SetFillColor(23, 37, 84) }    // navy
func (d *cdPDF) fillLight()   { d.pdf.SetFillColor(241, 245, 249) } // slate-100
func (d *cdPDF) fillWhite()   { d.pdf.SetFillColor(255, 255, 255) }
func (d *cdPDF) fillGreen()   { d.pdf.SetFillColor(220, 252, 231) } // green-100

// --- Spacing helpers ---------------------------------------------------------

func (d *cdPDF) ensureSpace(h float64) {
	if d.cursorY+h > d.pageH-d.marginB {
		d.pdf.AddPage()
		d.cursorY = d.marginT
	}
}

func (d *cdPDF) gap(mm float64) {
	d.cursorY += mm
}

// --- Drawing helpers ---------------------------------------------------------

func (d *cdPDF) sectionTitle(num int, title string) {
	d.ensureSpace(14)
	d.fillPrimary()
	d.colWhite()
	d.pdf.SetFont("Arial", "B", 11)
	d.pdf.RoundedRect(d.marginL, d.cursorY, d.contentW, 10, 2, "1234", "F")
	d.pdf.SetXY(d.marginL+4, d.cursorY+1)
	d.pdf.CellFormat(d.contentW-8, 8, fmt.Sprintf("%d. %s", num, strings.ToUpper(title)), "", 0, "L", false, 0, "")
	d.cursorY += 13
	d.colBlack()
}

func (d *cdPDF) keyValue(key, value string) {
	d.ensureSpace(7)
	d.pdf.SetFont("Arial", "B", 9)
	d.colSecondary()
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(52, 6, key, "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "", 9)
	d.colBlack()
	d.pdf.SetXY(d.marginL+54, d.cursorY)
	d.pdf.CellFormat(d.contentW-56, 6, value, "", 0, "L", false, 0, "")
	d.cursorY += 7
}

func (d *cdPDF) tableRow(cols []string, widths []float64, bold bool, fill bool) {
	d.ensureSpace(8)
	if fill {
		d.fillLight()
	} else {
		d.fillWhite()
	}
	fontStyle := ""
	if bold {
		fontStyle = "B"
	}
	d.pdf.SetFont("Arial", fontStyle, 8)
	d.colBlack()
	x := d.marginL
	for i, col := range cols {
		w := widths[i]
		d.pdf.SetXY(x, d.cursorY)
		d.pdf.CellFormat(w, 7, col, "1", 0, "C", fill, 0, "")
		x += w
	}
	d.cursorY += 7
}

// --- Report generation -------------------------------------------------------

// carbonResultJSON mirrors the services.CarbonResult for JSON parsing from batch.
type carbonResultJSON struct {
	TotalKgCO2e     float64             `json:"total_kg_co2e"`
	PerKWhKgCO2e    float64             `json:"per_kwh_kg_co2e"`
	Breakdown       carbonBreakdownJSON `json:"breakdown"`
	Methodology     string              `json:"methodology"`
	CalculationDate string              `json:"calculation_date"`
	DeclarationText string              `json:"declaration_text"`
	FactorsUsed     []carbonFactorUsed  `json:"factors_used"`
}

type carbonBreakdownJSON struct {
	CellProduction float64 `json:"cell_production_kg_co2e"`
	CellEnergy     float64 `json:"cell_energy_kg_co2e"`
	Assembly       float64 `json:"assembly_kg_co2e"`
	Transport      float64 `json:"transport_kg_co2e"`
}

type carbonFactorUsed struct {
	Category    string  `json:"category"`
	Subcategory string  `json:"subcategory"`
	Value       float64 `json:"value"`
	Unit        string  `json:"unit"`
	Source      string  `json:"source"`
}

// GenerateComplianceDeclaration creates the Article 7 carbon footprint declaration PDF.
func GenerateComplianceDeclaration(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	// Parse carbon result from batch
	var cr carbonResultJSON
	if len(batch.CarbonFootprintResult) == 0 {
		return nil, fmt.Errorf("no carbon footprint result stored on batch %s", batch.ID)
	}
	if err := json.Unmarshal(batch.CarbonFootprintResult, &cr); err != nil {
		return nil, fmt.Errorf("invalid carbon footprint JSON: %w", err)
	}

	d := newCDPDF()
	d.pdf.AddPage()
	d.cursorY = d.marginT

	// ── Title ────────────────────────────────────────────────────────────
	d.fillPrimary()
	d.colWhite()
	d.pdf.SetFont("Arial", "B", 16)
	d.pdf.RoundedRect(d.marginL, d.cursorY, d.contentW, 14, 3, "1234", "F")
	d.pdf.SetXY(d.marginL+6, d.cursorY+2)
	d.pdf.CellFormat(d.contentW-12, 10, "CARBON FOOTPRINT DECLARATION", "", 0, "L", false, 0, "")
	d.cursorY += 16

	// Subtitle
	d.colSecondary()
	d.pdf.SetFont("Arial", "", 9)
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 5, "EU Battery Regulation 2023/1542 — Article 7", "", 0, "L", false, 0, "")
	d.cursorY += 5
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 5, fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04 UTC")), "", 0, "L", false, 0, "")
	d.cursorY += 8
	d.colBlack()

	// ── Section 1: Manufacturer & Batch Identity ─────────────────────────
	d.sectionTitle(1, "Manufacturer & Batch Identity")
	d.keyValue("Manufacturer", tenant.CompanyName)
	if tenant.Address != "" {
		d.keyValue("Address", tenant.Address)
	}
	if tenant.EUAuthorizedRepresentativeName != "" {
		d.keyValue("EU Auth. Rep.", tenant.EUAuthorizedRepresentativeName)
	}
	if tenant.EUAuthorizedRepresentativeAddress != "" {
		d.keyValue("EU Rep. Address", tenant.EUAuthorizedRepresentativeAddress)
	}
	d.gap(2)
	d.keyValue("Batch Name", batch.BatchName)
	d.keyValue("Model / Product", batch.ModelName)
	d.keyValue("Market Region", string(batch.MarketRegion))
	d.keyValue("Chemistry", batch.Specs.Chemistry)
	if batch.Specs.Capacity != "" {
		d.keyValue("Capacity", batch.Specs.Capacity)
	}
	if batch.Specs.Weight != "" {
		d.keyValue("Weight", batch.Specs.Weight)
	}
	d.gap(4)

	// ── Section 2: Carbon Footprint Result ───────────────────────────────
	d.sectionTitle(2, "Carbon Footprint Result")

	// Big numbers
	d.ensureSpace(22)
	halfW := d.contentW / 2

	// Total CO2e box
	d.fillGreen()
	d.pdf.RoundedRect(d.marginL, d.cursorY, halfW-2, 18, 2, "1234", "F")
	d.colGreen()
	d.pdf.SetFont("Arial", "", 7)
	d.pdf.SetXY(d.marginL+4, d.cursorY+2)
	d.pdf.CellFormat(halfW-8, 4, "TOTAL CARBON FOOTPRINT", "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "B", 14)
	d.pdf.SetXY(d.marginL+4, d.cursorY+7)
	d.pdf.CellFormat(halfW-8, 8, fmt.Sprintf("%.1f kg CO2e", cr.TotalKgCO2e), "", 0, "L", false, 0, "")

	// Per kWh box
	d.fillLight()
	d.pdf.RoundedRect(d.marginL+halfW, d.cursorY, halfW-2, 18, 2, "1234", "F")
	d.colPrimary()
	d.pdf.SetFont("Arial", "", 7)
	d.pdf.SetXY(d.marginL+halfW+4, d.cursorY+2)
	d.pdf.CellFormat(halfW-8, 4, "PER KWH", "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "B", 14)
	d.pdf.SetXY(d.marginL+halfW+4, d.cursorY+7)
	d.pdf.CellFormat(halfW-8, 8, fmt.Sprintf("%.2f kg CO2e/kWh", cr.PerKWhKgCO2e), "", 0, "L", false, 0, "")

	d.cursorY += 22
	d.colBlack()

	// Breakdown table
	d.gap(4)
	d.sectionTitle(3, "Breakdown by Life-Cycle Stage")
	breakdownWidths := []float64{d.contentW * 0.5, d.contentW * 0.25, d.contentW * 0.25}
	d.tableRow([]string{"Stage", "kg CO2e", "% of Total"}, breakdownWidths, true, true)

	total := cr.TotalKgCO2e
	if total < 0.01 {
		total = 1 // avoid division by zero
	}
	stages := []struct {
		name  string
		value float64
	}{
		{"Cell Production", cr.Breakdown.CellProduction},
		{"Cell Manufacturing Energy", cr.Breakdown.CellEnergy},
		{"Pack Assembly", cr.Breakdown.Assembly},
		{"Transport", cr.Breakdown.Transport},
	}
	for i, s := range stages {
		pct := (s.value / total) * 100
		d.tableRow(
			[]string{s.name, fmt.Sprintf("%.1f", s.value), fmt.Sprintf("%.1f%%", pct)},
			breakdownWidths, false, i%2 == 0,
		)
	}
	d.gap(4)

	// ── Section 4: Factors Audit Trail ───────────────────────────────────
	if len(cr.FactorsUsed) > 0 {
		d.sectionTitle(4, "Emission Factors Audit Trail")
		factorWidths := []float64{d.contentW * 0.2, d.contentW * 0.2, d.contentW * 0.15, d.contentW * 0.15, d.contentW * 0.3}
		d.tableRow([]string{"Category", "Subcategory", "Value", "Unit", "Source"}, factorWidths, true, true)
		for i, f := range cr.FactorsUsed {
			d.tableRow(
				[]string{f.Category, f.Subcategory, fmt.Sprintf("%.4f", f.Value), f.Unit, f.Source},
				factorWidths, false, i%2 == 0,
			)
		}
		d.gap(4)
	}

	// ── Section 5: Declaration ───────────────────────────────────────────
	sectionNum := 4
	if len(cr.FactorsUsed) > 0 {
		sectionNum = 5
	}
	d.sectionTitle(sectionNum, "Legal Declaration")
	d.ensureSpace(20)
	d.pdf.SetFont("Arial", "I", 9)
	d.colBlack()
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.MultiCell(d.contentW-4, 5, cr.DeclarationText, "", "L", false)
	d.cursorY += float64(len(cr.DeclarationText)/80+1) * 5
	d.gap(3)

	// Methodology & date
	d.keyValue("Methodology", cr.Methodology)
	if cr.CalculationDate != "" {
		d.keyValue("Calculation Date", cr.CalculationDate)
	}
	d.gap(6)

	// ── Footer / Signature Block ─────────────────────────────────────────
	d.ensureSpace(20)
	d.pdf.SetDrawColor(200, 200, 200)
	d.pdf.Line(d.marginL, d.cursorY, d.marginL+d.contentW, d.cursorY)
	d.cursorY += 3
	d.colSecondary()
	d.pdf.SetFont("Arial", "", 8)
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, "Authorized Signatory: ____________________________________________", "", 0, "L", false, 0, "")
	d.cursorY += 6
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, fmt.Sprintf("Date: %s", time.Now().Format("02 January 2006")), "", 0, "L", false, 0, "")
	d.cursorY += 6
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, fmt.Sprintf("Company: %s", tenant.CompanyName), "", 0, "L", false, 0, "")
	d.cursorY += 8

	// Confidentiality notice
	d.colSecondary()
	d.pdf.SetFont("Arial", "I", 7)
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.MultiCell(d.contentW, 4, "This document is generated by ExportReady Battery Passport Platform. "+
		"The carbon footprint values declared herein are calculated per EU Regulation 2023/1542 Article 7, "+
		"using JRC-aligned emission factors. This declaration forms part of the battery passport documentation.", "", "C", false)

	// Write to buffer
	var buf bytes.Buffer
	if err := d.pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate compliance declaration PDF: %w", err)
	}
	return buf.Bytes(), nil
}
