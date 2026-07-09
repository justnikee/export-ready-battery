package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"

	"github.com/anvayalabs/battery-api/internal/models"
)

// ============================================================================
// PLI CLAIM PACKET — MANIFEST / COVER SHEET
// ============================================================================
//
// A one-page cover sheet bundled at the front of the PLI claim packet ZIP
// (STRAT-04), listing exactly what's included so a CA or MHI reviewer
// doesn't have to guess, and flagging the one document ExportReady does not
// track (ARAI/iCAT type approval) so it isn't silently missing.

type pliPDF struct {
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

func newPLIPDF() *pliPDF {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	d := &pliPDF{
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

func (d *pliPDF) colSecondary() { d.pdf.SetTextColor(100, 116, 139) }
func (d *pliPDF) colWhite()     { d.pdf.SetTextColor(255, 255, 255) }
func (d *pliPDF) colBlack()     { d.pdf.SetTextColor(33, 33, 33) }
func (d *pliPDF) colGreen()     { d.pdf.SetTextColor(22, 163, 74) }
func (d *pliPDF) colAmber()     { d.pdf.SetTextColor(180, 83, 9) }

func (d *pliPDF) fillPrimary() { d.pdf.SetFillColor(23, 37, 84) }
func (d *pliPDF) fillGreen()   { d.pdf.SetFillColor(220, 252, 231) }
func (d *pliPDF) fillAmber()   { d.pdf.SetFillColor(254, 243, 199) }

func (d *pliPDF) ensureSpace(h float64) {
	if d.cursorY+h > d.pageH-d.marginB {
		d.pdf.AddPage()
		d.cursorY = d.marginT
	}
}

func (d *pliPDF) gap(mm float64) { d.cursorY += mm }

func (d *pliPDF) sectionTitle(num int, title string) {
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

func (d *pliPDF) keyValue(key, value string) {
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

func (d *pliPDF) checklistRow(label string, included bool, note string) {
	d.ensureSpace(8)
	if included {
		d.fillGreen()
		d.colGreen()
	} else {
		d.fillAmber()
		d.colAmber()
	}
	mark := "Included"
	if !included {
		mark = "Not on file"
	}
	d.pdf.SetFont("Arial", "B", 8)
	tw := d.pdf.GetStringWidth(mark) + 6
	d.pdf.RoundedRect(d.marginL+2, d.cursorY, tw, 6, 1.5, "1234", "F")
	d.pdf.SetXY(d.marginL+5, d.cursorY+0.7)
	d.pdf.CellFormat(tw-6, 5, mark, "", 0, "C", false, 0, "")

	d.colBlack()
	d.pdf.SetFont("Arial", "", 9)
	d.pdf.SetXY(d.marginL+2+tw+4, d.cursorY+0.3)
	d.pdf.CellFormat(d.contentW-tw-6, 6, label, "", 0, "L", false, 0, "")
	d.cursorY += 7

	if note != "" {
		d.ensureSpace(6)
		d.pdf.SetFont("Arial", "I", 7.5)
		d.colSecondary()
		d.pdf.SetXY(d.marginL+2+tw+4, d.cursorY)
		d.pdf.CellFormat(d.contentW-tw-6, 5, note, "", 0, "L", false, 0, "")
		d.cursorY += 6
	}
	d.gap(1)
}

// PLIPacketManifestInput describes what the assembled packet actually
// contains, so the cover sheet reflects reality rather than the aspirational
// list of every document a PLI claim could theoretically include.
type PLIPacketManifestInput struct {
	Batch               *models.Batch
	Tenant              *models.Tenant
	HasDVAReport        bool
	HasComplianceReport bool
	HasBISCertificate   bool
	HasPLICertificate   bool
	DGFTClaim           *models.DGFTClaim
}

// GeneratePLIPacketManifest renders the one-page cover sheet for the PLI
// claim packet ZIP (STRAT-04).
func GeneratePLIPacketManifest(in PLIPacketManifestInput) ([]byte, error) {
	d := newPLIPDF()
	d.pdf.AddPage()
	d.cursorY = d.marginT

	d.pdf.SetFont("Arial", "B", 16)
	d.colBlack()
	d.pdf.SetXY(d.marginL, d.cursorY)
	d.pdf.CellFormat(d.contentW, 9, "PLI Claim Packet", "", 0, "L", false, 0, "")
	d.cursorY += 9

	d.pdf.SetFont("Arial", "", 10)
	d.colSecondary()
	d.pdf.SetXY(d.marginL, d.cursorY)
	companyName := ""
	if in.Tenant != nil {
		companyName = in.Tenant.CompanyName
	}
	d.pdf.CellFormat(d.contentW, 6, fmt.Sprintf("%s — generated %s", companyName, time.Now().Format("02 Jan 2006")), "", 0, "L", false, 0, "")
	d.cursorY += 12
	d.colBlack()

	d.sectionTitle(1, "Batch Identity")
	d.keyValue("Batch Name", in.Batch.BatchName)
	d.keyValue("Chemistry", in.Batch.Specs.Chemistry)
	d.keyValue("Market Region", string(in.Batch.MarketRegion))
	d.keyValue("Domestic Value Addition", fmt.Sprintf("%.2f%%", in.Batch.DomesticValueAdd))
	d.gap(4)

	d.sectionTitle(2, "Packet Contents")
	d.checklistRow("DVA Calculation Report (CA-ready PDF)", in.HasDVAReport, "")
	d.checklistRow("Batch Compliance Report (AIS-156 checklist)", in.HasComplianceReport, "")
	d.checklistRow("BIS Certificate", in.HasBISCertificate, "")
	d.checklistRow("PLI / ACC Scheme Certificate", in.HasPLICertificate, "")
	if in.DGFTClaim != nil {
		d.checklistRow("DGFT Export Incentive Claim", true, fmt.Sprintf("Scheme: %s, Status: %s", in.DGFTClaim.SchemeType, in.DGFTClaim.Status))
	} else {
		d.checklistRow("DGFT Export Incentive Claim", false, "No claim filed against this batch yet — see DGFT Claims tab")
	}
	d.checklistRow("Type Approval Certificate (ARAI/iCAT)", false, "Not tracked by ExportReady — attach manually before MHI submission")
	d.gap(4)

	d.sectionTitle(3, "Submission Preparation Notes")
	d.pdf.SetFont("Arial", "", 8.5)
	d.colBlack()
	notes := []string{
		"This packet is an internal preparation aid, not an official MHI PLI-ACC submission form.",
		"Verify the current MHI PLI-ACC portal's exact document checklist before filing — requirements",
		"can change between claim cycles. Attach the Type Approval Certificate separately if required.",
		"Have your CA review the DVA Calculation Report before submission if the DVA figure is ESTIMATED",
		"rather than AUDITED.",
	}
	for _, line := range notes {
		d.ensureSpace(6)
		d.pdf.SetXY(d.marginL+2, d.cursorY)
		d.pdf.CellFormat(d.contentW-4, 5, line, "", 0, "L", false, 0, "")
		d.cursorY += 5.5
	}

	var buf bytes.Buffer
	if err := d.pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PLI packet manifest: %w", err)
	}
	return buf.Bytes(), nil
}
