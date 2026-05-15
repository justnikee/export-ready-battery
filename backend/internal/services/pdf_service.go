package services

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"

	"anvayalabs-battery/internal/models"
)

// PDFService handles PDF label sheet generation
type PDFService struct {
	baseURL string
}

// NewPDFService creates a new PDF service
func NewPDFService(baseURL string) *PDFService {
	return &PDFService{baseURL: baseURL}
}

// Label sheet configuration (Avery Standard A4 sticker sheet)
const (
	// Page dimensions (A4)
	pageWidth  = 210.0 // mm
	pageHeight = 297.0 // mm

	// Grid configuration: 3 columns, 7 rows = 21 labels per page
	columns = 3
	rows    = 7

	// Margins
	marginTop  = 10.0 // mm
	marginLeft = 5.0  // mm

	// Cell dimensions (Avery Standard)
	cellWidth  = 63.5 // mm - Avery Standard
	cellHeight = 38.1 // mm - Avery Standard
	hGap       = 2.5  // mm - Horizontal gap between columns

	// QR code size
	qrSize = 28.0 // mm

	// Padding inside cell
	cellPadding = 2.0 // mm
)

// GenerateLabelSheet creates an A4 PDF with a grid of printable product labels.
// Guarded to max 500 passports to prevent OOM; larger batches should use async export jobs.
func (s *PDFService) GenerateLabelSheet(batch *models.Batch, passports []*models.Passport, tenant *models.Tenant, lang ...string) (*bytes.Buffer, error) {
	labelLang := "en"
	if len(lang) > 0 && lang[0] != "" {
		labelLang = lang[0]
	}
	const maxPassports = 500
	if len(passports) > maxPassports {
		return nil, fmt.Errorf("too many passports (%d); maximum is %d for synchronous generation — use async export jobs for larger batches", len(passports), maxPassports)
	}

	// Create new PDF in portrait A4
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(false, 0)

	// Extract carbon footprint for EU/Global labels
	carbonPerKWh := ExtractCarbonPerKWh(batch.CarbonFootprintResult)

	labelsPerPage := columns * rows
	totalLabels := len(passports)

	for i, passport := range passports {
		// Add new page at the start or when we've filled a page
		if i%labelsPerPage == 0 {
			pdf.AddPage()
		}

		// Calculate position in grid
		positionOnPage := i % labelsPerPage
		col := positionOnPage % columns
		row := positionOnPage / columns

		// Calculate X, Y coordinates
		x := marginLeft + float64(col)*(cellWidth+hGap)
		y := marginTop + float64(row)*cellHeight

		// Draw the label
		s.drawLabel(pdf, x, y, batch, passport, tenant, carbonPerKWh, labelLang)
	}

	// If no passports, add at least one page with a message
	if totalLabels == 0 {
		pdf.AddPage()
		pdf.SetFont("Arial", "I", 12)
		pdf.SetXY(marginLeft, marginTop)
		pdf.Cell(0, 10, "No passports to print")
	}

	// Output to buffer
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return &buf, nil
}

