package models

import (
	"encoding/json"
	"fmt"
)

// StoredCarbonFootprintDescription formats the saved calculator result without
// recalculating it. Live and issued passport views must use the same value.
func StoredCarbonFootprintDescription(raw json.RawMessage) string {
	var result struct {
		TotalKgCO2e  float64 `json:"total_kg_co2e"`
		PerKWhKgCO2e float64 `json:"per_kwh_kg_co2e"`
	}
	if json.Unmarshal(raw, &result) != nil || result.TotalKgCO2e <= 0 {
		return ""
	}
	return fmt.Sprintf("%.2f kg CO₂e (%.3f kg CO₂e/kWh)", result.TotalKgCO2e, result.PerKWhKgCO2e)
}
