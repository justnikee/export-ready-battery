package models

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// CARBON FACTORS (shared type for services + repository)
// ============================================================================

// CarbonFactor represents a carbon emission factor for EU Battery Regulation compliance.
// Canonical type shared by services and repository packages.
type CarbonFactor struct {
	ID          uuid.UUID  `json:"id"`
	Category    string     `json:"category"`
	Subcategory string     `json:"subcategory"`
	FactorValue float64    `json:"factor_value"`
	Unit        string     `json:"unit"`
	Source      string     `json:"source"`
	ValidFrom   time.Time  `json:"valid_from"`
	ValidTo     *time.Time `json:"valid_to,omitempty"`
	Notes       string     `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

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
// BATTERY CATEGORY (EU 2023/1542 Art 2)
// ============================================================================

// BatteryCategory classifies batteries per EU Battery Regulation scope
type BatteryCategory string

const (
	BatteryCategoryEV         BatteryCategory = "EV"          // Electric vehicle (>25 kWh)
	BatteryCategoryLMT        BatteryCategory = "LMT"         // Light means of transport (e-bikes, e-scooters)
	BatteryCategoryIndustrial BatteryCategory = "INDUSTRIAL"   // Industrial batteries (>2 kWh, stationary storage)
	BatteryCategoryPortable   BatteryCategory = "PORTABLE"     // Portable batteries (<5 kg, consumer)
	BatteryCategorySLI        BatteryCategory = "SLI"          // Starting, Lighting, Ignition (automotive 12V)
)

// IsValid checks if the battery category is valid
func (c BatteryCategory) IsValid() bool {
	switch c {
	case BatteryCategoryEV, BatteryCategoryLMT, BatteryCategoryIndustrial,
		BatteryCategoryPortable, BatteryCategorySLI:
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

	// EU Authorized Representative (EU Battery Regulation)
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                    string `json:"eu_contact_email,omitempty"`

	// Quota System (Monetization)
	QuotaBalance int    `json:"quota_balance"` // Batch activation slots available
	PlanType     string `json:"plan_type"`     // STARTER, GROWTH, ENTERPRISE

	// India Regulatory Compliance Fields (BWM Rules 2022 & BIS)
	EPRRegistrationNumber string `json:"epr_registration_number,omitempty"` // CPCB EPR registration
	BISRNumber            string `json:"bis_r_number,omitempty"`            // BIS CRS registration (IS 16046)
	IECCode               string `json:"iec_code,omitempty"`                // Import Export Code (for importers)
	MorthManufacturerCode string `json:"morth_manufacturer_code,omitempty"` // MoRTH manufacturer code
	MorthFactoryCodes     string `json:"morth_factory_codes,omitempty"`     // MoRTH factory codes

	// Certificate Document Paths (Compliance Vault)
	EPRCertificatePath string `json:"epr_certificate_path,omitempty"` // Path to EPR certificate PDF
	BISCertificatePath string `json:"bis_certificate_path,omitempty"` // Path to BIS certificate PDF
	PLICertificatePath string `json:"pli_certificate_path,omitempty"` // Path to PLI certificate PDF

	// Document Verification Status (NOT_UPLOADED, PENDING, VERIFIED, REJECTED)
	EPRStatus string `json:"epr_status,omitempty"` // EPR certificate verification status
	BISStatus string `json:"bis_status,omitempty"` // BIS certificate verification status
	PLIStatus string `json:"pli_status,omitempty"` // PLI certificate verification status

	// Partner Access (Tier B Magic Link Verification)
	PartnerAccessCode string `json:"partner_access_code,omitempty"` // Secret code for external partner verification

	// Onboarding Status
	OnboardingCompleted bool `json:"onboarding_completed"` // Whether user completed profile setup

	// BPAN V2: 3-char manufacturer code for serial number generation
	ManufacturerCode string `json:"manufacturer_code,omitempty"` // e.g. "TEN", auto-derived from company name

	// Field Visibility Config stored as JSONB.
	// Must be json.RawMessage ([]byte) — pgx SimpleProtocol cannot encode map types into JSONB.
	DataVisibility json.RawMessage `json:"data_visibility,omitempty"`
}

// UpdateProfileRequest represents the payload for updating tenant profile
type UpdateProfileRequest struct {
	CompanyName  string `json:"company_name"`
	Address      string `json:"address"`
	LogoURL      string `json:"logo_url"`
	SupportEmail string `json:"support_email"`
	Website      string `json:"website"`

	// EU Authorized Representative
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address"`
	EUContactEmail                    string `json:"eu_contact_email"`

	// India Regulatory Fields
	EPRRegistrationNumber string `json:"epr_registration_number"`
	BISRNumber            string `json:"bis_r_number"`
	IECCode               string `json:"iec_code"`
	MorthManufacturerCode string `json:"morth_manufacturer_code"`
	MorthFactoryCodes     string `json:"morth_factory_codes"`

	// Field Visibility Config stored as JSONB.
	// Must be json.RawMessage ([]byte) — pgx SimpleProtocol cannot encode map types into JSONB.
	DataVisibility json.RawMessage `json:"data_visibility"`
}

// ============================================================================
// TEMPLATE
// ============================================================================

// Template represents a reusable batch specification template (Product SKU)
type Template struct {
	ID           uuid.UUID    `json:"id"`
	TenantID     uuid.UUID    `json:"tenant_id"`
	Name         string       `json:"name"`
	MarketRegion MarketRegion `json:"market_region"` // INDIA, EU, or GLOBAL
	Specs        BatchSpec    `json:"specs"`
	CreatedAt    time.Time    `json:"created_at"`
}