// drawLabel draws a single product label at the given position.
// Layout:
//
//	+-------------------------------+
//	| [QR]  Product Info  [REGION] |
//	|        SERIAL-NUMBER          |
//	|        Product-specific line  |
//	|        Spec / Origin line     |
//	|        Footer info            |
//	|        Footer info            |
//	+-------------------------------+
func (s *PDFService) drawLabel(pdf *gofpdf.Fpdf, x, y float64,
	batch *models.Batch, passport *models.Passport, tenant *models.Tenant,
	carbonPerKWh float64, lang string) {

	tenant.EnsureBatteryProfile()
	tenant.EnsureTextileProfile()

	tr := GetLabelTranslations(lang)

	// Draw cell border (rectangle)
	pdf.SetDrawColor(180, 180, 180)
	pdf.SetLineWidth(0.3)
	pdf.Rect(x, y, cellWidth, cellHeight, "D")

	// === LEFT SIDE: QR Code ===
	qrX := x + cellPadding
	qrY := y + (cellHeight-qrSize)/2 // Center vertically

	// Generate enriched QR code
	var qrCtx *QRLabelContext
	if carbonPerKWh > 0 || tenant.BatteryProfile.EPRRegistrationNumber != "" {
		qrCtx = &QRLabelContext{
			CarbonPerKWh: carbonPerKWh,
			EPRNumber:    tenant.BatteryProfile.EPRRegistrationNumber,
		}
	}
	qrURL := (&QRService{baseURL: s.baseURL}).BuildQRPayload(passport.UUID, passport.SerialNumber, qrCtx)
	qrPNG, err := qrcode.Encode(qrURL, qrcode.Medium, 128)
	if err == nil {
		imageName := fmt.Sprintf("qr_%s", passport.UUID.String())
		pdf.RegisterImageOptionsReader(imageName, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions(imageName, qrX, qrY, qrSize, qrSize, false, gofpdf.ImageOptions{}, 0, "")
	}

	// === RIGHT SIDE: Text Content ===
	textX := qrX + qrSize + cellPadding
	textY := y + cellPadding
	textWidth := cellWidth - qrSize - cellPadding*3

	// --- Row 1: Product descriptor + Market Region Badge ---
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetXY(textX, textY)
	pdf.CellFormat(textWidth-12, 4, labelPrimaryText(batch, tr), "", 0, "L", false, 0, "")

	// Market region badge (top-right of text area)
	s.drawRegionBadge(pdf, textX+textWidth-12, textY, models.MarketRegion(batch.MarketRegion))

	// --- Row 2: Serial Number (monospace, prominent) ---
	textY += 5
	comp := ParseBPAN(passport.SerialNumber)
	serial := passport.SerialNumber

	// For India-market BPAN serials, show "BPAN:" prefix label
	if comp != nil && models.MarketRegion(batch.MarketRegion) == models.MarketRegionIndia {
		pdf.SetFont("Arial", "B", 5)
		pdf.SetTextColor(180, 80, 0)
		pdf.SetXY(textX, textY)
		pdf.CellFormat(10, 3, "BPAN", "", 0, "L", false, 0, "")

		pdf.SetFont("Courier", "B", 7)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetXY(textX+10, textY)
		pdf.CellFormat(textWidth-10, 3.5, serial, "", 0, "L", false, 0, "")
	} else {
		pdf.SetFont("Courier", "B", 6.5)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetXY(textX, textY)
		if len(serial) > 25 {
			serial = serial[:25] + ".."
		}
		pdf.CellFormat(textWidth, 3.5, serial, "", 0, "L", false, 0, "")
	}

	// --- Row 3: Product-specific detail line ---
	textY += 4
	detailLine := labelDetailText(batch, passport, comp)
	if detailLine != "" {
		pdf.SetFont("Arial", "", 5.5)
		pdf.SetTextColor(80, 80, 80)
		pdf.SetXY(textX, textY)
		pdf.CellFormat(textWidth, 3, detailLine, "", 0, "L", false, 0, "")
	}

	// --- Row 4: Product-specific specs ---
	textY += 3.5
	pdf.SetFont("Arial", "", 5.5)
	pdf.SetTextColor(60, 60, 60)
	specLine := labelSpecText(batch)
	if specLine != "" {
		pdf.SetXY(textX, textY)
		pdf.CellFormat(textWidth, 3, specLine, "", 0, "L", false, 0, "")
	}

	// === FOOTER: Compliance Info ===
	footerY := y + cellHeight - 10
	if batch.ProductType == models.ProductTypeTextile {
		for _, footerLine := range labelTextileFooterLines(batch, tenant) {
			pdf.SetXY(textX, footerY)
			pdf.SetFont("Arial", "", 4.5)
			pdf.SetTextColor(60, 60, 60)
			pdf.CellFormat(textWidth, 2.5, footerLine, "", 0, "L", false, 0, "")
			footerY += 2.5
		}
		return
	}

	// EPR Registration
	pdf.SetFont("Arial", "", 4.5)
	pdf.SetTextColor(60, 60, 60)
	if tenant.BatteryProfile.EPRRegistrationNumber != "" {
		pdf.SetXY(textX, footerY)
		eprText := fmt.Sprintf("EPR: %s", tenant.BatteryProfile.EPRRegistrationNumber)
		if len(eprText) > 30 {
			eprText = eprText[:30] + ".."
		}
		pdf.CellFormat(textWidth, 2.5, eprText, "", 0, "L", false, 0, "")
		footerY += 2.5
	}

	// BIS R-Number
	if tenant.BatteryProfile.BISRNumber != "" {
		pdf.SetXY(textX, footerY)
		bisText := fmt.Sprintf("BIS: R-%s", tenant.BatteryProfile.BISRNumber)
		pdf.CellFormat(textWidth, 2.5, bisText, "", 0, "L", false, 0, "")
		footerY += 2.5
	}

	// AIS-156 compliance mark for India market
	if models.MarketRegion(batch.MarketRegion) == models.MarketRegionIndia {
		pdf.SetXY(textX, footerY)
		pdf.SetFont("Arial", "B", 4.5)
		pdf.SetTextColor(0, 100, 0)
		pdf.CellFormat(textWidth, 2.5, "AIS-156 Compliant", "", 0, "L", false, 0, "")
		footerY += 2.5
		pdf.SetTextColor(60, 60, 60)
		pdf.SetFont("Arial", "", 4.5)
	}

	// Carbon Footprint (EU/Global batches)
	if carbonPerKWh > 0 {
		pdf.SetXY(textX, footerY)
		pdf.SetTextColor(0, 100, 0)
		pdf.SetFont("Arial", "B", 4.5)
		co2Text := fmt.Sprintf("CO2: %.1f kgCO2e/kWh", carbonPerKWh)
		pdf.CellFormat(textWidth, 2.5, co2Text, "", 0, "L", false, 0, "")
		footerY += 2.5
		pdf.SetTextColor(60, 60, 60)
		pdf.SetFont("Arial", "", 4.5)
	}

	// Cell Source (Origin) — bottom line
	pdf.SetXY(textX, footerY)
	cellSource := batch.Specs.CellSource
	if cellSource == "" {
		cellSource = "DOMESTIC"
	}
	cellSourceDisplay := tr.CellDomestic
	if cellSource != "DOMESTIC" {
		cellSourceDisplay = tr.CellImported
	}
	if cellSource == "DOMESTIC" {
		pdf.SetTextColor(0, 128, 0) // Green
	} else {
		pdf.SetTextColor(200, 120, 0) // Orange
	}
	pdf.SetFont("Arial", "B", 4.5)
	pdf.CellFormat(textWidth, 2.5, cellSourceDisplay, "", 0, "L", false, 0, "")
}

func labelPrimaryText(batch *models.Batch, tr LabelTranslations) string {
	if batch.ProductType == models.ProductTypeTextile {
		if batch.Specs.MaterialProfile != "" {
			return truncateLabelText(batch.Specs.MaterialProfile, 22)
		}
		if batch.ModelName != "" {
			return truncateLabelText(batch.ModelName, 22)
		}
		return "Textile Passport"
	}

	chemistry := batch.Specs.Chemistry
	if chemistry == "" {
		chemistry = tr.DefaultChemistry
	}
	return truncateLabelText(chemistry, 22)
}

func labelDetailText(batch *models.Batch, passport *models.Passport, comp *models.BPANComponents) string {
	if batch.ProductType == models.ProductTypeTextile {
		parts := make([]string, 0, 2)
		if batch.Specs.ProductionStage != "" {
			parts = append(parts, batch.Specs.ProductionStage)
		}
		if batch.Specs.LotSize != "" {
			parts = append(parts, batch.Specs.LotSize)
		}
		return truncateLabelText(strings.Join(parts, " | "), 34)
	}

	if comp == nil {
		return ""
	}
	return fmt.Sprintf("%s-%s | %s | %d | #%05d", comp.Region, comp.Manufacturer, comp.Chemistry, comp.Year, comp.Sequence)
}

func labelSpecText(batch *models.Batch) string {
	parts := make([]string, 0, 3)
	if batch.ProductType == models.ProductTypeTextile {
		if batch.Specs.Manufacturer != "" {
			parts = append(parts, truncateLabelText(batch.Specs.Manufacturer, 15))
		}
		if batch.Specs.CountryOfOrigin != "" {
			parts = append(parts, batch.Specs.CountryOfOrigin)
		}
		return strings.Join(parts, " | ")
	}

	if batch.Specs.NominalVoltage != "" {
		parts = append(parts, batch.Specs.NominalVoltage)
	}
	if batch.Specs.Capacity != "" {
		parts = append(parts, batch.Specs.Capacity)
	}
	if batch.Specs.Manufacturer != "" {
		parts = append(parts, truncateLabelText(batch.Specs.Manufacturer, 15))
	}
	return strings.Join(parts, " | ")
}

func labelTextileFooterLines(batch *models.Batch, tenant *models.Tenant) []string {
	tenant.EnsureTextileProfile()
	lines := make([]string, 0, 3)
	profileLine := strings.TrimSpace(strings.Join(compactStrings(
		tenant.TextileProfile.FacilityType,
		tenant.TextileProfile.SupplyChainTier,
	), " | "))
	if profileLine != "" {
		lines = append(lines, truncateLabelText(profileLine, 32))
	}
	if len(batch.Specs.Certifications) > 0 {
		lines = append(lines, truncateLabelText("CERT: "+strings.Join(batch.Specs.Certifications, ", "), 32))
	}
	if batch.Specs.CountryOfOrigin != "" {
		lines = append(lines, truncateLabelText("Origin: "+batch.Specs.CountryOfOrigin, 32))
	}
	if len(lines) == 0 {
		return []string{"TEXTILE PASSPORT"}
	}
	if len(lines) > 3 {
		return lines[:3]
	}
	return lines
}

func compactStrings(values ...string) []string {
	parts := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			parts = append(parts, value)
		}
	}
	return parts
}

