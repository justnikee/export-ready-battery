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
	BatteryCategoryEV         BatteryCategory = "EV"         // Electric vehicle (>25 kWh)
	BatteryCategoryLMT        BatteryCategory = "LMT"        // Light means of transport (e-bikes, e-scooters)
	BatteryCategoryIndustrial BatteryCategory = "INDUSTRIAL" // Industrial batteries (>2 kWh, stationary storage)
	BatteryCategoryPortable   BatteryCategory = "PORTABLE"   // Portable batteries (<5 kg, consumer)
	BatteryCategorySLI        BatteryCategory = "SLI"        // Starting, Lighting, Ignition (automotive 12V)
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
	ID           uuid.UUID   `json:"id"`
	CompanyName  string      `json:"company_name"`
	Address      string      `json:"address,omitempty"`
	LogoURL      string      `json:"logo_url,omitempty"`
	SupportEmail string      `json:"support_email,omitempty"`
	Website      string      `json:"website,omitempty"`
	ProductType  ProductType `json:"product_type"`
	CreatedAt    time.Time   `json:"created_at"`

	// Quota System (Monetization)
	QuotaBalance          int        `json:"quota_balance"` // Passport activation slots available (debited per passport in ActivateBatch)
	PlanType              string     `json:"plan_type"`     // STARTER, GROWTH, ENTERPRISE
	SubscriptionExpiresAt *time.Time `json:"subscription_expires_at,omitempty"`
	PlanStatus            string     `json:"plan_status"` // ACTIVE, EXPIRED, TRIAL
	BonusSeats            int        `json:"bonus_seats"` // Extra seats purchased beyond the plan's included seat count (see "Extra Team Seat" add-on)

	// Partner Access (Tier B Magic Link Verification)
	PartnerAccessCode string `json:"partner_access_code,omitempty"` // Secret code for external partner verification

	// Onboarding Status
	OnboardingCompleted bool `json:"onboarding_completed"` // Whether user completed profile setup

	// BPAN V2: 3-char manufacturer code for serial number generation
	ManufacturerCode string `json:"manufacturer_code,omitempty"` // e.g. "TEN", auto-derived from company name

	// Field Visibility Config stored as JSONB.
	// Must be json.RawMessage ([]byte) — pgx SimpleProtocol cannot encode map types into JSONB.
	DataVisibility json.RawMessage `json:"data_visibility,omitempty"`

	// Product-specific profiles (populated from battery_tenant_profiles).
	BatteryProfile *BatteryTenantProfile `json:"battery_profile,omitempty"`
}

// BaseProfileRequest holds shared profile fields for all product types.
type BaseProfileRequest struct {
	CompanyName    string          `json:"company_name"`
	Address        string          `json:"address"`
	LogoURL        string          `json:"logo_url"`
	SupportEmail   string          `json:"support_email"`
	Website        string          `json:"website"`
	DataVisibility json.RawMessage `json:"data_visibility"`
}

// BatteryProfileUpdate holds battery-specific profile update fields.
type BatteryProfileUpdate struct {
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address"`
	EUContactEmail                    string `json:"eu_contact_email"`
	EPRRegistrationNumber             string `json:"epr_registration_number"`
	BISRNumber                        string `json:"bis_r_number"`
	IECCode                           string `json:"iec_code"`
	MorthManufacturerCode             string `json:"morth_manufacturer_code"`
	MorthFactoryCodes                 string `json:"morth_factory_codes"`
}

// UpdateProfileRequest represents the payload for updating tenant profile.
// It preserves the flat JSON API contract via promoted fields.
type UpdateProfileRequest struct {
	BaseProfileRequest
	*BatteryProfileUpdate
}

// ============================================================================
// TEMPLATE
// ============================================================================

// Template represents a reusable batch specification template (Product SKU)
type Template struct {
	ID           uuid.UUID    `json:"id"`
	TenantID     uuid.UUID    `json:"tenant_id"`
	Name         string       `json:"name"`
	ProductType  ProductType  `json:"product_type"`
	MarketRegion MarketRegion `json:"market_region"` // INDIA, EU, or GLOBAL
	Specs        BatchSpec    `json:"specs"`
	CreatedAt    time.Time    `json:"created_at"`
}

// CreateTemplateRequest is the request body for creating a template
type CreateTemplateRequest struct {
	TenantID     uuid.UUID    `json:"tenant_id"`
	Name         string       `json:"name"`
	ProductType  ProductType  `json:"product_type"`
	MarketRegion MarketRegion `json:"market_region"` // INDIA, EU, or GLOBAL
	Specs        BatchSpec    `json:"specs"`
}

// ============================================================================
// BATCH (UPDATED FOR DUAL-MODE)
// ============================================================================

