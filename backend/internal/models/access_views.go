package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// THREE-LAYER DATA ACCESS MODEL (EU 2023/1542 Art 78)
// ============================================================================
// PUBLIC    — Anyone scanning QR code (no auth)
// PARTNER   — Supply-chain actors via magic-link access_token
// REGULATOR — Market surveillance via X-Regulator-Key header
// ============================================================================

// AccessTier represents the three access levels defined by EU Art 78
type AccessTier string

const (
	AccessTierPublic    AccessTier = "PUBLIC"
	AccessTierPartner   AccessTier = "PARTNER"
	AccessTierRegulator AccessTier = "REGULATOR"
)

// ============================================================================
// PUBLIC VIEW — Consumer-safe subset
// ============================================================================

// PublicPassportView contains only consumer-safe data visible to anyone.
// Omits: ownership history, repair/replacement events, lifecycle timestamps,
// telemetry data, internal identifiers, audit trail.
type PublicPassportView struct {
	// Identity
	UUID            uuid.UUID `json:"uuid"`
	SerialNumber    string    `json:"serial_number"`
	ManufactureDate time.Time `json:"manufacture_date"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`

	// Dynamic compliance (public per Art 78)
	StateOfHealth          *float64   `json:"state_of_health,omitempty"`
	LastSOHUpdateTimestamp *time.Time `json:"last_soh_update_timestamp,omitempty"`

	// Specs (product identity — public)
	Specs *PublicSpecsView `json:"specs"`

	// Manufacturer / Tenant (public profile)
	Tenant *PublicTenantView `json:"tenant"`

	// Batch context
	BatchName    string       `json:"batch_name"`
	ModelName    string       `json:"model_name,omitempty"`
	ProductType  ProductType  `json:"product_type"`
	TemplateVariant string    `json:"template_variant,omitempty"`
	MarketRegion MarketRegion `json:"market_region"`

	// Manufacturing window
	ManufacturingStartDate *time.Time `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time `json:"manufacturing_end_date,omitempty"`

	// India compliance (public)
	CellSource       string     `json:"cell_source,omitempty"`
	DomesticValueAdd float64    `json:"domestic_value_add,omitempty"`
	PLICompliant     bool       `json:"pli_compliant,omitempty"`
	HSNCode          string     `json:"hsn_code,omitempty"`
	DVASource        string     `json:"dva_source,omitempty"`
	BillOfEntryNo    string     `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin  string     `json:"country_of_origin,omitempty"`
	CustomsDate      *time.Time `json:"customs_date,omitempty"`

	// Access tier metadata
	AccessTier AccessTier `json:"access_tier"`
}

// PublicSpecsView is the consumer-safe subset of BatchSpec
type PublicSpecsView struct {
	Chemistry              string               `json:"chemistry"`
	NominalVoltage         string               `json:"voltage"`
	Capacity               string               `json:"capacity"`
	Weight                 string               `json:"weight"`
	CarbonFootprint        string               `json:"carbon_footprint"`
	CountryOfOrigin        string               `json:"country_of_origin"`
	Manufacturer           string               `json:"manufacturer"`
	MaterialProfile        string               `json:"material_profile,omitempty"`
	LotSize                string               `json:"lot_size,omitempty"`
	ProductionStage        string               `json:"production_stage,omitempty"`
	ManufacturerAddress    string               `json:"manufacturer_address,omitempty"`
	MaterialComposition    *MaterialComposition `json:"material_composition,omitempty"`
	Certifications         []string             `json:"certifications,omitempty"`
	HazardousSubstances    *HazardousSubstances `json:"hazardous_substances,omitempty"`
	WarrantyMonths         *int                 `json:"warranty_months,omitempty"`
	ExpectedLifetimeCycles *int                 `json:"expected_lifetime_cycles,omitempty"`
	RecycledContentPct     *float64             `json:"recycled_content_pct,omitempty"`
	// EU Battery Regulation structured fields (public)
	BatteryCategory        BatteryCategory      `json:"battery_category,omitempty"`
	PerformanceSpec        *PerformanceSpec     `json:"performance_spec,omitempty"`
	// India compliance identifiers (from batch specs)
	BISNumber              string               `json:"bis_number,omitempty"`
	EPRNumber              string               `json:"epr_number,omitempty"`
}

