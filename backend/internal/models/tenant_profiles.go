package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// BatteryTenantProfile holds battery-specific tenant data stored in battery_tenant_profiles.
type BatteryTenantProfile struct {
	TenantID                       uuid.UUID `json:"tenant_id"`
	EPRRegistrationNumber          string    `json:"epr_registration_number,omitempty"`
	BISRNumber                     string    `json:"bis_r_number,omitempty"`
	IECCode                        string    `json:"iec_code,omitempty"`
	MorthManufacturerCode          string    `json:"morth_manufacturer_code,omitempty"`
	MorthFactoryCodes              string    `json:"morth_factory_codes,omitempty"`
	EPRCertificatePath             string    `json:"epr_certificate_path,omitempty"`
	BISCertificatePath             string    `json:"bis_certificate_path,omitempty"`
	PLICertificatePath             string    `json:"pli_certificate_path,omitempty"`
	EPRStatus                      string    `json:"epr_status,omitempty"`
	BISStatus                      string    `json:"bis_status,omitempty"`
	PLIStatus                      string    `json:"pli_status,omitempty"`
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                    string `json:"eu_contact_email,omitempty"`
	CreatedAt                      time.Time `json:"created_at"`
	UpdatedAt                      time.Time `json:"updated_at"`
}

// TextileTenantProfile holds textile-specific tenant data stored in textile_tenant_profiles.
type TextileTenantProfile struct {
	TenantID           uuid.UUID       `json:"tenant_id"`
	FacilityType       string          `json:"facility_type,omitempty"`
	SupplyChainTier    string          `json:"supply_chain_tier,omitempty"`
	PrimaryMarkets     json.RawMessage `json:"primary_markets,omitempty"`
	DefaultFiberTypes  json.RawMessage `json:"default_fiber_types,omitempty"`
	Certifications     json.RawMessage `json:"certifications,omitempty"`
	ComplianceDefaults json.RawMessage `json:"compliance_defaults,omitempty"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}