// Batch represents a production batch uploaded by a tenant
type Batch struct {
	ID        uuid.UUID  `json:"id"`
	TenantID  uuid.UUID  `json:"tenant_id"`
	BatchName string     `json:"batch_name"`
	ModelName string     `json:"model_name"`
	Specs     BatchSpec  `json:"specs"`
	CreatedAt time.Time  `json:"created_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"` // Soft-delete timestamp; nil = active
	Status    string     `json:"status"`               // DRAFT, ACTIVE, ARCHIVED

	// v2: Product-agnostic fields
	ProductType     ProductType     `json:"product_type"`              // BATTERY or ELECTRONICS (default: BATTERY)
	SchemaVersion   int             `json:"schema_version"`            // Schema version used for specs validation
	ComplianceScore float64         `json:"compliance_score"`          // 0-100, computed by compliance engine
	ComplianceGaps  json.RawMessage `json:"compliance_gaps,omitempty"` // [{field, market, regulation}]

	// Manufacturing window (legal declaration)
	ManufacturingStartDate *time.Time `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time `json:"manufacturing_end_date,omitempty"`

	// Dual-Mode Compliance Fields
	MarketRegion     MarketRegion `json:"market_region"`      // INDIA, EU, or GLOBAL
	PLICompliant     bool         `json:"pli_compliant"`      // India: PLI subsidy eligibility
	DomesticValueAdd float64      `json:"domestic_value_add"` // India: % of local value (stored as literal: 45.5 = 45.5%)
	TotalPassports   int          `json:"total_passports"`    // Computed count of passports

	// ── v2: Battery-specific fields moved to Specs JSONB ──
	// CellSource, BillOfEntryNo, CountryOfOrigin, CustomsDate, HSNCode, BISNumber,
	// EPRNumber, DVASource, AuditedDomesticValueAdd, PLICertificateURL are now
	// stored inside the specs JSONB column for product-agnostic schema design.
	// Access them via batch.Specs.CellSource, batch.Specs.HSNCode, etc.

	// EU Carbon Footprint Calculator Result (JSONB, from POST /api/v1/carbon/calculate)
	CarbonFootprintResult json.RawMessage `json:"carbon_footprint_result,omitempty"`

	// ── EU Battery Regulation 2023/1542 compliance fields (migration 057) ──
	CEMarking                   bool   `json:"ce_marking"`
	NotifiedBodyNumber          string `json:"notified_body_number,omitempty"`
	CarbonPerformanceClass      string `json:"carbon_performance_class,omitempty"` // A, B, C, D, E
	RemovableAndReplaceable     bool   `json:"removable_and_replaceable"`
	DeclarationOfConformityPath string `json:"declaration_of_conformity_path,omitempty"`

	// GS1 Digital Link GTIN for EU Battery Passport QR code compliance (migration 071)
	GTIN string `json:"gtin,omitempty"`
}

// BatchSpec holds the common specifications stored as JSONB
type BatchSpec struct {
	Chemistry         string `json:"chemistry"`
	NominalVoltage    string `json:"voltage"`  // String for flexibility (e.g., "3.7V")
	Capacity          string `json:"capacity"` // String for flexibility (e.g., "5000mAh")
	Manufacturer      string `json:"manufacturer"`
	ManufacturerEmail string `json:"manufacturer_email,omitempty"` // Compliance contact email
	Weight            string `json:"weight"`                       // String for flexibility (e.g., "500g")
	Recyclable        bool   `json:"recyclable"`                   // Is the battery recyclable?
	CarbonFootprint   string `json:"carbon_footprint"`             // e.g., "10 kg CO2e"
	CountryOfOrigin   string `json:"country_of_origin"`
	MaterialProfile   string `json:"material_profile,omitempty"`
	LotSize           string `json:"lot_size,omitempty"`
	ProductionStage   string `json:"production_stage,omitempty"`

	// Financials (India PLI) stored in JSONB to avoid schema change
	SalePriceINR  float64 `json:"sale_price_inr,omitempty"`
	ImportCostINR float64 `json:"import_cost_inr,omitempty"` // legacy 2-field estimator (still used by CSV bulk import)

	// DVA cost breakdown (MHI PLI-ACC formula) — used by the interactive batch
	// wizard's estimator. When present, takes precedence over the legacy
	// SalePriceINR/ImportCostINR shortcut in batch_creation_validator.go.
	CellCostImportedINR   float64 `json:"cell_cost_imported_inr,omitempty"`
	CellCostDomesticINR   float64 `json:"cell_cost_domestic_inr,omitempty"`
	BMSCostImportedINR    float64 `json:"bms_cost_imported_inr,omitempty"`
	BMSCostDomesticINR    float64 `json:"bms_cost_domestic_inr,omitempty"`
	CasingCostImportedINR float64 `json:"casing_cost_imported_inr,omitempty"`
	CasingCostDomesticINR float64 `json:"casing_cost_domestic_inr,omitempty"`
	LabourOverheadCostINR float64 `json:"labour_overhead_cost_inr,omitempty"`

	// India PLI/Compliance Fields (for Product SKU Templates)
	CellSource       string  `json:"cell_source,omitempty"`        // IMPORTED or DOMESTIC
	DomesticValueAdd float64 `json:"domestic_value_add,omitempty"` // Target DVA % (e.g., 50.0 = 50%)
	HSNCode          string  `json:"hsn_code,omitempty"`           // Harmonized System Nomenclature code
	BISNumber        string  `json:"bis_number,omitempty"`         // BIS R-Number (e.g., "R-12345678")
	EPRNumber        string  `json:"epr_number,omitempty"`         // EPR Registration Number

	// ── Fields migrated from top-level Batch columns (v2 product-agnostic refactor) ──
	BillOfEntryNo           string   `json:"bill_of_entry_no,omitempty"`           // Customs Bill of Entry number
	CustomsDate             string   `json:"customs_date,omitempty"`               // YYYY-MM-DD
	DVASource               string   `json:"dva_source,omitempty"`                 // "ESTIMATED" or "AUDITED"
	AuditedDomesticValueAdd *float64 `json:"audited_domestic_value_add,omitempty"` // CA-certified DVA %
	PLICertificateURL       string   `json:"pli_certificate_url,omitempty"`        // URL to CA certificate

	// EU Battery Regulation 2023/1542 - MANDATORY FIELDS
	MaterialComposition     *MaterialComposition `json:"material_composition,omitempty"`       // Critical raw materials %
	Certifications          []string             `json:"certifications,omitempty"`             // CE, UL, IEC, etc.
	BISCertificateIssueDate string               `json:"bis_certificate_issue_date,omitempty"` // YYYY-MM-DD
	UN383TestDate           string               `json:"un38_3_test_date,omitempty"`           // YYYY-MM-DD
	UN383LabName            string               `json:"un38_3_lab_name,omitempty"`            // Test lab name (e.g., "TUV SUD")
	IEC62133TestDate        string               `json:"iec_62133_test_date,omitempty"`        // YYYY-MM-DD
	CENotifiedBodyNumber    string               `json:"ce_notified_body_number,omitempty"`    // EU NANDO notified body number (e.g., "NB1234")
	MSDSIssueDate           string               `json:"msds_issue_date,omitempty"`            // YYYY-MM-DD
	ManufacturerAddress     string               `json:"manufacturer_address,omitempty"`       // Physical address
	EURepresentative        string               `json:"eu_representative,omitempty"`          // EU contact name/company
	EURepresentativeEmail   string               `json:"eu_representative_email,omitempty"`    // EU contact email
	EURepresentativeAddress string               `json:"eu_representative_address,omitempty"`  // EU contact address
	ExpectedLifetimeCycles  *int                 `json:"expected_lifetime_cycles,omitempty"`   // Expected charge cycles (e.g., 1000)
	WarrantyMonths          *int                 `json:"warranty_months,omitempty"`            // Warranty period in months
	RecycledContentPct      *float64             `json:"recycled_content_pct,omitempty"`       // % recycled content (stored as literal: 15.5 = 15.5%)
	HazardousSubstances     *HazardousSubstances `json:"hazardous_substances,omitempty"`       // REACH/RoHS compliance

	// EU Battery Regulation 2023/1542 - STRUCTURED DATA (Art 2, Art 7, Art 57, Art 39)
	BatteryCategory       BatteryCategory        `json:"battery_category,omitempty"`        // EV, LMT, INDUSTRIAL, PORTABLE, SLI
	PerformanceSpec       *PerformanceSpec       `json:"performance_spec,omitempty"`        // Rated electrical/thermal specs (Annex IV)
	DisassemblyGuide      *DisassemblyGuide      `json:"disassembly_guide,omitempty"`       // Disassembly & recycling info (Art 57)
	SupplyChainProvenance *SupplyChainProvenance `json:"supply_chain_provenance,omitempty"` // Raw material sourcing (Art 39)

	// Bill of Materials — nested component hierarchy (pack → module → cell)
	Components []Component `json:"components,omitempty"`

	// GS1 Digital Link GTIN for EU Battery Passport QR code compliance
	GTIN string `json:"gtin,omitempty"`
}

// CertificateAnchor stores a blockchain timestamp proof for a certificate PDF.
// The file_hash is a SHA-256 of the PDF. The ots_proof is an OpenTimestamps
// attestation that commits the hash to the Bitcoin blockchain.
type CertificateAnchor struct {
	ID          string     `json:"id"`
	BatchID     string     `json:"batch_id"`
	TenantID    string     `json:"tenant_id"`
	CertType    string     `json:"cert_type"` // BIS, UN38.3, IEC_62133, MSDS, DOC, PLI
	FileURL     string     `json:"file_url"`
	FileHash    string     `json:"file_hash"`           // SHA-256 hex
	OTSProof    *string    `json:"ots_proof,omitempty"` // base64 .ots proof
	BitcoinTxID *string    `json:"bitcoin_tx_id,omitempty"`
	Status      string     `json:"status"` // pending, anchored, confirmed, failed
	AnchoredAt  *time.Time `json:"anchored_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ============================================================================
// DGFT EXPORT INCENTIVE CLAIMS
// ============================================================================

// DGFTSchemeConfig holds static configuration for Indian export incentive schemes.
type DGFTSchemeConfig struct {
	SchemeType        string    `db:"scheme_type" json:"scheme_type"`
	Name              string    `db:"name" json:"name"`
	Description       string    `db:"description" json:"description,omitempty"`
	RequiredDocuments []string  `db:"required_documents" json:"required_documents,omitempty"`
	CalculationMethod string    `db:"calculation_method" json:"calculation_method"`
	DefaultRate       float64   `db:"default_rate" json:"default_rate"`
	IsActive          bool      `db:"is_active" json:"is_active"`
	HelpURL           string    `db:"help_url" json:"help_url,omitempty"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}

// DGFTClaimDocument tracks a single supporting document inside a claim.
type DGFTClaimDocument struct {
	DocType    string     `json:"doc_type"`
	FileURL    string     `json:"file_url,omitempty"`
	Status     string     `json:"status"` // PENDING, UPLOADED, VERIFIED, REJECTED
	UploadedAt *time.Time `json:"uploaded_at,omitempty"`
}

// DGFTClaim tracks an export incentive claim submission for a tenant.
type DGFTClaim struct {
	ID                   string              `db:"id" json:"id"`
	TenantID             string              `db:"tenant_id" json:"tenant_id"`
	BatchID              *string             `db:"batch_id" json:"batch_id,omitempty"`
	SchemeType           string              `db:"scheme_type" json:"scheme_type"`
	Status               string              `db:"status" json:"status"`
	ClaimPeriodStart     string              `db:"claim_period_start" json:"claim_period_start"`
	ClaimPeriodEnd       string              `db:"claim_period_end" json:"claim_period_end"`
	HSNCode              string              `db:"hsn_code" json:"hsn_code,omitempty"`
	DestinationCountry   string              `db:"destination_country" json:"destination_country,omitempty"`
	ExportValueINR       float64             `db:"export_value_inr" json:"export_value_inr"`
	ExportQuantity       float64             `db:"export_quantity" json:"export_quantity"`
	EstimatedClaimAmount float64             `db:"estimated_claim_amount" json:"estimated_claim_amount"`
	ApprovedClaimAmount  *float64            `db:"approved_claim_amount" json:"approved_claim_amount,omitempty"`
	Documents            []DGFTClaimDocument `db:"documents" json:"documents,omitempty"`
	GeneratedFiles       json.RawMessage     `db:"generated_files" json:"generated_files,omitempty"`
	DGFTReferenceNo      string              `db:"dgft_reference_no" json:"dgft_reference_no,omitempty"`
	Notes                string              `db:"notes" json:"notes,omitempty"`
	CreatedAt            time.Time           `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time           `db:"updated_at" json:"updated_at"`
}

// DGFTClaimInput is used for creating or updating a claim draft.
type DGFTClaimInput struct {
	BatchID            *string `json:"batch_id,omitempty"`
	SchemeType         string  `json:"scheme_type" validate:"required"`
	ClaimPeriodStart   string  `json:"claim_period_start" validate:"required"`
	ClaimPeriodEnd     string  `json:"claim_period_end" validate:"required"`
	HSNCode            string  `json:"hsn_code,omitempty"`
	DestinationCountry string  `json:"destination_country,omitempty"`
	ExportValueINR     float64 `json:"export_value_inr"`
	ExportQuantity     float64 `json:"export_quantity"`
	Notes              string  `json:"notes,omitempty"`
}

// ============================================================================
// SUPPLIER PORTAL
// ============================================================================

// Supplier represents an upstream vendor invited by a tenant.
type Supplier struct {
	ID              string     `db:"id" json:"id"`
	TenantID        string     `db:"tenant_id" json:"tenant_id"`
	Email           string     `db:"email" json:"email"`
	CompanyName     string     `db:"company_name" json:"company_name"`
	ContactPhone    string     `db:"contact_phone" json:"contact_phone,omitempty"`
	Address         string     `db:"address" json:"address,omitempty"`
	Country         string     `db:"country" json:"country,omitempty"`
	Status          string     `db:"status" json:"status"` // invited, active, blocked
	InvitationToken string     `db:"invitation_token" json:"-"`
	PasswordHash    string     `db:"password_hash" json:"-"`
	InvitedAt       time.Time  `db:"invited_at" json:"invited_at"`
	AcceptedAt      *time.Time `db:"accepted_at" json:"accepted_at,omitempty"`
	LastLoginAt     *time.Time `db:"last_login_at" json:"last_login_at,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
}

// SupplierDocument is a CoC, audit report, or provenance file uploaded by a supplier.
type SupplierDocument struct {
	ID            string     `db:"id" json:"id"`
	SupplierID    string     `db:"supplier_id" json:"supplier_id"`
	TenantID      string     `db:"tenant_id" json:"tenant_id"`
	BatchID       *string    `db:"batch_id" json:"batch_id,omitempty"`
	ComponentID   *string    `db:"component_id" json:"component_id,omitempty"`
	DocType       string     `db:"doc_type" json:"doc_type"` // coc, audit_report, provenance, msds, test_report, other
	FileURL       string     `db:"file_url" json:"file_url"`
	FileName      string     `db:"file_name" json:"file_name,omitempty"`
	FileSize      int        `db:"file_size" json:"file_size,omitempty"`
	Status        string     `db:"status" json:"status"` // pending, approved, rejected
	ReviewerNotes string     `db:"reviewer_notes" json:"reviewer_notes,omitempty"`
	ReviewedBy    *string    `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt    *time.Time `db:"reviewed_at" json:"reviewed_at,omitempty"`
	UploadedAt    time.Time  `db:"uploaded_at" json:"uploaded_at"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
}

// ============================================================================
// Due Diligence Engine Models (Phase B)
// ============================================================================

// SupplierRiskProfile stores auto-computed + manual-override risk scores.
type SupplierRiskProfile struct {
	ID               string     `db:"id" json:"id"`
	SupplierID       string     `db:"supplier_id" json:"supplier_id"`
	TenantID         string     `db:"tenant_id" json:"tenant_id"`
	OverallScore     int        `db:"overall_score" json:"overall_score"`
	CountryRiskTier  int        `db:"country_risk_tier" json:"country_risk_tier"`
	MineralRiskFlags []string   `db:"mineral_risk_flags" json:"mineral_risk_flags"`
	RMAPValid        *bool      `db:"rmap_valid" json:"rmap_valid,omitempty"`
	LastAuditDate    *time.Time `db:"last_audit_date" json:"last_audit_date,omitempty"`
	NextAuditDue     *time.Time `db:"next_audit_due" json:"next_audit_due,omitempty"`
	ComputedAt       time.Time  `db:"computed_at" json:"computed_at"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updated_at"`
}

// DueDiligenceAssessment tracks OECD 5-step progress per supplier.
type DueDiligenceAssessment struct {
	ID           string     `db:"id" json:"id"`
	SupplierID   string     `db:"supplier_id" json:"supplier_id"`
	TenantID     string     `db:"tenant_id" json:"tenant_id"`
	BatchID      *string    `db:"batch_id" json:"batch_id,omitempty"`
	Step         string     `db:"step" json:"step"`     // policy, identify, assess, respond, audit
	Status       string     `db:"status" json:"status"` // not_started, in_progress, complete, failed
	EvidenceDocs []string   `db:"evidence_docs" json:"evidence_docs"`
	CompletedBy  *string    `db:"completed_by" json:"completed_by,omitempty"`
	CompletedAt  *time.Time `db:"completed_at" json:"completed_at,omitempty"`
	Notes        string     `db:"notes" json:"notes,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
}

// DDAssessmentTransitionRequest is the body for advancing an OECD step.
type DDAssessmentTransitionRequest struct {
	Status string `json:"status" validate:"required,oneof=in_progress complete failed"`
	Notes  string `json:"notes,omitempty"`
}

// SupplierCMRTReport stores parsed CMRT/CRT Excel uploads.
type SupplierCMRTReport struct {
	ID               string                   `db:"id" json:"id"`
	SupplierID       string                   `db:"supplier_id" json:"supplier_id"`
	TenantID         string                   `db:"tenant_id" json:"tenant_id"`
	ReportingYear    int                      `db:"reporting_year" json:"reporting_year"`
	FileURL          string                   `db:"file_url" json:"file_url"`
	Smelters         []map[string]interface{} `db:"smelters" json:"smelters"`
	UnknownSmelters  int                      `db:"unknown_smelters" json:"unknown_smelters"`
	RMIConformantPct *int                     `db:"rmi_conformant_pct" json:"rmi_conformant_pct,omitempty"`
	ParsedAt         *time.Time               `db:"parsed_at" json:"parsed_at,omitempty"`
	CreatedAt        time.Time                `db:"created_at" json:"created_at"`
}

// CMRTSmelter is a single smelter entry parsed from a CMRT report.
type CMRTSmelter struct {
	Name       string `json:"name"`
	Country    string `json:"country"`
	Mineral    string `json:"mineral"`
	SmelterRef string `json:"smelter_ref,omitempty"`
	RMIStatus  string `json:"rmi_status,omitempty"` // conformant, active, no_longer_conformant, unknown
}

// CorrectiveAction tracks non-conformance remediation tickets.
type CorrectiveAction struct {
	ID           string     `db:"id" json:"id"`
	SupplierID   string     `db:"supplier_id" json:"supplier_id"`
	TenantID     string     `db:"tenant_id" json:"tenant_id"`
	AssessmentID *string    `db:"assessment_id" json:"assessment_id,omitempty"`
	Title        string     `db:"title" json:"title"`
	Description  string     `db:"description" json:"description"`
	Severity     string     `db:"severity" json:"severity"` // low, medium, high, critical
	Status       string     `db:"status" json:"status"`     // open, remediated, verified, escalated, closed
	DueDate      string     `db:"due_date" json:"due_date"` // YYYY-MM-DD
	RemediatedAt *time.Time `db:"remediated_at" json:"remediated_at,omitempty"`
	VerifiedBy   *string    `db:"verified_by" json:"verified_by,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
}

// CreateCorrectiveActionRequest is the body for POST /corrective-actions.
type CreateCorrectiveActionRequest struct {
	SupplierID   string `json:"supplier_id" validate:"required,uuid"`
	AssessmentID string `json:"assessment_id,omitempty"`
	Title        string `json:"title" validate:"required"`
	Description  string `json:"description" validate:"required"`
	Severity     string `json:"severity" validate:"required,oneof=low medium high critical"`
	DueDate      string `json:"due_date" validate:"required"` // YYYY-MM-DD
}

// UpdateCorrectiveActionStatusRequest is the body for PUT /corrective-actions/{id}/status.
type UpdateCorrectiveActionStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=open remediated verified escalated closed"`
}