// PublicTenantView is the consumer-safe subset of Tenant
type PublicTenantView struct {
	ID                                uuid.UUID `json:"id"`
	CompanyName                       string    `json:"company_name"`
	Address                           string    `json:"address,omitempty"`
	SupportEmail                      string    `json:"support_email,omitempty"`
	TextileFacilityType               string    `json:"textile_facility_type,omitempty"`
	TextileSupplyChainTier            string    `json:"textile_supply_chain_tier,omitempty"`
	EPRRegistrationNumber             string    `json:"epr_registration_number,omitempty"`
	BISRNumber                        string    `json:"bis_r_number,omitempty"`
	BISCertificatePath                string    `json:"bis_certificate_path,omitempty"`
	EPRCertificatePath                string    `json:"epr_certificate_path,omitempty"`
	PLICertificatePath                string    `json:"pli_certificate_path,omitempty"`
	EUAuthorizedRepresentativeName    string    `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string    `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                    string    `json:"eu_contact_email,omitempty"`
}

type publicViewBatchSnapshot struct {
	BatchName              string              `json:"batch_name"`
	ModelName              string              `json:"model_name,omitempty"`
	ProductType            ProductType         `json:"product_type"`
	TemplateVariant        string              `json:"template_variant,omitempty"`
	MarketRegion           MarketRegion        `json:"market_region"`
	Specs                  *BatchSpec          `json:"specs,omitempty"`
	ManufacturingStartDate *time.Time          `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time          `json:"manufacturing_end_date,omitempty"`
	CellSource             string              `json:"cell_source,omitempty"`
	DomesticValueAdd       float64             `json:"domestic_value_add,omitempty"`
	PLICompliant           bool                `json:"pli_compliant,omitempty"`
	HSNCode                string              `json:"hsn_code,omitempty"`
	DVASource              string              `json:"dva_source,omitempty"`
	BillOfEntryNo          string              `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin        string              `json:"country_of_origin,omitempty"`
	CustomsDate            *time.Time          `json:"customs_date,omitempty"`
	Tenant                 *publicTenantSnapshot `json:"tenant,omitempty"`
}

type publicTenantSnapshot struct {
	TenantID                          string `json:"tenant_id"`
	CompanyName                       string `json:"company_name"`
	Address                           string `json:"address,omitempty"`
	TextileFacilityType               string `json:"textile_facility_type,omitempty"`
	TextileSupplyChainTier            string `json:"textile_supply_chain_tier,omitempty"`
	EPRRegistrationNumber             string `json:"epr_registration_number,omitempty"`
	BISRNumber                        string `json:"bis_r_number,omitempty"`
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                    string `json:"eu_contact_email,omitempty"`
}

// ============================================================================
// PARTNER VIEW — Supply-chain actors (extends Public)
// ============================================================================

// PartnerPassportView adds ownership, lifecycle, and repair data for partners.
type PartnerPassportView struct {
	PublicPassportView

	// Ownership tracking
	CurrentOwnerIdentifier string          `json:"current_owner_identifier,omitempty"`
	OwnershipHistory       json.RawMessage `json:"ownership_history,omitempty"`

	// Lifecycle timestamps
	ShippedAt   *time.Time `json:"shipped_at,omitempty"`
	InstalledAt *time.Time `json:"installed_at,omitempty"`
	ReturnedAt  *time.Time `json:"returned_at,omitempty"`
	RecycledAt  *time.Time `json:"recycled_at,omitempty"`

	// EU mandatory dynamic data (partner-level visibility)
	RepairEvents      json.RawMessage `json:"repair_events,omitempty"`
	ReplacementEvents json.RawMessage `json:"replacement_events,omitempty"`

	// EU Art 57 / Art 39 (partner-level only)
	DisassemblyGuide      *DisassemblyGuide      `json:"disassembly_guide,omitempty"`
	SupplyChainProvenance *SupplyChainProvenance `json:"supply_chain_provenance,omitempty"`

	// Telemetry summary
	CycleCount      *int       `json:"cycle_count,omitempty"`
	LastTemperature *float64   `json:"last_temperature,omitempty"`
	LastVoltage     *float64   `json:"last_voltage,omitempty"`
	LastTelemetryAt *time.Time `json:"last_telemetry_at,omitempty"`

	// India recycling
	RecyclingStatus string     `json:"recycling_status,omitempty"`
	RecyclerEprID   string     `json:"recycler_epr_id,omitempty"`
	RecyclingDate   *time.Time `json:"recycling_date,omitempty"`
}

