package services

import "github.com/anvayalabs/textile-api/internal/models"

// CalculateComplianceScore evaluates a batch against the EU BatteryPass
// consortium's 80-attribute checklist and returns coverage percentage.
func CalculateComplianceScore(batch *models.Batch, tenant *models.Tenant) models.ComplianceScoreResult {
	attrs := buildAttributeChecklist(batch, tenant)

	filled := 0
	for _, a := range attrs {
		if a.Filled {
			filled++
		}
	}

	score := 0.0
	if len(attrs) > 0 {
		score = float64(filled) / float64(len(attrs)) * 100
	}

	return models.ComplianceScoreResult{
		Score:      score,
		Filled:     filled,
		Total:      len(attrs),
		Attributes: attrs,
	}
}

func buildAttributeChecklist(batch *models.Batch, tenant *models.Tenant) []models.ComplianceAttribute {
	return buildTextileAttributeChecklist(batch, tenant)
}

func buildTextileAttributeChecklist(batch *models.Batch, tenant *models.Tenant) []models.ComplianceAttribute {
	s := batch.Specs
	return []models.ComplianceAttribute{
		// General Information
		{ID: "TX-1", Name: "Material Profile", Category: "General", RegRef: "ESPR Art. 7", Filled: s.MaterialProfile != ""},
		{ID: "TX-2", Name: "Manufacturer Address", Category: "General", RegRef: "ESPR Art. 7", Filled: s.ManufacturerAddress != ""},
		{ID: "TX-3", Name: "Production Stage", Category: "General", RegRef: "ESPR Art. 7", Filled: s.ProductionStage != ""},
		{ID: "TX-4", Name: "GSM", Category: "General", RegRef: "QCO", Filled: s.GSM > 0},
		{ID: "TX-5", Name: "Model Name", Category: "General", RegRef: "ESPR Art. 7", Filled: batch.ModelName != ""},

		// Fiber Composition (Legal Metrology / ESPR)
		{ID: "TX-6", Name: "Fiber Composition Declared", Category: "Composition", RegRef: "Legal Metrology", Filled: s.FiberComposition != nil},
		{ID: "TX-7", Name: "Fiber Composition Total 100%", Category: "Composition", RegRef: "Legal Metrology", Filled: s.FiberComposition != nil && fiberTotalIsValid(s.FiberComposition)},

		// Durability & Sustainability
		{ID: "TX-8", Name: "Expected Lifetime (Washes)", Category: "Durability", RegRef: "ESPR Art. 7", Filled: s.ExpectedLifetimeWashes != nil && *s.ExpectedLifetimeWashes > 0},
		{ID: "TX-9", Name: "Biodegradable %", Category: "Sustainability", RegRef: "ESPR Art. 7", Filled: s.BiodegradablePct != nil && *s.BiodegradablePct >= 0},

		// Environmental Parameters
		{ID: "TX-10", Name: "Water Usage (L/kg)", Category: "Environment", RegRef: "ESPR Art. 9", Filled: s.WaterUsageLiters > 0},
		{ID: "TX-11", Name: "Energy Usage (kWh/kg)", Category: "Environment", RegRef: "ESPR Art. 9", Filled: s.EnergyUsageKWh > 0},
		{ID: "TX-12", Name: "Carbon Footprint Result", Category: "Environment", RegRef: "ESPR Art. 9", Filled: len(batch.CarbonFootprintResult) > 0},

		// Chemical Compliance
		{ID: "TX-13", Name: "ZDHC MRSL Level", Category: "Chemical", RegRef: "ZDHC MRSL", Filled: s.ChemicalComplianceZDHC != nil && s.ChemicalComplianceZDHC.ZDHCLevel != "" && s.ChemicalComplianceZDHC.ZDHCLevel != "NA"},
		{ID: "TX-14", Name: "MRSL Tested", Category: "Chemical", RegRef: "ZDHC MRSL", Filled: s.ChemicalComplianceZDHC != nil && s.ChemicalComplianceZDHC.MRSLTested},

		// Labor Compliance
		{ID: "TX-15", Name: "Labor Compliance Declared", Category: "Labor", RegRef: "SA8000/BSCI", Filled: s.LaborCompliance != nil},
		{ID: "TX-16", Name: "Labor Certification", Category: "Labor", RegRef: "SA8000/BSCI", Filled: s.LaborCompliance != nil && (s.LaborCompliance.SA8000Certified || s.LaborCompliance.BSCIAudited || s.LaborCompliance.SedexMember || s.LaborCompliance.FairTradeCertified)},
	}
}

func fiberTotalIsValid(fc *models.FiberComposition) bool {
	if fc == nil {
		return false
	}
	total := fc.CottonPct + fc.PolyesterPct + fc.WoolPct + fc.SilkPct +
		fc.LinenPct + fc.ViscosePct + fc.NylonPct + fc.AcrylicPct +
		fc.HempPct + fc.OtherPct
	return total >= 99.0 && total <= 101.0
}


