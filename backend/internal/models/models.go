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
	ID           uuid.UUID `json:"id"`
	CompanyName  string    `json:"company_name"`
	Address      string    `json:"address,omitempty"`
	LogoURL      string    `json:"logo_url,omitempty"`
	SupportEmail string    `json:"support_email,omitempty"`
	Website      string    `json:"website,omitempty"`
	CreatedAt    time.Time `json:"created_at"`

	// Quota System (Monetization)
	QuotaBalance int `json:"quota_balance"` // Batch activation slots available

	// India Regulatory Compliance Fields (BWM Rules 2022 & BIS)
	EPRRegistrationNumber string `json:"epr_registration_number,omitempty"` // CPCB EPR registration
	BISRNumber            string `json:"bis_r_number,omitempty"`            // BIS CRS registration (IS 16046)
	IECCode               string `json:"iec_code,omitempty"`                // Import Export Code (for importers)

	// Certificate Document Paths (Compliance Vault)
	EPRCertificatePath string `json:"epr_certificate_path,omitempty"` // Path to EPR certificate PDF
	BISCertificatePath string `json:"bis_certificate_path,omitempty"` // Path to BIS certificate PDF
	PLICertificatePath string `json:"pli_certificate_path,omitempty"` // Path to PLI certificate PDF

	// Document Verification Status (NOT_UPLOADED, PENDING, VERIFIED, REJECTED)
	EPRStatus string `json:"epr_status,omitempty"` // EPR certificate verification status
	BISStatus string `json:"bis_status,omitempty"` // BIS certificate verification status
	PLIStatus string `json:"pli_status,omitempty"` // PLI certificate verification status
}

// UpdateProfileRequest represents the payload for updating tenant profile
type UpdateProfileRequest struct {
	CompanyName  string `json:"company_name"`
	Address      string `json:"address"`
	LogoURL      string `json:"logo_url"`
	SupportEmail string `json:"support_email"`
	Website      string `json:"website"`

	// India Regulatory Fields
	EPRRegistrationNumber string `json:"epr_registration_number"`
	BISRNumber            string `json:"bis_r_number"`
	IECCode               string `json:"iec_code"`
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
	Status    string    `json:"status"` // DRAFT, ACTIVE, ARCHIVED

	// Dual-Mode Compliance Fields
	MarketRegion     MarketRegion `json:"market_region"`         // INDIA, EU, or GLOBAL
	PLICompliant     bool         `json:"pli_compliant"`         // India: PLI subsidy eligibility
	DomesticValueAdd float64      `json:"domestic_value_add"`    // India: % of local value (stored as literal: 45.5 = 45.5%)
	CellSource       string       `json:"cell_source,omitempty"` // IMPORTED or DOMESTIC
	TotalPassports   int          `json:"total_passports"`       // Computed count of passports

	// India Import/Customs Fields (Required when CellSource = IMPORTED)
	BillOfEntryNo   string     `json:"bill_of_entry_no,omitempty"`  // Customs Bill of Entry number
	CountryOfOrigin string     `json:"country_of_origin,omitempty"` // Source country for imported cells
	CustomsDate     *time.Time `json:"customs_date,omitempty"`      // Date of customs clearance

	// India Compliance Fields
	HSNCode string `json:"hsn_code,omitempty"` // Harmonized System Nomenclature code (e.g., "8507.60")
}

