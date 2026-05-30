package services

import (
	"encoding/json"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// BatchSnapshot captures immutable batch + tenant compliance data at passport creation time.
type BatchSnapshot struct {
	BatchID                string              `json:"batch_id"`
	BatchName              string              `json:"batch_name"`
	ModelName              string              `json:"model_name,omitempty"`
	ProductType            models.ProductType  `json:"product_type"`
	TemplateVariant        string              `json:"template_variant,omitempty"`
	MarketRegion           models.MarketRegion `json:"market_region"`
	Specs                  models.BatchSpec    `json:"specs"`
	ManufacturingStartDate *time.Time          `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate   *time.Time          `json:"manufacturing_end_date,omitempty"`
	CellSource             string              `json:"cell_source,omitempty"`
	BillOfEntryNo          string              `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin        string              `json:"country_of_origin,omitempty"`
	CustomsDate            *time.Time          `json:"customs_date,omitempty"`
	DomesticValueAdd       float64             `json:"domestic_value_add,omitempty"`
	PLICompliant           bool                `json:"pli_compliant,omitempty"`
	HSNCode                string              `json:"hsn_code,omitempty"`
	BISNumber              string              `json:"bis_number,omitempty"`
	EPRNumber              string              `json:"epr_number,omitempty"`

	// PLI Audit Trail — captures how DVA was verified at passport creation time.
	// DVASource "AUDITED" means a CA-certified value; "ESTIMATED" is system-calculated.
	DVASource               string   `json:"dva_source,omitempty"`
	AuditedDomesticValueAdd *float64 `json:"audited_domestic_value_add,omitempty"`
	PLICertificateURL       string   `json:"pli_certificate_url,omitempty"`

	// Compliance state captured at passport creation (may be 0 if engine not yet finished).
	ComplianceScore float64              `json:"compliance_score"`
	ComplianceGaps  json.RawMessage      `json:"compliance_gaps,omitempty"`

	Tenant     TenantSnapshot `json:"tenant"`
	SnapshotAt time.Time      `json:"snapshot_at"`
}

// TenantSnapshot captures immutable tenant compliance data at creation time.
type TenantSnapshot struct {
	TenantID                          string `json:"tenant_id"`
	CompanyName                       string `json:"company_name"`
	Address                           string `json:"address,omitempty"`
	EPRRegistrationNumber             string `json:"epr_registration_number,omitempty"`
	BISRNumber                        string `json:"bis_r_number,omitempty"`
	IECCode                           string `json:"iec_code,omitempty"`
	EUAuthorizedRepresentativeName    string `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                    string `json:"eu_contact_email,omitempty"`
	MorthManufacturerCode             string `json:"morth_manufacturer_code,omitempty"`
	MorthFactoryCodes                 string `json:"morth_factory_codes,omitempty"`
}

// BuildBatchSnapshot builds a JSON snapshot for embedding in passports.
func BuildBatchSnapshot(batch *models.Batch, tenant *models.Tenant) (json.RawMessage, error) {
	tenant.EnsureBatteryProfile()
	snapshot := BatchSnapshot{
		BatchID:                batch.ID.String(),
		BatchName:              batch.BatchName,
		ModelName:              batch.ModelName,
		ProductType:            batch.ProductType,
		TemplateVariant:        models.ResolvePassportTemplateVariantForBatch(batch),
		MarketRegion:           batch.MarketRegion,
		Specs:                  batch.Specs,
		ManufacturingStartDate: batch.ManufacturingStartDate,
		ManufacturingEndDate:   batch.ManufacturingEndDate,
		CellSource:             batch.Specs.CellSource,
		BillOfEntryNo:          batch.Specs.BillOfEntryNo,
		CountryOfOrigin:        batch.Specs.CountryOfOrigin,
		DomesticValueAdd:       batch.DomesticValueAdd,
		PLICompliant:           batch.PLICompliant,
		HSNCode:                batch.Specs.HSNCode,
		BISNumber:              batch.Specs.BISNumber,
		EPRNumber:              batch.Specs.EPRNumber,
		DVASource:               batch.Specs.DVASource,
		AuditedDomesticValueAdd: batch.Specs.AuditedDomesticValueAdd,
		PLICertificateURL:       batch.Specs.PLICertificateURL,
		ComplianceScore:        batch.ComplianceScore,
		ComplianceGaps:         batch.ComplianceGaps,
		Tenant: TenantSnapshot{
			TenantID:                          tenant.ID.String(),
			CompanyName:                       tenant.CompanyName,
			Address:                           tenant.Address,
			EPRRegistrationNumber:             tenant.BatteryProfile.EPRRegistrationNumber,
			BISRNumber:                        tenant.BatteryProfile.BISRNumber,
			IECCode:                           tenant.BatteryProfile.IECCode,
			EUAuthorizedRepresentativeName:    tenant.BatteryProfile.EUAuthorizedRepresentativeName,
			EUAuthorizedRepresentativeAddress: tenant.BatteryProfile.EUAuthorizedRepresentativeAddress,
			EUContactEmail:                    tenant.BatteryProfile.EUContactEmail,
			MorthManufacturerCode:             tenant.BatteryProfile.MorthManufacturerCode,
			MorthFactoryCodes:                 tenant.BatteryProfile.MorthFactoryCodes,
		},
		SnapshotAt: time.Now(),
	}

	data, err := json.Marshal(snapshot)
	if err != nil {
		return nil, err
	}
	return json.RawMessage(data), nil
}
