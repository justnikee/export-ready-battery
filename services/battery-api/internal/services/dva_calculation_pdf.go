package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"

	"github.com/anvayalabs/battery-api/internal/models"
)

// ============================================================================
// PLI DVA CALCULATION REPORT (MHI PLI-ACC Scheme)
// ============================================================================
//
// A CA-ready record of how a batch's Domestic Value Addition % was derived —
// either the ESTIMATED cost breakdown (cell/BMS/casing/labour) or the
// AUDITED, CA-certified figure — plus the PLI compliance threshold check.
// Covers:
//   1. Batch Identity
//   2. DVA Calculation (mode-dependent)
//   3. PLI Compliance Status
//   4. Customs Declaration (IMPORTED cells only)

// dvaPDF wraps gofpdf with the same helper styling as the other compliance PDFs.
type dvaPDF struct {
	pdf     *gofpdf.Fpdf
	cursorY float64

	pageW    float64
	pageH    float64
	marginL  float64
	marginR  float64
	marginT  float64
	marginB  float64
	contentW float64
}

func newDVAPDF() *dvaPDF {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	d := &dvaPDF{
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

func (d *dvaPDF) colSecondary() { d.pdf.SetTextColor(100, 116, 139) }
func (d *dvaPDF) colWhite()     { d.pdf.SetTextColor(255, 255, 255) }
func (d *dvaPDF) colBlack()     { d.pdf.SetTextColor(33, 33, 33) }
func (d *dvaPDF) colGreen()     { d.pdf.SetTextColor(22, 163, 74) }
func (d *dvaPDF) colRed()       { d.pdf.SetTextColor(220, 38, 38) }

func (d *dvaPDF) fillPrimary() { d.pdf.SetFillColor(23, 37, 84) }
func (d *dvaPDF) fillLight()   { d.pdf.SetFillColor(241, 245, 249) }
func (d *dvaPDF) fillWhite()   { d.pdf.SetFillColor(255, 255, 255) }
func (d *dvaPDF) fillGreen()   { d.pdf.SetFillColor(220, 252, 231) }
func (d *dvaPDF) fillRed()     { d.pdf.SetFillColor(254, 226, 226) }

func (d *dvaPDF) ensureSpace(h float64) {
	if d.cursorY+h > d.pageH-d.marginB {
		d.pdf.AddPage()
		d.cursorY = d.marginT
	}
}

func (d *dvaPDF) gap(mm float64) {
	d.cursorY += mm
}

func (d *dvaPDF) sectionTitle(num int, title string) {
	d.ensureSpace(14)
	d.fillPrimary()
	d.colWhite()
	d.pdf.SetFont("Arial", "B", 11)
	d.pdf.RoundedRect(d.marginL, d.cursorY, d.contentW, 10, 2, "1234", "F")
	d.pdf.SetXY(d.marginL+4, d.cursorY+1)
	d.pdf.CellFormat(d.contentW-8, 8, fmt.Sprintf("%d. %s", num, title), "", 0, "L", false, 0, "")
	d.cursorY += 13
	d.colBlack()
}

func (d *dvaPDF) keyValue(key, value string) {
	d.ensureSpace(7)
	d.pdf.SetFont("Arial", "B", 9)
	d.colSecondary()
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(58, 6, key, "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "", 9)
	d.colBlack()
	d.pdf.SetXY(d.marginL+60, d.cursorY)
	d.pdf.CellFormat(d.contentW-62, 6, value, "", 0, "L", false, 0, "")
	d.cursorY += 7
}

func (d *dvaPDF) tableRow(cols []string, widths []float64, bold bool, fill bool) {
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
		align := "C"
		if i == 0 {
			align = "L"
		}
		d.pdf.CellFormat(w, 7, col, "1", 0, align, fill, 0, "")
		x += w
	}
	d.cursorY += 7
}

func (d *dvaPDF) statusBadge(label string, pass bool) {
	if pass {
		d.fillGreen()
		d.colGreen()
	} else {
		d.fillRed()
		d.colRed()
	}
	d.pdf.SetFont("Arial", "B", 8)
	tw := d.pdf.GetStringWidth(label) + 6
	x := d.marginL + 2
	d.pdf.RoundedRect(x, d.cursorY, tw, 6, 1.5, "1234", "F")
	d.pdf.SetXY(x+3, d.cursorY+0.7)
	d.pdf.CellFormat(tw-6, 5, label, "", 0, "C", false, 0, "")
	d.cursorY += 9
	d.colBlack()
}

// GenerateDVACalculationReport generates the CA-ready PLI DVA calculation PDF for a batch.
func GenerateDVACalculationReport(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	d := newDVAPDF()

	d.drawHeader(batch, tenant)
	d.drawBatchIdentity(batch)
	d.drawDVACalculation(batch)
	d.drawPLICompliance(batch)
	if batch.Specs.CellSource == "IMPORTED" {
		d.drawCustomsDeclaration(batch)
	}
	d.drawFooter(batch)

	var buf bytes.Buffer
	if err := d.pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate DVA calculation PDF: %w", err)
	}
	return buf.Bytes(), nil
}

func (d *dvaPDF) drawHeader(batch *models.Batch, tenant *models.Tenant) {
	d.pdf.AddPage()
	d.cursorY = d.marginT

	d.fillPrimary()
	d.pdf.RoundedRect(d.marginL, d.cursorY, d.contentW, 22, 3, "1234", "F")
	d.colWhite()
	d.pdf.SetFont("Arial", "B", 16)
	d.pdf.SetXY(d.marginL+6, d.cursorY+2)
	d.pdf.CellFormat(d.contentW-12, 10, "PLI DVA CALCULATION REPORT", "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "", 9)
	d.pdf.SetXY(d.marginL+6, d.cursorY+12)
	d.pdf.CellFormat(d.contentW-12, 7, "MHI PLI-ACC Scheme — Domestic Value Addition Calculation", "", 0, "L", false, 0, "")
	d.cursorY += 28

	d.colBlack()
	d.pdf.SetFont("Arial", "", 8)
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW/2, 5, fmt.Sprintf("Company: %s", tenant.CompanyName), "", 0, "L", false, 0, "")
	d.pdf.SetXY(d.marginL+d.contentW/2, d.cursorY)
	d.pdf.CellFormat(d.contentW/2, 5, fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04 UTC")), "", 0, "R", false, 0, "")
	d.cursorY += 6
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW/2, 5, fmt.Sprintf("Batch: %s", batch.BatchName), "", 0, "L", false, 0, "")
	d.pdf.SetXY(d.marginL+d.contentW/2, d.cursorY)
	d.pdf.CellFormat(d.contentW/2, 5, fmt.Sprintf("Document Ref: %s", batch.ID.String()[:8]), "", 0, "R", false, 0, "")
	d.cursorY += 8

	d.pdf.SetDrawColor(200, 200, 200)
	d.pdf.Line(d.marginL, d.cursorY, d.marginL+d.contentW, d.cursorY)
	d.cursorY += 4
}

func (d *dvaPDF) drawBatchIdentity(batch *models.Batch) {
	d.sectionTitle(1, "Batch Identity")

	d.keyValue("Batch Name", batch.BatchName)
	d.keyValue("Chemistry", batch.Specs.Chemistry)
	d.keyValue("Market Region", string(batch.MarketRegion))
	cellSource := batch.Specs.CellSource
	if cellSource == "" {
		cellSource = "Not specified"
	}
	d.keyValue("Cell Source", cellSource)
	if batch.Specs.HSNCode != "" {
		d.keyValue("HSN Code", batch.Specs.HSNCode)
	}
	d.gap(4)
}

func (d *dvaPDF) drawDVACalculation(batch *models.Batch) {
	d.sectionTitle(2, "Domestic Value Addition Calculation")

	dvaSource := batch.Specs.DVASource
	if dvaSource == "" {
		dvaSource = "ESTIMATED"
	}
	d.keyValue("Calculation Mode", dvaSource)

	if dvaSource == "AUDITED" {
		auditedDVA := 0.0
		if batch.Specs.AuditedDomesticValueAdd != nil {
			auditedDVA = *batch.Specs.AuditedDomesticValueAdd
		}
		d.keyValue("Audited DVA %", fmt.Sprintf("%.2f%%", auditedDVA))
		if batch.Specs.PLICertificateURL != "" {
			d.keyValue("CA Certificate", batch.Specs.PLICertificateURL)
		} else {
			d.keyValue("CA Certificate", "Not uploaded")
		}
		d.gap(2)
		d.ensureSpace(10)
		d.fillLight()
		d.pdf.RoundedRect(d.marginL+2, d.cursorY, d.contentW-4, 9, 1.5, "1234", "F")
		d.pdf.SetFont("Arial", "I", 7.5)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+5, d.cursorY+2)
		d.pdf.CellFormat(d.contentW-10, 6, "This DVA figure was provided by the manufacturer as independently CA-audited and was not recomputed by this platform.", "", 0, "L", false, 0, "")
		d.cursorY += 13
		d.colBlack()
		d.gap(2)
		return
	}

	// ESTIMATED mode: show the cost breakdown the platform used to compute DomesticValueAdd.
	s := batch.Specs
	domesticTotal := s.CellCostDomesticINR + s.BMSCostDomesticINR + s.CasingCostDomesticINR + s.LabourOverheadCostINR
	importedTotal := s.CellCostImportedINR + s.BMSCostImportedINR + s.CasingCostImportedINR
	hasBreakdown := domesticTotal > 0 || importedTotal > 0

	d.gap(2)
	if hasBreakdown {
		colWidths := []float64{d.contentW * 0.40, d.contentW * 0.30, d.contentW * 0.30}
		d.tableRow([]string{"Component", "Imported (INR)", "Domestic (INR)"}, colWidths, true, true)
		d.tableRow([]string{"Cell", fmt.Sprintf("%.2f", s.CellCostImportedINR), fmt.Sprintf("%.2f", s.CellCostDomesticINR)}, colWidths, false, true)
		d.tableRow([]string{"BMS", fmt.Sprintf("%.2f", s.BMSCostImportedINR), fmt.Sprintf("%.2f", s.BMSCostDomesticINR)}, colWidths, false, false)
		d.tableRow([]string{"Casing", fmt.Sprintf("%.2f", s.CasingCostImportedINR), fmt.Sprintf("%.2f", s.CasingCostDomesticINR)}, colWidths, false, true)
		d.tableRow([]string{"Labour & Overhead", "—", fmt.Sprintf("%.2f", s.LabourOverheadCostINR)}, colWidths, false, false)
		d.tableRow([]string{"Total", fmt.Sprintf("%.2f", importedTotal), fmt.Sprintf("%.2f", domesticTotal)}, colWidths, true, true)
		d.gap(3)
		d.keyValue("Net Selling Price", fmt.Sprintf("INR %.2f", s.SalePriceINR))
		d.gap(2)
		d.ensureSpace(10)
		d.fillLight()
		d.pdf.RoundedRect(d.marginL+2, d.cursorY, d.contentW-4, 9, 1.5, "1234", "F")
		d.pdf.SetFont("Arial", "I", 7.5)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+5, d.cursorY+2)
		d.pdf.CellFormat(d.contentW-10, 6, "Formula (MHI PLI-ACC): DVA % = Total Domestic Cost / Net Selling Price x 100", "", 0, "L", false, 0, "")
		d.cursorY += 13
		d.colBlack()
	} else {
		d.keyValue("Net Selling Price", fmt.Sprintf("INR %.2f", s.SalePriceINR))
		d.keyValue("Import Cost", fmt.Sprintf("INR %.2f", s.ImportCostINR))
		d.gap(2)
		d.ensureSpace(10)
		d.fillLight()
		d.pdf.RoundedRect(d.marginL+2, d.cursorY, d.contentW-4, 9, 1.5, "1234", "F")
		d.pdf.SetFont("Arial", "I", 7.5)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+5, d.cursorY+2)
		d.pdf.CellFormat(d.contentW-10, 6, "Legacy formula (no component breakdown on file): DVA % = (Sale Price - Import Cost) / Sale Price x 100", "", 0, "L", false, 0, "")
		d.cursorY += 13
		d.colBlack()
	}

	d.gap(2)
	d.keyValue("Calculated DVA %", fmt.Sprintf("%.2f%%", batch.DomesticValueAdd))
	d.gap(4)
}

