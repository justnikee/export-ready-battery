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

	"github.com/anvayalabs/textile-api/internal/models"
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

	// ---- Product-specific regulatory sections ----
	d.addTextileComplianceSummary(batch, tenant)

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
	disclaimer := "This report is generated automatically by AnvayaLabs and reflects the compliance status at the time of batch activation. " +
		"It does not constitute a legal certification. Manufacturers are responsible for ensuring full regulatory compliance " +
		"with applicable standards (Legal Metrology Rules 2011, Textiles QCO, ESPR, REACH/ZDHC MRSL)."
	pdf.MultiCell(d.contentW, 4, disclaimer, "", "L", false)

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

type textileCheck struct {
	Item   string
	Status string // PASS, FAIL, N/A
	Detail string
}

// ---- Textile Compliance Summary ----

func (d *crPDF) addTextileComplianceSummary(batch *models.Batch, tenant *models.Tenant) {
	pdf := d.pdf

	pdf.SetFont("Helvetica", "B", 13)
	d.colPrimary()
	pdf.CellFormat(d.contentW, 8, "Textile Compliance Summary", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	// Build checklist items
	checks := []textileCheck{
		checkFiberComposition(batch),
		checkGSM(batch),
		checkLaborCompliance(batch),
		checkChemicalCompliance(batch),
		checkWaterEnergyUsage(batch),
		checkExpectedLifetime(batch),
	}

	colW := []float64{d.contentW * 0.35, d.contentW * 0.12, d.contentW * 0.53}
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(236, 253, 245) // emerald tint
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

func checkFiberComposition(batch *models.Batch) textileCheck {
	if batch.Specs.FiberComposition == nil {
		return textileCheck{"Fiber Composition (Legal Metrology)", "FAIL", "Not declared"}
	}
	total := batch.Specs.FiberComposition.CottonPct + batch.Specs.FiberComposition.PolyesterPct +
		batch.Specs.FiberComposition.WoolPct + batch.Specs.FiberComposition.SilkPct +
		batch.Specs.FiberComposition.LinenPct + batch.Specs.FiberComposition.ViscosePct +
		batch.Specs.FiberComposition.NylonPct + batch.Specs.FiberComposition.AcrylicPct +
		batch.Specs.FiberComposition.HempPct + batch.Specs.FiberComposition.OtherPct
	if total >= 99.0 && total <= 101.0 {
		return textileCheck{"Fiber Composition (Legal Metrology)", "PASS", fmt.Sprintf("Total: %.1f%%", total)}
	}
	return textileCheck{"Fiber Composition (Legal Metrology)", "FAIL", fmt.Sprintf("Total: %.1f%% (must be 100%%)", total)}
}

func checkGSM(batch *models.Batch) textileCheck {
	if batch.Specs.GSM > 0 && batch.Specs.GSM < 2000 {
		return textileCheck{"GSM (QCO Quality Parameter)", "PASS", fmt.Sprintf("%.0f g/m²", batch.Specs.GSM)}
	}
	if batch.Specs.GSM <= 0 {
		return textileCheck{"GSM (QCO Quality Parameter)", "FAIL", "Not declared"}
	}
	return textileCheck{"GSM (QCO Quality Parameter)", "FAIL", fmt.Sprintf("%.0f g/m² (invalid)", batch.Specs.GSM)}
}

func checkLaborCompliance(batch *models.Batch) textileCheck {
	lc := batch.Specs.LaborCompliance
	if lc == nil {
		return textileCheck{"Labor Compliance (SA8000/BSCI/SEDEX/Fair Trade)", "FAIL", "Not declared"}
	}
	if lc.SA8000Certified || lc.BSCIAudited || lc.SedexMember || lc.FairTradeCertified {
		certs := []string{}
		if lc.SA8000Certified {
			certs = append(certs, "SA8000")
		}
		if lc.BSCIAudited {
			certs = append(certs, "BSCI")
		}
		if lc.SedexMember {
			certs = append(certs, "SEDEX")
		}
		if lc.FairTradeCertified {
			certs = append(certs, "Fair Trade")
		}
		return textileCheck{"Labor Compliance (SA8000/BSCI/SEDEX/Fair Trade)", "PASS", strings.Join(certs, ", ")}
	}
	return textileCheck{"Labor Compliance (SA8000/BSCI/SEDEX/Fair Trade)", "FAIL", "No certification found"}
}

func checkChemicalCompliance(batch *models.Batch) textileCheck {
	zdhc := batch.Specs.ChemicalComplianceZDHC
	if zdhc == nil {
		return textileCheck{"Chemical Compliance (ZDHC MRSL)", "FAIL", "Not declared"}
	}
	if zdhc.ZDHCLevel == "" || zdhc.ZDHCLevel == "NA" {
		return textileCheck{"Chemical Compliance (ZDHC MRSL)", "FAIL", "ZDHC level not set"}
	}
	if !zdhc.MRSLTested {
		return textileCheck{"Chemical Compliance (ZDHC MRSL)", "FAIL", fmt.Sprintf("Level %s — MRSL not tested", zdhc.ZDHCLevel)}
	}
	return textileCheck{"Chemical Compliance (ZDHC MRSL)", "PASS", fmt.Sprintf("Level %s — MRSL tested", zdhc.ZDHCLevel)}
}

func checkWaterEnergyUsage(batch *models.Batch) textileCheck {
	parts := []string{}
	if batch.Specs.WaterUsageLiters > 0 {
		parts = append(parts, fmt.Sprintf("Water: %.1f L/kg", batch.Specs.WaterUsageLiters))
	}
	if batch.Specs.EnergyUsageKWh > 0 {
		parts = append(parts, fmt.Sprintf("Energy: %.1f kWh/kg", batch.Specs.EnergyUsageKWh))
	}
	if len(parts) == 0 {
		return textileCheck{"Water & Energy Usage (ESPR Art. 9)", "FAIL", "Not declared"}
	}
	return textileCheck{"Water & Energy Usage (ESPR Art. 9)", "PASS", strings.Join(parts, " | ")}
}

func checkExpectedLifetime(batch *models.Batch) textileCheck {
	if batch.Specs.ExpectedLifetimeWashes != nil && *batch.Specs.ExpectedLifetimeWashes > 0 {
		return textileCheck{"Expected Lifetime (ESPR Durability)", "PASS", fmt.Sprintf("%d washes", *batch.Specs.ExpectedLifetimeWashes)}
	}
	return textileCheck{"Expected Lifetime (ESPR Durability)", "FAIL", "Not declared"}
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
