package services

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"

	"exportready-battery/internal/models"
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
}

// GenerateQRCode generates a single QR code PNG.
// The QR payload is a URL enriched with decoded BPAN metadata when available.
func (s *QRService) GenerateQRCode(passportUUID uuid.UUID, serialNumber string) (*QRResult, error) {
	return s.GenerateQRCodeEnriched(passportUUID, serialNumber, nil)
}

// GenerateQRCodeEnriched generates a QR code PNG with optional label context
// (carbon footprint, etc.) embedded as URL query parameters.
func (s *QRService) GenerateQRCodeEnriched(passportUUID uuid.UUID, serialNumber string, ctx *QRLabelContext) (*QRResult, error) {
	qrURL := s.BuildQRPayload(passportUUID, serialNumber, ctx)

	// Generate QR code PNG (256x256 pixels, medium recovery level)
	png, err := qrcode.Encode(qrURL, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	return &QRResult{
		UUID:     passportUUID,
		Serial:   serialNumber,
		PNGData:  png,
		Filename: fmt.Sprintf("%s.png", serialNumber),
	}, nil
}

// BuildQRPayload constructs the QR code URL, enriching it with decoded BPAN
// metadata as query parameters when the serial follows BPAN V2 format.
//
// Plain legacy serial:  https://app.exportready.in/p/{uuid}
// BPAN V2 serial:       https://app.exportready.in/p/{uuid}?bpan=IN-TEN-LFP-2026-00001&chem=LFP&yr=2026&mfr=TEN&rgn=IN
// EU with carbon:       ...&co2=65.00
func (s *QRService) BuildQRPayload(passportUUID uuid.UUID, serialNumber string, ctx *QRLabelContext) string {
	base := fmt.Sprintf("%s/p/%s", s.baseURL, passportUUID.String())

	// Try parsing the serial as BPAN
	comp := ParseBPAN(serialNumber)
	if comp == nil {
		return base // Legacy serial — URL only
	}

	// BPAN V2: enrich with decoded metadata
	params := url.Values{}
	params.Set("bpan", serialNumber)
	params.Set("chem", comp.Chemistry)
	params.Set("yr", fmt.Sprintf("%d", comp.Year))
	params.Set("mfr", comp.Manufacturer)
	params.Set("rgn", comp.Region)

	// Add carbon footprint if available (EU/Global)
	if ctx != nil && ctx.CarbonPerKWh > 0 {
		params.Set("co2", fmt.Sprintf("%.2f", ctx.CarbonPerKWh))
	}

	// Add EPR registration number for Indian-market batteries (BWMR compliance)
	if ctx != nil && ctx.EPRNumber != "" && comp.Region == "IN" {
		params.Set("epr", ctx.EPRNumber)
	}

	return fmt.Sprintf("%s?%s", base, params.Encode())
}

// ExtractCarbonPerKWh extracts the per-kWh carbon footprint value
// from a batch's CarbonFootprintResult JSONB field.
// Returns 0 if the field is nil or unparseable.
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

// GenerateQRCodesParallel generates QR codes for multiple passports using goroutines.
// A 5-minute timeout prevents goroutine leaks if generation stalls.
// Pass a non-nil QRLabelContext to enrich QR payloads for all passports in the batch.
func (s *QRService) GenerateQRCodesParallel(passports []*models.Passport, workerCount int, ctx *QRLabelContext) []*QRResult {
	if workerCount <= 0 {
		workerCount = 10
	}

	bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	results := make([]*QRResult, len(passports))
	var wg sync.WaitGroup

	// Create a channel to distribute work
	type job struct {
		index    int
		passport *models.Passport
	}
	jobs := make(chan job, len(passports))

	// Start workers
	for w := 0; w < workerCount; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				// Check for context cancellation before processing
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

	// Send jobs
	for i, passport := range passports {
		jobs <- job{index: i, passport: passport}
	}
	close(jobs)

	// Wait for all workers to complete
	wg.Wait()

	return results
}

// CreateZipArchive creates a ZIP file containing all QR codes
func (s *QRService) CreateZipArchive(qrResults []*QRResult) (io.Reader, int64, error) {
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	for _, qr := range qrResults {
		if qr.Error != nil || qr.PNGData == nil {
			continue // Skip failed QR codes
		}

		// Sanitize filename to prevent Zip Slip (path traversal)
		safeFilename := filepath.Base(qr.Filename)
		if safeFilename == "." || safeFilename == ".." {
			continue // Skip invalid filenames
		}

		// Create file in zip
		writer, err := zipWriter.Create(safeFilename)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to create zip entry: %w", err)
		}

		if _, err := writer.Write(qr.PNGData); err != nil {
			return nil, 0, fmt.Errorf("failed to write to zip: %w", err)
		}
	}

	if err := zipWriter.Close(); err != nil {
		return nil, 0, fmt.Errorf("failed to close zip: %w", err)
	}

	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}

// GenerateAndZip is a convenience method that generates QR codes and creates a ZIP.
// Pass batch to extract carbon footprint for enriched QR payloads.
func (s *QRService) GenerateAndZip(passports []*models.Passport) (io.Reader, int64, error) {
	return s.GenerateAndZipEnriched(passports, nil)
}

// GenerateAndZipEnriched generates enriched QR codes and creates a ZIP.
func (s *QRService) GenerateAndZipEnriched(passports []*models.Passport, ctx *QRLabelContext) (io.Reader, int64, error) {
	// Generate all QR codes in parallel
	qrResults := s.GenerateQRCodesParallel(passports, 20, ctx) // 20 workers for speed

	// Count successful generations
	successCount := 0
	for _, r := range qrResults {
		if r.Error == nil {
			successCount++
		}
	}

	if successCount == 0 {
		return nil, 0, fmt.Errorf("failed to generate any QR codes")
	}

	// Create ZIP archive
	return s.CreateZipArchive(qrResults)
}