// CreateTemplateRequest is the request body for creating a template
type CreateTemplateRequest struct {
	TenantID     uuid.UUID    `json:"tenant_id"`
	Name         string       `json:"name"`
	MarketRegion MarketRegion `json:"market_region"` // INDIA, EU, or GLOBAL
	Specs        BatchSpec    `json:"specs"`
}

// ============================================================================
// BATCH (UPDATED FOR DUAL-MODE)
// ============================================================================

// Batch represents a production batch uploaded by a tenant
type Batch struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	BatchName string    `json:"batch_name"`
	ModelName string    `json:"model_name"`
	Specs     BatchSpec `json:"specs"`
	CreatedAt time.Time `json:"created_at"`
	Status    string    `json:"status"` // DRAFT, ACTIVE, ARCHIVED

	// v2: Product-agnostic fields
	ProductType   ProductType     `json:"product_type"`          // BATTERY, TEXTILE, ELECTRONICS (default: BATTERY)
	SchemaVersion int             `json:"schema_version"`        // Schema version used for specs validation
	ComplianceScore float64       `json:"compliance_score"`      // 0-100, computed by compliance engine
	ComplianceGaps json.RawMessage `json:"compliance_gaps,omitempty"` // [{field, market, regulation}]

	// Manufacturing window (legal declaration)
	ManufacturingStartDate *time.Time `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time `json:"manufacturing_end_date,omitempty"`

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

	// India Compliance Fields (Mandatory for market_region = INDIA)
	HSNCode   string `json:"hsn_code,omitempty"`   // Harmonized System Nomenclature code (e.g., "8507.60")
	BISNumber string `json:"bis_number,omitempty"` // BIS R-Number (e.g., "R-12345678") - Required for lithium-ion batteries
	EPRNumber string `json:"epr_number,omitempty"` // EPR Registration Number (e.g., "EPR/E-Waste/2024/00001")

	// PLI/DVA Audit Compliance Fields (reduces legal liability)
	DVASource               string   `json:"dva_source,omitempty"`                 // "ESTIMATED" or "AUDITED"
	AuditedDomesticValueAdd *float64 `json:"audited_domestic_value_add,omitempty"` // CA-certified DVA % (nullable)
	PLICertificateURL       string   `json:"pli_certificate_url,omitempty"`        // Path to CA certificate

	// EU Carbon Footprint Calculator Result (JSONB, from POST /api/v1/carbon/calculate)
	CarbonFootprintResult json.RawMessage `json:"carbon_footprint_result,omitempty"`
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

	// Financials (India PLI) stored in JSONB to avoid schema change
	SalePriceINR  float64 `json:"sale_price_inr,omitempty"`
	ImportCostINR float64 `json:"import_cost_inr,omitempty"`

	// India PLI/Compliance Fields (for Product SKU Templates)
	CellSource       string  `json:"cell_source,omitempty"`        // IMPORTED or DOMESTIC
	DomesticValueAdd float64 `json:"domestic_value_add,omitempty"` // Target DVA % (e.g., 50.0 = 50%)
	HSNCode          string  `json:"hsn_code,omitempty"`           // Harmonized System Nomenclature code
	BISNumber        string  `json:"bis_number,omitempty"`         // BIS R-Number (e.g., "R-12345678")
	EPRNumber        string  `json:"epr_number,omitempty"`         // EPR Registration Number

	// EU Battery Regulation 2023/1542 - MANDATORY FIELDS
	MaterialComposition    *MaterialComposition `json:"material_composition,omitempty"`     // Critical raw materials %
	Certifications         []string             `json:"certifications,omitempty"`           // CE, UL, IEC, etc.
	ManufacturerAddress    string               `json:"manufacturer_address,omitempty"`     // Physical address
	EURepresentative       string               `json:"eu_representative,omitempty"`        // EU contact name/company
	EURepresentativeEmail  string               `json:"eu_representative_email,omitempty"`  // EU contact email
	ExpectedLifetimeCycles *int                 `json:"expected_lifetime_cycles,omitempty"` // Expected charge cycles (e.g., 1000)
	WarrantyMonths         *int                 `json:"warranty_months,omitempty"`          // Warranty period in months
	RecycledContentPct     *float64             `json:"recycled_content_pct,omitempty"`     // % recycled content (stored as literal: 15.5 = 15.5%)
	HazardousSubstances    *HazardousSubstances `json:"hazardous_substances,omitempty"`     // REACH/RoHS compliance

	// EU Battery Regulation 2023/1542 - STRUCTURED DATA (Art 2, Art 7, Art 57, Art 39)
	BatteryCategory       BatteryCategory        `json:"battery_category,omitempty"`        // EV, LMT, INDUSTRIAL, PORTABLE, SLI
	PerformanceSpec       *PerformanceSpec       `json:"performance_spec,omitempty"`        // Rated electrical/thermal specs (Annex IV)
	DisassemblyGuide      *DisassemblyGuide      `json:"disassembly_guide,omitempty"`       // Disassembly & recycling info (Art 57)
	SupplyChainProvenance *SupplyChainProvenance `json:"supply_chain_provenance,omitempty"` // Raw material sourcing (Art 39)
}

// MaterialComposition holds the critical raw material percentages (EU Battery Regulation)
// All values stored as literal percentages: 12.5 means 12.5%
type MaterialComposition struct {
	CobaltPct    float64 `json:"cobalt_pct,omitempty"`    // e.g., 12.5 = 12.5%
	LithiumPct   float64 `json:"lithium_pct,omitempty"`   // e.g., 8.0 = 8%
	GraphitePct  float64 `json:"graphite_pct,omitempty"`  // e.g., 20.0 = 20%
	NickelPct    float64 `json:"nickel_pct,omitempty"`    // e.g., 15.0 = 15%
	LeadPct      float64 `json:"lead_pct,omitempty"`      // e.g., 0 = 0%
	ManganesePct float64 `json:"manganese_pct,omitempty"` // Common in LFP batteries

	// Per-material recycled content (EU 2023/1542 Art. 8)
	// Required from 2030: Co ≥16%, Li ≥6%, Ni ≥6%, Pb ≥85%
	// Required from 2035: Co ≥26%, Li ≥12%, Ni ≥15%, Pb ≥85%
	RecycledCobaltPct  float64 `json:"recycled_cobalt_pct,omitempty"`  // % of cobalt from recycled sources
	RecycledLithiumPct float64 `json:"recycled_lithium_pct,omitempty"` // % of lithium from recycled sources
	RecycledNickelPct  float64 `json:"recycled_nickel_pct,omitempty"`  // % of nickel from recycled sources
	RecycledLeadPct    float64 `json:"recycled_lead_pct,omitempty"`    // % of lead from recycled sources
}

// HazardousSubstances holds REACH/RoHS compliance declarations
type HazardousSubstances struct {
	LeadPresent    bool   `json:"lead_present"`         // Does product contain lead?
	MercuryPresent bool   `json:"mercury_present"`      // Does product contain mercury?
	CadmiumPresent bool   `json:"cadmium_present"`      // Does product contain cadmium?
	Declaration    string `json:"declaration,omitempty"` // Compliance statement
	Exemptions     string `json:"exemptions,omitempty"` // Any RoHS exemptions claimed
}

// ============================================================================
// EU STRUCTURED SPECS (EU 2023/1542 Art 7, Art 10, Art 57)
// ============================================================================

// PerformanceSpec holds rated electrical/thermal performance data (EU Annex IV)
type PerformanceSpec struct {
	RatedCapacityAh    *float64 `json:"rated_capacity_ah,omitempty"`               // Nominal capacity in Ah
	RatedCapacityWh    *float64 `json:"rated_capacity_wh,omitempty"`               // Nominal energy in Wh
	RatedVoltage       *float64 `json:"rated_voltage,omitempty"`                   // Nominal voltage (V)
	MinVoltage         *float64 `json:"min_voltage,omitempty"`                     // Minimum voltage (V)
	MaxVoltage         *float64 `json:"max_voltage,omitempty"`                     // Maximum voltage (V)
	InternalResistance *float64 `json:"internal_resistance_mohm,omitempty"`        // Initial internal resistance (mΩ)
	MaxChargeCRate     *float64 `json:"max_charge_c_rate,omitempty"`               // Max charge C-rate
	MaxDischargeCRate  *float64 `json:"max_discharge_c_rate,omitempty"`            // Max discharge C-rate
	OperatingTempMin   *float64 `json:"operating_temp_min_c,omitempty"`            // Min operating temp (°C)
	OperatingTempMax   *float64 `json:"operating_temp_max_c,omitempty"`            // Max operating temp (°C)
	CapacityAt80SoH    *float64 `json:"capacity_at_80_soh_ah,omitempty"`           // Capacity at 80% SoH threshold (Ah)
	RoundTripEffPct    *float64 `json:"round_trip_efficiency_pct,omitempty"`        // Energy round-trip efficiency (%)
	CathodeMaterial    string   `json:"cathode_material,omitempty"`                // e.g., "LiFePO4", "LiNiMnCoO2"
	AnodeMaterial      string   `json:"anode_material,omitempty"`                  // e.g., "Graphite", "Li4Ti5O12"
}

// DisassemblyGuide holds battery disassembly/recycling info (EU Art 57)
type DisassemblyGuide struct {
	DocumentURL      string   `json:"document_url,omitempty"`      // URL to full disassembly PDF/manual
	Steps            []string `json:"steps,omitempty"`             // Ordered disassembly steps
	ToolsRequired    []string `json:"tools_required,omitempty"`    // Required tools
	Hazards          []string `json:"hazards,omitempty"`           // Safety hazards
	SafetyGuidelines []string `json:"safety_guidelines,omitempty"` // Safety procedures
	EOLInstructions  string   `json:"eol_instructions,omitempty"`  // End-of-life handling notes
	RecyclerURL      string   `json:"recycler_url,omitempty"`      // Link to authorized recycler portal
}

// SupplyChainProvenance holds due diligence and raw material sourcing info (EU Art 39)
type SupplyChainProvenance struct {
	DueDiligencePolicy string            `json:"due_diligence_policy,omitempty"` // URL to supply chain due diligence policy
	Tiers              []SupplyChainTier `json:"tiers,omitempty"`
}

// SupplyChainTier represents one material source in the supply chain
type SupplyChainTier struct {
	Material        string  `json:"material"`                       // cobalt, lithium, nickel, manganese, graphite
	SupplierName    string  `json:"supplier_name,omitempty"`        // Supplier company name
	CountryOfOrigin string  `json:"country_of_origin"`              // ISO Alpha-2
	MineOrRefinery  string  `json:"mine_or_refinery,omitempty"`     // Name of mine or refinery
	Certified       bool    `json:"certified"`                      // Third-party audited?
	CertBody        string  `json:"certification_body,omitempty"`   // e.g., "RMI", "IRMA"
	RecycledSource  bool    `json:"recycled_source"`                // From recycled material?
	Percentage      float64 `json:"percentage,omitempty"`           // % of total material from this source
}

// ============================================================================
// PASSPORT
// ============================================================================

// Passport represents a single product's digital passport
type Passport struct {
	UUID            uuid.UUID `json:"uuid"`
	BatchID         uuid.UUID `json:"batch_id"`
	SerialNumber    string    `json:"serial_number"` // Supports BPAN: IN-NKY-LFP-2026-00001
	ManufactureDate time.Time `json:"manufacture_date"`
	Status          string    `json:"status"` // CREATED, ACTIVE, SHIPPED, IN_SERVICE, RECYCLED, END_OF_LIFE, RECALLED
	CreatedAt       time.Time `json:"created_at"`

	// v2: Product-agnostic fields
	ProductType ProductType     `json:"product_type"` // BATTERY, TEXTILE, ELECTRONICS (default: BATTERY)
	Telemetry   json.RawMessage `json:"telemetry,omitempty"` // IoT telemetry data (product-specific)

	// Immutable snapshot of batch data at creation time
	BatchSnapshot json.RawMessage `json:"batch_snapshot,omitempty"`

	// Ownership tracking (current + history)
	CurrentOwnerIdentifier string          `json:"current_owner_identifier,omitempty"`
	CurrentOwnerEmail      string          `json:"current_owner_email,omitempty"`
	OwnershipHistory       json.RawMessage `json:"ownership_history,omitempty"`

	// Lifecycle tracking fields
	ShippedAt   *time.Time `json:"shipped_at,omitempty"`   // When battery left factory
	InstalledAt *time.Time `json:"installed_at,omitempty"` // When installed in device/vehicle
	ReturnedAt  *time.Time `json:"returned_at,omitempty"`  // When returned for warranty/recycling
	RecycledAt  *time.Time `json:"recycled_at,omitempty"`  // When recycled

	// Dynamic compliance field (updated over battery lifetime)
	StateOfHealth          *float64   `json:"state_of_health,omitempty"` // 0-100, stored as literal percentage (e.g., 95.5 = 95.5%)
	LastSOHUpdateTimestamp *time.Time `json:"last_soh_update_timestamp,omitempty"`

	// BMS Telemetry summary fields (updated by telemetry ingestion)
	CycleCount        *int       `json:"cycle_count,omitempty"`
	LastTemperature   *float64   `json:"last_temperature,omitempty"`
	LastVoltage       *float64   `json:"last_voltage,omitempty"`
	ThermalEventCount int        `json:"thermal_event_count"`
	LastTelemetryAt   *time.Time `json:"last_telemetry_at,omitempty"`

	// EU dynamic compliance data
	RepairEvents      json.RawMessage `json:"repair_events,omitempty"`
	ReplacementEvents json.RawMessage `json:"replacement_events,omitempty"`

	// Ownership tracking
	OwnerID *uuid.UUID `json:"owner_id,omitempty"` // Current owner (distributor, retailer, end user)

	// India-specific recycling fields
	RecyclingStatus string     `json:"recycling_status,omitempty"`
	RecyclerEprID   string     `json:"recycler_epr_id,omitempty"`
	RecyclingDate   *time.Time `json:"recycling_date,omitempty"`

	// CSV Traceability
	CSVSourceFilename string `json:"csv_source_filename,omitempty"`
	CSVRowIndex       int    `json:"csv_row_index,omitempty"`
}

// PassportStatus constants - lifecycle states
const (
	PassportStatusCreated   = "CREATED"     // Passport record created
	PassportStatusActive    = "ACTIVE"      // Manufactured and legally valid
	PassportStatusShipped   = "SHIPPED"     // Battery left factory/warehouse
	PassportStatusInService = "IN_SERVICE"  // Installed in device/vehicle
	PassportStatusRecalled  = "RECALLED"    // Safety/compliance interruption
	PassportStatusRecycled  = "RECYCLED"    // Processed by authorized recycler
	PassportStatusEndOfLife = "END_OF_LIFE" // Final state
)

// ActorType defines who performed a lifecycle action
type ActorType string

const (
	ActorTypeSystem  ActorType = "SYSTEM"
	ActorTypeUser    ActorType = "USER"
	ActorTypePartner ActorType = "PARTNER"
)

// ActorRole defines legal authority for lifecycle actions
type ActorRole string

const (
	ActorRoleSystem           ActorRole = "SYSTEM"
	ActorRoleInternalOperator ActorRole = "INTERNAL_OPERATOR"
	ActorRoleLogistics        ActorRole = "LOGISTICS"
	ActorRoleTechnician       ActorRole = "TECHNICIAN"
	ActorRoleRecycler         ActorRole = "RECYCLER"
	ActorRoleAdmin            ActorRole = "ADMIN"
)

// ActionSource defines where the action originated
type ActionSource string

const (
	ActionSourceInternal  ActionSource = "INTERNAL"
	ActionSourceMagicLink ActionSource = "MAGIC_LINK"
)

// ActorContext carries the mandatory actor identity for lifecycle actions
type ActorContext struct {
	ActorType ActorType
	ActorID   string
	ActorRole ActorRole
	Source    ActionSource
}

var (
	ErrInvalidActorContext = errors.New("invalid actor context")
)

// IsValidActorType checks if the actor type is valid
func IsValidActorType(actorType ActorType) bool {
	switch actorType {
	case ActorTypeSystem, ActorTypeUser, ActorTypePartner:
		return true
	}
	return false
}

// IsValidActorRole checks if the actor role is valid
func IsValidActorRole(role ActorRole) bool {
	switch role {
	case ActorRoleSystem, ActorRoleInternalOperator, ActorRoleLogistics, ActorRoleTechnician, ActorRoleRecycler, ActorRoleAdmin:
		return true
	}
	return false
}

// IsValidPartnerRole checks if the role is valid for external partners
func IsValidPartnerRole(role string) bool {
	switch ActorRole(role) {
	case ActorRoleLogistics, ActorRoleTechnician, ActorRoleRecycler:
		return true
	}
	return false
}

// IsValidActionSource checks if the action source is valid
func IsValidActionSource(source ActionSource) bool {
	switch source {
	case ActionSourceInternal, ActionSourceMagicLink:
		return true
	}
	return false
}

// ValidateActorContext validates actor context and required invariants
func ValidateActorContext(ctx ActorContext) error {
	if ctx.ActorID == "" || ctx.ActorType == "" || ctx.ActorRole == "" || ctx.Source == "" {
		return ErrInvalidActorContext
	}
	if !IsValidActorType(ctx.ActorType) || !IsValidActorRole(ctx.ActorRole) || !IsValidActionSource(ctx.Source) {
		return ErrInvalidActorContext
	}
	// Enforce type/source alignment
	switch ctx.ActorType {
	case ActorTypeSystem:
		if ctx.ActorRole != ActorRoleSystem || ctx.Source != ActionSourceInternal || ctx.ActorID != "system" {
			return ErrInvalidActorContext
		}
	case ActorTypeUser:
		if ctx.Source != ActionSourceInternal || ctx.ActorRole == ActorRoleSystem {
			return ErrInvalidActorContext
		}
	case ActorTypePartner:
		if ctx.Source != ActionSourceMagicLink {
			return ErrInvalidActorContext
		}
	}
	return nil
}

// TransitionAction constants - canonical lifecycle actions
type TransitionAction string

const (
	ActionActivate TransitionAction = "ACTIVATE"
	ActionShip     TransitionAction = "SHIP"
	ActionInstall  TransitionAction = "INSTALL"
	ActionRecycle  TransitionAction = "RECYCLE"
	ActionClose    TransitionAction = "CLOSE"
	ActionRecall   TransitionAction = "RECALL"
)

// TransitionDefinition defines allowed from-states and resulting state for an action.
// This is the single source of truth for lifecycle transitions.
type TransitionDefinition struct {
	AllowedFrom []string
	To          string
}

// TransitionActionOrder ensures deterministic ordering for allowed actions.
var TransitionActionOrder = []TransitionAction{
	ActionActivate,
	ActionShip,
	ActionInstall,
	ActionRecycle,
	ActionClose,
	ActionRecall,
}

// TransitionMap defines the canonical action-based lifecycle transitions.
var TransitionMap = map[TransitionAction]TransitionDefinition{
	ActionActivate: {
		AllowedFrom: []string{PassportStatusCreated},
		To:          PassportStatusActive,
	},
	ActionShip: {
		AllowedFrom: []string{PassportStatusActive},
		To:          PassportStatusShipped,
	},
	ActionInstall: {
		AllowedFrom: []string{PassportStatusShipped},
		To:          PassportStatusInService,
	},
	ActionRecycle: {
		AllowedFrom: []string{PassportStatusInService, PassportStatusRecalled},
		To:          PassportStatusRecycled,
	},
	ActionClose: {
		AllowedFrom: []string{PassportStatusRecycled, PassportStatusRecalled},
		To:          PassportStatusEndOfLife,
	},
	ActionRecall: {
		AllowedFrom: []string{PassportStatusActive, PassportStatusShipped, PassportStatusInService},
		To:          PassportStatusRecalled,
	},
}

// AllowedRolesByAction defines which roles can perform which actions
var AllowedRolesByAction = map[TransitionAction][]ActorRole{
	ActionActivate: {ActorRoleSystem},
	ActionShip:     {ActorRoleInternalOperator, ActorRoleLogistics},
	ActionInstall:  {ActorRoleTechnician},
	ActionRecycle:  {ActorRoleRecycler},
	ActionClose:    {ActorRoleSystem, ActorRoleRecycler},
	ActionRecall:   {ActorRoleAdmin},
}

// IsRoleAllowedForAction checks if a role is allowed to perform an action
func IsRoleAllowedForAction(action TransitionAction, role ActorRole) bool {
	allowedRoles, exists := AllowedRolesByAction[action]
	if !exists {
		return false
	}
	for _, allowed := range allowedRoles {
		if allowed == role {
			return true
		}
	}
	return false
}

// IsValidAction checks if a transition action is defined in the canonical map.
func IsValidAction(action string) bool {
	_, exists := TransitionMap[TransitionAction(action)]
	return exists
}

// GetTransitionDefinition returns the transition definition for a given action.
func GetTransitionDefinition(action TransitionAction) (TransitionDefinition, bool) {
	def, exists := TransitionMap[action]
	return def, exists
}

// IsActionAllowedFrom checks if an action is allowed from the current status.
func IsActionAllowedFrom(action TransitionAction, currentStatus string) bool {
	def, exists := TransitionMap[action]
	if !exists {
		return false
	}
	for _, status := range def.AllowedFrom {
		if status == currentStatus {
			return true
		}
	}
	return false
}

// GetAllowedActions returns the list of valid actions for a given current status.
func GetAllowedActions(currentStatus string) []TransitionAction {
	allowed := make([]TransitionAction, 0)
	for _, action := range TransitionActionOrder {
		if IsActionAllowedFrom(action, currentStatus) {
			allowed = append(allowed, action)
		}
	}
	return allowed
}

// ============================================================================
// PASSPORT EVENTS (LIFECYCLE AUDIT LOG)
// ============================================================================

// PassportEvent represents an immutable lifecycle event for a passport
type PassportEvent struct {
	ID           uuid.UUID              `json:"id"`
	PassportID   uuid.UUID              `json:"passport_id"`
	EventType    string                 `json:"event_type"` // CREATED, STATUS_CHANGED, SCANNED, RECALLED, RECYCLED, END_OF_LIFE
	Action       TransitionAction       `json:"action,omitempty"`
	Actor        string                 `json:"actor"` // Who triggered: system, user email, etc.
	ActorType    string                 `json:"actor_type,omitempty"`
	ActorRole    ActorRole              `json:"actor_role,omitempty"`
	ActorID      string                 `json:"actor_identifier,omitempty"`
	Source       string                 `json:"source,omitempty"` // INTERNAL | MAGIC_LINK | API
	StatusFrom   string                 `json:"status_from,omitempty"`
	StatusTo     string                 `json:"status_to,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	Hash         string                 `json:"hash,omitempty"`          // SHA-256 hash of event data for tamper detection
	PreviousHash string                 `json:"previous_hash,omitempty"` // Hash of previous event in chain
}