// SupplierInvitationRequest is the body for POST /suppliers/invitations.
type SupplierInvitationRequest struct {
	Email        string `json:"email" validate:"required,email"`
	CompanyName  string `json:"company_name" validate:"required"`
	ContactPhone string `json:"contact_phone,omitempty"`
	Address      string `json:"address,omitempty"`
	Country      string `json:"country,omitempty"`
}

// SupplierAcceptRequest is the body for POST /suppliers/accept.
type SupplierAcceptRequest struct {
	Token        string `json:"token" validate:"required"`
	Password     string `json:"password" validate:"required,min=8"`
	CompanyName  string `json:"company_name,omitempty"`
	ContactPhone string `json:"contact_phone,omitempty"`
}

// SupplierLoginRequest is the body for POST /supplier/login.
type SupplierLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// SupplierLoginResponse returns the supplier JWT and profile.
type SupplierLoginResponse struct {
	Token       string `json:"token"`
	SupplierID  string `json:"supplier_id"`
	TenantID    string `json:"tenant_id"`
	Email       string `json:"email"`
	CompanyName string `json:"company_name"`
	ExpiresIn   int    `json:"expires_in"`
}

// TenantAlert stores proactive compliance and expiry notifications for a tenant.
type TenantAlert struct {
	ID           string     `json:"id"`
	TenantID     string     `json:"tenant_id"`
	AlertType    string     `json:"alert_type"` // CERTIFICATE_EXPIRY, COMPLIANCE_DEGRADED, QUOTA_LOW
	Severity     string     `json:"severity"`   // INFO, WARNING, CRITICAL
	Title        string     `json:"title"`
	Message      string     `json:"message"`
	ResourceType string     `json:"resource_type,omitempty"` // BATCH, PASSPORT, TENANT
	ResourceID   *string    `json:"resource_id,omitempty"`
	ReadAt       *time.Time `json:"read_at,omitempty"`
	EmailedAt    *time.Time `json:"emailed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
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
	LeadPresent    bool   `json:"lead_present"`          // Does product contain lead?
	MercuryPresent bool   `json:"mercury_present"`       // Does product contain mercury?
	CadmiumPresent bool   `json:"cadmium_present"`       // Does product contain cadmium?
	Declaration    string `json:"declaration,omitempty"` // Compliance statement
	Exemptions     string `json:"exemptions,omitempty"`  // Any RoHS exemptions claimed
}

// Component represents a single item in a battery Bill of Materials (BOM).
// The hierarchy is stored as a flat list with ParentID references.
type Component struct {
	ID                  string      `json:"id"`
	Name                string      `json:"name"`
	ComponentType       string      `json:"component_type"`      // "cell", "module", "pack", "subsystem"
	ParentID            *string     `json:"parent_id,omitempty"` // nil for top-level items
	ModelNumber         string      `json:"model_number,omitempty"`
	SerialNumber        string      `json:"serial_number,omitempty"`
	LotNumber           string      `json:"lot_number,omitempty"`
	DateOfManufacture   string      `json:"date_of_manufacture,omitempty"`
	Manufacturer        string      `json:"manufacturer,omitempty"`
	ManufacturerAddress string      `json:"manufacturer_address,omitempty"`
	CountryOfOrigin     string      `json:"country_of_origin,omitempty"`
	Chemistry           string      `json:"chemistry,omitempty"` // e.g. "NMC811", "LFP"
	CobaltPct           float64     `json:"cobalt_pct,omitempty"`
	LithiumPct          float64     `json:"lithium_pct,omitempty"`
	NickelPct           float64     `json:"nickel_pct,omitempty"`
	ManganesePct        float64     `json:"manganese_pct,omitempty"`
	GraphitePct         float64     `json:"graphite_pct,omitempty"`
	LeadPct             float64     `json:"lead_pct,omitempty"`
	RecycledCobaltPct   float64     `json:"recycled_cobalt_pct,omitempty"`
	RecycledLithiumPct  float64     `json:"recycled_lithium_pct,omitempty"`
	RecycledNickelPct   float64     `json:"recycled_nickel_pct,omitempty"`
	RecycledLeadPct     float64     `json:"recycled_lead_pct,omitempty"`
	WeightKg            float64     `json:"weight_kg,omitempty"`
	Quantity            int         `json:"quantity,omitempty"`
	CEMarking           bool        `json:"ce_marking,omitempty"`
	BISNumber           string      `json:"bis_number,omitempty"`
	HazardousLead       bool        `json:"hazardous_lead,omitempty"`
	HazardousMercury    bool        `json:"hazardous_mercury,omitempty"`
	HazardousCadmium    bool        `json:"hazardous_cadmium,omitempty"`
	SupplierID          *string     `json:"supplier_id,omitempty"`
	Children            []Component `json:"children,omitempty"`
}

// ============================================================================
// EU STRUCTURED SPECS (EU 2023/1542 Art 7, Art 10, Art 57)
// ============================================================================

// PerformanceSpec holds rated electrical/thermal performance data (EU Annex IV)
type PerformanceSpec struct {
	RatedCapacityAh    *float64 `json:"rated_capacity_ah,omitempty"`         // Nominal capacity in Ah
	RatedCapacityWh    *float64 `json:"rated_capacity_wh,omitempty"`         // Nominal energy in Wh
	RatedVoltage       *float64 `json:"rated_voltage,omitempty"`             // Nominal voltage (V)
	MinVoltage         *float64 `json:"min_voltage,omitempty"`               // Minimum voltage (V)
	MaxVoltage         *float64 `json:"max_voltage,omitempty"`               // Maximum voltage (V)
	InternalResistance *float64 `json:"internal_resistance_mohm,omitempty"`  // Initial internal resistance (mΩ)
	MaxChargeCRate     *float64 `json:"max_charge_c_rate,omitempty"`         // Max charge C-rate
	MaxDischargeCRate  *float64 `json:"max_discharge_c_rate,omitempty"`      // Max discharge C-rate
	OperatingTempMin   *float64 `json:"operating_temp_min_c,omitempty"`      // Min operating temp (°C)
	OperatingTempMax   *float64 `json:"operating_temp_max_c,omitempty"`      // Max operating temp (°C)
	CapacityAt80SoH    *float64 `json:"capacity_at_80_soh_ah,omitempty"`     // Capacity at 80% SoH threshold (Ah)
	RoundTripEffPct    *float64 `json:"round_trip_efficiency_pct,omitempty"` // Energy round-trip efficiency (%)
	CathodeMaterial    string   `json:"cathode_material,omitempty"`          // e.g., "LiFePO4", "LiNiMnCoO2"
	AnodeMaterial      string   `json:"anode_material,omitempty"`            // e.g., "Graphite", "Li4Ti5O12"
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
	Material        string  `json:"material"`                     // cobalt, lithium, nickel, manganese, graphite
	SupplierName    string  `json:"supplier_name,omitempty"`      // Supplier company name
	CountryOfOrigin string  `json:"country_of_origin"`            // ISO Alpha-2
	MineOrRefinery  string  `json:"mine_or_refinery,omitempty"`   // Name of mine or refinery
	Certified       bool    `json:"certified"`                    // Third-party audited?
	CertBody        string  `json:"certification_body,omitempty"` // e.g., "RMI", "IRMA"
	RecycledSource  bool    `json:"recycled_source"`              // From recycled material?
	Percentage      float64 `json:"percentage,omitempty"`         // % of total material from this source
}

// ============================================================================
// PASSPORT
// ============================================================================

// Passport represents a single product's digital passport
type Passport struct {
	UUID            uuid.UUID  `json:"uuid"`
	BatchID         uuid.UUID  `json:"batch_id"`
	SerialNumber    string     `json:"serial_number"` // Supports BPAN: IN-NKY-LFP-2026-00001
	ManufactureDate time.Time  `json:"manufacture_date"`
	Status          string     `json:"status"` // CREATED, ACTIVE, SHIPPED, IN_SERVICE, RECYCLED, END_OF_LIFE, RECALLED
	CreatedAt       time.Time  `json:"created_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty"` // Soft-delete timestamp; nil = active

	// v2: Product-agnostic fields
	ProductType ProductType     `json:"product_type"`        // BATTERY or ELECTRONICS (default: BATTERY)
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

	// ── EU Battery Passport ID & Circularity Status (migration 057) ──
	BatteryPassportID string `json:"battery_passport_id,omitempty"` // EU Implementing Reg 2024/1715 format
	CircularityStatus string `json:"circularity_status,omitempty"`  // ORIGINAL, REPURPOSED, REUSED, REMANUFACTURED, WASTE
}

// PassportStatus constants - lifecycle states
const (
	PassportStatusCreated        = "CREATED"        // Passport record created
	PassportStatusActive         = "ACTIVE"         // Manufactured and legally valid
	PassportStatusShipped        = "SHIPPED"        // Battery left factory/warehouse
	PassportStatusInService      = "IN_SERVICE"     // Installed in device/vehicle
	PassportStatusRecalled       = "RECALLED"       // Safety/compliance interruption
	PassportStatusRecycled       = "RECYCLED"       // Processed by authorized recycler
	PassportStatusRemanufactured = "REMANUFACTURED" // Refurbished to like-new condition
	PassportStatusReused         = "REUSED"         // Direct second-use without remanufacturing
	PassportStatusRepurposed     = "REPURPOSED"     // Used for a different application
	PassportStatusEndOfLife      = "END_OF_LIFE"    // Final state
)

// CircularityStatus constants - EU Battery Regulation Art 14 / Annex XIII(4c)
const (
	CircularityStatusOriginal       = "ORIGINAL"
	CircularityStatusRepurposed     = "REPURPOSED"
	CircularityStatusReused         = "REUSED"
	CircularityStatusRemanufactured = "REMANUFACTURED"
	CircularityStatusWaste          = "WASTE"
)

// ActorType defines who performed a lifecycle action
type ActorType string

const (
	ActorTypeSystem   ActorType = "SYSTEM"
	ActorTypeUser     ActorType = "USER"
	ActorTypePartner  ActorType = "PARTNER"
	ActorTypeExternal ActorType = "EXTERNAL" // API-key authenticated supply-chain partner
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
	ActionSourceAPIKey    ActionSource = "API_KEY" // machine-to-machine via scoped API key
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
	case ActorTypeSystem, ActorTypeUser, ActorTypePartner, ActorTypeExternal:
		return true
	}
	return false
}

// IsValidActorRole checks if the actor role is valid.
func IsValidActorRole(role ActorRole) bool {
	switch role {
	case ActorRoleSystem, ActorRoleInternalOperator, ActorRoleLogistics,
		ActorRoleTechnician, ActorRoleRecycler, ActorRoleAdmin:
		return true
	}
	return false
}

// IsValidPartnerRole checks if the role is valid for external partners.
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
	// Battery lifecycle actions
	ActionActivate      TransitionAction = "ACTIVATE"
	ActionShip          TransitionAction = "SHIP"
	ActionInstall       TransitionAction = "INSTALL"
	ActionRecycle       TransitionAction = "RECYCLE"
	ActionClose         TransitionAction = "CLOSE"
	ActionRecall        TransitionAction = "RECALL"
	ActionRemanufacture TransitionAction = "REMANUFACTURE"
	ActionReuse         TransitionAction = "REUSE"
	ActionRepurpose     TransitionAction = "REPURPOSE"

	// ActionSOHUpdate is not a lifecycle state transition — it does not change PassportStatus.
	// It is a pseudo-action used exclusively for issuing magic link tokens that allow
	// external partners (technicians, fleet operators) to push SoH readings via
	// POST /api/v1/passport/{uuid}/soh. Multi-use until token expiry.
	ActionSOHUpdate TransitionAction = "SOH_UPDATE"
)

// IsValidMagicLinkAction returns true for actions that can be encoded in a magic link token.
// This includes all lifecycle TransitionActions (which change state) plus SOH_UPDATE
// (which only records a health reading without changing state).
func IsValidMagicLinkAction(action string) bool {
	if action == string(ActionSOHUpdate) {
		return true
	}
	_, ok := BatteryTransitionMap[TransitionAction(action)]
	return ok
}

// TransitionDefinition defines allowed from-states and resulting state for an action.
// This is the single source of truth for lifecycle transitions.
type TransitionDefinition struct {
	AllowedFrom []string
	To          string
}

// transitionMaps returns the transition map and action order for a product type.
func transitionMaps(productType ProductType) (map[TransitionAction]TransitionDefinition, []TransitionAction) {
	return BatteryTransitionMap, BatteryTransitionActionOrder
}

// roleMaps returns the allowed-roles map for a product type.
func roleMaps(productType ProductType) map[TransitionAction][]ActorRole {
	return BatteryAllowedRolesByAction
}

// BatteryTransitionActionOrder ensures deterministic ordering for battery actions.
var BatteryTransitionActionOrder = []TransitionAction{
	ActionActivate,
	ActionShip,
	ActionInstall,
	ActionRecycle,
	ActionClose,
	ActionRecall,
}

// BatteryTransitionMap defines the canonical battery lifecycle transitions.
var BatteryTransitionMap = map[TransitionAction]TransitionDefinition{
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
	ActionRemanufacture: {
		AllowedFrom: []string{PassportStatusInService, PassportStatusRecalled},
		To:          PassportStatusRemanufactured,
	},
	ActionReuse: {
		AllowedFrom: []string{PassportStatusInService, PassportStatusRecalled},
		To:          PassportStatusReused,
	},
	ActionRepurpose: {
		AllowedFrom: []string{PassportStatusInService, PassportStatusRecalled},
		To:          PassportStatusRepurposed,
	},
}

// BatteryAllowedRolesByAction defines which roles can perform battery actions.
var BatteryAllowedRolesByAction = map[TransitionAction][]ActorRole{
	ActionActivate:      {ActorRoleSystem},
	ActionShip:          {ActorRoleInternalOperator, ActorRoleLogistics, ActorRoleAdmin},
	ActionInstall:       {ActorRoleTechnician},
	ActionRecycle:       {ActorRoleRecycler},
	ActionClose:         {ActorRoleSystem, ActorRoleRecycler},
	ActionRecall:        {ActorRoleAdmin},
	ActionRemanufacture: {ActorRoleRecycler, ActorRoleTechnician},
	ActionReuse:         {ActorRoleRecycler, ActorRoleLogistics},
	ActionRepurpose:     {ActorRoleRecycler, ActorRoleTechnician},
}

// IsRoleAllowedForAction checks if a role is allowed to perform an action for a given product type.
func IsRoleAllowedForAction(action TransitionAction, role ActorRole, productType ProductType) bool {
	allowedRoles, exists := roleMaps(productType)[action]
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

// IsValidAction checks if a transition action is defined for a product type.
func IsValidAction(action string, productType ProductType) bool {
	m, _ := transitionMaps(productType)
	_, exists := m[TransitionAction(action)]
	return exists
}

// GetTransitionDefinition returns the transition definition for a given action and product type.
func GetTransitionDefinition(action TransitionAction, productType ProductType) (TransitionDefinition, bool) {
	m, _ := transitionMaps(productType)
	def, exists := m[action]
	return def, exists
}

// IsActionAllowedFrom checks if an action is allowed from the current status for a product type.
func IsActionAllowedFrom(action TransitionAction, currentStatus string, productType ProductType) bool {
	m, _ := transitionMaps(productType)
	def, exists := m[action]
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

// GetAllowedActions returns the list of valid actions for a given current status and product type.
func GetAllowedActions(currentStatus string, productType ProductType) []TransitionAction {
	m, order := transitionMaps(productType)
	allowed := make([]TransitionAction, 0)
	for _, action := range order {
		def, ok := m[action]
		if !ok {
			continue
		}
		for _, status := range def.AllowedFrom {
			if status == currentStatus {
				allowed = append(allowed, action)
				break
			}
		}
	}
	return allowed
}

// GetAllowedActionsForRole returns the list of valid actions for a given
// current status and actor role, filtered by product type.
func GetAllowedActionsForRole(currentStatus string, role ActorRole, productType ProductType) []TransitionAction {
	m, order := transitionMaps(productType)
	rm := roleMaps(productType)
	allowed := make([]TransitionAction, 0)
	for _, action := range order {
		def, ok := m[action]
		if !ok {
			continue
		}
		found := false
		for _, status := range def.AllowedFrom {
			if status == currentStatus {
				found = true
				break
			}
		}
		if !found {
			continue
		}
		allowedRoles, ok := rm[action]
		if !ok {
			continue
		}
		roleAllowed := false
		for _, r := range allowedRoles {
			if r == role {
				roleAllowed = true
				break
			}
		}
		if roleAllowed {
			allowed = append(allowed, action)
		}
	}
	return allowed
}

// ============================================================================
// PASSPORT EVENTS (LIFECYCLE AUDIT LOG)
// ============================================================================

// PassportEvent represents an immutable lifecycle event for a passport

// LDProof represents a W3C Linked Data Proof (Ed25519Signature2020).
type LDProof struct {
	Type               string `json:"type"`
	Created            string `json:"created"`
	ProofPurpose       string `json:"proofPurpose"`
	VerificationMethod string `json:"verificationMethod"`
	ProofValue         string `json:"proofValue"`
}

// PassportVC stores a W3C Verifiable Credential payload for a passport.
type PassportVC struct {
	ID                uuid.UUID       `json:"id"`
	PassportID        uuid.UUID       `json:"passport_id"`
	VCType            string          `json:"vc_type"`
	IssuerDID         string          `json:"issuer_did"`
	CredentialSubject json.RawMessage `json:"credential_subject"`
	Proof             json.RawMessage `json:"proof"`
	Status            string          `json:"status"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

// SignupRequest stores a qualification form submission for gated signup review.
type SignupRequest struct {
	ID               uuid.UUID  `json:"id"`
	CompanyName      string     `json:"company_name"`
	Email            string     `json:"email"`
	GSTIN            string     `json:"gstin,omitempty"`
	IECCode          string     `json:"iec_code,omitempty"`
	ProductType      string     `json:"product_type"`
	EstimatedBatches string     `json:"estimated_batches,omitempty"`
	MarketRegion     string     `json:"market_region,omitempty"`
	Phone            string     `json:"phone,omitempty"`
	Status           string     `json:"status"`
	RejectionReason  string     `json:"rejection_reason,omitempty"`
	ReviewedAt       *time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy       *uuid.UUID `json:"reviewed_by,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

// EUBuyerLead stores an EU buyer's interest in mandating ExportReady to
// their Indian suppliers (STRAT-06: EU Buyer Landing Page). Distinct from
// SignupRequest, which is the Indian manufacturer self-signup flow.
type EUBuyerLead struct {
	ID               uuid.UUID `json:"id"`
	BuyerCompanyName string    `json:"buyer_company_name"`
	ContactName      string    `json:"contact_name"`
	ContactEmail     string    `json:"contact_email"`
	Country          string    `json:"country"`
	IndianSuppliers  string    `json:"indian_suppliers,omitempty"`
	Message          string    `json:"message,omitempty"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

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
	PreviousStatus     string // Required for TOCTOU protection: UPDATE WHERE status = PreviousStatus
	NewStatus          string
	ShippedAt          *time.Time
	InstalledAt        *time.Time
	RecycledAt         *time.Time
	RecyclingStatus    string
	RecyclerEprID      string
	RecyclingDate      *time.Time
	CircularityStatus  *string // Maps lifecycle action to circularity status (ORIGINAL, WASTE, etc.)
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
	// PassportEventReverseTransition marks an admin-initiated undo of the
	// most recent lifecycle transition, within the 30-minute grace window —
	// a new chained event, never a mutation/deletion of the reversed one.
	PassportEventReverseTransition = "REVERSE_TRANSITION"
)

// SoHHistoryEntry is one row in the soh_history table.
// Every call to UpdateStateOfHealth appends a row, giving a queryable time-series
// of health readings without replaying the passport event log.
type SoHHistoryEntry struct {
	ID         uuid.UUID `json:"id"`
	PassportID uuid.UUID `json:"passport_id"`
	SoH        float64   `json:"state_of_health"`
	RecordedAt time.Time `json:"recorded_at"`
	Actor      string    `json:"actor,omitempty"`
	ActorType  string    `json:"actor_type,omitempty"` // USER | PARTNER | SYSTEM | DEVICE
	Source     string    `json:"source,omitempty"`     // INTERNAL | MAGIC_LINK | API | CSV
}

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
	PaymentID   *string    `json:"payment_id,omitempty"` // Razorpay payment ID, set on purchase transactions for idempotency
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

	// EU Battery Regulation 2023/1542 compliance fields
	CEMarking                   bool   `json:"ce_marking,omitempty"`
	CarbonPerformanceClass      string `json:"carbon_performance_class,omitempty"` // A, B, C, D, E
	RemovableAndReplaceable     bool   `json:"removable_and_replaceable,omitempty"`
	NotifiedBodyNumber          string `json:"notified_body_number,omitempty"`
	DeclarationOfConformityPath string `json:"declaration_of_conformity_path,omitempty"`
}

