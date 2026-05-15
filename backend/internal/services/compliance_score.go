package services

import "anvayalabs-battery/internal/models"

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
	s := batch.Specs
	attrs := []models.ComplianceAttribute{
		// General Information (Art 2, Art 7)
		{ID: "EU-1", Name: "Battery Category", Category: "General", RegRef: "Art 2(1)", Filled: s.BatteryCategory != ""},
		{ID: "EU-2", Name: "Manufacturer Name", Category: "General", RegRef: "Art 38(7)", Filled: s.Manufacturer != ""},
		{ID: "EU-3", Name: "Manufacturer Address", Category: "General", RegRef: "Art 38(7)", Filled: s.ManufacturerAddress != ""},
		{ID: "EU-4", Name: "Manufacturing Date", Category: "General", RegRef: "Art 38(7)", Filled: batch.ManufacturingStartDate != nil},
		{ID: "EU-5", Name: "Manufacturing Location", Category: "General", RegRef: "Art 38(7)", Filled: s.CountryOfOrigin != ""},
		{ID: "EU-6", Name: "Battery Weight", Category: "General", RegRef: "Art 38(7)", Filled: s.Weight != ""},
		{ID: "EU-7", Name: "Battery Chemistry", Category: "General", RegRef: "Annex IV", Filled: s.Chemistry != ""},
		{ID: "EU-8", Name: "Nominal Voltage", Category: "General", RegRef: "Annex IV", Filled: s.NominalVoltage != ""},
		{ID: "EU-9", Name: "Nominal Capacity", Category: "General", RegRef: "Annex IV", Filled: s.Capacity != ""},
		{ID: "EU-10", Name: "Model Name", Category: "General", RegRef: "Art 38(7)", Filled: batch.ModelName != ""},

		// EU Representative (Art 38)
		{ID: "EU-11", Name: "EU Representative Name", Category: "EU Rep", RegRef: "Art 38", Filled: s.EURepresentative != ""},
		{ID: "EU-12", Name: "EU Representative Email", Category: "EU Rep", RegRef: "Art 38", Filled: s.EURepresentativeEmail != ""},
		{ID: "EU-13", Name: "EU Auth Rep Name (Tenant)", Category: "EU Rep", RegRef: "Art 38", Filled: tenant != nil && tenant.BatteryProfile.EUAuthorizedRepresentativeName != ""},
		{ID: "EU-14", Name: "EU Auth Rep Address (Tenant)", Category: "EU Rep", RegRef: "Art 38", Filled: tenant != nil && tenant.BatteryProfile.EUAuthorizedRepresentativeAddress != ""},
		{ID: "EU-15", Name: "EU Contact Email (Tenant)", Category: "EU Rep", RegRef: "Art 38", Filled: tenant != nil && tenant.BatteryProfile.EUContactEmail != ""},

		// Performance & Durability (Annex IV)
		{ID: "EU-16", Name: "Expected Lifetime Cycles", Category: "Performance", RegRef: "Annex IV", Filled: s.ExpectedLifetimeCycles != nil && *s.ExpectedLifetimeCycles > 0},
		{ID: "EU-17", Name: "Warranty Duration", Category: "Performance", RegRef: "Art 10", Filled: s.WarrantyMonths != nil && *s.WarrantyMonths > 0},
		{ID: "EU-18", Name: "Rated Capacity (Ah)", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.RatedCapacityAh != nil},
		{ID: "EU-19", Name: "Rated Capacity (Wh)", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.RatedCapacityWh != nil},
		{ID: "EU-20", Name: "Rated Voltage", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.RatedVoltage != nil},
		{ID: "EU-21", Name: "Min Voltage", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.MinVoltage != nil},
		{ID: "EU-22", Name: "Max Voltage", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.MaxVoltage != nil},
		{ID: "EU-23", Name: "Internal Resistance", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.InternalResistance != nil},
		{ID: "EU-24", Name: "Max Charge C-Rate", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.MaxChargeCRate != nil},
		{ID: "EU-25", Name: "Max Discharge C-Rate", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.MaxDischargeCRate != nil},
		{ID: "EU-26", Name: "Operating Temp Min", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.OperatingTempMin != nil},
		{ID: "EU-27", Name: "Operating Temp Max", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.OperatingTempMax != nil},
		{ID: "EU-28", Name: "Capacity at 80% SoH", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.CapacityAt80SoH != nil},
		{ID: "EU-29", Name: "Round-Trip Efficiency", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.RoundTripEffPct != nil},
		{ID: "EU-30", Name: "Cathode Material", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.CathodeMaterial != ""},
		{ID: "EU-31", Name: "Anode Material", Category: "Performance", RegRef: "Annex IV", Filled: s.PerformanceSpec != nil && s.PerformanceSpec.AnodeMaterial != ""},

		// Material Composition (Art 8)
		{ID: "EU-32", Name: "Cobalt Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.CobaltPct > 0},
		{ID: "EU-33", Name: "Lithium Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.LithiumPct > 0},
		{ID: "EU-34", Name: "Nickel Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.NickelPct > 0},
		{ID: "EU-35", Name: "Manganese Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.ManganesePct > 0},
		{ID: "EU-36", Name: "Graphite Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.GraphitePct > 0},
		{ID: "EU-37", Name: "Lead Content %", Category: "Materials", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.LeadPct >= 0},

		// Recycled Content (Art 8)
		{ID: "EU-38", Name: "Recycled Content (Overall %)", Category: "Recycled", RegRef: "Art 8", Filled: s.RecycledContentPct != nil && *s.RecycledContentPct > 0},
		{ID: "EU-39", Name: "Recycled Cobalt %", Category: "Recycled", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.RecycledCobaltPct > 0},
		{ID: "EU-40", Name: "Recycled Lithium %", Category: "Recycled", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.RecycledLithiumPct > 0},
		{ID: "EU-41", Name: "Recycled Nickel %", Category: "Recycled", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.RecycledNickelPct > 0},
		{ID: "EU-42", Name: "Recycled Lead %", Category: "Recycled", RegRef: "Art 8", Filled: s.MaterialComposition != nil && s.MaterialComposition.RecycledLeadPct > 0},

		// Carbon Footprint (Art 7)
		{ID: "EU-43", Name: "Carbon Footprint Value", Category: "Carbon", RegRef: "Art 7", Filled: s.CarbonFootprint != ""},
		{ID: "EU-44", Name: "Carbon Calculator Result", Category: "Carbon", RegRef: "Art 7", Filled: len(batch.CarbonFootprintResult) > 0},
		{ID: "EU-45", Name: "Carbon Performance Class", Category: "Carbon", RegRef: "Art 7(3)", Filled: len(batch.CarbonFootprintResult) > 0}, // Class derived from result

		// Certifications (Art 17)
		{ID: "EU-46", Name: "Certifications List", Category: "Certifications", RegRef: "Art 17", Filled: len(s.Certifications) > 0},

		// Hazardous Substances (Art 6, REACH)
		{ID: "EU-47", Name: "Hazardous Substances Declaration", Category: "Hazardous", RegRef: "Art 6", Filled: s.HazardousSubstances != nil && s.HazardousSubstances.Declaration != ""},
		{ID: "EU-48", Name: "Lead Presence Declared", Category: "Hazardous", RegRef: "Art 6", Filled: s.HazardousSubstances != nil},
		{ID: "EU-49", Name: "Mercury Presence Declared", Category: "Hazardous", RegRef: "Art 6", Filled: s.HazardousSubstances != nil},
		{ID: "EU-50", Name: "Cadmium Presence Declared", Category: "Hazardous", RegRef: "Art 6", Filled: s.HazardousSubstances != nil},

		// Supply Chain (Art 39, Art 48)
		{ID: "EU-51", Name: "Due Diligence Policy URL", Category: "Supply Chain", RegRef: "Art 39", Filled: s.SupplyChainProvenance != nil && s.SupplyChainProvenance.DueDiligencePolicy != ""},
		{ID: "EU-52", Name: "Supply Chain Tiers Declared", Category: "Supply Chain", RegRef: "Art 48", Filled: s.SupplyChainProvenance != nil && len(s.SupplyChainProvenance.Tiers) > 0},

		// Disassembly & Recycling (Art 57)
		{ID: "EU-53", Name: "Disassembly Guide URL", Category: "Disassembly", RegRef: "Art 57", Filled: s.DisassemblyGuide != nil && s.DisassemblyGuide.DocumentURL != ""},
		{ID: "EU-54", Name: "Disassembly Steps", Category: "Disassembly", RegRef: "Art 57", Filled: s.DisassemblyGuide != nil && len(s.DisassemblyGuide.Steps) > 0},
		{ID: "EU-55", Name: "Safety Guidelines", Category: "Disassembly", RegRef: "Art 57", Filled: s.DisassemblyGuide != nil && len(s.DisassemblyGuide.SafetyGuidelines) > 0},
		{ID: "EU-56", Name: "Recycler URL", Category: "Disassembly", RegRef: "Art 57", Filled: s.DisassemblyGuide != nil && s.DisassemblyGuide.RecyclerURL != ""},
	}

	return attrs
}
