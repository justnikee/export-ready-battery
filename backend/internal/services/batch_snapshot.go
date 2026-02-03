package services

import (
	"encoding/json"
	"time"

	"exportready-battery/internal/models"
)

// BatchSnapshot captures immutable batch + tenant compliance data at passport creation time.
type BatchSnapshot struct {
	BatchID                 string               `json:"batch_id"`
	BatchName               string               `json:"batch_name"`
	ModelName               string               `json:"model_name,omitempty"`
	MarketRegion            models.MarketRegion  `json:"market_region"`
	Specs                   models.BatchSpec     `json:"specs"`
	ManufacturingStartDate  *time.Time           `json:"manufacturing_start_date,omitempty"`
	ManufacturingEndDate    *time.Time           `json:"manufacturing_end_date,omitempty"`
	CellSource              string               `json:"cell_source,omitempty"`
	BillOfEntryNo           string               `json:"bill_of_entry_no,omitempty"`
	CountryOfOrigin         string               `json:"country_of_origin,omitempty"`
	CustomsDate             *time.Time           `json:"customs_date,omitempty"`
	DomesticValueAdd        float64              `json:"domestic_value_add,omitempty"`
	PLICompliant            bool                 `json:"pli_compliant,omitempty"`
	HSNCode                 string               `json:"hsn_code,omitempty"`
	BISNumber               string               `json:"bis_number,omitempty"`
	EPRNumber               string               `json:"epr_number,omitempty"`
	Tenant                  TenantSnapshot       `json:"tenant"`
	SnapshotAt              time.Time            `json:"snapshot_at"`
}

// TenantSnapshot captures immutable tenant compliance data at creation time.
type TenantSnapshot struct {
	TenantID                        string `json:"tenant_id"`
	CompanyName                     string `json:"company_name"`
	Address                         string `json:"address,omitempty"`
	EPRRegistrationNumber           string `json:"epr_registration_number,omitempty"`
	BISRNumber                      string `json:"bis_r_number,omitempty"`
	IECCode                         string `json:"iec_code,omitempty"`
	EUAuthorizedRepresentativeName  string `json:"eu_authorized_representative_name,omitempty"`
	EUAuthorizedRepresentativeAddress string `json:"eu_authorized_representative_address,omitempty"`
	EUContactEmail                  string `json:"eu_contact_email,omitempty"`
}

// BuildBatchSnapshot builds a JSON snapshot for embedding in passports.
func BuildBatchSnapshot(batch *models.Batch, tenant *models.Tenant) (json.RawMessage, error) {
	snapshot := BatchSnapshot{
		BatchID:                batch.ID.String(),
		BatchName:              batch.BatchName,
		ModelName:              batch.ModelName,
		MarketRegion:           batch.MarketRegion,
		Specs:                  batch.Specs,
		ManufacturingStartDate: batch.ManufacturingStartDate,
		ManufacturingEndDate:   batch.ManufacturingEndDate,
		CellSource:             batch.CellSource,
		BillOfEntryNo:          batch.BillOfEntryNo,
		CountryOfOrigin:        batch.CountryOfOrigin,
		CustomsDate:            batch.CustomsDate,
		DomesticValueAdd:       batch.DomesticValueAdd,
		PLICompliant:           batch.PLICompliant,
		HSNCode:                batch.HSNCode,
		BISNumber:              batch.BISNumber,
		EPRNumber:              batch.EPRNumber,
		Tenant: TenantSnapshot{
			TenantID:                         tenant.ID.String(),
			CompanyName:                      tenant.CompanyName,
			Address:                          tenant.Address,
			EPRRegistrationNumber:            tenant.EPRRegistrationNumber,
			BISRNumber:                       tenant.BISRNumber,
			IECCode:                          tenant.IECCode,
			EUAuthorizedRepresentativeName:   tenant.EUAuthorizedRepresentativeName,
			EUAuthorizedRepresentativeAddress: tenant.EUAuthorizedRepresentativeAddress,
			EUContactEmail:                   tenant.EUContactEmail,
		},
		SnapshotAt: time.Now(),
	}

	data, err := json.Marshal(snapshot)
	if err != nil {
		return nil, err
	}
	return json.RawMessage(data), nil
}
