package services

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"sync"

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

// GenerateQRCode generates a single QR code PNG
func (s *QRService) GenerateQRCode(passportUUID uuid.UUID, serialNumber string) (*QRResult, error) {
	// URL that the QR code points to
	url := fmt.Sprintf("%s/p/%s", s.baseURL, passportUUID.String())

	// Generate QR code PNG (256x256 pixels, medium recovery level)
	png, err := qrcode.Encode(url, qrcode.Medium, 256)
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

// GenerateQRCodesParallel generates QR codes for multiple passports using goroutines
func (s *QRService) GenerateQRCodesParallel(passports []*models.Passport, workerCount int) []*QRResult {
	if workerCount <= 0 {
		workerCount = 10
	}

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
				result, err := s.GenerateQRCode(j.passport.UUID, j.passport.SerialNumber)
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

		// Create file in zip
		writer, err := zipWriter.Create(qr.Filename)
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

// GenerateAndZip is a convenience method that generates QR codes and creates a ZIP
func (s *QRService) GenerateAndZip(passports []*models.Passport) (io.Reader, int64, error) {
	// Generate all QR codes in parallel
	qrResults := s.GenerateQRCodesParallel(passports, 20) // 20 workers for speed

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
