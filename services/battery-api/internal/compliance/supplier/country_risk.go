// Package supplier provides due-diligence compliance checks for suppliers.
package supplier

// CountryRiskTier maps ISO country codes to Basel AML + USGS conflict-mineral risk tiers.
// Tier 1 = low risk, 4 = extreme risk (sanctions, conflict minerals, weak governance).
type CountryRiskTier int

const (
	TierLow     CountryRiskTier = 1
	TierMedium  CountryRiskTier = 2
	TierHigh    CountryRiskTier = 3
	TierExtreme CountryRiskTier = 4
)

// CountryRiskTierMap is the seed data. In production this should be loaded from
// an admin-managed table or external feed (Basel AML Index, USGS Mineral Commodity
// Summaries, etc.).
var CountryRiskTierMap = map[string]CountryRiskTier{
	// Tier 4 — Extreme risk (conflict minerals, sanctions, severe governance gaps)
	"CD": TierExtreme, "AF": TierExtreme, "MM": TierExtreme, "SY": TierExtreme,
	"SD": TierExtreme, "SS": TierExtreme, "YE": TierExtreme, "SO": TierExtreme,
	"LR": TierExtreme, "CF": TierExtreme, "ML": TierExtreme, "BF": TierExtreme,
	"TD": TierExtreme, "VE": TierExtreme, "KP": TierExtreme, "IR": TierExtreme,
	"BY": TierExtreme, "RU": TierExtreme, "ZW": TierExtreme, "GN": TierExtreme,

	// Tier 3 — High risk (significant compliance concerns)
	"CN": TierHigh, "CG": TierHigh, "GQ": TierHigh, "AO": TierHigh,
	"BI": TierHigh, "RW": TierHigh, "UG": TierHigh, "TZ": TierHigh,
	"KE": TierHigh, "ZM": TierHigh, "ID": TierHigh, "PH": TierHigh,
	"PK": TierHigh, "BD": TierHigh, "KH": TierHigh, "LA": TierHigh,
	"VN": TierHigh, "KZ": TierHigh, "TM": TierHigh, "UZ": TierHigh,
	"TJ": TierHigh, "KG": TierHigh, "AZ": TierHigh, "AM": TierHigh,
	"GE": TierHigh, "MD": TierHigh, "UA": TierHigh, "BA": TierHigh,
	"AL": TierHigh, "MK": TierHigh, "ME": TierHigh, "RS": TierHigh,
	"TR": TierHigh, "EG": TierHigh, "LY": TierHigh, "IQ": TierHigh,
	"LB": TierHigh, "PS": TierHigh, "JO": TierHigh, "SA": TierHigh,
	"AE": TierHigh, "QA": TierHigh, "BH": TierHigh, "KW": TierHigh,
	"OM": TierHigh, "MN": TierHigh, "PG": TierHigh, "SB": TierHigh,
	"FJ": TierHigh, "BT": TierHigh, "NP": TierHigh, "LK": TierHigh,
	"MV": TierHigh, "MX": TierHigh, "BR": TierHigh, "CO": TierHigh,
	"PE": TierHigh, "EC": TierHigh, "BO": TierHigh, "PY": TierHigh,
	"GT": TierHigh, "HN": TierHigh, "SV": TierHigh, "NI": TierHigh,
	"HT": TierHigh, "DO": TierHigh, "CU": TierHigh, "JM": TierHigh,
	"TT": TierHigh, "BB": TierHigh, "GD": TierHigh, "LC": TierHigh,
	"VC": TierHigh, "AG": TierHigh, "DM": TierHigh, "KN": TierHigh,
	"BS": TierHigh, "KY": TierHigh, "TC": TierHigh, "VG": TierHigh,
	"AI": TierHigh, "MS": TierHigh, "BM": TierHigh,

	// Tier 2 — Medium risk (moderate governance, emerging markets)
	"IN": TierMedium, "ZA": TierMedium, "TH": TierMedium, "MY": TierMedium,
	"CL": TierMedium, "AR": TierMedium, "UY": TierMedium, "GY": TierMedium,
	"SR": TierMedium, "CR": TierMedium, "PA": TierMedium, "BZ": TierMedium,
	"PR": TierMedium, "TW": TierMedium, "KR": TierMedium, "JP": TierMedium,
	"NZ": TierMedium, "AU": TierMedium, "CA": TierMedium, "US": TierMedium,
	"GB": TierMedium, "FR": TierMedium, "DE": TierMedium, "IT": TierMedium,
	"ES": TierMedium, "PT": TierMedium, "NL": TierMedium, "BE": TierMedium,
	"AT": TierMedium, "SE": TierMedium, "DK": TierMedium, "FI": TierMedium,
	"EE": TierMedium, "LV": TierMedium, "LT": TierMedium, "PL": TierMedium,
	"CZ": TierMedium, "SK": TierMedium, "HU": TierMedium, "SI": TierMedium,
	"HR": TierMedium, "RO": TierMedium, "BG": TierMedium, "GR": TierMedium,
	"IE": TierMedium, "LU": TierMedium, "MT": TierMedium, "CY": TierMedium,
	"IS": TierMedium, "NO": TierMedium, "CH": TierMedium, "LI": TierMedium,
	"AD": TierMedium, "MC": TierMedium, "SM": TierMedium, "VA": TierMedium,
	"SG": TierMedium, "HK": TierMedium, "MO": TierMedium, "BN": TierMedium,
	"IL": TierMedium, "MG": TierMedium, "MZ": TierMedium, "BW": TierMedium,
	"NA": TierMedium, "SZ": TierMedium, "LS": TierMedium, "SZ2": TierMedium,
	"ET": TierMedium, "ER": TierMedium, "DJ": TierMedium, "KM": TierMedium,
	"SC": TierMedium, "MU": TierMedium, "RE": TierMedium, "YT": TierMedium,
	"MW": TierMedium, "ZM2": TierMedium, "ZW2": TierMedium, "AO2": TierMedium,
	"GA": TierMedium, "GQ2": TierMedium, "ST": TierMedium, "CM": TierMedium,
	"NG": TierMedium, "BJ": TierMedium, "TG": TierMedium, "GH": TierMedium,
	"CI": TierMedium, "SL": TierMedium, "GM": TierMedium, "GW": TierMedium,
	"SN": TierMedium, "MR": TierMedium, "NE": TierMedium, "DZ": TierMedium,
	"MA": TierMedium, "TN": TierMedium, "MR2": TierMedium, "EH": TierMedium,
	"GW2": TierMedium, "CV": TierMedium, "GM2": TierMedium,
}

// GetCountryRiskTier returns the risk tier for a country code.
// Unknown countries default to TierMedium (2) — safe middle ground.
func GetCountryRiskTier(countryCode string) CountryRiskTier {
	if tier, ok := CountryRiskTierMap[countryCode]; ok {
		return tier
	}
	return TierMedium
}