// BatchSpec holds the common specifications stored as JSONB
type BatchSpec struct {
	Chemistry       string `json:"chemistry"`
	NominalVoltage  string `json:"voltage"`  // String for flexibility (e.g., "3.7V")
	Capacity        string `json:"capacity"` // String for flexibility (e.g., "5000mAh")
	Manufacturer    string `json:"manufacturer"`
	Weight          string `json:"weight"`           // String for flexibility (e.g., "500g")
	CarbonFootprint string `json:"carbon_footprint"` // e.g., "10 kg CO2e"
	CountryOfOrigin string `json:"country_of_origin"`

	// EU Battery Regulation 2023/1542 - MANDATORY FIELDS
	MaterialComposition    *MaterialComposition `json:"material_composition,omitempty"`     // Critical raw materials %
	Certifications         []string             `json:"certifications,omitempty"`           // CE, UL, IEC, etc.
	ManufacturerAddress    string               `json:"manufacturer_address,omitempty"`     // Physical address
	EURepresentative       string               `json:"eu_representative,omitempty"`        // EU contact name/company
	EURepresentativeEmail  string               `json:"eu_representative_email,omitempty"`  // EU contact email
	ExpectedLifetimeCycles int                  `json:"expected_lifetime_cycles,omitempty"` // Expected charge cycles (e.g., 1000)
	WarrantyMonths         int                  `json:"warranty_months,omitempty"`          // Warranty period in months
	RecycledContentPct     float64              `json:"recycled_content_pct,omitempty"`     // % recycled content (stored as literal: 15.5 = 15.5%)
	HazardousSubstances    *HazardousSubstances `json:"hazardous_substances,omitempty"`     // REACH/RoHS compliance
}

// MaterialComposition holds the critical raw material percentages (EU Battery Regulation)
// All values stored as literal percentages: 12.5 means 12.5%
type MaterialComposition struct {
	CobaltPct    float64 `json:"cobalt_pct,omitempty"`    // e.g., 12.5 = 12.5%
	LithiumPct   float64 `json:"lithium_pct,omitempty"`   // e.g., 8.0 = 8%
	NickelPct    float64 `json:"nickel_pct,omitempty"`    // e.g., 15.0 = 15%
	LeadPct      float64 `json:"lead_pct,omitempty"`      // e.g., 0 = 0%
	ManganesePct float64 `json:"manganese_pct,omitempty"` // Common in LFP batteries
}

// HazardousSubstances holds REACH/RoHS compliance declarations
type HazardousSubstances struct {
	LeadPresent    bool   `json:"lead_present"`          // Does product contain lead?
	MercuryPresent bool   `json:"mercury_present"`       // Does product contain mercury?
	CadmiumPresent bool   `json:"cadmium_present"`       // Does product contain cadmium?
	Declaration    string `json:"declaration,omitempty"` // Compliance statement
	Exemptions     string `json:"exemptions,omitempty"`  // Any RoHS exemptions claimed
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
	Status          string    `json:"status"` // CREATED, SHIPPED, IN_SERVICE, RETURNED, RECALLED, RECYCLED, END_OF_LIFE
	CreatedAt       time.Time `json:"created_at"`

	// Lifecycle tracking fields
	ShippedAt   *time.Time `json:"shipped_at,omitempty"`   // When battery left factory
	InstalledAt *time.Time `json:"installed_at,omitempty"` // When installed in device/vehicle
	ReturnedAt  *time.Time `json:"returned_at,omitempty"`  // When returned for warranty/recycling

	// Dynamic compliance field (updated over battery lifetime)
	StateOfHealth float64 `json:"state_of_health"` // 0-100, stored as literal percentage (e.g., 95.5 = 95.5%)

	// Ownership tracking
	OwnerID *uuid.UUID `json:"owner_id,omitempty"` // Current owner (distributor, retailer, end user)
}

// PassportStatus constants - lifecycle states
const (
	PassportStatusCreated   = "CREATED"     // Initial state after passport generation
	PassportStatusShipped   = "SHIPPED"     // Battery left factory/warehouse
	PassportStatusInService = "IN_SERVICE"  // Installed in device/vehicle
	PassportStatusReturned  = "RETURNED"    // Returned for warranty or recycling
	PassportStatusRecalled  = "RECALLED"    // Manufacturer recall
	PassportStatusRecycled  = "RECYCLED"    // End of second life
	PassportStatusEndOfLife = "END_OF_LIFE" // Final state

	// Legacy alias for backward compatibility
	PassportStatusActive = "CREATED" // Deprecated: use PassportStatusCreated
)

