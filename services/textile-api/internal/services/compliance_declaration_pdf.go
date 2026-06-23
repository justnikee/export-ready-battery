package services

import (
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf"

	"github.com/anvayalabs/textile-api/internal/models"
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

// GenerateComplianceDeclaration generates the textile compliance declaration PDF.
func GenerateComplianceDeclaration(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	tenant.EnsureTextileProfile()
	return GenerateTextileComplianceDeclaration(batch, tenant)
}

// generateTextileComplianceDeclaration is a placeholder kept for naming consistency.
// The actual implementation lives in textile_compliance_declaration_pdf.go.
func generateTextileComplianceDeclaration(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	return GenerateTextileComplianceDeclaration(batch, tenant)
}
