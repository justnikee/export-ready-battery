package services

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/anvayalabs/battery-api/internal/ai"
)

// numericUnitRegex matches numbers followed optionally by symbols like V, Ah, kg, etc.
var numericUnitRegex = regexp.MustCompile(`^\s*([0-9,.]+)\s*([a-zA-Z°Ω/]+[0-9]*)\s*$`)

// parseNumericWithUnit parses strings like "48V", "12.5 kg" into float64 value and unit part.
func parseNumericWithUnit(val string) (float64, string, bool) {
	val = strings.TrimSpace(val)
	if val == "" {
		return 0, "", false
	}
	matches := numericUnitRegex.FindStringSubmatch(val)
	if len(matches) != 3 {
		// Try to fallback: match only float if unit was omitted or has special symbols
		numOnlyRegex := regexp.MustCompile(`^\s*([0-9,.]+)\s*$`)
		m := numOnlyRegex.FindStringSubmatch(val)
		if len(m) == 2 {
			cleanNum := strings.ReplaceAll(m[1], ",", "")
			f, err := strconv.ParseFloat(cleanNum, 64)
			if err == nil {
				return f, "", true
			}
		}
		return 0, "", false
	}

	cleanNum := strings.ReplaceAll(matches[1], ",", "")
	f, err := strconv.ParseFloat(cleanNum, 64)
	if err != nil {
		return 0, "", false
	}
	return f, matches[2], true
}

// normalizeChemistry maps known common variants of battery chemistries to standard values.
func normalizeChemistry(chem string) string {
	chem = strings.TrimSpace(chem)
	lower := strings.ToLower(chem)
	switch {
	case strings.Contains(lower, "lifepo4") || strings.Contains(lower, "lfp") || strings.Contains(lower, "iron phosphate"):
		return "LFP"
	case strings.Contains(lower, "nmc811") || strings.Contains(lower, "ncm811"):
		return "NMC811"
	case strings.Contains(lower, "nmc622") || strings.Contains(lower, "ncm622"):
		return "NMC622"
	case strings.Contains(lower, "nmc") || strings.Contains(lower, "ncm") || strings.Contains(lower, "nickel manganese"):
		return "NMC"
	case strings.Contains(lower, "nca") || strings.Contains(lower, "aluminium"):
		return "NCA"
	case strings.Contains(lower, "lco") || strings.Contains(lower, "cobalt oxide"):
		return "LCO"
	case strings.Contains(lower, "lto") || strings.Contains(lower, "titanate"):
		return "LTO"
	case strings.Contains(lower, "lmo") || strings.Contains(lower, "mangan"):
		return "LMO"
	case strings.Contains(lower, "sodium"):
		return "Sodium-ion"
	case strings.Contains(lower, "li-ion") || strings.Contains(lower, "lithium-ion") || strings.Contains(lower, "lithium ion"):
		return "Li-ion"
	default:
		return chem
	}
}

// isValidChemistry returns true if chem is one of the supported standard enums.
func isValidChemistry(chem string) bool {
	valid := map[string]bool{
		"LFP":        true,
		"NMC":        true,
		"NMC811":     true,
		"NMC622":     true,
		"NCA":        true,
		"LCO":        true,
		"LTO":        true,
		"LMO":        true,
		"Sodium-ion": true,
		"Li-ion":     true,
	}
	return valid[chem]
}

// normalizeDatasheet normalizes fields in-place on the parsed struct.
func normalizeDatasheet(r *DatasheetParseResult) {
	if r == nil {
		return
	}

	r.Chemistry = normalizeChemistry(r.Chemistry)

	// Normalize voltage string (e.g. 3.7v -> 3.70V)
	if f, unit, ok := parseNumericWithUnit(r.Voltage); ok {
		u := strings.ToLower(unit)
		if u == "mv" {
			r.Voltage = fmt.Sprintf("%.3fV", f*0.001)
		} else if u == "v" || u == "" {
			r.Voltage = fmt.Sprintf("%.2fV", f)
		}
	}

	// Normalize capacity string (e.g. 5000 mah -> 5.00Ah / 5000.00mAh)
	if f, unit, ok := parseNumericWithUnit(r.Capacity); ok {
		u := strings.ToLower(unit)
		if u == "mah" {
			r.Capacity = fmt.Sprintf("%.3fAh", f*0.001)
		} else if u == "ah" || u == "" {
			r.Capacity = fmt.Sprintf("%.2fAh", f)
		}
	}

	// Normalize weight string (e.g. 500g -> 0.500kg)
	if f, unit, ok := parseNumericWithUnit(r.Weight); ok {
		u := strings.ToLower(unit)
		if u == "g" || u == "grams" {
			r.Weight = fmt.Sprintf("%.3fkg", f*0.001)
		} else if u == "lbs" {
			r.Weight = fmt.Sprintf("%.3fkg", f*0.453592)
		} else if u == "kg" || u == "" {
			r.Weight = fmt.Sprintf("%.3fkg", f)
		}
	}

	ensureCertPresence(r)
}