// CreateBatchResponse is the response after creating a batch
type CreateBatchResponse struct {
	Batch *Batch `json:"batch"`
}

// PatchBatchRequest holds optional fields for partial updates to a DRAFT batch.
// Only provided (non-nil) fields are applied; omitted fields are left unchanged.
type PatchBatchRequest struct {
	ModelName              *string    `json:"model_name,omitempty"`
	ManufacturingStartDate *time.Time `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time `json:"manufacturing_end_date,omitempty"`
	CellSource             *string    `json:"cell_source,omitempty"`
	BillOfEntryNo          *string    `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin        *string    `json:"country_of_origin,omitempty"`
	CustomsDate            *time.Time `json:"customs_date,omitempty"`
	DomesticValueAdd       *float64   `json:"domestic_value_add,omitempty"`
	// EU Battery Regulation 2023/1542 compliance fields
	CEMarking                   *bool   `json:"ce_marking,omitempty"`
	CarbonPerformanceClass      *string `json:"carbon_performance_class,omitempty"`
	RemovableAndReplaceable     *bool   `json:"removable_and_replaceable,omitempty"`
	NotifiedBodyNumber          *string `json:"notified_body_number,omitempty"`
	DeclarationOfConformityPath *string `json:"declaration_of_conformity_path,omitempty"`
	// Specs is a partial spec update; keys are merged into the existing JSONB via ||
	Specs map[string]interface{} `json:"specs,omitempty"`
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
	ProductType            ProductType  `json:"product_type"`
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

	// EU Battery Regulation 2023/1542 compliance fields
	BatteryPassportID           string `json:"battery_passport_id,omitempty"`
	CEMarking                   bool   `json:"ce_marking,omitempty"`
	CarbonPerformanceClass      string `json:"carbon_performance_class,omitempty"`
	RemovableAndReplaceable     bool   `json:"removable_and_replaceable,omitempty"`
	NotifiedBodyNumber          string `json:"notified_body_number,omitempty"`
	DeclarationOfConformityPath string `json:"declaration_of_conformity_path,omitempty"`
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
	TotalPassports       int            `json:"total_passports"`
	TotalBatches         int            `json:"total_batches"`
	QuotaUsed            int            `json:"quota_used"`
	QuotaLimit           int            `json:"quota_limit"`
	QuotaBalance         int            `json:"quota_balance"`
	CarbonCompliancePct  float64        `json:"carbon_compliance_percentage"`
	PassportsThisWeek    int            `json:"passports_this_week"`
	PendingExportBatches int            `json:"pending_export_batches"`
	BatchesByStatus      map[string]int `json:"batches_by_status,omitempty"`
}

