package services

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"

	"anvayalabs-battery/internal/models"
)

// ============================================================================
// COMPLIANCE REPORT PDF — Score, Gaps & Regulatory Checklist
// ============================================================================

// crPDF wraps gofpdf with helpers for the compliance report.
type crPDF struct {
	pdf      *gofpdf.Fpdf
	pageW    float64
	marginL  float64
	marginR  float64
	contentW float64
}

func newCRPDF() *crPDF {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	d := &crPDF{
		pdf:     pdf,
		pageW:   210,
		marginL: 18,
		marginR: 18,
	}
	d.contentW = d.pageW - d.marginL - d.marginR
	return d
}

func (d *crPDF) colPrimary()   { d.pdf.SetTextColor(23, 37, 84) }
func (d *crPDF) colSecondary() { d.pdf.SetTextColor(100, 116, 139) }
func (d *crPDF) colWhite()     { d.pdf.SetTextColor(255, 255, 255) }
func (d *crPDF) colBlack()     { d.pdf.SetTextColor(33, 33, 33) }
func (d *crPDF) colRed()       { d.pdf.SetTextColor(185, 28, 28) }
func (d *crPDF) colGreen()     { d.pdf.SetTextColor(22, 101, 52) }
func (d *crPDF) colAmber()     { d.pdf.SetTextColor(180, 83, 9) }

// complianceGap mirrors the compliance.Gap struct for JSON unmarshalling.
type complianceGap struct {
	Field      string `json:"field"`
	Market     string `json:"market"`
	Regulation string `json:"regulation"`
	Message    string `json:"message"`
	Severity   string `json:"severity"`
}

// GenerateComplianceReport produces a PDF summarising a batch's compliance
// status: overall score, pass/fail status per market, and a detailed gap table.
func GenerateComplianceReport(batch *models.Batch, tenant *models.Tenant) ([]byte, error) {
	d := newCRPDF()
	pdf := d.pdf

	pdf.SetMargins(d.marginL, 20, d.marginR)
	pdf.AddPage()

	// ---- Header banner ----
	pdf.SetFillColor(23, 37, 84)
	pdf.Rect(0, 0, d.pageW, 38, "F")
	pdf.SetFont("Helvetica", "B", 18)
	d.colWhite()
	pdf.SetXY(d.marginL, 10)
	pdf.CellFormat(d.contentW, 10, "Compliance Assessment Report", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetX(d.marginL)
	pdf.CellFormat(d.contentW, 7, fmt.Sprintf("Generated %s", time.Now().Format("02 Jan 2006, 15:04 UTC")), "", 1, "L", false, 0, "")

	pdf.SetY(45)

	// ---- Batch Identity ----
	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, "Batch Details", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	d.kvRow("Batch Name", batch.BatchName)
	d.kvRow("Model", batch.ModelName)
	d.kvRow("Product Type", string(batch.ProductType))
	d.kvRow("Market Region", string(batch.MarketRegion))
	if tenant != nil {
		d.kvRow("Manufacturer", tenant.CompanyName)
	}
	d.kvRow("Status", batch.Status)
	pdf.Ln(4)

	// ---- Compliance Score ----
	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, "Compliance Score", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	scoreStr := fmt.Sprintf("%.1f / 100.0", batch.ComplianceScore)
	pdf.SetFont("Helvetica", "B", 22)
	switch {
	case batch.ComplianceScore >= 80:
		d.colGreen()
	case batch.ComplianceScore >= 50:
		d.colAmber()
	default:
		d.colRed()
	}
	pdf.CellFormat(d.contentW, 12, scoreStr, "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// ---- Compliance Gaps Table ----
	var gaps []complianceGap
	if len(batch.ComplianceGaps) > 0 {
		_ = json.Unmarshal(batch.ComplianceGaps, &gaps)
	}

	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, fmt.Sprintf("Compliance Gaps (%d)", len(gaps)), "", 1, "L", false, 0, "")
	pdf.Ln(2)

	if len(gaps) == 0 {
		pdf.SetFont("Helvetica", "I", 10)
		d.colGreen()
		pdf.CellFormat(d.contentW, 7, "No compliance gaps detected — all checks passed.", "", 1, "L", false, 0, "")
	} else {
		// Table header
		colWidths := []float64{d.contentW * 0.18, d.contentW * 0.12, d.contentW * 0.10, d.contentW * 0.35, d.contentW * 0.25}
		headers := []string{"Field", "Market", "Severity", "Message", "Regulation"}

		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(241, 245, 249)
		d.colPrimary()
		for i, h := range headers {
			pdf.CellFormat(colWidths[i], 7, h, "1", 0, "L", true, 0, "")
		}
		pdf.Ln(-1)

		// Table rows
		pdf.SetFont("Helvetica", "", 7.5)
		for _, g := range gaps {
			d.colBlack()

			field := truncate(g.Field, 28)
			market := truncate(g.Market, 16)
			severity := g.Severity
			msg := truncate(g.Message, 55)
			reg := truncate(g.Regulation, 38)

			// Row height based on longest content
			pdf.CellFormat(colWidths[0], 6, field, "1", 0, "L", false, 0, "")
			pdf.CellFormat(colWidths[1], 6, market, "1", 0, "L", false, 0, "")

			switch strings.ToUpper(severity) {
			case "ERROR":
				d.colRed()
			case "WARNING":
				d.colAmber()
			default:
				d.colBlack()
			}
			pdf.CellFormat(colWidths[2], 6, severity, "1", 0, "C", false, 0, "")
			d.colBlack()

			pdf.CellFormat(colWidths[3], 6, msg, "1", 0, "L", false, 0, "")
			pdf.CellFormat(colWidths[4], 6, reg, "1", 0, "L", false, 0, "")
			pdf.Ln(-1)
		}
	}

	pdf.Ln(6)

	// ---- India AIS-156 / EPR / BIS Checklist (when market = INDIA or GLOBAL) ----
	if batch.MarketRegion == "INDIA" || batch.MarketRegion == "GLOBAL" {
		d.addIndiaChecklistSection(batch, tenant)
	}

	// ---- EU 2023/1542 Regulatory References (when market = EU or GLOBAL) ----
	if batch.MarketRegion == "EU" || batch.MarketRegion == "GLOBAL" {
		d.addEURegulatorySection(batch)
	}

	// ---- Cryptographic Integrity Hash ----
	specsHash := computeSpecsHash(batch)
	pdf.Ln(4)
	pdf.SetFont("Helvetica", "B", 9)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 6, "Data Integrity", "", 1, "L", false, 0, "")
	pdf.SetFont("Courier", "", 7)
	d.colSecondary()
	pdf.CellFormat(d.contentW, 5, fmt.Sprintf("SHA-256: %s", specsHash), "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// ---- Footer disclaimer ----
	pdf.SetFont("Helvetica", "I", 8)
	d.colSecondary()
	pdf.MultiCell(d.contentW, 4,
		"This report is generated automatically by AnvayaLabs and reflects the compliance status at the time of batch activation. "+
			"It does not constitute a legal certification. Manufacturers are responsible for ensuring full regulatory compliance "+
			"with applicable standards (EU 2023/1542, AIS-156, BIS CRS, BWM Rules 2022).",
		"", "L", false)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate compliance report PDF: %w", err)
	}
	return buf.Bytes(), nil
}