// ensureCertPresence synchronizes boolean flags and the certifications list.
func ensureCertPresence(r *DatasheetParseResult) {
	certMap := []struct {
		flag bool
		code string
	}{
		{r.UN38_3, "UN38.3"},
		{r.CEMarking, "CE"},
		{r.ULListed, "UL"},
		{r.BISCertified, "BIS"},
		{r.IEC62133, "IEC62133"},
		{r.RoHSCompliant, "RoHS"},
		{r.REACHCompliant, "REACH"},
	}

	for _, item := range certMap {
		if item.flag {
			found := false
			for _, c := range r.Certifications {
				if strings.EqualFold(c, item.code) {
					found = true
					break
				}
			}
			if !found {
				r.Certifications = append(r.Certifications, item.code)
			}
		}
	}

	// Reverse direction: if certs contains the string, mark boolean true
	for _, c := range r.Certifications {
		switch strings.ToUpper(strings.TrimSpace(c)) {
		case "UN38.3", "UN38_3", "UN 38.3":
			r.UN38_3 = true
		case "CE":
			r.CEMarking = true
		case "UL":
			r.ULListed = true
		case "BIS":
			r.BISCertified = true
		case "IEC62133", "IEC-62133", "IEC 62133":
			r.IEC62133 = true
		case "ROHS":
			r.RoHSCompliant = true
		case "REACH":
			r.REACHCompliant = true
		}
	}

	if r.BISNumber != "" {
		r.BISCertified = true
	}
}

// validateDatasheet runs validation rules on the parsed DatasheetParseResult.
func validateDatasheet(r *DatasheetParseResult) []ai.ValidationError {
	var errs []ai.ValidationError
	if r == nil {
		return errs
	}

	// Normalize values in place before validation
	normalizeDatasheet(r)

	// 1. Chemistry Enum check
	if r.Chemistry != "" && !isValidChemistry(r.Chemistry) {
		errs = append(errs, ai.ValidationError{
			Field: "chemistry",
			Msg:   fmt.Sprintf("must be one of: LFP, NMC, NMC811, NMC622, NCA, LCO, LTO, LMO, Sodium-ion, Li-ion (got %q)", r.Chemistry),
		})
		r.Chemistry = ""
	}

	// 2. CountryOfOrigin check (2-letter ISO code)
	if r.CountryOfOrigin != "" {
		c := strings.TrimSpace(r.CountryOfOrigin)
		if len(c) != 2 {
			errs = append(errs, ai.ValidationError{
				Field: "country_of_origin",
				Msg:   fmt.Sprintf("must be 2-letter ISO code (got %q)", r.CountryOfOrigin),
			})
			r.CountryOfOrigin = ""
		}
	}

	// 3. CarbonPerformanceClass check (A-G)
	if r.CarbonPerformanceClass != "" {
		c := strings.ToUpper(strings.TrimSpace(r.CarbonPerformanceClass))
		if len(c) != 1 || c[0] < 'A' || c[0] > 'G' {
			errs = append(errs, ai.ValidationError{
				Field: "carbon_performance_class",
				Msg:   fmt.Sprintf("must be a single letter A-G (got %q)", r.CarbonPerformanceClass),
			})
			r.CarbonPerformanceClass = ""
		}
	}

	// 4. Voltage Sane Range check (0.5V to 1500V)
	if r.Voltage != "" {
		f, _, ok := parseNumericWithUnit(r.Voltage)
		if !ok {
			errs = append(errs, ai.ValidationError{
				Field: "voltage",
				Msg:   fmt.Sprintf("invalid numeric format (got %q)", r.Voltage),
			})
			r.Voltage = ""
		} else if f < 0.5 || f > 1500 {
			errs = append(errs, ai.ValidationError{
				Field: "voltage",
				Msg:   fmt.Sprintf("outside plausible range 0.5V to 1500V (got %.2fV)", f),
			})
			r.Voltage = ""
		}
	}

	// 5. Capacity validation
	if r.Capacity != "" {
		if _, _, ok := parseNumericWithUnit(r.Capacity); !ok {
			errs = append(errs, ai.ValidationError{
				Field: "capacity",
				Msg:   fmt.Sprintf("invalid capacity format (got %q)", r.Capacity),
			})
			r.Capacity = ""
		}
	}

	// 6. Weight validation
	if r.Weight != "" {
		f, _, ok := parseNumericWithUnit(r.Weight)
		if !ok {
			errs = append(errs, ai.ValidationError{
				Field: "weight",
				Msg:   fmt.Sprintf("invalid weight format (got %q)", r.Weight),
			})
			r.Weight = ""
		} else if f <= 0 {
			errs = append(errs, ai.ValidationError{
				Field: "weight",
				Msg:   fmt.Sprintf("must be positive value (got %.3f)", f),
			})
			r.Weight = ""
		}
	}

	return errs
}

