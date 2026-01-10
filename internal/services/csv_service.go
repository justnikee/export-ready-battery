package services

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"exportready-battery/internal/models"
)

// CSVService handles CSV parsing
type CSVService struct{}

// NewCSVService creates a new CSV service
func NewCSVService() *CSVService {
	return &CSVService{}
}

// CSVParseResult contains the result of parsing a CSV
type CSVParseResult struct {
	Passports []*models.Passport
	Errors    []CSVRowError
	RowCount  int
}

// CSVRowError represents an error in a specific row
type CSVRowError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

// ParseCSV parses a CSV file and creates passport records
// Expected CSV format: serial_number,manufacture_date
// Uses goroutines for parallel validation
func (s *CSVService) ParseCSV(reader io.Reader, batchID uuid.UUID) (*CSVParseResult, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true

	// Read header
	header, err := csvReader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %w", err)
	}

	// Validate and map headers
	headerMap := make(map[string]int)
	for i, h := range header {
		headerMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	serialIdx, hasSerial := headerMap["serial_number"]
	dateIdx, hasDate := headerMap["manufacture_date"]

	if !hasSerial || !hasDate {
		return nil, fmt.Errorf("CSV must have 'serial_number' and 'manufacture_date' columns")
	}

	// Read all rows
	records, err := csvReader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	result := &CSVParseResult{
		Passports: make([]*models.Passport, 0, len(records)),
		Errors:    make([]CSVRowError, 0),
		RowCount:  len(records),
	}

	// Process rows in parallel using worker pool pattern
	type rowResult struct {
		passport *models.Passport
		err      *CSVRowError
	}

	resultsChan := make(chan rowResult, len(records))
	var wg sync.WaitGroup

	// Use a worker pool (limit concurrency to avoid memory issues)
	workerCount := 10
	rowsChan := make(chan struct {
		idx    int
		record []string
	}, len(records))

	// Start workers
	for w := 0; w < workerCount; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for row := range rowsChan {
				passport, rowErr := s.parseRow(row.idx, row.record, serialIdx, dateIdx, batchID)
				resultsChan <- rowResult{passport: passport, err: rowErr}
			}
		}()
	}

	// Send rows to workers
	for i, record := range records {
		rowsChan <- struct {
			idx    int
			record []string
		}{idx: i + 2, record: record} // +2 because row 1 is header, and we're 1-indexed
	}
	close(rowsChan)

	// Wait for all workers and close results channel
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results
	for res := range resultsChan {
		if res.err != nil {
			result.Errors = append(result.Errors, *res.err)
		} else if res.passport != nil {
			result.Passports = append(result.Passports, res.passport)
		}
	}

	return result, nil
}

// parseRow validates and parses a single CSV row
func (s *CSVService) parseRow(rowNum int, record []string, serialIdx, dateIdx int, batchID uuid.UUID) (*models.Passport, *CSVRowError) {
	// Validate row has enough columns
	maxIdx := serialIdx
	if dateIdx > maxIdx {
		maxIdx = dateIdx
	}
	if len(record) <= maxIdx {
		return nil, &CSVRowError{Row: rowNum, Message: "row has missing columns"}
	}

	serialNumber := strings.TrimSpace(record[serialIdx])
	dateStr := strings.TrimSpace(record[dateIdx])

	// Validate serial number
	if serialNumber == "" {
		return nil, &CSVRowError{Row: rowNum, Message: "serial_number is empty"}
	}

	// Parse manufacture date (expected format: YYYY-MM-DD)
	manufactureDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// Try alternative formats
		manufactureDate, err = time.Parse("02/01/2006", dateStr) // DD/MM/YYYY
		if err != nil {
			manufactureDate, err = time.Parse("01/02/2006", dateStr) // MM/DD/YYYY
			if err != nil {
				return nil, &CSVRowError{Row: rowNum, Message: fmt.Sprintf("invalid date format: %s (expected YYYY-MM-DD)", dateStr)}
			}
		}
	}

	return &models.Passport{
		UUID:            uuid.New(),
		BatchID:         batchID,
		SerialNumber:    serialNumber,
		ManufactureDate: manufactureDate,
		Status:          models.PassportStatusActive,
		CreatedAt:       time.Now(),
	}, nil
}
