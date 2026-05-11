package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"

	"anvayalabs-battery/internal/models"
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

// GenerateDueDiligenceReport creates the full due diligence PDF.
func GenerateDueDiligenceReport(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	d := newDDPDF()

	d.drawHeader(batch, tenant)
	d.drawBatchIdentity(batch)
	d.drawMaterialComposition(batch.Specs)
	d.drawCarbonFootprint(batch)
	d.drawHazardousSubstances(batch.Specs)
	d.drawSupplyChain(batch, tenant)
	d.drawCertifications(batch.Specs)
	d.drawFooter(batch)

	var buf bytes.Buffer
	if err := d.pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate due diligence PDF: %w", err)
	}
	return buf.Bytes(), nil
}

// --- Sections ----------------------------------------------------------------

func (d *ddPDF) drawHeader(batch *models.Batch, tenant *models.Tenant) {
	d.pdf.AddPage()
	d.cursorY = d.marginT

	// Title bar
	d.fillPrimary()
	d.pdf.RoundedRect(d.marginL, d.cursorY, d.contentW, 22, 3, "1234", "F")
	d.colWhite()
	d.pdf.SetFont("Arial", "B", 16)
	d.pdf.SetXY(d.marginL+6, d.cursorY+2)
	d.pdf.CellFormat(d.contentW-12, 10, "EU DUE DILIGENCE REPORT", "", 0, "L", false, 0, "")
	d.pdf.SetFont("Arial", "", 9)
	d.pdf.SetXY(d.marginL+6, d.cursorY+12)
	d.pdf.CellFormat(d.contentW-12, 7, "EU Battery Regulation 2023/1542, Art. 39 — Supply Chain Due Diligence", "", 0, "L", false, 0, "")
	d.cursorY += 28

	// Meta info
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

	// Divider
	d.pdf.SetDrawColor(200, 200, 200)
	d.pdf.Line(d.marginL, d.cursorY, d.marginL+d.contentW, d.cursorY)
	d.cursorY += 4
}

func (d *ddPDF) drawBatchIdentity(batch *models.Batch) {
	d.sectionTitle(1, "Batch Identity")

	d.keyValue("Batch Name", batch.BatchName)
	d.keyValue("Model", batch.ModelName)
	d.keyValue("Chemistry", batch.Specs.Chemistry)
	d.keyValue("Capacity", batch.Specs.Capacity)
	d.keyValue("Nominal Voltage", batch.Specs.NominalVoltage)
	d.keyValue("Weight", batch.Specs.Weight)
	d.keyValue("Market Region", string(batch.MarketRegion))
	d.keyValue("Country of Origin", batch.Specs.CountryOfOrigin)
	d.keyValue("Status", batch.Status)

	if batch.ManufacturingStartDate != nil {
		start := batch.ManufacturingStartDate.Format("2006-01-02")
		end := "ongoing"
		if batch.ManufacturingEndDate != nil {
			end = batch.ManufacturingEndDate.Format("2006-01-02")
		}
		d.keyValue("Mfg. Window", fmt.Sprintf("%s — %s", start, end))
	}
	d.gap(4)
}

func (d *ddPDF) drawMaterialComposition(specs models.BatchSpec) {
	d.sectionTitle(2, "Material Composition & Recycled Content")

	mc := specs.MaterialComposition
	if mc == nil {
		d.pdf.SetFont("Arial", "I", 9)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+2, d.cursorY)
		d.pdf.CellFormat(d.contentW, 6, "No material composition data declared for this batch.", "", 0, "L", false, 0, "")
		d.cursorY += 8
		d.colBlack()
		return
	}

	// Table header
	colWidths := []float64{d.contentW * 0.22, d.contentW * 0.16, d.contentW * 0.18, d.contentW * 0.20, d.contentW * 0.24}
	d.tableRow([]string{"Material", "Total %", "Recycled %", "EU 2030 Target", "Status"}, colWidths, true, true)

	// Helper to determine compliance status
	type matRow struct {
		name       string
		totalPct   float64
		recycPct   float64
		target2030 float64
	}

	materials := []matRow{
		{"Cobalt", mc.CobaltPct, mc.RecycledCobaltPct, 16.0},
		{"Lithium", mc.LithiumPct, mc.RecycledLithiumPct, 6.0},
		{"Nickel", mc.NickelPct, mc.RecycledNickelPct, 6.0},
		{"Lead", mc.LeadPct, mc.RecycledLeadPct, 85.0},
		{"Manganese", mc.ManganesePct, 0, 0},
		{"Graphite", mc.GraphitePct, 0, 0},
	}

	for i, m := range materials {
		fill := i%2 == 0
		totalStr := fmt.Sprintf("%.1f%%", m.totalPct)
		var recycStr, targetStr, statusStr string

		if m.target2030 > 0 {
			recycStr = fmt.Sprintf("%.1f%%", m.recycPct)
			targetStr = fmt.Sprintf(">= %.0f%%", m.target2030)
			if m.recycPct >= m.target2030 {
				statusStr = "COMPLIANT"
			} else if m.recycPct > 0 {
				statusStr = "BELOW TARGET"
			} else {
				statusStr = "NOT DECLARED"
			}
		} else {
			recycStr = "N/A"
			targetStr = "—"
			statusStr = "—"
		}

		if m.totalPct == 0 && m.recycPct == 0 && m.target2030 == 0 {
			totalStr = "0.0%"
		}

		d.tableRow([]string{m.name, totalStr, recycStr, targetStr, statusStr}, colWidths, false, fill)
	}

	// Overall recycled content
	if specs.RecycledContentPct != nil {
		d.gap(3)
		d.keyValue("Overall Recycled Content", fmt.Sprintf("%.1f%%", *specs.RecycledContentPct))
	}
	d.gap(4)
}