// AnalyticsOverview represents aggregated analytics data for the tenant dashboard.
type AnalyticsOverview struct {
	ComplianceTrend        []ComplianceTrendPoint `json:"compliance_trend"`
	CertificateExpiry      []CertExpirySummary    `json:"certificate_expiry"`
	ExpiringCertificates   []ExpiringCertDetail   `json:"expiring_certificates"`
	CarbonDistribution     []CarbonClassCount     `json:"carbon_distribution"`
	BatchStatusBreakdown   map[string]int         `json:"batch_status_breakdown"`
	ComplianceReadyCount   int                    `json:"compliance_ready_count"`
	MarketRegionSplit      []RegionCount          `json:"market_region_split"`
	SupplierDocStatus      map[string]int         `json:"supplier_document_status"`
	DGFTClaimFunnel        []StatusCount          `json:"dgft_claim_funnel"`
	AlertSeverityBreakdown map[string]int         `json:"alert_severity_breakdown"`
}

// ExpiringCertDetail holds details of certificates expiring soon for a specific batch.
type ExpiringCertDetail struct {
	BatchID    uuid.UUID `json:"batch_id"`
	BatchName  string    `json:"batch_name"`
	CertType   string    `json:"cert_type"`
	ExpiryDate time.Time `json:"expiry_date"`
	DaysLeft   int       `json:"days_left"`
}

