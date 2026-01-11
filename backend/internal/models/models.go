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

// Template represents a reusable batch specification template
type Template struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	Name      string    `json:"name"`
	Specs     BatchSpec `json:"specs"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateTemplateRequest is the request body for creating a template
type CreateTemplateRequest struct {
	TenantID uuid.UUID `json:"tenant_id"`
	Name     string    `json:"name"`
	Specs    BatchSpec `json:"specs"`
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
	Chemistry       string `json:"chemistry"`
	NominalVoltage  string `json:"voltage"`          // Changed to string, json tag to matches frontend
	Capacity        string `json:"capacity"`         // Changed to string
	Manufacturer    string `json:"manufacturer"`     // Added field
	Weight          string `json:"weight"`           // Changed to string
	CarbonFootprint string `json:"carbon_footprint"` // Changed to string
	Recyclable      bool   `json:"recyclable"`
	CountryOfOrigin string `json:"country_of_origin"`
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

// ScanEvent represents a QR code scan event
type ScanEvent struct {
	ID         uuid.UUID `json:"id"`
	PassportID uuid.UUID `json:"passport_id"`
	IPAddress  string    `json:"ip_address"`
	City       string    `json:"city"`
	Country    string    `json:"country"`
	DeviceType string    `json:"device_type"`
	UserAgent  string    `json:"user_agent"`
	ScannedAt  time.Time `json:"scanned_at"`
}

// ScanFeedItem represents a scan event for the live feed
type ScanFeedItem struct {
	City         string    `json:"city"`
	Country      string    `json:"country"`
	DeviceType   string    `json:"device_type"`
	ScannedAt    time.Time `json:"scanned_at"`
	SerialNumber string    `json:"serial_number"`
	BatchName    string    `json:"batch_name"`
}

// DashboardStats represents the overview statistics
type DashboardStats struct {
	TotalPassports       int     `json:"total_passports"`
	TotalBatches         int     `json:"total_batches"`
	QuotaUsed            int     `json:"quota_used"`
	QuotaLimit           int     `json:"quota_limit"`
	CarbonCompliancePct  float64 `json:"carbon_compliance_percentage"`
	PassportsThisWeek    int     `json:"passports_this_week"`
	PendingExportBatches int     `json:"pending_export_batches"`
}

// BatchSummary represents a batch for the recent batches list
type BatchSummary struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CreatedAt    string `json:"created_at"`
	TotalUnits   int    `json:"total_units"`
	Status       string `json:"status"`
	DownloadURL  string `json:"download_url,omitempty"`
	UsedTemplate bool   `json:"used_template"`
}
