package services

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io"
	"math"
	"net/url"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"

	"github.com/anvayalabs/battery-api/internal/models"
)

// QRService handles QR code generation
type QRService struct {
	baseURL string
}

// NewQRService creates a new QR service
func NewQRService(baseURL string) *QRService {
	return &QRService{baseURL: baseURL}
}

// QRResult represents a generated QR code
type QRResult struct {
	UUID     uuid.UUID
	Serial   string
	PNGData  []byte
	Filename string
	Error    error
}

// QRLabelContext carries additional data for enriched QR payloads.
type QRLabelContext struct {
	// CarbonPerKWh is the per-kWh carbon footprint in kgCO2e (0 = not available).
	CarbonPerKWh float64
	// EPRNumber is the producer's EPR registration number (India market).
	// When set and the BPAN region is India (IN), this is embedded in the QR payload.
	EPRNumber string
	// ProductType drives QR parameter naming (chem for battery, fiber for textile).
	ProductType models.ProductType
	// GTIN is the GS1 Global Trade Item Number for GS1 Digital Link QR codes.
	// When set, the QR payload uses the GS1 Digital Link format instead of the legacy /p/{uuid} format.
	GTIN string
	// ModelName is shown as the product descriptor on the label.
	ModelName string
	// MarketRegion for badge colour.
	MarketRegion models.MarketRegion
	// Chemistry short code (LFP, NMC, etc.) for the label.
	Chemistry string
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload builder
// ─────────────────────────────────────────────────────────────────────────────

// GenerateQRCode generates a single industry-standard labelled QR code PNG.
func (s *QRService) GenerateQRCode(passportUUID uuid.UUID, serialNumber string) (*QRResult, error) {
	return s.GenerateQRCodeEnriched(passportUUID, serialNumber, nil)
}

// GenerateQRCodeEnriched generates a labelled QR code PNG with optional context.
func (s *QRService) GenerateQRCodeEnriched(passportUUID uuid.UUID, serialNumber string, ctx *QRLabelContext) (*QRResult, error) {
	qrURL := s.BuildQRPayload(passportUUID, serialNumber, ctx)

	pngData, err := renderLabelledQR(qrURL, serialNumber, ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	return &QRResult{
		UUID:     passportUUID,
		Serial:   serialNumber,
		PNGData:  pngData,
		Filename: fmt.Sprintf("%s.png", serialNumber),
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry-standard labelled QR image renderer
// ─────────────────────────────────────────────────────────────────────────────

// renderLabelledQR creates a premium, print-ready QR code label image.
//
// Layout (portrait, 600×760 px @ 300 dpi ≈ 50×64 mm):
//
//	┌─────────────────────────────────────┐
//	│  ▪▪▪  BATTERY PASSPORT  [REGION]   │  ← header bar (coloured)
//	│                                     │
//	│         ┌─────────────┐             │
//	│         │   QR code   │             │  ← QR at Level H, 512×512 px
//	│         │  (Level H)  │             │
//	│         └─────────────┘             │
//	│                                     │
//	│   IN-TEN-LFP-2026-00001            │  ← serial (monospace)
//	│   LFP  ·  ExportReady              │  ← chemistry · brand
//	│                                     │
//	│  ■ Scan for full battery data       │  ← footer
//	└─────────────────────────────────────┘
func renderLabelledQR(qrURL, serialNumber string, ctx *QRLabelContext) ([]byte, error) {
	const (
		imgW    = 600
		imgH    = 760
		qrPx    = 480  // QR matrix pixel size
		qrLeft  = (imgW - qrPx) / 2
		qrTop   = 120
		radius  = 18   // corner radius for decorative elements
		headerH = 100
	)

	// Generate QR at Level H (30 % error recovery — required for physical labels)
	qrPNG, err := qrcode.Encode(qrURL, qrcode.High, qrPx)
	if err != nil {
		return nil, err
	}
	qrImg, _, err := image.Decode(bytes.NewReader(qrPNG))
	if err != nil {
		return nil, err
	}

	// ── Palette ───────────────────────────────────────────────────────────────
	white := color.RGBA{255, 255, 255, 255}
	black := color.RGBA{12, 12, 16, 255}
	lightGray := color.RGBA{245, 245, 248, 255}
	borderGray := color.RGBA{220, 220, 228, 255}

	// Region accent colour
	accent := regionAccent(ctx)

	// ── Canvas ────────────────────────────────────────────────────────────────
	img := image.NewRGBA(image.Rect(0, 0, imgW, imgH))

	// Background: white
	drawFill(img, image.Rect(0, 0, imgW, imgH), white)

	// Header bar (solid accent colour)
	drawFill(img, image.Rect(0, 0, imgW, headerH), accent)

	// Thin accent bar at very bottom
	drawFill(img, image.Rect(0, imgH-8, imgW, imgH), accent)

	// Light gray inner content area below header
	drawFill(img, image.Rect(0, headerH, imgW, imgH-8), lightGray)

	// Outer border
	drawRect(img, image.Rect(0, 0, imgW, imgH), black, 3)

	// ── Header text ──────────────────────────────────────────────────────────
	headerLabel := "BATTERY PASSPORT"
	if ctx != nil && ctx.ProductType == models.ProductTypeElectronics {
		headerLabel = "ELECTRONICS PASSPORT"
	}
	drawCentredText(img, headerLabel, imgW/2, 38, white, 3)

	// Region badge (top-right of header)
	regionText := "GL"
	if ctx != nil {
		switch ctx.MarketRegion {
		case models.MarketRegionIndia:
			regionText = "IN"
		case models.MarketRegionEU:
			regionText = "EU"
		}
	}
	drawRoundedBadge(img, imgW-90, 20, 70, 34, white, accent, regionText)

	// Small "◆" bullet top-left of header
	drawCentredText(img, "◆", 40, 38, white, 2)

	// Sub-header: chemistry · model (if available)
	subHeader := buildSubHeader(ctx)
	if subHeader != "" {
		drawCentredText(img, subHeader, imgW/2, 70, color.RGBA{255, 255, 255, 200}, 1)
	}

	// ── QR Code ──────────────────────────────────────────────────────────────
	// White card behind QR for contrast
	qrCardPad := 16
	qrCardRect := image.Rect(
		qrLeft-qrCardPad,
		qrTop-qrCardPad,
		qrLeft+qrPx+qrCardPad,
		qrTop+qrPx+qrCardPad,
	)
	drawFill(img, qrCardRect, white)
	drawRect(img, qrCardRect, borderGray, 2)

	// Draw QR image
	draw.Draw(img, image.Rect(qrLeft, qrTop, qrLeft+qrPx, qrTop+qrPx), qrImg, image.Point{}, draw.Over)

	// ── Serial Number ─────────────────────────────────────────────────────────
	serialY := qrTop + qrPx + qrCardPad + 44
	// Serial label micro-text
	drawCentredText(img, "SERIAL NUMBER", imgW/2, serialY-20, color.RGBA{120, 120, 140, 255}, 1)
	// Serial value in monospace (simulated with spacing)
	drawCentredText(img, formatSerial(serialNumber), imgW/2, serialY, black, 2)

	// ── Chemistry / Brand line ────────────────────────────────────────────────
	chemLine := buildChemLine(ctx)
	if chemLine != "" {
		drawCentredText(img, chemLine, imgW/2, serialY+38, color.RGBA{80, 80, 100, 255}, 1)
	}

	// Separator line
	sepY := imgH - 60
	drawFill(img, image.Rect(40, sepY, imgW-40, sepY+1), borderGray)

	// ── Footer ────────────────────────────────────────────────────────────────
	drawCentredText(img, "■  Scan for full battery data  ■", imgW/2, imgH-35, color.RGBA{100, 100, 120, 255}, 1)

	// Corner registration marks (industrial print alignment)
	drawCornerMark(img, 8, 8, black)
	drawCornerMark(img, imgW-8, 8, black)
	drawCornerMark(img, 8, imgH-8, black)
	drawCornerMark(img, imgW-8, imgH-8, black)

	// ── Encode to PNG ─────────────────────────────────────────────────────────
	// Use BestSpeed compression: QR label images are stored inside compressed ZIP archives or served dynamically
	var buf bytes.Buffer
	encoder := &png.Encoder{CompressionLevel: png.BestSpeed}
	if err := encoder.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing helpers
// ─────────────────────────────────────────────────────────────────────────────

func drawFill(img *image.RGBA, r image.Rectangle, c color.Color) {
	draw.Draw(img, r, &image.Uniform{c}, image.Point{}, draw.Src)
}

// drawRect draws a solid-colour border rectangle of given thickness.
func drawRect(img *image.RGBA, r image.Rectangle, c color.Color, thickness int) {
	// top
	drawFill(img, image.Rect(r.Min.X, r.Min.Y, r.Max.X, r.Min.Y+thickness), c)
	// bottom
	drawFill(img, image.Rect(r.Min.X, r.Max.Y-thickness, r.Max.X, r.Max.Y), c)
	// left
	drawFill(img, image.Rect(r.Min.X, r.Min.Y, r.Min.X+thickness, r.Max.Y), c)
	// right
	drawFill(img, image.Rect(r.Max.X-thickness, r.Min.Y, r.Max.X, r.Max.Y), c)
}

// scale multipliers for drawCentredText
var fontScales = []int{1, 2, 3}

// drawCentredText renders text centred at (cx, y) using basicfont, scaled by `scale`.
func drawCentredText(img *image.RGBA, text string, cx, y int, c color.Color, scale int) {
	if scale < 1 {
		scale = 1
	}
	face := basicfont.Face7x13
	charW := 7 * scale
	totalW := len(text) * charW
	startX := cx - totalW/2

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(c),
		Face: face,
	}

	if scale == 1 {
		d.Dot = fixed.P(startX, y)
		d.DrawString(text)
		return
	}

	// For scale > 1: draw each character pixel-by-pixel scaled
	for ci, ch := range text {
		charStr := string(ch)
		// Draw into a tiny temp image
		tmp := image.NewRGBA(image.Rect(0, 0, 7, 13))
		td := &font.Drawer{
			Dst:  tmp,
			Src:  image.NewUniform(color.RGBA{255, 255, 255, 255}),
			Face: face,
			Dot:  fixed.P(0, 11),
		}
		td.DrawString(charStr)

		// Scale up and blit
		charX := startX + ci*charW
		charY := y - 11*scale
		for py := 0; py < 13; py++ {
			for px := 0; px < 7; px++ {
				src := tmp.At(px, py)
				sr, sg, sb, sa := src.RGBA()
				if sa > 0x8000 || sr > 0x8000 || sg > 0x8000 || sb > 0x8000 {
					// Filled pixel — draw scale×scale block
					block := image.Rect(
						charX+px*scale,
						charY+py*scale,
						charX+px*scale+scale,
						charY+py*scale+scale,
					)
					drawFill(img, block, c)
				}
			}
		}
	}
}

// drawRoundedBadge draws a filled pill badge with centred text.
func drawRoundedBadge(img *image.RGBA, x, y, w, h int, fillC, _ color.Color, text string) {
	// Fill rectangle (rounded via circle corners)
	r := h / 2
	// Main body
	drawFill(img, image.Rect(x+r, y, x+w-r, y+h), fillC)
	// Left/right caps
	drawFill(img, image.Rect(x, y+r/2, x+r, y+h-r/2), fillC)
	drawFill(img, image.Rect(x+w-r, y+r/2, x+w, y+h-r/2), fillC)
	// Corners (filled circles approximate)
	for dy := 0; dy < r; dy++ {
		for dx := 0; dx < r; dx++ {
			dist := math.Sqrt(float64(dx*dx + dy*dy))
			if dist <= float64(r) {
				img.Set(x+r-dx, y+r-dy, fillC)
				img.Set(x+w-r+dx, y+r-dy, fillC)
				img.Set(x+r-dx, y+h-r+dy, fillC)
				img.Set(x+w-r+dx, y+h-r+dy, fillC)
			}
		}
	}
	// Text — use accent (the caller's background colour) for contrast on white fill
	textC := color.RGBA{20, 20, 40, 255}
	drawCentredText(img, text, x+w/2, y+h/2+5, textC, 2)
}

// drawCornerMark draws a small L-shaped registration crosshair.
func drawCornerMark(img *image.RGBA, cx, cy int, c color.Color) {
	const arm = 12
	const thick = 2
	// Determine direction
	left := cx < 20
	top := cy < 20
	sx, ex := cx, cx+arm
	if !left {
		sx, ex = cx-arm, cx
	}
	sy, ey := cy, cy+arm
	if !top {
		sy, ey = cy-arm, cy
	}
	drawFill(img, image.Rect(sx, cy-thick/2, ex, cy+thick/2+1), c)
	drawFill(img, image.Rect(cx-thick/2, sy, cx+thick/2+1, ey), c)
}

// ─────────────────────────────────────────────────────────────────────────────
// Context helpers
// ─────────────────────────────────────────────────────────────────────────────

func regionAccent(ctx *QRLabelContext) color.RGBA {
	if ctx == nil {
		return color.RGBA{30, 30, 50, 255} // Near-black default
	}
	switch ctx.MarketRegion {
	case models.MarketRegionIndia:
		return color.RGBA{180, 72, 20, 255} // Deep saffron
	case models.MarketRegionEU:
		return color.RGBA{0, 42, 120, 255} // EU navy
	default:
		return color.RGBA{20, 90, 80, 255} // Teal-green (global)
	}
}

func buildSubHeader(ctx *QRLabelContext) string {
	if ctx == nil {
		return ""
	}
	parts := []string{}
	if ctx.Chemistry != "" {
		parts = append(parts, ctx.Chemistry)
	}
	if ctx.ModelName != "" {
		mn := ctx.ModelName
		if len(mn) > 28 {
			mn = mn[:25] + "..."
		}
		parts = append(parts, mn)
	}
	if len(parts) == 0 {
		return ""
	}
	result := ""
	for i, p := range parts {
		if i > 0 {
			result += "  ·  "
		}
		result += p
	}
	return result
}

func buildChemLine(ctx *QRLabelContext) string {
	if ctx == nil {
		return "ExportReady Battery"
	}
	chem := ctx.Chemistry
	if chem == "" {
		chem = "Battery"
	}
	return chem + "  ·  ExportReady"
}

func formatSerial(serial string) string {
	if len(serial) > 32 {
		return serial[:29] + "..."
	}
	return serial
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload builder (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

// BuildQRPayload constructs the QR code URL, enriching it with decoded BPAN
// metadata as query parameters when the serial follows BPAN V2 format.
//
// Plain legacy serial:  https://app.anvayalabs.in/p/{uuid}
// BPAN V2 serial:       https://app.anvayalabs.in/p/{uuid}?bpan=IN-TEN-LFP-2026-00001&chem=LFP&yr=2026&mfr=TEN&rgn=IN
// EU with carbon:       ...&co2=65.00
func (s *QRService) BuildQRPayload(passportUUID uuid.UUID, serialNumber string, ctx *QRLabelContext) string {
	// GS1 Digital Link format when GTIN is available
	if ctx != nil && ctx.GTIN != "" {
		base := fmt.Sprintf("%s/01/%s/21/%s", s.baseURL, ctx.GTIN, serialNumber)

		comp := ParseBPAN(serialNumber)
		if comp == nil {
			return base
		}

		params := url.Values{}
		params.Set("bpan", serialNumber)
		params.Set("chem", comp.Chemistry)
		params.Set("yr", fmt.Sprintf("%d", comp.Year))
		params.Set("mfr", comp.Manufacturer)
		params.Set("rgn", comp.Region)

		if ctx.CarbonPerKWh > 0 {
			params.Set("co2", fmt.Sprintf("%.2f", ctx.CarbonPerKWh))
		}
		if ctx.EPRNumber != "" && comp.Region == "IN" {
			params.Set("epr", ctx.EPRNumber)
		}

		return fmt.Sprintf("%s?%s", base, params.Encode())
	}

	// Legacy format: fall back to /p/{uuid}
	base := fmt.Sprintf("%s/p/%s", s.baseURL, passportUUID.String())

	comp := ParseBPAN(serialNumber)
	if comp == nil {
		return base
	}

	params := url.Values{}
	params.Set("bpan", serialNumber)
	params.Set("chem", comp.Chemistry)
	params.Set("yr", fmt.Sprintf("%d", comp.Year))
	params.Set("mfr", comp.Manufacturer)
	params.Set("rgn", comp.Region)

	if ctx != nil && ctx.CarbonPerKWh > 0 {
		params.Set("co2", fmt.Sprintf("%.2f", ctx.CarbonPerKWh))
	}
	if ctx != nil && ctx.EPRNumber != "" && comp.Region == "IN" {
		params.Set("epr", ctx.EPRNumber)
	}

	return fmt.Sprintf("%s?%s", base, params.Encode())
}

// ExtractCarbonPerKWh extracts the per-kWh carbon footprint value
// from a batch's CarbonFootprintResult JSONB field.
func ExtractCarbonPerKWh(cfResult json.RawMessage) float64 {
	if len(cfResult) == 0 {
		return 0
	}
	var result struct {
		PerKWhKgCO2e float64 `json:"per_kwh_kg_co2e"`
	}
	if err := json.Unmarshal(cfResult, &result); err != nil {
		return 0
	}
	return result.PerKWhKgCO2e
}

// ─────────────────────────────────────────────────────────────────────────────
// Parallel generation & ZIP
// ─────────────────────────────────────────────────────────────────────────────

// GenerateQRCodesParallel generates QR codes for multiple passports using goroutines.
func (s *QRService) GenerateQRCodesParallel(passports []*models.Passport, workerCount int, ctx *QRLabelContext) []*QRResult {
	if workerCount <= 0 {
		workerCount = 10
	}

	bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	results := make([]*QRResult, len(passports))
	var wg sync.WaitGroup

	type job struct {
		index    int
		passport *models.Passport
	}
	jobs := make(chan job, len(passports))

	for w := 0; w < workerCount; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				if bgCtx.Err() != nil {
					results[j.index] = &QRResult{
						UUID:   j.passport.UUID,
						Serial: j.passport.SerialNumber,
						Error:  bgCtx.Err(),
					}
					continue
				}
				result, err := s.GenerateQRCodeEnriched(j.passport.UUID, j.passport.SerialNumber, ctx)
				if err != nil {
					results[j.index] = &QRResult{
						UUID:   j.passport.UUID,
						Serial: j.passport.SerialNumber,
						Error:  err,
					}
				} else {
					results[j.index] = result
				}
			}
		}()
	}

	for i, passport := range passports {
		jobs <- job{index: i, passport: passport}
	}
	close(jobs)
	wg.Wait()

	return results
}

// StreamZipArchive streams rendered QR codes into a ZIP archive via an io.Writer.
func (s *QRService) StreamZipArchive(qrResults []*QRResult, w io.Writer) error {
	zipWriter := zip.NewWriter(w)

	for _, qr := range qrResults {
		if qr.Error != nil || qr.PNGData == nil {
			continue
		}

		safeFilename := filepath.Base(qr.Filename)
		if safeFilename == "." || safeFilename == ".." {
			continue
		}

		writer, err := zipWriter.Create(safeFilename)
		if err != nil {
			return fmt.Errorf("failed to create zip entry: %w", err)
		}

		if _, err := writer.Write(qr.PNGData); err != nil {
			return fmt.Errorf("failed to write to zip: %w", err)
		}
	}

	if err := zipWriter.Close(); err != nil {
		return fmt.Errorf("failed to close zip: %w", err)
	}

	return nil
}

// CreateZipArchive creates a ZIP file containing all QR codes
func (s *QRService) CreateZipArchive(qrResults []*QRResult) (io.Reader, int64, error) {
	buf := new(bytes.Buffer)
	if err := s.StreamZipArchive(qrResults, buf); err != nil {
		return nil, 0, err
	}
	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}

// GenerateAndZip is a convenience method that generates QR codes and creates a ZIP.
func (s *QRService) GenerateAndZip(passports []*models.Passport) (io.Reader, int64, error) {
	return s.GenerateAndZipEnriched(passports, nil)
}

// GenerateAndZipEnriched generates enriched QR codes and creates a ZIP.
func (s *QRService) GenerateAndZipEnriched(passports []*models.Passport, ctx *QRLabelContext) (io.Reader, int64, error) {
	qrResults := s.GenerateQRCodesParallel(passports, 20, ctx)

	successCount := 0
	for _, r := range qrResults {
		if r.Error == nil {
			successCount++
		}
	}

	if successCount == 0 {
		return nil, 0, fmt.Errorf("failed to generate any QR codes")
	}

	return s.CreateZipArchive(qrResults)
}