// ============================================================================
// REGULATOR VIEW — Full data + audit trail
// ============================================================================

// RegulatorPassportView returns the complete passport data plus the audit event log.
type RegulatorPassportView struct {
	*PassportWithSpecs

	// Complete audit trail with hash chain
	Events []*PassportEvent `json:"events,omitempty"`

	// Access tier metadata
	AccessTier AccessTier `json:"access_tier"`
}

// ============================================================================
// BUILDER FUNCTIONS
// ============================================================================

// BuildPublicView creates a PublicPassportView from full passport data.
func BuildPublicView(full *PassportWithSpecs) *PublicPassportView {
	if full == nil || full.Passport == nil {
		return nil
	}
	p := full.Passport

	view := &PublicPassportView{
		UUID:            p.UUID,
		SerialNumber:    p.SerialNumber,
		ManufactureDate: p.ManufactureDate,
		Status:          p.Status,
		CreatedAt:       p.CreatedAt,

		StateOfHealth:          p.StateOfHealth,
		LastSOHUpdateTimestamp: p.LastSOHUpdateTimestamp,

		BatchName:    full.BatchName,
		ModelName:    full.ModelName,
		ProductType:  full.ProductType,
		TemplateVariant: ResolvePassportTemplateVariant(full.ProductType, full.MarketRegion),
		MarketRegion: full.MarketRegion,

		ManufacturingStartDate: full.ManufacturingStartDate,
		ManufacturingEndDate:   full.ManufacturingEndDate,

		CellSource:       full.CellSource,
		DomesticValueAdd: full.DomesticValueAdd,
		PLICompliant:     full.PLICompliant,
		HSNCode:          full.HSNCode,
		DVASource:        full.DVASource,
		BillOfEntryNo:    full.BillOfEntryNo,
		CountryOfOrigin:  full.CountryOfOrigin,
		CustomsDate:      full.CustomsDate,

		AccessTier: AccessTierPublic,
	}

	// Map specs
	view.Specs = buildPublicSpecsView(full.Specs)

	// Map tenant (public-safe fields only)
	view.Tenant = buildPublicTenantView(full.Tenant)
	applySnapshotOverrides(view, p.BatchSnapshot)

	return view
}

func buildPublicSpecsView(specs *BatchSpec) *PublicSpecsView {
	if specs == nil {
		return nil
	}

	return &PublicSpecsView{
		Chemistry:              specs.Chemistry,
		NominalVoltage:         specs.NominalVoltage,
		Capacity:               specs.Capacity,
		Weight:                 specs.Weight,
		CarbonFootprint:        specs.CarbonFootprint,
		CountryOfOrigin:        specs.CountryOfOrigin,
		Manufacturer:           specs.Manufacturer,
		MaterialProfile:        specs.MaterialProfile,
		LotSize:                specs.LotSize,
		ProductionStage:        specs.ProductionStage,
		ManufacturerAddress:    specs.ManufacturerAddress,
		MaterialComposition:    specs.MaterialComposition,
		Certifications:         specs.Certifications,
		HazardousSubstances:    specs.HazardousSubstances,
		WarrantyMonths:         specs.WarrantyMonths,
		ExpectedLifetimeCycles: specs.ExpectedLifetimeCycles,
		RecycledContentPct:     specs.RecycledContentPct,
		BatteryCategory:        specs.BatteryCategory,
		PerformanceSpec:        specs.PerformanceSpec,
		BISNumber:              specs.BISNumber,
		EPRNumber:              specs.EPRNumber,
	}
}

