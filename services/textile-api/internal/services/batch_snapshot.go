package services

import (
	"encoding/json"
	"time"

	"github.com/anvayalabs/textile-api/internal/models"
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
	CountryOfOrigin        string              `json:"country_of_origin,omitempty"`

	// Compliance state captured at passport creation (may be 0 if engine not yet finished).
	ComplianceScore float64         `json:"compliance_score"`
	ComplianceGaps  json.RawMessage `json:"compliance_gaps,omitempty"`

	Tenant     TenantSnapshot `json:"tenant"`
	SnapshotAt time.Time      `json:"snapshot_at"`
}

// TenantSnapshot captures immutable tenant compliance data at creation time.
type TenantSnapshot struct {
	TenantID               string `json:"tenant_id"`
	CompanyName            string `json:"company_name"`
	Address                string `json:"address,omitempty"`
	TextileFacilityType    string `json:"textile_facility_type,omitempty"`
	TextileSupplyChainTier string `json:"textile_supply_chain_tier,omitempty"`
}

// BuildBatchSnapshot builds a JSON snapshot for embedding in passports.
func BuildBatchSnapshot(batch *models.Batch, tenant *models.Tenant) (json.RawMessage, error) {
	tenant.EnsureTextileProfile()
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

		ComplianceScore:        batch.ComplianceScore,
		ComplianceGaps:         batch.ComplianceGaps,
		Tenant: TenantSnapshot{
			TenantID:               tenant.ID.String(),
			CompanyName:            tenant.CompanyName,
			Address:                tenant.Address,
			TextileFacilityType:    tenant.TextileProfile.FacilityType,
			TextileSupplyChainTier: tenant.TextileProfile.SupplyChainTier,
		},
		SnapshotAt: time.Now(),
	}

	data, err := json.Marshal(snapshot)
	if err != nil {
		return nil, err
	}
	return json.RawMessage(data), nil
}
