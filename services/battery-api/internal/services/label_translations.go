package services

// LabelTranslations holds translated strings for the PDF label sheet.
// Only a handful of strings on the physical sticker need translation;
// most values (serial numbers, EPR codes, voltages) are universal.
type LabelTranslations struct {
	DefaultChemistry string // fallback when chemistry is empty
	CellDomestic     string // "DOMESTIC" badge text
	CellImported     string // "IMPORTED" badge text
}

// SupportedLabelLang is the set of languages supported for PDF labels.
var SupportedLabelLangs = map[string]bool{
	"en": true,
	"fr": true,
	"de": true,
}

// labelTranslationMap provides translations per language code.
var labelTranslationMap = map[string]LabelTranslations{
	"en": {
		DefaultChemistry: "Li-ion Battery",
		CellDomestic:     "DOMESTIC",
		CellImported:     "IMPORTED",
	},
	"fr": {
		DefaultChemistry: "Batterie Li-ion",
		CellDomestic:     "NATIONAL",
		CellImported:     "IMPORTÉ",
	},
	"de": {
		DefaultChemistry: "Li-Ionen-Batterie",
		CellDomestic:     "INLAND",
		CellImported:     "IMPORTIERT",
	},
}

// GetLabelTranslations returns translations for the given language code.
// Falls back to English for unsupported languages.
func GetLabelTranslations(lang string) LabelTranslations {
	if t, ok := labelTranslationMap[lang]; ok {
		return t
	}
	return labelTranslationMap["en"]
}

// NormalizeLang validates and normalises a language code from a query parameter.
// Returns "en" for empty or unsupported values.
func NormalizeLang(lang string) string {
	if lang == "" {
		return "en"
	}
	if SupportedLabelLangs[lang] {
		return lang
	}
	return "en"
}