// ValidPassportTransitions defines which status transitions are allowed
// Key = current status, Value = list of allowed next statuses
var ValidPassportTransitions = map[string][]string{
	PassportStatusCreated:   {PassportStatusShipped},
	PassportStatusShipped:   {PassportStatusInService, PassportStatusReturned, PassportStatusRecalled},
	PassportStatusInService: {PassportStatusReturned, PassportStatusRecalled},
	PassportStatusReturned:  {PassportStatusRecycled, PassportStatusInService}, // Can go back to service after repair
	PassportStatusRecalled:  {PassportStatusRecycled},
	PassportStatusRecycled:  {PassportStatusEndOfLife},
	PassportStatusEndOfLife: {}, // Terminal state
}

// IsValidTransition checks if a status transition is allowed
func IsValidTransition(from, to string) bool {
	allowed, exists := ValidPassportTransitions[from]
	if !exists {
		return false
	}
	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}

// GetAllowedTransitions returns the list of valid next statuses for a given current status
func GetAllowedTransitions(currentStatus string) []string {
	return ValidPassportTransitions[currentStatus]
}

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
	PassportEventShipped       = "SHIPPED"   // NEW: battery left factory
	PassportEventInstalled     = "INSTALLED" // NEW: installed in device
	PassportEventReturned      = "RETURNED"  // NEW: warranty return
	PassportEventRecalled      = "RECALLED"
	PassportEventRecycled      = "RECYCLED"
	PassportEventEndOfLife     = "END_OF_LIFE"
)

// ============================================================================
// BATCH STATUS (QUOTA SYSTEM)
// ============================================================================

// BatchStatus constants
const (
	BatchStatusDraft    = "DRAFT"    // Data entry mode, downloads disabled
	BatchStatusActive   = "ACTIVE"   // Activated, downloads enabled
	BatchStatusArchived = "ARCHIVED" // No longer in use
)

// ============================================================================
// TRANSACTIONS (QUOTA LEDGER)
// ============================================================================

// Transaction represents a quota usage event
type Transaction struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	Description string     `json:"description"`
	QuotaChange int        `json:"quota_change"` // Negative for usage, positive for top-up
	BatchID     *uuid.UUID `json:"batch_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

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
	DomesticValueAdd float64      `json:"domestic_value_add,omitempty"` // India only (stored as literal: 45.5 = 45.5%)
	CellSource       string       `json:"cell_source,omitempty"`        // India only

	// India Import/Customs Fields (Required when MarketRegion=INDIA and CellSource=IMPORTED)
	BillOfEntryNo   string `json:"bill_of_entry_no,omitempty"`  // Customs Bill of Entry number
	CountryOfOrigin string `json:"country_of_origin,omitempty"` // Source country
	CustomsDate     string `json:"customs_date,omitempty"`      // Date in YYYY-MM-DD format
	HSNCode         string `json:"hsn_code,omitempty"`          // India: HSN code (e.g., "8507.60")
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
	Tenant       *Tenant      `json:"tenant"`        // Added for public profile display
	// Added for Import/Domestic logic
	CellSource      string `json:"cell_source,omitempty"`
	BillOfEntryNo   string `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin string `json:"country_of_origin,omitempty"`
	// India compliance fields - needed for passport view
	DomesticValueAdd float64    `json:"domestic_value_add,omitempty"` // Stored as literal: 45.5 = 45.5%
	PLICompliant     bool       `json:"pli_compliant,omitempty"`
	CustomsDate      *time.Time `json:"customs_date,omitempty"`
	HSNCode          string     `json:"hsn_code,omitempty"`
	// EU fields from specs are already in BatchSpec
	// Materials composition is in specs.material_composition
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
