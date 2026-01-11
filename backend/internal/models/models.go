package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// MARKET REGION (DUAL-MODE COMPLIANCE)
// ============================================================================

// MarketRegion represents the target market for a batch
type MarketRegion string

const (
	MarketRegionIndia  MarketRegion = "INDIA"  // Battery Aadhaar (domestic)
	MarketRegionEU     MarketRegion = "EU"     // Battery Passport (export)
	MarketRegionGlobal MarketRegion = "GLOBAL" // Both markets (default)
)

// IsValid checks if the market region is valid
func (m MarketRegion) IsValid() bool {
	switch m {
	case MarketRegionIndia, MarketRegionEU, MarketRegionGlobal:
		return true
	}
	return false
}

// ============================================================================
// TENANT
// ============================================================================

// Tenant represents a company using the platform
type Tenant struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"company_name"`
	CreatedAt   time.Time `json:"created_at"`
}

// ============================================================================
// TEMPLATE
// ============================================================================

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

// ============================================================================
// BATCH (UPDATED FOR DUAL-MODE)
// ============================================================================

// Batch represents a production batch uploaded by a tenant
type Batch struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	BatchName string    `json:"batch_name"`
	Specs     BatchSpec `json:"specs"`
	CreatedAt time.Time `json:"created_at"`

	// Dual-Mode Compliance Fields
	MarketRegion     MarketRegion `json:"market_region"`         // INDIA, EU, or GLOBAL
	PLICompliant     bool         `json:"pli_compliant"`         // India: PLI subsidy eligibility
	DomesticValueAdd float64      `json:"domestic_value_add"`    // India: % of local value
	CellSource       string       `json:"cell_source,omitempty"` // IMPORTED or DOMESTIC
	Materials        *Materials   `json:"materials,omitempty"`   // EU: Material composition
	TotalPassports   int          `json:"total_passports"`       // Computed count of passports
}

// Materials holds material composition percentages for EU compliance
type Materials struct {
	Cobalt  float64 `json:"cobalt"`  // % of Cobalt
	Lithium float64 `json:"lithium"` // % of Lithium
	Nickel  float64 `json:"nickel"`  // % of Nickel
	Lead    float64 `json:"lead"`    // % of Lead
}

// BatchSpec holds the common specifications stored as JSONB
type BatchSpec struct {
	Chemistry       string `json:"chemistry"`
	NominalVoltage  string `json:"voltage"`  // String for flexibility (e.g., "3.7V")
	Capacity        string `json:"capacity"` // String for flexibility (e.g., "5000mAh")
	Manufacturer    string `json:"manufacturer"`
	Weight          string `json:"weight"`           // String for flexibility (e.g., "500g")
	CarbonFootprint string `json:"carbon_footprint"` // e.g., "10 kg CO2e"
	Recyclable      bool   `json:"recyclable"`
	CountryOfOrigin string `json:"country_of_origin"`

	// EU Regulatory Compliance Fields
	MaterialComposition   *MaterialComposition `json:"material_composition,omitempty"`    // Critical raw materials %
	Certifications        []string             `json:"certifications,omitempty"`          // CE, UL, IEC, etc.
	ManufacturerAddress   string               `json:"manufacturer_address,omitempty"`    // Physical address
	EURepresentative      string               `json:"eu_representative,omitempty"`       // EU contact name/company
	EURepresentativeEmail string               `json:"eu_representative_email,omitempty"` // EU contact email
}

// MaterialComposition holds the critical raw material percentages (EU Battery Regulation)
type MaterialComposition struct {
	Cobalt  string `json:"cobalt,omitempty"`  // e.g., "12%"
	Lithium string `json:"lithium,omitempty"` // e.g., "8%"
	Nickel  string `json:"nickel,omitempty"`  // e.g., "15%"
	Lead    string `json:"lead,omitempty"`    // e.g., "0%"
}

// ============================================================================
// PASSPORT
// ============================================================================

// Passport represents a single battery's digital passport
type Passport struct {
	UUID            uuid.UUID `json:"uuid"`
	BatchID         uuid.UUID `json:"batch_id"`
	SerialNumber    string    `json:"serial_number"` // Supports BPAN: IN-NKY-LFP-2026-00001
	ManufactureDate time.Time `json:"manufacture_date"`
	Status          string    `json:"status"` // ACTIVE, RECALLED, RECYCLED, END_OF_LIFE
	CreatedAt       time.Time `json:"created_at"`
}

// PassportStatus constants
const (
	PassportStatusActive    = "ACTIVE"
	PassportStatusRecalled  = "RECALLED"
	PassportStatusRecycled  = "RECYCLED"
	PassportStatusEndOfLife = "END_OF_LIFE"
)

// ============================================================================
// PASSPORT EVENTS (LIFECYCLE AUDIT LOG)
// ============================================================================

// PassportEvent represents an immutable lifecycle event for a passport
type PassportEvent struct {
	ID         uuid.UUID              `json:"id"`
	PassportID uuid.UUID              `json:"passport_id"`
	EventType  string                 `json:"event_type"` // CREATED, STATUS_CHANGED, SCANNED, RECALLED, RECYCLED, END_OF_LIFE
	Actor      string                 `json:"actor"`      // Who triggered: system, user email, etc.
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
}

// PassportEventType constants
const (
	PassportEventCreated       = "CREATED"
	PassportEventStatusChanged = "STATUS_CHANGED"
	PassportEventScanned       = "SCANNED"
	PassportEventRecalled      = "RECALLED"
	PassportEventRecycled      = "RECYCLED"
	PassportEventEndOfLife     = "END_OF_LIFE"
)

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

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

	// Dual-Mode Fields
	MarketRegion     MarketRegion `json:"market_region"`                // INDIA, EU, or GLOBAL
	PLICompliant     bool         `json:"pli_compliant,omitempty"`      // India only
	DomesticValueAdd float64      `json:"domestic_value_add,omitempty"` // India only
	CellSource       string       `json:"cell_source,omitempty"`        // India only
	Materials        *Materials   `json:"materials,omitempty"`          // EU only
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
	Passport     *Passport    `json:"passport"`
	BatchName    string       `json:"batch_name"`
	Specs        *BatchSpec   `json:"specs"`
	MarketRegion MarketRegion `json:"market_region"` // For conditional UI rendering
}

// ============================================================================
// SCAN EVENTS
// ============================================================================

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

// ============================================================================
// DASHBOARD
// ============================================================================

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
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	CreatedAt    string       `json:"created_at"`
	TotalUnits   int          `json:"total_units"`
	Status       string       `json:"status"`
	DownloadURL  string       `json:"download_url,omitempty"`
	UsedTemplate bool         `json:"used_template"`
	MarketRegion MarketRegion `json:"market_region"` // Added for dual-mode visibility
}

// ============================================================================
// BPAN GENERATOR (INDIA MODE)
// ============================================================================

// BPANConfig holds configuration for generating Battery Product Authentication Numbers
type BPANConfig struct {
	CountryCode      string // "IN" for India
	ManufacturerCode string // 3-char code, e.g., "NKY"
	ChemistryCode    string // 3-char code, e.g., "LFP", "NMC", "LCO"
	Year             int    // 4-digit year
}

// GenerateBPAN creates a BPAN serial number in format: IN-NKY-LFP-2026-00001
func GenerateBPAN(config BPANConfig, sequence int) string {
	return fmt.Sprintf("%s-%s-%s-%d-%05d",
		config.CountryCode,
		config.ManufacturerCode,
		config.ChemistryCode,
		config.Year,
		sequence,
	)
}

// ValidateBPAN checks if a serial number follows BPAN format
func ValidateBPAN(serial string) bool {
	// Format: IN-XXX-XXX-YYYY-NNNNN (21 chars)
	if len(serial) != 21 {
		return false
	}
	// Check prefix
	if serial[:3] != "IN-" {
		return false
	}
	// Additional validation can be added here
	return true
}
