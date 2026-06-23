package services

import (
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf"

	"github.com/anvayalabs/textile-api/internal/models"
)

// ============================================================================
// DUE DILIGENCE REPORT PDF (EU 2023/1542 Art. 39)
// ============================================================================
//
// Generates a multi-page A4 PDF covering:
//   1. Batch Identity
//   2. Material Composition & Recycled Content
//   3. Carbon Footprint Declaration
//   4. Hazardous Substances (REACH/RoHS)
//   5. Supply Chain Details
//   6. Certifications & Warranty

// ddPDF wraps gofpdf with helper methods for consistent styling.
type ddPDF struct {
	pdf     *gofpdf.Fpdf
	cursorY float64

	// Page constants
	pageW    float64
	pageH    float64
	marginL  float64
	marginR  float64
	marginT  float64
	marginB  float64
	contentW float64
}

func newDDPDF() *ddPDF {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	d := &ddPDF{
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

func (d *ddPDF) colPrimary()   { d.pdf.SetTextColor(23, 37, 84) }    // navy
func (d *ddPDF) colSecondary() { d.pdf.SetTextColor(100, 116, 139) } // slate-500
func (d *ddPDF) colWhite()     { d.pdf.SetTextColor(255, 255, 255) }
func (d *ddPDF) colBlack()     { d.pdf.SetTextColor(33, 33, 33) }
func (d *ddPDF) colGreen()     { d.pdf.SetTextColor(22, 163, 74) }
func (d *ddPDF) colRed()       { d.pdf.SetTextColor(220, 38, 38) }
func (d *ddPDF) colAmber()     { d.pdf.SetTextColor(180, 83, 9) }

func (d *ddPDF) fillPrimary() { d.pdf.SetFillColor(23, 37, 84) }    // navy
func (d *ddPDF) fillLight()   { d.pdf.SetFillColor(241, 245, 249) } // slate-100
func (d *ddPDF) fillWhite()   { d.pdf.SetFillColor(255, 255, 255) }
func (d *ddPDF) fillGreen()   { d.pdf.SetFillColor(220, 252, 231) } // green-100
func (d *ddPDF) fillRed()     { d.pdf.SetFillColor(254, 226, 226) } // red-100
func (d *ddPDF) fillAmber()   { d.pdf.SetFillColor(254, 243, 199) } // amber-100

// --- Spacing helpers ---------------------------------------------------------

func (d *ddPDF) ensureSpace(h float64) {
	if d.cursorY+h > d.pageH-d.marginB {
		d.pdf.AddPage()
		d.cursorY = d.marginT
	}
}

func (d *ddPDF) gap(mm float64) {
	d.cursorY += mm
}

// --- Drawing helpers ---------------------------------------------------------

func (d *ddPDF) sectionTitle(num int, title string) {
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

func (d *ddPDF) keyValue(key, value string) {
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

// tableRow draws a row with evenly distributed columns, optionally filled.
func (d *ddPDF) tableRow(cols []string, widths []float64, bold bool, fill bool) {
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

// statusBadge renders a small coloured status indicator.
func (d *ddPDF) statusBadge(x, y float64, label string, status string) {
	switch status {
	case "pass":
		d.fillGreen()
		d.colGreen()
	case "fail":
		d.fillRed()
		d.colRed()
	default:
		d.fillAmber()
		d.colAmber()
	}
	d.pdf.SetFont("Arial", "B", 7)
	d.pdf.SetXY(x, y)
	tw := d.pdf.GetStringWidth(label) + 4
	d.pdf.RoundedRect(x, y, tw, 5, 1, "1234", "F")
	d.pdf.SetXY(x+2, y+0.5)
	d.pdf.CellFormat(tw-4, 4, label, "", 0, "C", false, 0, "")
	d.colBlack()
}

// --- Report generation -------------------------------------------------------

// GenerateDueDiligenceReport generates the textile due diligence PDF.
func GenerateDueDiligenceReport(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	tenant.EnsureTextileProfile()
	return GenerateTextileDueDiligenceReport(batch, tenant)
}
