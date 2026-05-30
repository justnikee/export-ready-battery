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
// MARKET REGION (DUAL-MODE COMPLIANCE)
// ============================================================================

// MarketRegion represents the target market for a batch
type MarketRegion string

const (
	MarketRegionIndia  MarketRegion = "INDIA"  // India domestic market
	MarketRegionEU     MarketRegion = "EU"     // EU export market
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
	ID           uuid.UUID   `json:"id"`
	CompanyName  string      `json:"company_name"`
	Address      string      `json:"address,omitempty"`
	LogoURL      string      `json:"logo_url,omitempty"`
	SupportEmail string      `json:"support_email,omitempty"`
	Website      string      `json:"website,omitempty"`
	ProductType  ProductType `json:"product_type"`
	CreatedAt    time.Time   `json:"created_at"`

	// Quota System (Monetization)
	QuotaBalance int    `json:"quota_balance"` // Batch activation slots available
	PlanType     string `json:"plan_type"`     // STARTER, GROWTH, ENTERPRISE

	// Partner Access (Tier B Magic Link Verification)
	PartnerAccessCode string `json:"partner_access_code,omitempty"` // Secret code for external partner verification

	// Onboarding Status
	OnboardingCompleted bool `json:"onboarding_completed"` // Whether user completed profile setup

	// BPAN V2: 3-char manufacturer code for serial number generation
	ManufacturerCode string `json:"manufacturer_code,omitempty"` // e.g. "TEN", auto-derived from company name

	// Field Visibility Config stored as JSONB.
	// Must be json.RawMessage ([]byte) — pgx SimpleProtocol cannot encode map types into JSONB.
	DataVisibility json.RawMessage `json:"data_visibility,omitempty"`

	// Product-specific profiles (populated from textile_tenant_profiles).
	TextileProfile *TextileTenantProfile `json:"textile_profile,omitempty"`
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

// TextileProfileUpdate holds textile-specific profile update fields.
type TextileProfileUpdate struct {
	TextileFacilityType       string          `json:"textile_facility_type"`
	TextileSupplyChainTier    string          `json:"textile_supply_chain_tier"`
	TextilePrimaryMarkets     json.RawMessage `json:"textile_primary_markets"`
	TextileDefaultFiberTypes  json.RawMessage `json:"textile_default_fiber_types"`
	TextileCertifications     json.RawMessage `json:"textile_certifications"`
	TextileComplianceDefaults json.RawMessage `json:"textile_compliance_defaults"`
}

// UpdateProfileRequest represents the payload for updating tenant profile.
// It preserves the flat JSON API contract via promoted fields.
type UpdateProfileRequest struct {
	BaseProfileRequest
	*TextileProfileUpdate
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
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	BatchName string    `json:"batch_name"`
	ModelName string    `json:"model_name"`
	Specs     BatchSpec `json:"specs"`
	CreatedAt time.Time `json:"created_at"`
	Status    string    `json:"status"` // DRAFT, ACTIVE, ARCHIVED

	// v2: Product-agnostic fields
	ProductType     ProductType     `json:"product_type"`              // BATTERY, TEXTILE, ELECTRONICS (default: BATTERY)
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
}

// BatchSpec holds the common specifications stored as JSONB
type BatchSpec struct {
	MaterialProfile     string `json:"material_profile,omitempty"`
	LotSize             string `json:"lot_size,omitempty"`
	ProductionStage     string `json:"production_stage,omitempty"`
	ManufacturerAddress string `json:"manufacturer_address,omitempty"`

	// ── Textile-Specific Fields ───────────────────────────────────────────────
	GSM                    float64                 `json:"gsm,omitempty"`                      // Grams per square meter
	WaterUsageLiters       float64                 `json:"water_usage_liters,omitempty"`       // Liters per unit/kg
	EnergyUsageKWh         float64                 `json:"energy_usage_kwh,omitempty"`         // kWh per unit/kg
	DyeProcess             string                  `json:"dye_process,omitempty"`              // reactive, vat, disperse, acid, natural, pigment, none
	FiberComposition       *FiberComposition       `json:"fiber_composition,omitempty"`        // Structured fiber breakdown %
	SupplierTier           *SupplierTier           `json:"supplier_tier,omitempty"`            // Supply chain tier mapping
	LaborCompliance        *LaborCompliance        `json:"labor_compliance,omitempty"`         // SA8000, BSCI, SEDEX, Fair Trade
	ChemicalComplianceZDHC *ChemicalComplianceZDHC `json:"chemical_compliance_zdhc,omitempty"` // ZDHC MRSL compliance
	DyeChemicals           []string                `json:"dye_chemicals,omitempty"`            // Key dyes and chemicals used
	FinishType             []string                `json:"finish_type,omitempty"`              // mercerized, brushed, peached, etc.
	Color                  string                  `json:"color,omitempty"`                    // Product color
	Dimensions             string                  `json:"dimensions,omitempty"`               // Size dimensions or roll width
	PackagingType          string                  `json:"packaging_type,omitempty"`           // Packaging material description
	OrderQuantity          int                     `json:"order_quantity,omitempty"`           // Total units in production order
	BiodegradablePct       *float64                `json:"biodegradable_pct,omitempty"`        // % biodegradable fibers
	ExpectedLifetimeWashes *int                    `json:"expected_lifetime_washes,omitempty"` // Expected wash cycles
	FiberOrigin            string                  `json:"fiber_origin,omitempty"`             // Raw fiber sourcing region/country
	RecycledContentPct     *float64                `json:"recycled_content_pct,omitempty"`     // % recycled fiber content (EU ESPR / GRS)
	Certifications         []string                `json:"certifications,omitempty"`           // e.g. GOTS, OEKO-TEX, GRS, FAIRTRADE
	Weight                 string                  `json:"weight,omitempty"`                   // Product weight (e.g. "250g")
	CarbonFootprint        string                  `json:"carbon_footprint,omitempty"`         // kgCO2e/kg or per unit
	HazardousSubstances    *HazardousSubstances    `json:"hazardous_substances,omitempty"`     // REACH/SVHC hazardous substance declaration
}

// ============================================================================
// TEXTILE-SPECIFIC STRUCTS
// ============================================================================

// FiberComposition holds structured fiber breakdown by percentage.
// Mandatory for EU ESPR fiber traceability and India fiber labeling rules.
type FiberComposition struct {
	CottonPct    float64 `json:"cotton_pct,omitempty"`
	PolyesterPct float64 `json:"polyester_pct,omitempty"`
	WoolPct      float64 `json:"wool_pct,omitempty"`
	SilkPct      float64 `json:"silk_pct,omitempty"`
	LinenPct     float64 `json:"linen_pct,omitempty"`
	ViscosePct   float64 `json:"viscose_pct,omitempty"`
	NylonPct     float64 `json:"nylon_pct,omitempty"`
	AcrylicPct   float64 `json:"acrylic_pct,omitempty"`
	HempPct      float64 `json:"hemp_pct,omitempty"`
	OtherPct     float64 `json:"other_pct,omitempty"`
}

// SupplierTier maps supply chain participants for textile traceability.
type SupplierTier struct {
	FiberSupplier       string `json:"fiber_supplier,omitempty"`
	SpinningMill        string `json:"spinning_mill,omitempty"`
	WeavingKnittingMill string `json:"weaving_knitting_mill,omitempty"`
	DyeHouse            string `json:"dye_house,omitempty"`
	FinishingFacility   string `json:"finishing_facility,omitempty"`
	CutSewFacility      string `json:"cut_sew_facility,omitempty"`
}

// LaborCompliance holds social compliance certifications and audit results.
type LaborCompliance struct {
	SA8000Certified    bool    `json:"sa8000_certified,omitempty"`
	BSCIAudited        bool    `json:"bsci_audited,omitempty"`
	SedexMember        bool    `json:"sedex_member,omitempty"`
	FairTradeCertified bool    `json:"fair_trade_certified,omitempty"`
	AuditDate          string  `json:"audit_date,omitempty"`  // YYYY-MM-DD
	AuditScore         float64 `json:"audit_score,omitempty"` // 0-100
}

// ChemicalComplianceZDHC holds ZDHC MRSL (Manufacturing Restricted Substances List) compliance data.
type ChemicalComplianceZDHC struct {
	ZDHCLevel                 string   `json:"zdhc_level,omitempty"` // "1", "2", "3", "NA"
	MRSLTested                bool     `json:"mrsl_tested,omitempty"`
	TestReportURL             string   `json:"test_report_url,omitempty"`
	RestrictedSubstancesFound []string `json:"restricted_substances_found,omitempty"`
}

// HazardousSubstances holds REACH/SVHC hazardous substance declarations per EU ESPR.
type HazardousSubstances struct {
	Declaration    string `json:"declaration,omitempty"`    // e.g. "No hazardous substances above 0.1% w/w"
	LeadPresent    bool   `json:"lead_present,omitempty"`
	MercuryPresent bool   `json:"mercury_present,omitempty"`
	CadmiumPresent bool   `json:"cadmium_present,omitempty"`
	Exemptions     string `json:"exemptions,omitempty"` // REACH Annex XVII exemption reference
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
	ProductType ProductType     `json:"product_type"`        // BATTERY, TEXTILE, ELECTRONICS (default: BATTERY)
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

// TextilePassportStatus constants — textile-specific supply-chain lifecycle states
const (
	TextileStatusRawMaterial  = "RAW_MATERIAL"  // Fiber/fabric produced at Tier 3/4
	TextileStatusInProduction = "IN_PRODUCTION" // Dyeing, cutting, sewing
	TextileStatusFinished     = "FINISHED"      // Finished goods at factory
	TextileStatusShipped      = "SHIPPED"       // In transit to brand/retailer
	TextileStatusInUse        = "IN_USE"        // At retail or in consumer use
	TextileStatusRecycled     = "RECYCLED"      // Processed by authorized recycler
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
	ActorRoleAdmin            ActorRole = "ADMIN"

	// Textile-specific supply chain actor roles
	ActorRoleSupplier       ActorRole = "SUPPLIER"      // Fiber / yarn supplier
	ActorRoleSpinningMill   ActorRole = "SPINNING_MILL" // Spinning / weaving facility
	ActorRoleDyeHouse       ActorRole = "DYE_HOUSE"     // Dyeing / finishing facility
	ActorRoleCutSewFacility ActorRole = "CUT_SEW"       // Cut-make-trim (CMT) facility
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
	case ActorRoleSystem, ActorRoleInternalOperator, ActorRoleAdmin,
		ActorRoleSupplier, ActorRoleSpinningMill, ActorRoleDyeHouse, ActorRoleCutSewFacility:
		return true
	}
	return false
}

// IsValidPartnerRole checks if the role is valid for external partners.
func IsValidPartnerRole(role string) bool {
	switch ActorRole(role) {
	case ActorRoleSupplier, ActorRoleSpinningMill, ActorRoleDyeHouse, ActorRoleCutSewFacility:
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
	// Textile supply chain lifecycle actions
	ActionProduce TransitionAction = "PRODUCE" // Raw material → in production
	ActionDye     TransitionAction = "DYE"     // In production → finished (dyeing/finishing)
	ActionFinish  TransitionAction = "FINISH"  // In production → finished (CMT)
	ActionSell    TransitionAction = "SELL"    // Finished → shipped
	ActionCollect TransitionAction = "COLLECT" // In use → recycled

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
	_, ok := TextileTransitionMap[TransitionAction(action)]
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
	return TextileTransitionMap, TextileTransitionActionOrder
}

// roleMaps returns the allowed-roles map for a product type.
func roleMaps(productType ProductType) map[TransitionAction][]ActorRole {
	return TextileAllowedRolesByAction
}

// TextileTransitionActionOrder ensures deterministic ordering for textile actions.
var TextileTransitionActionOrder = []TransitionAction{
	ActionProduce,
	ActionDye,
	ActionFinish,
	ActionSell,
	ActionCollect,
}

// TextileTransitionMap defines the canonical textile supply chain transitions.
var TextileTransitionMap = map[TransitionAction]TransitionDefinition{
	ActionProduce: {
		AllowedFrom: []string{TextileStatusRawMaterial},
		To:          TextileStatusInProduction,
	},
	ActionDye: {
		AllowedFrom: []string{TextileStatusInProduction},
		To:          TextileStatusFinished,
	},
	ActionFinish: {
		AllowedFrom: []string{TextileStatusInProduction},
		To:          TextileStatusFinished,
	},
	ActionSell: {
		AllowedFrom: []string{TextileStatusFinished},
		To:          TextileStatusShipped,
	},
	ActionCollect: {
		AllowedFrom: []string{TextileStatusInUse, TextileStatusShipped},
		To:          TextileStatusRecycled,
	},
}

// TextileAllowedRolesByAction defines which roles can perform textile actions.
var TextileAllowedRolesByAction = map[TransitionAction][]ActorRole{
	ActionProduce: {ActorRoleSystem, ActorRoleInternalOperator, ActorRoleSupplier},
	ActionDye:     {ActorRoleDyeHouse, ActorRoleInternalOperator, ActorRoleAdmin},
	ActionFinish:  {ActorRoleCutSewFacility, ActorRoleInternalOperator, ActorRoleAdmin},
	ActionSell:    {ActorRoleInternalOperator, ActorRoleAdmin},
	ActionCollect: {ActorRoleSystem},
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

	// Textile-specific sustainability aggregations
	AvgWaterUsage        float64 `json:"avg_water_usage"`
	AvgEnergyUsage       float64 `json:"avg_energy_usage"`
	AvgRecycledContent   float64 `json:"avg_recycled_content"`
	AvgBiodegradable     float64 `json:"avg_biodegradable"`
	ChemicalCompliancePct float64 `json:"chemical_compliance_percentage"`
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

// BPANVersion indicates the serial format version.
type BPANVersion string

const (
	BPANv1 BPANVersion = "V1" // Legacy India-only format
	BPANv2 BPANVersion = "V2" // Multi-region format (IN/EU/GL)
)

// BPANComponents holds the decoded segments of a BPAN V2 serial number.
type BPANComponents struct {
	Region       string      `json:"region"`       // IN, EU, GL
	Manufacturer string      `json:"manufacturer"` // 3-char code
	Chemistry    string      `json:"chemistry"`    // LFP, NMC, etc.
	Year         int         `json:"year"`
	Sequence     int         `json:"sequence"`
	Version      BPANVersion `json:"version"`
}