// ComplianceTrendPoint is a single data point in the compliance trend line.
type ComplianceTrendPoint struct {
	Period     string  `json:"period"`
	AvgScore   float64 `json:"avg_score"`
	BatchCount int     `json:"batch_count"`
}

// CertExpirySummary shows certificate expiry buckets by type.
type CertExpirySummary struct {
	CertType    string `json:"cert_type"`
	Expiring30d int    `json:"expiring_30d"`
	Expiring7d  int    `json:"expiring_7d"`
	Expired     int    `json:"expired"`
}

// CarbonClassCount is a single carbon class bucket.
type CarbonClassCount struct {
	Class string `json:"class"`
	Count int    `json:"count"`
}

// RegionCount is a single market region bucket.
type RegionCount struct {
	Region string `json:"region"`
	Count  int    `json:"count"`
}

// StatusCount is a generic status bucket.
type StatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

// RegulationGapCount represents compliance gaps grouped by regulation.
type RegulationGapCount struct {
	Regulation string `json:"regulation"`
	Severity   string `json:"severity"`
	Count      int    `json:"count"`
}

// ActionFeedItem represents a priority action needed by a tenant.
type ActionFeedItem struct {
	Type      string     `json:"type"`       // e.g. "CERT_EXPIRY", "SUPPLIER_AUDIT", "EPR_SHORTFALL", "UNSIGNED_DOC", "VERIFICATION_FAILURE"
	Title     string     `json:"title"`      // Description of the action
	BatchID   *uuid.UUID `json:"batch_id"`   // Associated batch ID if any
	Severity  string     `json:"severity"`   // "ERROR" or "WARNING"
	DueDate   *time.Time `json:"due_date"`   // Due date or expiration date
}

// DGFTValueSummary represents financial analytics for DGFT claims.
type DGFTValueSummary struct {
	TotalClaimedValue  float64       `json:"total_claimed_value"`
	TotalEligibleValue float64       `json:"total_eligible_value"`
	ApprovalRate       float64       `json:"approval_rate"`
	AvgApprovalDays    float64       `json:"avg_approval_days"`
	SchemeBreakdown    []SchemeValue `json:"scheme_breakdown"`
}