// AuditEventRow is a DTO for batch-level audit export — joins PassportEvent with the passport's serial number.
type AuditEventRow struct {
	PassportEvent
	SerialNumber string `json:"serial_number"`
}

// TransitionPersistence bundles a lifecycle transition with its audit event for atomic persistence.
type TransitionPersistence struct {
	PassportID         uuid.UUID
	NewStatus          string
	ShippedAt          *time.Time
	InstalledAt        *time.Time
	RecycledAt         *time.Time
	RecyclingStatus    string
	RecyclerEprID      string
	RecyclingDate      *time.Time
	Event              *PassportEvent
	MagicLinkTokenHash string
}

// PassportEventType constants
const (
	PassportEventCreated       = "CREATED"
	PassportEventImported      = "IMPORTED"    // Genesis event for CSV-uploaded passports
	PassportEventTransferred   = "TRANSFERRED" // Ownership transfer event
	PassportEventStatusChanged = "STATUS_CHANGED"
	PassportEventScanned       = "SCANNED"
	PassportEventShipped       = "SHIPPED"   // NEW: battery left factory
	PassportEventInstalled     = "INSTALLED" // NEW: installed in device
	PassportEventRecalled      = "RECALLED"
	PassportEventRecycled      = "RECYCLED"
	PassportEventEndOfLife     = "END_OF_LIFE"
	PassportEventSOHUpdated    = "SOH_UPDATED"
	PassportEventRepairLogged  = "REPAIR_LOGGED"
	PassportEventReplaceLogged = "REPLACEMENT_LOGGED"
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
	TenantID    uuid.UUID   `json:"tenant_id"`
	BatchName   string      `json:"batch_name"`
	ModelName   string      `json:"model_name"`
	ProductType ProductType `json:"product_type,omitempty"` // v2: defaults to BATTERY if empty
	Specs       BatchSpec   `json:"specs"`

	// Dual-Mode Fields
	MarketRegion     MarketRegion `json:"market_region"`                // INDIA, EU, or GLOBAL
	PLICompliant     bool         `json:"pli_compliant,omitempty"`      // India only
	DomesticValueAdd float64      `json:"domestic_value_add,omitempty"` // India only (stored as literal: 45.5 = 45.5%)
	CellSource       string       `json:"cell_source,omitempty"`        // India only

	// Manufacturing window (legal declaration)
	ManufacturingStartDate string `json:"manufacturing_start_date,omitempty"` // YYYY-MM-DD
	ManufacturingEndDate   string `json:"manufacturing_end_date,omitempty"`   // YYYY-MM-DD

	// India Import/Customs Fields (Required when MarketRegion=INDIA and CellSource=IMPORTED)
	BillOfEntryNo   string `json:"bill_of_entry_no,omitempty"`  // Customs Bill of Entry number
	CountryOfOrigin string `json:"country_of_origin,omitempty"` // Source country
	CustomsDate     string `json:"customs_date,omitempty"`      // Date in YYYY-MM-DD format
	HSNCode         string `json:"hsn_code,omitempty"`          // India: HSN code (e.g., "8507.60")

	// PLI/DVA Audit Compliance Fields
	DVASource               string   `json:"dva_source,omitempty"`                 // "ESTIMATED" or "AUDITED"
	AuditedDomesticValueAdd *float64 `json:"audited_domestic_value_add,omitempty"` // CA-certified DVA %
	PLICertificateURL       string   `json:"pli_certificate_url,omitempty"`        // Path to CA certificate

	// India Compliance Certification Fields
	BISNumber string `json:"bis_number,omitempty"` // BIS R-Number (e.g., "R-12345678")
	EPRNumber string `json:"epr_number,omitempty"` // EPR Registration Number
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
	Passport               *Passport    `json:"passport"`
	BatchName              string       `json:"batch_name"`
	ModelName              string       `json:"model_name,omitempty"`
	Specs                  *BatchSpec   `json:"specs"`
	MarketRegion           MarketRegion `json:"market_region"` // For conditional UI rendering
	Tenant                 *Tenant      `json:"tenant"`        // Added for public profile display
	ManufacturingStartDate *time.Time   `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time   `json:"manufacturing_end_date,omitempty"`
	// Added for Import/Domestic logic
	CellSource      string `json:"cell_source,omitempty"`
	BillOfEntryNo   string `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin string `json:"country_of_origin,omitempty"`
	// India compliance fields - needed for passport view
	DomesticValueAdd float64    `json:"domestic_value_add,omitempty"` // Stored as literal: 45.5 = 45.5%
	PLICompliant     bool       `json:"pli_compliant,omitempty"`
	CustomsDate      *time.Time `json:"customs_date,omitempty"`
	HSNCode          string     `json:"hsn_code,omitempty"`
	DVASource        string     `json:"dva_source,omitempty"`
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
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	DeviceType string    `json:"device_type"`
	UserAgent  string    `json:"user_agent"`
	ScannedAt  time.Time `json:"scanned_at"`
}

