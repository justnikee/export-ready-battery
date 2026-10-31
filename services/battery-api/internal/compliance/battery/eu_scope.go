package battery

import (
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// Chapter VII due diligence (Arts 48–52) applies from 18 August 2027
// (Regulation (EU) 2025/1561). Art. 11 is removability, not due diligence.
const (
	euArt48Ref = "EU 2023/1542 Ch. VII / Art. 48 — Battery due diligence"
)

var dueDiligenceInForceAt = time.Date(2027, 8, 18, 0, 0, 0, 0, time.UTC)

func dueDiligenceInForce(now time.Time) bool {
	return !now.Before(dueDiligenceInForceAt)
}

// art7Applies reports whether Article 7 carbon-footprint duties can apply
// to this category. Clocks have not started (methodology/format acts pending);
// callers must not ERROR-block activation in 2026 even when this is true.
// Portable and SLI are outside Art. 7. Industrial applies only above 2 kWh.
func art7Applies(cat models.BatteryCategory, capacity string) bool {
	switch cat {
	case models.BatteryCategoryEV, models.BatteryCategoryLMT:
		return true
	case models.BatteryCategoryIndustrial:
		kwh, ok := parseCapacityKWh(capacity)
		if !ok {
			return true // fail closed: treat as in-scope if we cannot parse
		}
		return kwh > 2
	default:
		return false
	}
}

// art8Applies reports whether Article 8 recycled-content duties can apply.
// Portable is out. Industrial only >2 kWh. LMT is in scope on later clocks
// (documentation 18 Aug 2033, minima 18 Aug 2036).
func art8Applies(cat models.BatteryCategory, capacity string) bool {
	switch cat {
	case models.BatteryCategoryPortable, "":
		return false
	case models.BatteryCategoryEV, models.BatteryCategoryLMT, models.BatteryCategorySLI:
		return true
	case models.BatteryCategoryIndustrial:
		kwh, ok := parseCapacityKWh(capacity)
		if !ok {
			return true
		}
		return kwh > 2
	default:
		return false
	}
}

func art8DisclosureDate(cat models.BatteryCategory) string {
	if cat == models.BatteryCategoryLMT {
		return "18 Aug 2033"
	}
	return "18 Aug 2028"
}

func art8MinimaDate(cat models.BatteryCategory) string {
	if cat == models.BatteryCategoryLMT {
		return "18 Aug 2036"
	}
	return "18 Aug 2031"
}

var capacityNumber = regexp.MustCompile(`(?i)([0-9]+(?:\.[0-9]+)?)`)

// parseCapacityKWh reads a specs.capacity string. Wh is converted; Ah/mAh
// cannot be converted without voltage so ok=false.
func parseCapacityKWh(raw string) (float64, bool) {
	s := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(raw), " ", ""))
	if s == "" {
		return 0, false
	}
	m := capacityNumber.FindString(s)
	if m == "" {
		return 0, false
	}
	n, err := strconv.ParseFloat(m, 64)
	if err != nil || n <= 0 {
		return 0, false
	}
	switch {
	case strings.Contains(s, "kwh"):
		return n, true
	case strings.Contains(s, "wh"):
		return n / 1000, true
	default:
		return 0, false
	}
}

// tenantEstablishedInEUEEA is a best-effort read of the company address.
// Empty / unrecognised → false (fail closed: AR required).
func tenantEstablishedInEUEEA(tenant *models.Tenant) bool {
	if tenant == nil {
		return false
	}
	hay := strings.ToUpper(tenant.Address)
	if hay == "" {
		return false
	}
	for _, token := range euEEAAddressTokens {
		if strings.Contains(hay, token) {
			return true
		}
	}
	return false
}

// Tokens matched as substrings of Tenant.Address (uppercased). ISO-2 codes
// are wrapped with non-letter boundaries via the comma/space-padded forms
// factories actually type ("Berlin, DE", "DE, Germany").
var euEEAAddressTokens = []string{
	"AUSTRIA", "BELGIUM", "BULGARIA", "CROATIA", "CYPRUS", "CZECH",
	"DENMARK", "ESTONIA", "FINLAND", "FRANCE", "GERMANY", "GREECE",
	"HUNGARY", "IRELAND", "ITALY", "LATVIA", "LITHUANIA", "LUXEMBOURG",
	"MALTA", "NETHERLANDS", "POLAND", "PORTUGAL", "ROMANIA", "SLOVAK",
	"SLOVENIA", "SPAIN", "SWEDEN",
	"ICELAND", "LIECHTENSTEIN", "NORWAY",
	", AT", ", BE", ", BG", ", HR", ", CY", ", CZ", ", DK", ", EE",
	", FI", ", FR", ", DE", ", GR", ", EL", ", HU", ", IE", ", IT",
	", LV", ", LT", ", LU", ", MT", ", NL", ", PL", ", PT", ", RO",
	", SK", ", SI", ", ES", ", SE", ", IS", ", LI", ", NO",
	" AT,", " BE,", " DE,", " FR,", " IT,", " ES,", " NL,", " SE,",
}