func buildPublicTenantView(tenant *Tenant) *PublicTenantView {
	if tenant == nil {
		return nil
	}

	tenant.EnsureBatteryProfile()
	tenant.EnsureTextileProfile()

	return &PublicTenantView{
		ID:                                tenant.ID,
		CompanyName:                       tenant.CompanyName,
		Address:                           tenant.Address,
		SupportEmail:                      tenant.SupportEmail,
		TextileFacilityType:               tenant.TextileProfile.FacilityType,
		TextileSupplyChainTier:            tenant.TextileProfile.SupplyChainTier,
		EPRRegistrationNumber:             tenant.BatteryProfile.EPRRegistrationNumber,
		BISRNumber:                        tenant.BatteryProfile.BISRNumber,
		BISCertificatePath:                tenant.BatteryProfile.BISCertificatePath,
		EPRCertificatePath:                tenant.BatteryProfile.EPRCertificatePath,
		PLICertificatePath:                tenant.BatteryProfile.PLICertificatePath,
		EUAuthorizedRepresentativeName:    tenant.BatteryProfile.EUAuthorizedRepresentativeName,
		EUAuthorizedRepresentativeAddress: tenant.BatteryProfile.EUAuthorizedRepresentativeAddress,
		EUContactEmail:                    tenant.BatteryProfile.EUContactEmail,
	}
}

func buildPublicTenantViewFromSnapshot(snapshot *publicTenantSnapshot) *PublicTenantView {
	if snapshot == nil {
		return nil
	}

	view := &PublicTenantView{
		CompanyName:                       snapshot.CompanyName,
		Address:                           snapshot.Address,
		TextileFacilityType:               snapshot.TextileFacilityType,
		TextileSupplyChainTier:            snapshot.TextileSupplyChainTier,
		EPRRegistrationNumber:             snapshot.EPRRegistrationNumber,
		BISRNumber:                        snapshot.BISRNumber,
		EUAuthorizedRepresentativeName:    snapshot.EUAuthorizedRepresentativeName,
		EUAuthorizedRepresentativeAddress: snapshot.EUAuthorizedRepresentativeAddress,
		EUContactEmail:                    snapshot.EUContactEmail,
	}

	if snapshot.TenantID != "" {
		if parsedID, err := uuid.Parse(snapshot.TenantID); err == nil {
			view.ID = parsedID
		}
	}

	return view
}

func applySnapshotOverrides(view *PublicPassportView, raw json.RawMessage) {
	if view == nil || len(raw) == 0 {
		return
	}

	var snapshot publicViewBatchSnapshot
	if err := json.Unmarshal(raw, &snapshot); err != nil {
		return
	}

	if snapshot.BatchName != "" {
		view.BatchName = snapshot.BatchName
	}
	if snapshot.ModelName != "" {
		view.ModelName = snapshot.ModelName
	}
	if snapshot.ProductType.IsValid() {
		view.ProductType = snapshot.ProductType
		if view.TemplateVariant == "" {
			view.TemplateVariant = ResolvePassportTemplateVariant(snapshot.ProductType, snapshot.MarketRegion)
		}
	}
	if snapshot.TemplateVariant != "" {
		view.TemplateVariant = snapshot.TemplateVariant
	}
	if snapshot.MarketRegion != "" {
		view.MarketRegion = snapshot.MarketRegion
	}
	if snapshot.ManufacturingStartDate != nil {
		view.ManufacturingStartDate = snapshot.ManufacturingStartDate
	}
	if snapshot.ManufacturingEndDate != nil {
		view.ManufacturingEndDate = snapshot.ManufacturingEndDate
	}
	if snapshot.CellSource != "" {
		view.CellSource = snapshot.CellSource
	}
	if snapshot.DomesticValueAdd != 0 {
		view.DomesticValueAdd = snapshot.DomesticValueAdd
	}
	if snapshot.PLICompliant {
		view.PLICompliant = true
	}
	if snapshot.HSNCode != "" {
		view.HSNCode = snapshot.HSNCode
	}
	if snapshot.DVASource != "" {
		view.DVASource = snapshot.DVASource
	}
	if snapshot.BillOfEntryNo != "" {
		view.BillOfEntryNo = snapshot.BillOfEntryNo
	}
	if snapshot.CountryOfOrigin != "" {
		view.CountryOfOrigin = snapshot.CountryOfOrigin
	}
	if snapshot.CustomsDate != nil {
		view.CustomsDate = snapshot.CustomsDate
	}
	if snapshot.Specs != nil {
		view.Specs = buildPublicSpecsView(snapshot.Specs)
	}
	if snapshot.Tenant != nil {
		view.Tenant = buildPublicTenantViewFromSnapshot(snapshot.Tenant)
	}
}