// SchemeValue represents values for a specific DGFT scheme.
type SchemeValue struct {
	Scheme        string  `json:"scheme"` // e.g. "RoDTEP", "Duty Drawback", "Interest Equalization"
	ClaimedValue  float64 `json:"claimed_value"`
	EligibleValue float64 `json:"eligible_value"`
	Count         int     `json:"count"`
}

// ============================================================================
// REGISTRY VERIFICATIONS (External API Integrations)
// ============================================================================

// RegistryType identifies the external registry being queried.
type RegistryType string

const (
	RegistryTypeBIS     RegistryType = "bis"
	RegistryTypeCPCB    RegistryType = "cpcb"
	RegistryTypeEUNANDO RegistryType = "eu_nando"
	RegistryTypeUN38_3  RegistryType = "un38_3"
	RegistryTypeCustom  RegistryType = "custom"
)

// RegistryVerificationStatus is the outcome of a registry check.
type RegistryVerificationStatus string

const (
	RegistryStatusPending  RegistryVerificationStatus = "pending"
	RegistryStatusVerified RegistryVerificationStatus = "verified"
	RegistryStatusFailed   RegistryVerificationStatus = "failed"
	RegistryStatusError    RegistryVerificationStatus = "error"
	RegistryStatusNotFound RegistryVerificationStatus = "not_found"
)

// TrustTier indicates the confidence level of the verification.
type TrustTier string

const (
	TrustTierSelfDeclared TrustTier = "self_declared"
	TrustTierRegistry     TrustTier = "registry_verified"
	TrustTierOfficialAPI  TrustTier = "official_api"
)

