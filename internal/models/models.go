package models

import (
	"time"

	"github.com/google/uuid"
)

// Tenant represents a company using the platform
type Tenant struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"company_name"`
	CreatedAt   time.Time `json:"created_at"`
}

// Batch represents a production batch uploaded by a tenant
type Batch struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	BatchName string    `json:"batch_name"`
	Specs     BatchSpec `json:"specs"`
	CreatedAt time.Time `json:"created_at"`
}

// BatchSpec holds the common specifications stored as JSONB
type BatchSpec struct {
	Chemistry       string  `json:"chemistry"`        // e.g., "Li-ion", "LiFePO4"
	NominalVoltage  float64 `json:"nominal_voltage"`  // e.g., 3.7
	Capacity        float64 `json:"capacity"`         // e.g., 2500 mAh
	Weight          float64 `json:"weight"`           // in grams
	CarbonFootprint float64 `json:"carbon_footprint"` // kg CO2e per kWh
	Recyclable      bool    `json:"recyclable"`
	CountryOfOrigin string  `json:"country_of_origin"`
}

// Passport represents a single battery's digital passport
type Passport struct {
	UUID            uuid.UUID `json:"uuid"`
	BatchID         uuid.UUID `json:"batch_id"`
	SerialNumber    string    `json:"serial_number"`
	ManufactureDate time.Time `json:"manufacture_date"`
	Status          string    `json:"status"` // ACTIVE, RECALLED, RECYCLED
	CreatedAt       time.Time `json:"created_at"`
}

// PassportStatus constants
const (
	PassportStatusActive   = "ACTIVE"
	PassportStatusRecalled = "RECALLED"
	PassportStatusRecycled = "RECYCLED"
)

// CSVRow represents a single row from the uploaded CSV file
type CSVRow struct {
	SerialNumber    string `json:"serial_number"`
	ManufactureDate string `json:"manufacture_date"` // Expected format: YYYY-MM-DD
}

// CreateBatchRequest is the request body for creating a new batch
type CreateBatchRequest struct {
	TenantID  uuid.UUID `json:"tenant_id"`
	BatchName string    `json:"batch_name"`
	Specs     BatchSpec `json:"specs"`
}

// CreateBatchResponse is the response after creating a batch
type CreateBatchResponse struct {
	Batch *Batch `json:"batch"`
}

// UploadCSVResponse is the response after processing a CSV upload
type UploadCSVResponse struct {
	BatchID        uuid.UUID `json:"batch_id"`
	PassportsCount int       `json:"passports_count"`
	ProcessingTime string    `json:"processing_time"`
	QRCodesReady   bool      `json:"qr_codes_ready"`
}

// PassportWithSpecs combines passport data with batch specs for the public page
type PassportWithSpecs struct {
	Passport  *Passport  `json:"passport"`
	BatchName string     `json:"batch_name"`
	Specs     *BatchSpec `json:"specs"`
}