func (d *ddPDF) drawCarbonFootprint(batch *models.Batch) {
	d.sectionTitle(3, "Carbon Footprint Declaration")

	cf := batch.Specs.CarbonFootprint
	if cf == "" {
		d.pdf.SetFont("Arial", "I", 9)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+2, d.cursorY)
		d.pdf.CellFormat(d.contentW, 6, "No carbon footprint declared for this batch.", "", 0, "L", false, 0, "")
		d.cursorY += 8
		d.colBlack()
		return
	}

	d.keyValue("Declared Carbon Footprint", cf)

	// If there's a calculated carbon result, extract the per-kWh value
	carbonPerKWh := ExtractCarbonPerKWh(batch.CarbonFootprintResult)
	if carbonPerKWh > 0 {
		d.keyValue("Calculated (per kWh)", fmt.Sprintf("%.2f kg CO2e/kWh", carbonPerKWh))
	}

	d.keyValue("Methodology", "JRC 2024 — EU Rules for Carbon Footprint Calculation")
	d.keyValue("Regulation Reference", "EU 2023/1542 Art. 7 — Carbon Footprint Declaration")

	// Compliance note
	d.gap(2)
	d.ensureSpace(12)
	d.fillLight()
	d.pdf.RoundedRect(d.marginL+2, d.cursorY, d.contentW-4, 10, 1.5, "1234", "F")
	d.pdf.SetFont("Arial", "I", 7.5)
	d.colSecondary()
	d.pdf.SetXY(d.marginL+5, d.cursorY+2)
	d.pdf.CellFormat(d.contentW-10, 6, "Mandatory for industrial (>2 kWh) and EV batteries placed on the EU market from 18 February 2025.", "", 0, "L", false, 0, "")
	d.cursorY += 14
	d.colBlack()
}

func (d *ddPDF) drawHazardousSubstances(specs models.BatchSpec) {
	d.sectionTitle(4, "Hazardous Substances (REACH / RoHS)")

	hs := specs.HazardousSubstances
	if hs == nil {
		d.pdf.SetFont("Arial", "I", 9)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+2, d.cursorY)
		d.pdf.CellFormat(d.contentW, 6, "No hazardous substance declarations for this batch.", "", 0, "L", false, 0, "")
		d.cursorY += 8
		d.colBlack()
		return
	}

	// Substance presence table
	colWidths := []float64{d.contentW * 0.40, d.contentW * 0.30, d.contentW * 0.30}
	d.tableRow([]string{"Substance", "Present", "RoHS Status"}, colWidths, true, true)

	type substRow struct {
		name    string
		present bool
	}
	substances := []substRow{
		{"Lead (Pb)", hs.LeadPresent},
		{"Mercury (Hg)", hs.MercuryPresent},
		{"Cadmium (Cd)", hs.CadmiumPresent},
	}

	for i, s := range substances {
		present := "No"
		rohsStatus := "Compliant"
		if s.present {
			present = "Yes"
			rohsStatus = "Review Required"
		}
		d.tableRow([]string{s.name, present, rohsStatus}, colWidths, false, i%2 == 0)
	}

	// Declaration and exemptions
	if hs.Declaration != "" {
		d.gap(3)
		d.keyValue("Declaration", hs.Declaration)
	}
	if hs.Exemptions != "" {
		d.keyValue("RoHS Exemptions", hs.Exemptions)
	}
	d.gap(4)
}