// ScanFeedItem represents a scan event for the live feed
type ScanFeedItem struct {
	City         string    `json:"city"`
	Country      string    `json:"country"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
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
// BPAN V2 TYPES (Multi-Region Serial Numbering)
// Format: {REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}
// ============================================================================

// BPANVersion tracks the serial format version.
type BPANVersion string

const (
	BPANv1 BPANVersion = "V1" // Legacy India-only format
	BPANv2 BPANVersion = "V2" // Multi-region format (IN/EU/GL)
)

// BPANComponents represents the parsed segments of a BPAN serial number.
type BPANComponents struct {
	Region       string      `json:"region"`       // IN, EU, GL
	Manufacturer string      `json:"manufacturer"` // 3-char code
	Chemistry    string      `json:"chemistry"`    // LFP, NMC, etc.
	Year         int         `json:"year"`
	Sequence     int         `json:"sequence"`
	Version      BPANVersion `json:"version"`
}

// ============================================================================
// TRUSTED DOMAINS (TIER A MAGIC LINK VERIFICATION)
// ============================================================================

// TrustedDomain represents a pre-approved email domain for automatic role assignment
type TrustedDomain struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	Domain      string    `json:"domain"`      // e.g., "tatamotors.com"
	Role        string    `json:"role"`        // LOGISTICS, TECHNICIAN, RECYCLER
	Description string    `json:"description"` // e.g., "Tata Motors Fleet Management"
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateTrustedDomainRequest is the request body for adding a trusted domain
type CreateTrustedDomainRequest struct {
	Domain      string `json:"domain"`
	Role        string `json:"role"`
	Description string `json:"description,omitempty"`
}

// ============================================================================
// REWARD LEDGER (SCAN-TO-EARN GAMIFICATION - POINTS COUNTER ONLY)
// ============================================================================

// RewardActionType constants - points are display-only (no cash out)
const (
	RewardActionScanInstall = "SCAN_INSTALL" // 50 points
	RewardActionScanRecycle = "SCAN_RECYCLE" // 100 points
	RewardActionScanReturn  = "SCAN_RETURN"  // 20 points
	RewardActionBonus       = "BONUS"        // Manual bonus
	RewardActionRedemption  = "REDEMPTION"   // Manual offline redemption (negative)
)

// RewardPoints defines default point values
var RewardPoints = map[string]int{
	RewardActionScanInstall: 50,
	RewardActionScanRecycle: 100,
	RewardActionScanReturn:  20,
}

// RewardLedger tracks reputation points for mechanics (display-only, no payment)
type RewardLedger struct {
	ID             uuid.UUID              `json:"id"`
	TenantID       uuid.UUID              `json:"tenant_id"`
	RecipientEmail string                 `json:"recipient_email"`
	PassportUUID   *uuid.UUID             `json:"passport_uuid,omitempty"`
	ActionType     string                 `json:"action_type"` // SCAN_INSTALL, SCAN_RECYCLE, SCAN_RETURN
	PointsEarned   int                    `json:"points_earned"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

// RewardBalance represents aggregated points for a user (view data)
type RewardBalance struct {
	TenantID       uuid.UUID `json:"tenant_id"`
	RecipientEmail string    `json:"recipient_email"`
	TotalPoints    int       `json:"total_points"`
	InstallCount   int       `json:"install_count"`
	RecycleCount   int       `json:"recycle_count"`
	ReturnCount    int       `json:"return_count"`
	LastActivity   time.Time `json:"last_activity"`
	LoyaltyLevel   string    `json:"loyalty_level"` // Computed: "Level 1", "Level 2", etc.
}

// GetLoyaltyLevel computes loyalty level from total points
func GetLoyaltyLevel(totalPoints int) string {
	switch {
	case totalPoints >= 1000:
		return "Level 5 - Expert"
	case totalPoints >= 500:
		return "Level 4 - Senior"
	case totalPoints >= 200:
		return "Level 3 - Advanced"
	case totalPoints >= 50:
		return "Level 2 - Intermediate"
	default:
		return "Level 1 - Starter"
	}
}

// ============================================================================
// EXPORT JOBS (ASYNC BACKGROUND EXPORTS)
// ============================================================================

// ExportJobStatus represents the processing status of an export job
type ExportJobStatus string

const (
	ExportJobStatusPending    ExportJobStatus = "PENDING"
	ExportJobStatusProcessing ExportJobStatus = "PROCESSING"
	ExportJobStatusCompleted  ExportJobStatus = "COMPLETED"
	ExportJobStatusFailed     ExportJobStatus = "FAILED"
)

// ExportJobType represents the type of export file
type ExportJobType string

const (
	ExportJobTypeQRZip                 ExportJobType = "QR_ZIP"
	ExportJobTypeLabelPDF              ExportJobType = "LABELS_PDF"
	ExportJobTypeCSV                   ExportJobType = "CSV"
	ExportJobTypeDueDiligence          ExportJobType = "DUE_DILIGENCE"
	ExportJobTypeComplianceDeclaration ExportJobType = "COMPLIANCE_DECLARATION"
	ExportJobTypeAuditCSV              ExportJobType = "AUDIT_CSV"
	ExportJobTypeAuditPDF              ExportJobType = "AUDIT_PDF"
)

// ExportJob represents an async background export job
type ExportJob struct {
	ID            uuid.UUID       `json:"id"`
	TenantID      uuid.UUID       `json:"tenant_id"`
	BatchID       uuid.UUID       `json:"batch_id"`
	JobType       ExportJobType   `json:"job_type"`
	Status        ExportJobStatus `json:"status"`
	PassportCount int             `json:"passport_count"`

	// File storage info (Supabase Storage)
	FilePath      *string `json:"file_path,omitempty"`
	FileSizeBytes *int64  `json:"file_size_bytes,omitempty"`
	DownloadURL   *string `json:"download_url,omitempty"`

	// Error tracking
	ErrorMessage *string `json:"error_message,omitempty"`

	// Audit fields
	RequestedBy uuid.UUID  `json:"requested_by"`
	RequestedAt time.Time  `json:"requested_at"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`

	// Usage tracking
	DownloadCount    int        `json:"download_count"`
	LastDownloadedAt *time.Time `json:"last_downloaded_at,omitempty"`

	// Additional info for display (populated by service)
	BatchName string `json:"batch_name,omitempty"`
}

// IsExpired checks if the download link has expired
func (e *ExportJob) IsExpired() bool {
	if e.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*e.ExpiresAt)
}