// kvRow draws a label:value row in the PDF.
func (d *crPDF) kvRow(label, value string) {
	d.pdf.SetFont("Helvetica", "B", 9)
	d.colSecondary()
	d.pdf.CellFormat(40, 6, label+":", "", 0, "L", false, 0, "")
	d.pdf.SetFont("Helvetica", "", 9)
	d.colBlack()
	d.pdf.CellFormat(d.contentW-40, 6, value, "", 1, "L", false, 0, "")
}

// truncate shortens s to max characters, adding "…" if truncated.
func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "…"
}

// ---- India AIS-156 / EPR / BIS Checklist ----

type ais156Check struct {
	Item   string
	Status string // PASS, FAIL, N/A
	Detail string
}

func (d *crPDF) addIndiaChecklistSection(batch *models.Batch, tenant *models.Tenant) {
	pdf := d.pdf

	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, "India Regulatory Checklist (AIS-156 / EPR / BIS)", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	// Build checklist items
	checks := []ais156Check{
		d.checkBISRegistration(tenant),
		d.checkEPRCertificate(tenant),
		d.checkDVAThreshold(batch),
		d.checkHSNCode(batch),
		d.checkCountryOfOrigin(batch),
		d.checkBatteryChemistry(batch),
	}

	// Render table
	colW := []float64{d.contentW * 0.35, d.contentW * 0.12, d.contentW * 0.53}
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(255, 247, 237) // warm orange tint
	d.colPrimary()
	pdf.CellFormat(colW[0], 7, "Requirement", "1", 0, "L", true, 0, "")
	pdf.CellFormat(colW[1], 7, "Status", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colW[2], 7, "Details", "1", 0, "L", true, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("Helvetica", "", 8)
	for _, c := range checks {
		d.colBlack()
		pdf.CellFormat(colW[0], 6, c.Item, "1", 0, "L", false, 0, "")
		switch c.Status {
		case "PASS":
			d.colGreen()
		case "FAIL":
			d.colRed()
		default:
			d.colSecondary()
		}
		pdf.CellFormat(colW[1], 6, c.Status, "1", 0, "C", false, 0, "")
		d.colBlack()
		pdf.CellFormat(colW[2], 6, truncate(c.Detail, 70), "1", 0, "L", false, 0, "")
		pdf.Ln(-1)
	}
	pdf.Ln(4)
}

func (d *crPDF) checkBISRegistration(tenant *models.Tenant) ais156Check {
	if tenant != nil && tenant.BatteryProfile.BISRNumber != "" {
		return ais156Check{"BIS CRS Registration (IS 16046)", "PASS", fmt.Sprintf("R-No: %s", tenant.BatteryProfile.BISRNumber)}
	}
	return ais156Check{"BIS CRS Registration (IS 16046)", "FAIL", "No BIS R-number found on tenant profile"}
}

func (d *crPDF) checkEPRCertificate(tenant *models.Tenant) ais156Check {
	if tenant != nil && tenant.BatteryProfile.EPRRegistrationNumber != "" {
		return ais156Check{"EPR Registration (BWM Rules 2022)", "PASS", fmt.Sprintf("EPR-ID: %s", tenant.BatteryProfile.EPRRegistrationNumber)}
	}
	return ais156Check{"EPR Registration (BWM Rules 2022)", "FAIL", "No EPR registration number found"}
}

func (d *crPDF) checkDVAThreshold(batch *models.Batch) ais156Check {
	dva := batch.DomesticValueAdd
	if dva >= 25.0 {
		return ais156Check{"Domestic Value Add (PLI ≥25%)", "PASS", fmt.Sprintf("DVA: %.1f%%", dva)}
	}
	if dva > 0 {
		return ais156Check{"Domestic Value Add (PLI ≥25%)", "FAIL", fmt.Sprintf("DVA: %.1f%% — below 25%% threshold", dva)}
	}
	return ais156Check{"Domestic Value Add (PLI ≥25%)", "N/A", "DVA not declared"}
}

func (d *crPDF) checkHSNCode(batch *models.Batch) ais156Check {
	if batch.HSNCode != "" {
		return ais156Check{"HSN Code (Customs)", "PASS", fmt.Sprintf("HSN: %s", batch.HSNCode)}
	}
	return ais156Check{"HSN Code (Customs)", "FAIL", "HSN code not provided"}
}

func (d *crPDF) checkCountryOfOrigin(batch *models.Batch) ais156Check {
	if batch.CountryOfOrigin != "" {
		return ais156Check{"Country of Origin Declaration", "PASS", batch.CountryOfOrigin}
	}
	return ais156Check{"Country of Origin Declaration", "FAIL", "Country of origin not declared"}
}

func (d *crPDF) checkBatteryChemistry(batch *models.Batch) ais156Check {
	chem := batch.Specs.Chemistry
	if chem != "" {
		return ais156Check{"Battery Chemistry (AIS-156 Cat.)", "PASS", chem}
	}
	return ais156Check{"Battery Chemistry (AIS-156 Cat.)", "FAIL", "Chemistry not declared"}
}

// ---- EU 2023/1542 Regulatory References ----

func (d *crPDF) addEURegulatorySection(batch *models.Batch) {
	pdf := d.pdf

	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, "EU Battery Regulation 2023/1542 References", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	refs := []struct {
		Article string
		Title   string
	}{
		{"Art. 7", "Carbon Footprint Declaration"},
		{"Art. 8", "Recycled Content Disclosure"},
		{"Art. 10", "Due Diligence in Supply Chain"},
		{"Art. 11", "Performance & Durability Requirements"},
		{"Art. 13", "Labelling & Marking"},
		{"Art. 77", "Battery Passport (Digital Product Passport)"},
	}

	pdf.SetFont("Helvetica", "", 8)
	for _, r := range refs {
		d.colPrimary()
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(25, 5, r.Article, "", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 8)
		d.colBlack()
		pdf.CellFormat(d.contentW-25, 5, r.Title, "", 1, "L", false, 0, "")
	}
	pdf.Ln(4)
}

// ---- Cryptographic Hash ----

func computeSpecsHash(batch *models.Batch) string {
	specsJSON, _ := json.Marshal(batch.Specs)
	data := []byte(fmt.Sprintf("%s|%s|%s|%.1f|%s",
		batch.BatchName, batch.ProductType, batch.MarketRegion,
		batch.ComplianceScore, string(specsJSON)))
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}
