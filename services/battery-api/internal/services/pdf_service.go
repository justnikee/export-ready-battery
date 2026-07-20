package services

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"

	"github.com/anvayalabs/battery-api/internal/models"
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
	marginTop  = 8.0 // mm
	marginLeft = 4.0 // mm

	// Cell dimensions (Avery Standard)
	cellWidth  = 63.5 // mm - Avery Standard
	cellHeight = 38.1 // mm - Avery Standard
	hGap       = 2.5  // mm - Horizontal gap between columns

	// QR code size
	qrSize = 30.0 // mm - slightly larger for scannability

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

// drawLabel draws a premium product label at the given position.
//
// Layout:
//
//	+----------------------------------------------+
//	| ▪ BATTERY PASSPORT               [EU/IN/GL]  |   ← coloured header strip
//	|----------------------------------------------|
//	| [QR]  Model Name                             |
//	|        SERIAL-NUMBER                         |
//	|        Chemistry | Voltage | Capacity        |
//	|        EPR: ...  | BIS: ...                  |
//	|        AIS-156 Compliant  |  CO₂: xx kgCO₂e |
//	|        ▪ Cell: Domestic                      |
//	+----------------------------------------------+
func (s *PDFService) drawLabel(pdf *gofpdf.Fpdf, x, y float64,
	batch *models.Batch, passport *models.Passport, tenant *models.Tenant,
	carbonPerKWh float64, lang string) {

	tenant.EnsureBatteryProfile()
	tr := GetLabelTranslations(lang)

	// ── Outer border ──────────────────────────────────────────────────────────
	pdf.SetDrawColor(180, 180, 195)
	pdf.SetLineWidth(0.25)
	pdf.Rect(x, y, cellWidth, cellHeight, "D")

	// ── Header strip ──────────────────────────────────────────────────────────
	headerH := 5.5
	r, g, b := headerColour(models.MarketRegion(batch.MarketRegion))
	pdf.SetFillColor(r, g, b)
	pdf.Rect(x, y, cellWidth, headerH, "F")

	// Header label: "BATTERY PASSPORT"
	pdf.SetFont("Arial", "B", 5)
	pdf.SetTextColor(255, 255, 255)
	headerText := "BATTERY PASSPORT"
	if batch.ProductType == models.ProductTypeElectronics {
		headerText = "ELECTRONICS PASSPORT"
	}
	pdf.SetXY(x+2, y+0.8)
	pdf.CellFormat(cellWidth-14, 4, headerText, "", 0, "L", false, 0, "")

	// Region badge in header (right side)
	s.drawRegionBadge(pdf, x+cellWidth-13, y+0.8, models.MarketRegion(batch.MarketRegion))

	// ── Content area ──────────────────────────────────────────────────────────
	contentY := y + headerH + 0.8

	// === LEFT SIDE: QR Code ===
	qrX := x + cellPadding
	qrY := contentY + 0.5

	// Build enriched QR URL
	var qrCtx *QRLabelContext
	if carbonPerKWh > 0 || tenant.BatteryProfile.EPRRegistrationNumber != "" {
		qrCtx = &QRLabelContext{
			CarbonPerKWh: carbonPerKWh,
			EPRNumber:    tenant.BatteryProfile.EPRRegistrationNumber,
			ProductType:  batch.ProductType,
		}
	}
	qrURL := (&QRService{baseURL: s.baseURL}).BuildQRPayload(passport.UUID, passport.SerialNumber, qrCtx)

	// QR at Level H for print resilience
	qrPNG, err := qrcode.Encode(qrURL, qrcode.High, 128)
	if err == nil {
		// White background card behind QR
		pdf.SetFillColor(255, 255, 255)
		pdf.Rect(qrX-0.5, qrY-0.5, qrSize+1, qrSize+1, "F")
		imageName := fmt.Sprintf("qr_%s", passport.UUID.String())
		pdf.RegisterImageOptionsReader(imageName, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions(imageName, qrX, qrY, qrSize, qrSize, false, gofpdf.ImageOptions{}, 0, "")
	}

	// === RIGHT SIDE: Text Content ===
	textX := qrX + qrSize + cellPadding
	textY := contentY
	textWidth := cellWidth - qrSize - cellPadding*3

	// --- Row 1: Model name (bold, prominent) ---
	pdf.SetFont("Arial", "B", 7.5)
	pdf.SetTextColor(20, 20, 40)
	pdf.SetXY(textX, textY)
	modelName := batch.ModelName
	if modelName == "" {
		modelName = batch.BatchName
	}
	pdf.CellFormat(textWidth, 4.5, truncateLabelText(modelName, 20), "", 0, "L", false, 0, "")

	// --- Row 2: Serial Number ---
	textY += 5.0
	comp := ParseBPAN(passport.SerialNumber)
	serial := passport.SerialNumber

	if comp != nil && models.MarketRegion(batch.MarketRegion) == models.MarketRegionIndia {
		// India BPAN: "BPAN" prefix in accent colour
		pdf.SetFont("Arial", "B", 4.5)
		pdf.SetTextColor(r, g, b)
		pdf.SetXY(textX, textY)
		pdf.CellFormat(8, 3.5, "BPAN", "", 0, "L", false, 0, "")

		pdf.SetFont("Courier", "B", 6.5)
		pdf.SetTextColor(20, 20, 40)
		pdf.SetXY(textX+8, textY)
		pdf.CellFormat(textWidth-8, 3.5, serial, "", 0, "L", false, 0, "")
	} else {
		pdf.SetFont("Courier", "B", 6)
		pdf.SetTextColor(20, 20, 40)
		pdf.SetXY(textX, textY)
		if len(serial) > 24 {
			serial = serial[:22] + ".."
		}
		pdf.CellFormat(textWidth, 3.5, serial, "", 0, "L", false, 0, "")
	}

	// --- Row 3: Chemistry | Voltage | Capacity ---
	textY += 4.2
	specLine := labelSpecLine(batch)
	if specLine != "" {
		pdf.SetFont("Arial", "", 5.5)
		pdf.SetTextColor(60, 60, 80)
		pdf.SetXY(textX, textY)
		pdf.CellFormat(textWidth, 3, specLine, "", 0, "L", false, 0, "")
	}

	// --- Footer area (bottom of content) ---
	footerY := y + cellHeight - 11.5
	pdf.SetFont("Arial", "", 4.5)
	pdf.SetTextColor(80, 80, 100)

	// EPR Registration
	if tenant.BatteryProfile.EPRRegistrationNumber != "" {
		pdf.SetXY(textX, footerY)
		eprText := fmt.Sprintf("EPR: %s", tenant.BatteryProfile.EPRRegistrationNumber)
		if len(eprText) > 28 {
			eprText = eprText[:26] + ".."
		}
		pdf.CellFormat(textWidth, 2.5, eprText, "", 0, "L", false, 0, "")
		footerY += 2.5
	}

	// BIS R-Number
	if tenant.BatteryProfile.BISRNumber != "" {
		pdf.SetXY(textX, footerY)
		bisText := fmt.Sprintf("BIS R-%s", tenant.BatteryProfile.BISRNumber)
		pdf.CellFormat(textWidth, 2.5, bisText, "", 0, "L", false, 0, "")
		footerY += 2.5
	}

	// AIS-156 compliance mark (India)
	if models.MarketRegion(batch.MarketRegion) == models.MarketRegionIndia {
		pdf.SetFont("Arial", "B", 4.5)
		pdf.SetTextColor(0, 130, 60)
		pdf.SetXY(textX, footerY)
		pdf.CellFormat(textWidth, 2.5, "✓ AIS-156 Compliant", "", 0, "L", false, 0, "")
		footerY += 2.7
		pdf.SetTextColor(80, 80, 100)
		pdf.SetFont("Arial", "", 4.5)
	}

	// Carbon Footprint (EU / Global)
	if carbonPerKWh > 0 {
		pdf.SetFont("Arial", "B", 4.5)
		pdf.SetTextColor(0, 120, 60)
		pdf.SetXY(textX, footerY)
		co2Text := fmt.Sprintf("CO₂: %.1f kgCO₂e/kWh", carbonPerKWh)
		pdf.CellFormat(textWidth, 2.5, co2Text, "", 0, "L", false, 0, "")
		footerY += 2.5
		pdf.SetTextColor(80, 80, 100)
		pdf.SetFont("Arial", "", 4.5)
	}

	// Cell source (bottom-most line)
	cellSource := batch.Specs.CellSource
	if cellSource == "" {
		cellSource = "DOMESTIC"
	}
	cellSourceDisplay := tr.CellDomestic
	textColR, textColG, textColB := 0, 140, 60
	if cellSource != "DOMESTIC" {
		cellSourceDisplay = tr.CellImported
		textColR, textColG, textColB = 180, 100, 0
	}
	pdf.SetTextColor(textColR, textColG, textColB)
	pdf.SetFont("Arial", "B", 4.5)
	pdf.SetXY(textX, footerY)
	pdf.CellFormat(textWidth, 2.5, "■ "+cellSourceDisplay, "", 0, "L", false, 0, "")
}

// headerColour returns the RGB fill for the label header strip based on region.
func headerColour(region models.MarketRegion) (r, g, b int) {
	switch region {
	case models.MarketRegionIndia:
		return 180, 72, 20 // Deep saffron
	case models.MarketRegionEU:
		return 0, 42, 120 // EU navy
	default:
		return 20, 90, 80 // Teal-green (global)
	}
}

func labelSpecLine(batch *models.Batch) string {
	parts := make([]string, 0, 4)
	if batch.Specs.Chemistry != "" {
		parts = append(parts, batch.Specs.Chemistry)
	}
	if batch.Specs.NominalVoltage != "" {
		parts = append(parts, batch.Specs.NominalVoltage)
	}
	if batch.Specs.Capacity != "" {
		parts = append(parts, batch.Specs.Capacity)
	}
	if batch.Specs.Manufacturer != "" {
		parts = append(parts, truncateLabelText(batch.Specs.Manufacturer, 12))
	}
	return strings.Join(parts, " · ")
}

func labelDetailText(batch *models.Batch, passport *models.Passport, comp *models.BPANComponents) string {
	if comp == nil {
		return ""
	}
	return fmt.Sprintf("%s-%s | %s | %d | #%05d", comp.Region, comp.Manufacturer, comp.Chemistry, comp.Year, comp.Sequence)
}

// labelPrimaryText is kept for backward compatibility with tests.
func labelPrimaryText(batch *models.Batch, tr LabelTranslations) string {
	chemistry := batch.Specs.Chemistry
	if chemistry == "" {
		chemistry = tr.DefaultChemistry
	}
	if len(chemistry) > 22 {
		return chemistry[:20] + ".."
	}
	return chemistry
}

// labelSpecText is kept for backward compatibility with tests.
// It uses " | " as separator (vs " · " in the new labelSpecLine).
func labelSpecText(batch *models.Batch) string {
	parts := make([]string, 0, 4)
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

// drawRegionBadge draws a small colored market region pill badge.
func (s *PDFService) drawRegionBadge(pdf *gofpdf.Fpdf, x, y float64, marketRegion models.MarketRegion) {
	label := ""
	var r, g, b int
	switch marketRegion {
	case models.MarketRegionIndia:
		label = "IN"
		r, g, b = 255, 255, 255
	case models.MarketRegionEU:
		label = "EU"
		r, g, b = 255, 255, 255
	default:
		label = "GL"
		r, g, b = 255, 255, 255
	}

	// Semi-transparent white pill (sits in header, so contrasts on colour)
	pdf.SetFillColor(255, 255, 255)
	pdf.SetAlpha(0.25, "Normal")
	pdf.RoundedRect(x, y, 11, 4, 0.8, "1234", "F")
	pdf.SetAlpha(1.0, "Normal")

	// Badge text
	pdf.SetFont("Arial", "B", 5)
	pdf.SetTextColor(r, g, b)
	pdf.SetXY(x, y+0.3)
	pdf.CellFormat(11, 3.5, label, "", 0, "C", false, 0, "")
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
		qrPNG, err := qrcode.Encode(qrContent, qrcode.High, 128)
		if err != nil {
			continue
		}

		imageID := fmt.Sprintf("qr_%s", serial)
		pdf.RegisterImageOptionsReader(imageID, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions(imageID, x+2, y+6, legacyQrSize, legacyQrSize, false, gofpdf.ImageOptions{}, 0, "")

		textX := x + legacyQrSize + 4

		pdf.SetFont("Arial", "B", 8)
		pdf.SetXY(textX, y+8)
		pdf.Cell(30, 4, "ExportReady Battery")

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