func truncateLabelText(value string, maxLen int) string {
	if len(value) <= maxLen {
		return value
	}
	if maxLen <= 2 {
		return value[:maxLen]
	}
	return value[:maxLen-2] + ".."
}

// drawRegionBadge draws a small colored market region badge.
func (s *PDFService) drawRegionBadge(pdf *gofpdf.Fpdf, x, y float64, marketRegion models.MarketRegion) {
	label := ""
	var r, g, b int
	switch marketRegion {
	case models.MarketRegionIndia:
		label = "IN"
		r, g, b = 255, 153, 51 // Orange (India flag)
	case models.MarketRegionEU:
		label = "EU"
		r, g, b = 0, 51, 153 // Blue (EU flag)
	default:
		label = "GL"
		r, g, b = 34, 139, 34 // Green (global)
	}

	// Draw filled rounded rect
	pdf.SetFillColor(r, g, b)
	pdf.SetDrawColor(r, g, b)
	pdf.RoundedRect(x, y, 10, 4, 0.8, "1234", "FD")

	// Badge text
	pdf.SetFont("Arial", "B", 5)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetXY(x, y+0.3)
	pdf.CellFormat(10, 3.5, label, "", 0, "C", false, 0, "")
}

// GenerateLabelSheetReader returns an io.Reader for HTTP streaming
func (s *PDFService) GenerateLabelSheetReader(batch *models.Batch, passports []*models.Passport, tenant *models.Tenant, lang ...string) (io.Reader, int64, error) {
	buf, err := s.GenerateLabelSheet(batch, passports, tenant, lang...)
	if err != nil {
		return nil, 0, err
	}
	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}