// RegistryVerification is a cached verification result from an external registry.
type RegistryVerification struct {
	ID            string                  `json:"id"`
	TenantID      string                  `json:"tenant_id"`
	BatchID       string                  `json:"batch_id"`
	RegistryType  string                  `json:"registry_type"`
	CertificateNo string                  `json:"certificate_no,omitempty"`
	Status        string                  `json:"status"`
	TrustTier     string                  `json:"trust_tier"`
	VerifiedData  *map[string]interface{} `json:"verified_data,omitempty"`
	ErrorMessage  string                  `json:"error_message,omitempty"`
	VerifiedAt    *time.Time              `json:"verified_at,omitempty"`
	ExpiresAt     *time.Time              `json:"expires_at,omitempty"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
}

// VerifyBatchRegistryRequest triggers a registry verification for a batch.
type VerifyBatchRegistryRequest struct {
	RegistryType  string `json:"registry_type"`
	CertificateNo string `json:"certificate_no,omitempty"`
}

// BatchVerificationSummary is a lightweight view of all verifications for a batch.
type BatchVerificationSummary struct {
	BatchID       string                 `json:"batch_id"`
	Verifications []RegistryVerification `json:"verifications"`
	OverallTrust  TrustTier              `json:"overall_trust"`
}

// RegistryJob tracks an async registry verification task.
type RegistryJob struct {
	ID              string     `json:"id"`
	RegistryType    string     `json:"registry_type"`
	CertificateNo   string     `json:"certificate_no"`
	BatchID         string     `json:"batch_id"`
	TenantID        string     `json:"tenant_id"`
	Status          string     `json:"status"`
	AttemptCount    int        `json:"attempt_count"`
	MaxAttempts     int        `json:"max_attempts"`
	NextAttemptAt   *time.Time `json:"next_attempt_at,omitempty"`
	ResultStatus    string     `json:"result_status,omitempty"`
	ResultTrustTier string     `json:"result_trust_tier,omitempty"`
	ResultID        string     `json:"result_id,omitempty"`
	ErrorMessage    string     `json:"error_message,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// TenantCertVerificationJob is an async job that checks a tenant's compliance
// registration number (e.g. BIS R-Number) against an external registry
// adapter, so the corresponding *_status field can move from PENDING to
// VERIFIED automatically when the registry confirms it.
type TenantCertVerificationJob struct {
	ID              string     `json:"id"`
	TenantID        string     `json:"tenant_id"`
	DocType         string     `json:"doc_type"`
	CertificateNo   string     `json:"certificate_no"`
	Status          string     `json:"status"`
	AttemptCount    int        `json:"attempt_count"`
	MaxAttempts     int        `json:"max_attempts"`
	NextAttemptAt   *time.Time `json:"next_attempt_at,omitempty"`
	ResultStatus    string     `json:"result_status,omitempty"`
	ResultTrustTier string     `json:"result_trust_tier,omitempty"`
	ErrorMessage    string     `json:"error_message,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// RegistryAuditLog records every external registry call for compliance.
type RegistryAuditLog struct {
	ID              string                  `json:"id"`
	JobID           string                  `json:"job_id,omitempty"`
	RegistryType    string                  `json:"registry_type"`
	CertificateNo   string                  `json:"certificate_no"`
	RequestMethod   string                  `json:"request_method,omitempty"`
	RequestURL      string                  `json:"request_url,omitempty"`
	RequestPayload  *map[string]interface{} `json:"request_payload,omitempty"`
	ResponseStatus  int                     `json:"response_status,omitempty"`
	ResponsePayload *map[string]interface{} `json:"response_payload,omitempty"`
	LatencyMs       int                     `json:"latency_ms"`
	ErrorMessage    string                  `json:"error_message,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
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

// BatchChartData represents the minimal per-batch fields needed to render
// the dashboard production chart and compliance score card, without the
// cost of fetching each batch's full specs JSON.
type BatchChartData struct {
	ID             string    `json:"id"`
	CreatedAt      time.Time `json:"created_at"`
	Status         string    `json:"status"`
	TotalPassports int       `json:"total_passports"`
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
// INDIA BWM RULES 2022 — EPR OBLIGATION LEDGER (migration 058)
// ============================================================================

// EPRObligation tracks annual EPR obligation vs fulfillment per tenant/category
type EPRObligation struct {
	ID                          uuid.UUID  `json:"id"`
	TenantID                    uuid.UUID  `json:"tenant_id"`
	FinancialYear               string     `json:"financial_year"`                 // e.g. "2025-26"
	BatteryCategory             string     `json:"battery_category"`               // EV, PORTABLE, INDUSTRIAL, AUTOMOTIVE
	ObligationKg                float64    `json:"obligation_kg"`                  // Batteries placed on market (kg)
	BatteriesPlacedCount        int        `json:"batteries_placed_count"`         // Unit count
	FulfilledViaRecyclingKg     float64    `json:"fulfilled_via_recycling_kg"`     // kg fulfilled via recycling
	FulfilledViaRefurbishmentKg float64    `json:"fulfilled_via_refurbishment_kg"` // kg fulfilled via refurbishment
	CarriedForwardKg            float64    `json:"carried_forward_kg"`             // Excess from prev year
	NetObligationKg             float64    `json:"net_obligation_kg"`              // After carry-forward
	ShortfallKg                 float64    `json:"shortfall_kg"`                   // Unfulfilled amount
	ECCAmountINR                float64    `json:"ecc_amount_inr"`                 // Environmental Compensation Charge
	ECCStatus                   string     `json:"ecc_status"`                     // NOT_APPLICABLE, PENDING, PAID, WAIVED
	Status                      string     `json:"status"`                         // DRAFT, FILED, AUDITED, CLOSED
	CPCBReturnReference         string     `json:"cpcb_return_reference,omitempty"`
	CPCBFiledAt                 *time.Time `json:"cpcb_filed_at,omitempty"`
	CreatedAt                   time.Time  `json:"created_at"`
	UpdatedAt                   time.Time  `json:"updated_at"`
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
	ExportJobTypeEPCIS                 ExportJobType = "EPCIS"
	ExportJobTypePLIPacket             ExportJobType = "PLI_PACKET"
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
	case ExportJobTypeEPCIS:
		return fmt.Sprintf("%s_epcis.jsonld", sanitizedBatchName)
	case ExportJobTypePLIPacket:
		return fmt.Sprintf("%s_pli_claim_packet.zip", sanitizedBatchName)
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

// ============================================================================
// OUTBOUND WEBHOOKS (tenant event notifications)
// ============================================================================

// OutboundWebhook represents a tenant-configured webhook endpoint
type OutboundWebhook struct {
	ID              uuid.UUID  `json:"id"`
	TenantID        uuid.UUID  `json:"tenant_id"`
	URL             string     `json:"url"`
	Secret          string     `json:"-"`           // HMAC-SHA256 signing secret (never exposed)
	EventTypes      []string   `json:"event_types"` // e.g., ["STATUS_CHANGED","SOH_UPDATED","TRANSFER"]
	IsActive        bool       `json:"is_active"`
	FailureCount    int        `json:"failure_count"`
	LastTriggeredAt *time.Time `json:"last_triggered_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// CreateOutboundWebhookRequest is the request to register a webhook
type CreateOutboundWebhookRequest struct {
	URL        string   `json:"url"`
	EventTypes []string `json:"event_types"`
}

// WebhookPayload is the envelope sent to tenant webhook URLs
type WebhookPayload struct {
	Event      string                 `json:"event"`       // e.g., "STATUS_CHANGED"
	PassportID string                 `json:"passport_id"` // UUID of affected passport
	TenantID   string                 `json:"tenant_id"`
	Timestamp  string                 `json:"timestamp"` // ISO 8601
	Data       map[string]interface{} `json:"data"`      // Event-specific payload
}

// WebhookDelivery is one logged attempt to deliver a webhook payload —
// the audit trail surfaced on the Webhook Delivery Log UI, and the source
// of truth the retry worker reads from to find failed deliveries to retry.
type WebhookDelivery struct {
	ID             uuid.UUID  `json:"id"`
	WebhookID      uuid.UUID  `json:"webhook_id"`
	EventType      string     `json:"event_type"`
	Payload        []byte     `json:"payload"`
	ResponseStatus *int       `json:"response_status,omitempty"`
	ResponseBody   string     `json:"response_body,omitempty"`
	DeliveredAt    *time.Time `json:"delivered_at,omitempty"`
	RetryCount     int        `json:"retry_count"`
	ErrorMessage   string     `json:"error_message,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

// Succeeded reports whether this delivery attempt's HTTP response was in the
// 2xx range — the single definition of "delivered" used both by the
// dashboard's status badge and the retry worker's selection query.
func (d *WebhookDelivery) Succeeded() bool {
	return d.ResponseStatus != nil && *d.ResponseStatus >= 200 && *d.ResponseStatus < 300
}

// ============================================================================
// EU COMPLIANCE ATTRIBUTE SCORE (BatteryPass consortium 80-attribute mapping)
// ============================================================================

// ComplianceAttribute represents one EU-required data point and its fill status
type ComplianceAttribute struct {
	ID       string `json:"id"`       // e.g., "EU-7.1"
	Name     string `json:"name"`     // e.g., "Battery Category"
	Category string `json:"category"` // e.g., "General Information"
	RegRef   string `json:"reg_ref"`  // e.g., "Art 2(1)"
	Filled   bool   `json:"filled"`
}

// ComplianceScoreResult holds the overall compliance attribute coverage
type ComplianceScoreResult struct {
	Score      float64               `json:"score"` // 0-100%
	Filled     int                   `json:"filled"`
	Total      int                   `json:"total"`
	Attributes []ComplianceAttribute `json:"attributes"`
}

// ============================================================================
// COMPLIANCE RULES (database-driven rule engine)
// ============================================================================

// ComplianceRule stores a single market-specific regulatory threshold or requirement.
// Validators query active rules from the DB and fall back to hard-coded defaults.
type ComplianceRule struct {
	ID             uuid.UUID  `json:"id"`
	ProductType    string     `json:"product_type"`
	MarketRegion   string     `json:"market_region"`
	RuleKey        string     `json:"rule_key"`
	RuleType       string     `json:"rule_type"` // "threshold", "required_field", "format_regex"
	ThresholdValue *float64   `json:"threshold_value,omitempty"`
	ErrorMessage   string     `json:"error_message"`
	Required       bool       `json:"required"`
	EffectiveFrom  time.Time  `json:"effective_from"`
	EffectiveUntil *time.Time `json:"effective_until,omitempty"`
	Version        int        `json:"version"`
	CreatedAt      time.Time  `json:"created_at"`
}

// ComplianceDeadline stores a regulatory milestone date (e.g. "Digital Passport mandatory from 2027-02-18").
// Unlike ComplianceRule (which validates thresholds), this is purely informational for dashboard display.
type ComplianceDeadline struct {
	ID           uuid.UUID `json:"id"`
	ProductType  string    `json:"product_type"`
	MarketRegion string    `json:"market_region"`
	MilestoneKey string    `json:"milestone_key"`
	Label        string    `json:"label"`
	DeadlineDate time.Time `json:"deadline_date"`
	Description  string    `json:"description"`
	URL          string    `json:"url,omitempty"`
	Version      int       `json:"version"`
	CreatedAt    time.Time `json:"created_at"`
}

// ============================================================================
// MASS BALANCE LEDGER (EU Battery Regulation Annex VIII — book-and-claim)
// ============================================================================

// MassBalanceLedger tracks recycled material inflows and outflows per tenant.
// Supports book-and-claim chain-of-custody without physical segregation.
type MassBalanceLedger struct {
	ID             uuid.UUID `json:"id"`
	TenantID       uuid.UUID `json:"tenant_id"`
	MaterialType   string    `json:"material_type"`   // cobalt, lithium, nickel, lead, manganese
	IncomingKg     float64   `json:"incoming_kg"`     // recycled material received
	IncomingSource string    `json:"incoming_source"` // recycler EPR ID or ISCC cert
	AllocatedKg    float64   `json:"allocated_kg"`    // material allocated to products
	BalanceKg      float64   `json:"balance_kg"`      // remaining unallocated
	CertificateURL string    `json:"certificate_url,omitempty"`
	Notes          string    `json:"notes,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// MassBalanceAllocation links a specific battery batch/passport to a ledger claim.
type MassBalanceAllocation struct {
	ID           uuid.UUID  `json:"id"`
	LedgerID     uuid.UUID  `json:"ledger_id"`
	BatchID      uuid.UUID  `json:"batch_id"`
	PassportID   *uuid.UUID `json:"passport_id,omitempty"`
	MaterialType string     `json:"material_type"` // cobalt, lithium, nickel, lead, manganese
	AllocatedKg  float64    `json:"allocated_kg"`
	CreatedAt    time.Time  `json:"created_at"`
}

// ============================================================================
// REGULATORY INTELLIGENCE (Phase E)
// ============================================================================

// RegulatorySourceType defines how the source is fetched
type RegulatorySourceType string

const (
	RegulatorySourceTypeRSS     RegulatorySourceType = "rss"
	RegulatorySourceTypeAPI     RegulatorySourceType = "api"
	RegulatorySourceTypeScraper RegulatorySourceType = "scraper"
)

// RegulatorySource configures an external feed or page to monitor.
type RegulatorySource struct {
	ID            uuid.UUID            `json:"id"`
	Name          string               `json:"name"`
	SourceType    RegulatorySourceType `json:"source_type"`      // rss, api, scraper
	URL           string               `json:"url"`              // RSS feed URL or page URL
	Config        map[string]string    `json:"config,omitempty"` // scraper selectors, api headers
	FetchInterval string               `json:"fetch_interval"`   // cron-like, e.g. "6h"
	IsActive      bool                 `json:"is_active"`        // paused sources are skipped
	LastFetchedAt *time.Time           `json:"last_fetched_at,omitempty"`
	LastETag      string               `json:"last_etag,omitempty"` // HTTP conditional fetch
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
}

// RegulatoryItem is a single fetched document after classification.
type RegulatoryItem struct {
	ID           uuid.UUID  `json:"id"`
	SourceID     uuid.UUID  `json:"source_id"`
	ExternalID   string     `json:"external_id"` // guid, link, or hash from source
	Title        string     `json:"title"`
	Summary      string     `json:"summary,omitempty"`
	URL          string     `json:"url,omitempty"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
	ProductType  string     `json:"product_type,omitempty"`  // BATTERY, TEXTILE, GENERAL
	MarketRegion string     `json:"market_region,omitempty"` // EU, INDIA, GLOBAL
	Urgency      string     `json:"urgency"`                 // low, normal, high, critical
	Tags         []string   `json:"tags,omitempty"`
	Deadline     *time.Time `json:"deadline,omitempty"`
	RawContent   string     `json:"raw_content,omitempty"`
	ClassifiedAt *time.Time `json:"classified_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// TenantRegulatoryAlert is the per-tenant unread/dismissed state for an item.
type TenantRegulatoryAlert struct {
	ID               uuid.UUID  `json:"id"`
	TenantID         uuid.UUID  `json:"tenant_id"`
	RegulatoryItemID uuid.UUID  `json:"regulatory_item_id"`
	IsRead           bool       `json:"is_read"`
	IsDismissed      bool       `json:"is_dismissed"`
	ReadAt           *time.Time `json:"read_at,omitempty"`
	DismissedAt      *time.Time `json:"dismissed_at,omitempty"`
	EmailedAt        *time.Time `json:"emailed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	// Join fields (populated by query)
	Title        string     `json:"title,omitempty"`
	Summary      string     `json:"summary,omitempty"`
	Urgency      string     `json:"urgency,omitempty"`
	Deadline     *time.Time `json:"deadline,omitempty"`
	MarketRegion string     `json:"market_region,omitempty"`
	ProductType  string     `json:"product_type,omitempty"`
}