// GetFilename returns a user-friendly filename for the export
func (e *ExportJob) GetFilename(batchName string) string {
	// Sanitize batch name to prevent issues with spaces in URLs
	sanitizedBatchName := strings.ReplaceAll(batchName, " ", "_")

	switch e.JobType {
	case ExportJobTypeQRZip:
		return fmt.Sprintf("%s_qrcodes.zip", sanitizedBatchName)
	case ExportJobTypeLabelPDF:
		return fmt.Sprintf("%s_labels.pdf", sanitizedBatchName)
	case ExportJobTypeCSV:
		return fmt.Sprintf("%s_export.csv", sanitizedBatchName)
	case ExportJobTypeDueDiligence:
		return fmt.Sprintf("%s_due_diligence.pdf", sanitizedBatchName)
	case ExportJobTypeComplianceDeclaration:
		return fmt.Sprintf("%s_carbon_declaration.pdf", sanitizedBatchName)
	case ExportJobTypeAuditCSV:
		return fmt.Sprintf("%s_audit_trail.csv", sanitizedBatchName)
	case ExportJobTypeAuditPDF:
		return fmt.Sprintf("%s_audit_trail.pdf", sanitizedBatchName)
	default:
		return fmt.Sprintf("%s_export", sanitizedBatchName)
	}
}

