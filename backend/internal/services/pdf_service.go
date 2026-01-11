package services

import (
	"bytes"
	"fmt"
	"image/png"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
)

// PDFService handles PDF generation
type PDFService struct{}

// NewPDFService creates a new instance of PDFService
func NewPDFService() *PDFService {
	return &PDFService{}
}

// GenerateLabelSheet generates a PDF with QR code labels in a 3x7 grid
func (s *PDFService) GenerateLabelSheet(batchName string, serials []string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetFont("Arial", "", 10)
	pdf.AddPage()

	// A4 size: 210mm x 297mm
	// Margins: 10mm
	// Grid: 3 cols, 7 rows = 21 labels per page
	// Cell size approx: 63mm x 38mm

	startX, startY := 10.0, 15.0
	cellWidth, cellHeight := 63.3, 38.0
	qrSize := 25.0

	count := 0
	for _, serial := range serials {
		if count > 0 && count%21 == 0 {
			pdf.AddPage()
		}

		// Calculate position
		posInPage := count % 21
		col := posInPage % 3
		row := posInPage / 3

		x := startX + float64(col)*cellWidth
		y := startY + float64(row)*cellHeight

		// Draw border (optional, helpful for cutting)
		pdf.Rect(x, y, cellWidth, cellHeight, "D")

		// Generate QR Code
		// Currently pointing to a placeholder URL structure
		qrContent := fmt.Sprintf("https://exportready.app/p/%s", serial) // Use serial or uuid? Usually UUID for lookup, but let's assume serial maps to UUID
		// Wait, the handler should pass full URL or UUID.
		// For now let's assume the argument is the text content for the QR.

		qr, err := qrcode.New(qrContent, qrcode.Medium)
		if err != nil {
			return nil, fmt.Errorf("failed to generate QR for %s: %w", serial, err)
		}

		qrImage := qr.Image(256)

		// Register image in PDF
		// gofpdf requires an image options object or referencing file.
		// Since we have in-memory image, we use RegisterImageOptionsReader

		var buff bytes.Buffer
		if err := png.Encode(&buff, qrImage); err != nil {
			return nil, fmt.Errorf("failed to encode QR png: %w", err)
		}

		imageID := fmt.Sprintf("qr_%s", serial)
		pdf.RegisterImageOptionsReader(imageID, gofpdf.ImageOptions{ImageType: "PNG"}, &buff)

		// Place QR Code
		pdf.Image(imageID, x+2, y+6, qrSize, qrSize, false, "", 0, "")

		// Text info next to QR
		textX := x + qrSize + 4

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