// Legacy function for backward compatibility
func (s *PDFService) GenerateLabelSheetSimple(batchName string, serials []string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetFont("Arial", "", 10)
	pdf.AddPage()

	startX, startY := 10.0, 15.0
	legacyCellWidth, legacyCellHeight := 63.3, 38.0
	legacyQrSize := 25.0

	count := 0
	for _, serial := range serials {
		if count > 0 && count%21 == 0 {
			pdf.AddPage()
		}

		posInPage := count % 21
		col := posInPage % 3
		row := posInPage / 3

		x := startX + float64(col)*legacyCellWidth
		y := startY + float64(row)*legacyCellHeight

		pdf.Rect(x, y, legacyCellWidth, legacyCellHeight, "D")

		qrContent := fmt.Sprintf("%s/p/%s", s.baseURL, serial)
		qrPNG, err := qrcode.Encode(qrContent, qrcode.Medium, 128)
		if err != nil {
			continue
		}

		imageID := fmt.Sprintf("qr_%s", serial)
		pdf.RegisterImageOptionsReader(imageID, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions(imageID, x+2, y+6, legacyQrSize, legacyQrSize, false, gofpdf.ImageOptions{}, 0, "")

		textX := x + legacyQrSize + 4

		pdf.SetFont("Arial", "B", 8)
		pdf.SetXY(textX, y+8)
		pdf.Cell(30, 4, "AnvayaLabs Battery")

		pdf.SetFont("Arial", "", 7)
		pdf.SetXY(textX, y+13)
		pdf.Cell(30, 4, batchName)

		pdf.SetFont("Courier", "", 7)
		pdf.SetXY(textX, y+18)
		pdf.MultiCell(32, 3, serial, "", "L", false)

		count++
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return buf.Bytes(), nil
}