func (d *dvaPDF) drawPLICompliance(batch *models.Batch) {
	d.sectionTitle(3, "PLI Compliance Status")

	d.keyValue("PLI Compliant (declared)", fmt.Sprintf("%t", batch.PLICompliant))
	d.keyValue("Minimum DVA Required", "50.00%")
	d.keyValue("Calculated DVA %", fmt.Sprintf("%.2f%%", batch.DomesticValueAdd))

	d.gap(2)
	meetsThreshold := batch.DomesticValueAdd >= 50.0
	if batch.PLICompliant && meetsThreshold {
		d.statusBadge("PLI THRESHOLD MET", true)
	} else if batch.PLICompliant && !meetsThreshold {
		d.statusBadge("DECLARED COMPLIANT BUT BELOW 50% THRESHOLD", false)
	} else {
		d.statusBadge("NOT CLAIMED AS PLI COMPLIANT", false)
	}
	d.gap(4)
}

func (d *dvaPDF) drawCustomsDeclaration(batch *models.Batch) {
	d.sectionTitle(4, "Customs Declaration (Imported Cells)")

	s := batch.Specs
	if s.BillOfEntryNo != "" {
		d.keyValue("Bill of Entry No.", s.BillOfEntryNo)
	}
	if s.CountryOfOrigin != "" {
		d.keyValue("Country of Origin", s.CountryOfOrigin)
	}
	if s.CustomsDate != "" {
		d.keyValue("Import Date", s.CustomsDate)
	}
	d.gap(4)
}

func (d *dvaPDF) drawFooter(batch *models.Batch) {
	d.ensureSpace(20)
	d.gap(6)

	d.pdf.SetDrawColor(200, 200, 200)
	d.pdf.Line(d.marginL, d.cursorY, d.marginL+d.contentW, d.cursorY)
	d.cursorY += 4

	d.pdf.SetFont("Arial", "I", 7)
	d.colSecondary()
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, fmt.Sprintf("Generated by AnvayaLabs Battery Passport Platform | Document Reference: %s", batch.ID.String()), "", 0, "C", false, 0, "")
	d.cursorY += 5
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, "This report shows the inputs and formula used to derive the DVA %. It does not itself constitute a Chartered Accountant audit certificate.", "", 0, "C", false, 0, "")
}