// ============================================================================
// EPR CERTIFICATE LEDGER (India BWM Rules 2022)
// ============================================================================

// EPRCertificate represents a purchased EPR certificate from a registered recycler
type EPRCertificate struct {
	ID                uuid.UUID  `json:"id"`
	TenantID          uuid.UUID  `json:"tenant_id"`
	CertificateNumber string     `json:"certificate_number"`
	RecyclerName      string     `json:"recycler_name"`
	RecyclerEprID     string     `json:"recycler_epr_id,omitempty"`
	WeightKg          float64    `json:"weight_kg"`
	BatteryType       string     `json:"battery_type,omitempty"`
	FinancialYear     string     `json:"financial_year"`
	IssuedDate        time.Time  `json:"issued_date"`
	ExpiryDate        *time.Time `json:"expiry_date,omitempty"`
	Status            string     `json:"status"`
	RetiredAt         *time.Time `json:"retired_at,omitempty"`
	DocumentPath      string     `json:"document_path,omitempty"`
	Notes             string     `json:"notes,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// EPR Certificate status constants
const (
	EPRCertStatusActive   = "ACTIVE"
	EPRCertStatusRetired  = "RETIRED"
	EPRCertStatusExpired  = "EXPIRED"
	EPRCertStatusRejected = "REJECTED"
)

// CreateEPRCertificateRequest is the request body for adding a certificate
type CreateEPRCertificateRequest struct {
	CertificateNumber string  `json:"certificate_number"`
	RecyclerName      string  `json:"recycler_name"`
	RecyclerEprID     string  `json:"recycler_epr_id,omitempty"`
	WeightKg          float64 `json:"weight_kg"`
	BatteryType       string  `json:"battery_type,omitempty"`
	FinancialYear     string  `json:"financial_year"`
	IssuedDate        string  `json:"issued_date"`
	ExpiryDate        string  `json:"expiry_date,omitempty"`
	DocumentPath      string  `json:"document_path,omitempty"`
	Notes             string  `json:"notes,omitempty"`
}

// EPRLedgerSummary shows obligation vs certificates for a financial year
type EPRLedgerSummary struct {
	FinancialYear    string  `json:"financial_year"`
	ObligationKg     float64 `json:"obligation_kg"`
	CertifiedKg      float64 `json:"certified_kg"`
	DeficitKg        float64 `json:"deficit_kg"`
	SurplusKg        float64 `json:"surplus_kg"`
	CertificateCount int     `json:"certificate_count"`
	ComplianceStatus string  `json:"compliance_status"`
}