func (d *ddPDF) drawSupplyChain(batch *models.Batch, tenant *models.Tenant) {
	d.sectionTitle(5, "Supply Chain & Responsible Sourcing")

	// Manufacturer info
	d.keyValue("Manufacturer", batch.Specs.Manufacturer)
	if batch.Specs.ManufacturerAddress != "" {
		d.keyValue("Manufacturer Address", batch.Specs.ManufacturerAddress)
	}
	d.keyValue("Country of Origin", batch.Specs.CountryOfOrigin)

	// Cell source
	if batch.Specs.CellSource != "" {
		d.keyValue("Cell Source", batch.Specs.CellSource)
	}

	// EU Representative
	d.gap(3)
	d.pdf.SetFont("Arial", "B", 9)
	d.colPrimary()
	d.pdf.SetXY(d.marginL+2, d.cursorY)
	d.pdf.CellFormat(d.contentW, 6, "EU Authorized Representative", "", 0, "L", false, 0, "")
	d.cursorY += 7
	d.colBlack()

	// Prefer batch-level EU rep, fall back to tenant-level
	euRepName := batch.Specs.EURepresentative
	euRepEmail := batch.Specs.EURepresentativeEmail
	if euRepName == "" {
		euRepName = tenant.EUAuthorizedRepresentativeName
	}
	if euRepEmail == "" {
		euRepEmail = tenant.EUContactEmail
	}

	if euRepName != "" {
		d.keyValue("Representative", euRepName)
	} else {
		d.keyValue("Representative", "— Not declared")
	}
	if euRepEmail != "" {
		d.keyValue("Contact Email", euRepEmail)
	}
	if tenant.EUAuthorizedRepresentativeAddress != "" {
		d.keyValue("EU Address", tenant.EUAuthorizedRepresentativeAddress)
	}

	// India-specific compliance (if applicable)
	if batch.MarketRegion == models.MarketRegionIndia || batch.MarketRegion == models.MarketRegionGlobal {
		if batch.Specs.HSNCode != "" || batch.Specs.BISNumber != "" || batch.Specs.EPRNumber != "" {
			d.gap(3)
			d.pdf.SetFont("Arial", "B", 9)
			d.colPrimary()
			d.pdf.SetXY(d.marginL+2, d.cursorY)
			d.pdf.CellFormat(d.contentW, 6, "India Regulatory Compliance", "", 0, "L", false, 0, "")
			d.cursorY += 7
			d.colBlack()

			if batch.Specs.HSNCode != "" {
				d.keyValue("HSN Code", batch.Specs.HSNCode)
			}
			if batch.Specs.BISNumber != "" {
				d.keyValue("BIS R-Number", batch.Specs.BISNumber)
			}
			if batch.Specs.EPRNumber != "" {
				d.keyValue("EPR Number", batch.Specs.EPRNumber)
			}
		}
	}

	d.gap(4)
}

func (d *ddPDF) drawCertifications(specs models.BatchSpec) {
	d.sectionTitle(6, "Certifications & Warranty")

	if len(specs.Certifications) == 0 && specs.WarrantyMonths == nil && specs.ExpectedLifetimeCycles == nil {
		d.pdf.SetFont("Arial", "I", 9)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+2, d.cursorY)
		d.pdf.CellFormat(d.contentW, 6, "No certifications or warranty data declared for this batch.", "", 0, "L", false, 0, "")
		d.cursorY += 8
		d.colBlack()
		return
	}

	if len(specs.Certifications) > 0 {
		d.keyValue("Certifications", strings.Join(specs.Certifications, ", "))
	}
	if specs.ExpectedLifetimeCycles != nil {
		d.keyValue("Expected Lifetime", fmt.Sprintf("%d charge cycles", *specs.ExpectedLifetimeCycles))
	}
	if specs.WarrantyMonths != nil {
		d.keyValue("Warranty Period", fmt.Sprintf("%d months", *specs.WarrantyMonths))
	}
	d.gap(4)
}

func (d *ddPDF) drawFooter(batch *models.Batch) {
	d.ensureSpace(20)
	d.gap(6)

	// Divider
	d.pdf.SetDrawColor(200, 200, 200)
	d.pdf.Line(d.marginL, d.cursorY, d.marginL+d.contentW, d.cursorY)
	d.cursorY += 4

	d.pdf.SetFont("Arial", "I", 7)
	d.colSecondary()
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, fmt.Sprintf("Generated by AnvayaLabs Battery Passport Platform | Document Reference: %s", batch.ID.String()), "", 0, "C", false, 0, "")
	d.cursorY += 5
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW, 4, "This report is auto-generated based on data declared by the manufacturer. It does not constitute independent verification.", "", 0, "C", false, 0, "")
}
