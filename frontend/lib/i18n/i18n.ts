import en from './en.json'
import fr from './fr.json'
import de from './de.json'

export type Locale = 'en' | 'fr' | 'de'

const translations: Record<Locale, Record<string, string>> = { en, fr, de }

export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

/**
 * Resolve the active locale from a `?lang=` query parameter,
 * falling back to the browser's navigator.language, then "en".
 */
export function resolveLocale(searchParams?: URLSearchParams): Locale {
    // 1. Explicit ?lang= param
    const param = searchParams?.get('lang')?.toLowerCase()
    if (param && param in translations) return param as Locale

    // 2. Browser language (first 2 chars)
    if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language?.slice(0, 2).toLowerCase()
        if (browserLang && browserLang in translations) return browserLang as Locale
    }

    return 'en'
}

/**
 * Create a translator function for the given locale.
 * Returns the translated string for a key, falling back to English, then to the key itself.
 */
export function createTranslator(locale: Locale) {
    const dict = translations[locale] || translations.en
    const fallback = translations.en

    return function t(key: string, replacements?: Record<string, string | number>): string {
        let value = dict[key] ?? fallback[key] ?? key
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                value = value.replace(`{${k}}`, String(v))
            }
        }
        return value
    }
}