// validateNLCreate runs validation rules on NLCreateResult.
func validateNLCreate(r *NLCreateResult) []ai.ValidationError {
	var errs []ai.ValidationError
	if r == nil {
		return errs
	}

	r.Chemistry = normalizeChemistry(r.Chemistry)

	// Chemistry Enum check
	if r.Chemistry != "" && !isValidChemistry(r.Chemistry) {
		errs = append(errs, ai.ValidationError{
			Field: "chemistry",
			Msg:   fmt.Sprintf("must be one of: LFP, NMC, NMC811, NMC622, NCA, LCO, LTO, LMO, Sodium-ion, Li-ion (got %q)", r.Chemistry),
		})
		r.Chemistry = ""
	}

	// market_region: INDIA, EU
	if r.MarketRegion != "" {
		m := strings.ToUpper(strings.TrimSpace(r.MarketRegion))
		if m != "INDIA" && m != "EU" {
			errs = append(errs, ai.ValidationError{
				Field: "market_region",
				Msg:   fmt.Sprintf("must be one of: INDIA, EU (got %q)", r.MarketRegion),
			})
			r.MarketRegion = ""
		} else {
			r.MarketRegion = m
		}
	}

	// battery_category: EV, LMT, INDUSTRIAL, PORTABLE, SLI
	if r.BatteryCategory != "" {
		cat := strings.ToUpper(strings.TrimSpace(r.BatteryCategory))
		if cat != "EV" && cat != "LMT" && cat != "INDUSTRIAL" && cat != "PORTABLE" && cat != "SLI" {
			errs = append(errs, ai.ValidationError{
				Field: "battery_category",
				Msg:   fmt.Sprintf("must be one of: EV, LMT, INDUSTRIAL, PORTABLE, SLI (got %q)", r.BatteryCategory),
			})
			r.BatteryCategory = ""
		} else {
			r.BatteryCategory = cat
		}
	}

	// cell_source: DOMESTIC, IMPORTED
	if r.CellSource != "" {
		src := strings.ToUpper(strings.TrimSpace(r.CellSource))
		if src != "DOMESTIC" && src != "IMPORTED" {
			errs = append(errs, ai.ValidationError{
				Field: "cell_source",
				Msg:   fmt.Sprintf("must be one of: DOMESTIC, IMPORTED (got %q)", r.CellSource),
			})
			r.CellSource = ""
		} else {
			r.CellSource = src
		}
	}

	// carbon_performance_class: A-G
	if r.CarbonPerformanceClass != "" {
		c := strings.ToUpper(strings.TrimSpace(r.CarbonPerformanceClass))
		if len(c) != 1 || c[0] < 'A' || c[0] > 'G' {
			errs = append(errs, ai.ValidationError{
				Field: "carbon_performance_class",
				Msg:   fmt.Sprintf("must be a single letter A-G (got %q)", r.CarbonPerformanceClass),
			})
			r.CarbonPerformanceClass = ""
		} else {
			r.CarbonPerformanceClass = c
		}
	}

	// quantity: must be positive
	if r.Quantity < 0 {
		errs = append(errs, ai.ValidationError{
			Field: "quantity",
			Msg:   "cannot be negative",
		})
		r.Quantity = 0
	}

	return errs
}

// validateDatasheetJSON parses and validates raw JSON text.
func validateDatasheetJSON(raw []byte) []ai.ValidationError {
	var result DatasheetParseResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return []ai.ValidationError{{Field: "json", Msg: fmt.Sprintf("invalid JSON payload: %v", err)}}
	}
	return validateDatasheet(&result)
}

// validateNLCreateJSON parses and validates raw JSON text.
func validateNLCreateJSON(raw []byte) []ai.ValidationError {
	var result NLCreateResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return []ai.ValidationError{{Field: "json", Msg: fmt.Sprintf("invalid JSON payload: %v", err)}}
	}
	return validateNLCreate(&result)
}