// BuildPartnerView creates a PartnerPassportView from full passport data.
func BuildPartnerView(full *PassportWithSpecs) *PartnerPassportView {
	if full == nil || full.Passport == nil {
		return nil
	}
	p := full.Passport

	publicView := BuildPublicView(full)
	publicView.AccessTier = AccessTierPartner

	view := &PartnerPassportView{
		PublicPassportView: *publicView,

		CurrentOwnerIdentifier: p.CurrentOwnerIdentifier,
		OwnershipHistory:       p.OwnershipHistory,

		ShippedAt:   p.ShippedAt,
		InstalledAt: p.InstalledAt,
		ReturnedAt:  p.ReturnedAt,
		RecycledAt:  p.RecycledAt,

		RepairEvents:      p.RepairEvents,
		ReplacementEvents: p.ReplacementEvents,

		CycleCount:      p.CycleCount,
		LastTemperature: p.LastTemperature,
		LastVoltage:     p.LastVoltage,
		LastTelemetryAt: p.LastTelemetryAt,

		RecyclingStatus: p.RecyclingStatus,
		RecyclerEprID:   p.RecyclerEprID,
		RecyclingDate:   p.RecyclingDate,
	}

	if full.Specs != nil {
		view.DisassemblyGuide = full.Specs.DisassemblyGuide
		view.SupplyChainProvenance = full.Specs.SupplyChainProvenance
	}

	return view
}

// BuildRegulatorView creates a RegulatorPassportView from full passport data + events.
func BuildRegulatorView(full *PassportWithSpecs, events []*PassportEvent) *RegulatorPassportView {
	return &RegulatorPassportView{
		PassportWithSpecs: full,
		Events:            events,
		AccessTier:        AccessTierRegulator,
	}
}

// ApplyDisplayConfigToPublicView removes or redacts spec fields on a
// PublicPassportView based on the display_config access rules.
// This is called after BuildPublicView when a DisplayConfig is available.
func ApplyDisplayConfigToPublicView(view *PublicPassportView, dc DisplayConfig) {
	if view == nil || view.Specs == nil || dc.FieldVisibility == nil {
		return
	}
	tier := view.AccessTier

	if !dc.IsFieldVisible("manufacturer_address", tier) {
		fa := dc.FieldVisibility["manufacturer_address"]
		if fa.Redacted {
			view.Specs.ManufacturerAddress = "[Restricted]"
		} else {
			view.Specs.ManufacturerAddress = ""
		}
	}
}

// ApplyDisplayConfigToPartnerView removes or redacts fields on a
// PartnerPassportView based on the display_config access rules.
func ApplyDisplayConfigToPartnerView(view *PartnerPassportView, dc DisplayConfig) {
	if view == nil || dc.FieldVisibility == nil {
		return
	}
	// Partners inherit the public view — apply the same rules at PARTNER tier
	// The PublicPassportView embedded in the PartnerPassportView will already
	// have the correct AccessTier set to PARTNER, so fields accessible to
	// PARTNER or PUBLIC will remain visible.
	ApplyDisplayConfigToPublicView(&view.PublicPassportView, dc)
}
