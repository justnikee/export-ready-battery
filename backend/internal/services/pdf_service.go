package services

import (
	"bytes"
	"fmt"
	"io"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"

	"exportready-battery/internal/models"
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

// GenerateLabelSheet creates an A4 PDF with a grid of battery stickers
func (s *PDFService) GenerateLabelSheet(batch *models.Batch, passports []*models.Passport, tenant *models.Tenant) (*bytes.Buffer, error) {
	// Create new PDF in portrait A4
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(false, 0)

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
		s.drawLabel(pdf, x, y, batch, passport, tenant)
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

// drawLabel draws a single sticker label at the given position
func (s *PDFService) drawLabel(pdf *gofpdf.Fpdf, x, y float64, batch *models.Batch, passport *models.Passport, tenant *models.Tenant) {
	// Draw cell border (rectangle)
	pdf.SetDrawColor(180, 180, 180)
	pdf.SetLineWidth(0.3)
	pdf.Rect(x, y, cellWidth, cellHeight, "D")

	// === LEFT SIDE: QR Code ===
	qrX := x + cellPadding
	qrY := y + (cellHeight-qrSize)/2 // Center vertically

	// Generate QR code
	url := fmt.Sprintf("%s/p/%s", s.baseURL, passport.UUID.String())
	qrPNG, err := qrcode.Encode(url, qrcode.Medium, 128)
	if err == nil {
		// Register image from memory
		imageName := fmt.Sprintf("qr_%s", passport.UUID.String())
		pdf.RegisterImageOptionsReader(imageName, gofpdf.ImageOptions{ImageType: "PNG"}, bytes.NewReader(qrPNG))
		pdf.ImageOptions(imageName, qrX, qrY, qrSize, qrSize, false, gofpdf.ImageOptions{}, 0, "")
	}

	// === RIGHT SIDE: Text Content ===
	textX := qrX + qrSize + cellPadding
	textY := y + cellPadding
	textWidth := cellWidth - qrSize - cellPadding*3

	// Title: Chemistry or "Li-ion Battery"
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetXY(textX, textY)
	chemistry := batch.Specs.Chemistry
	if chemistry == "" {
		chemistry = "Li-ion Battery"
	}
	pdf.CellFormat(textWidth, 4, chemistry, "", 0, "L", false, 0, "")

	// Serial Number (Monospace-style)
	textY += 5
	pdf.SetFont("Courier", "", 7)
	pdf.SetXY(textX, textY)
	serial := passport.SerialNumber
	if len(serial) > 20 {
		serial = serial[:20] + "..."
	}
	pdf.CellFormat(textWidth, 3.5, serial, "", 0, "L", false, 0, "")

	// Specs line: Voltage / Capacity
	textY += 4.5
	pdf.SetFont("Arial", "", 6)
	specs := batch.Specs
	specLine := ""
	if specs.NominalVoltage != "" {
		specLine += specs.NominalVoltage
	}
	if specs.Capacity != "" {
		if specLine != "" {
			specLine += " | "
		}
		specLine += specs.Capacity
	}
	if specLine != "" {
		pdf.SetXY(textX, textY)
		pdf.CellFormat(textWidth, 3, specLine, "", 0, "L", false, 0, "")
	}

	// Manufacturer
	textY += 4
	pdf.SetFont("Arial", "", 5)
	pdf.SetTextColor(80, 80, 80)
	if specs.Manufacturer != "" {
		pdf.SetXY(textX, textY)
		mfr := specs.Manufacturer
		if len(mfr) > 25 {
			mfr = mfr[:25] + "..."
		}
		pdf.CellFormat(textWidth, 3, mfr, "", 0, "L", false, 0, "")
	}

	// === FOOTER: Compliance Info ===
	footerY := y + cellHeight - 10

	// EPR Registration
	pdf.SetFont("Arial", "", 5)
	pdf.SetTextColor(60, 60, 60)
	if tenant.EPRRegistrationNumber != "" {
		pdf.SetXY(textX, footerY)
		eprText := fmt.Sprintf("EPR: %s", tenant.EPRRegistrationNumber)
		if len(eprText) > 30 {
			eprText = eprText[:30] + "..."
		}
		pdf.CellFormat(textWidth, 2.5, eprText, "", 0, "L", false, 0, "")
		footerY += 3
	}

	// BIS R-Number
	if tenant.BISRNumber != "" {
		pdf.SetXY(textX, footerY)
		bisText := fmt.Sprintf("BIS: R-%s", tenant.BISRNumber)
		pdf.CellFormat(textWidth, 2.5, bisText, "", 0, "L", false, 0, "")
		footerY += 3
	}

	// Cell Source (Origin)
	pdf.SetXY(textX, footerY)
	cellSource := batch.CellSource
	if cellSource == "" {
		cellSource = "DOMESTIC"
	}
	if cellSource == "DOMESTIC" {
		pdf.SetTextColor(0, 128, 0) // Green
	} else {
		pdf.SetTextColor(200, 120, 0) // Orange
	}
	pdf.SetFont("Arial", "B", 5)
	pdf.CellFormat(textWidth, 2.5, cellSource, "", 0, "L", false, 0, "")
}

// GenerateLabelSheetReader returns an io.Reader for HTTP streaming
func (s *PDFService) GenerateLabelSheetReader(batch *models.Batch, passports []*models.Passport, tenant *models.Tenant) (io.Reader, int64, error) {
	buf, err := s.GenerateLabelSheet(batch, passports, tenant)
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
