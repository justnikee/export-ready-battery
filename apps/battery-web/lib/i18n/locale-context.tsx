"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTranslator, type Locale, SUPPORTED_LOCALES } from "./i18n";

const STORAGE_KEY = "anvaya_dashboard_locale";

// Only these locales have dashboard/batch-creation coverage today (STRAT-02).
// The rest of SUPPORTED_LOCALES (fr/de/+EU languages) only cover the public
// passport-viewer page — selecting them here would silently fall back to
// English for every dashboard string, which is correct behavior but not
// worth surfacing as a dashboard-language option yet.
export const DASHBOARD_LOCALES = SUPPORTED_LOCALES.filter((l) =>
  (["en", "hi", "gu", "ta"] as Locale[]).includes(l.code),
);

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && DASHBOARD_LOCALES.some((l) => l.code === saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// Falls back to an English-only translator when used outside the dashboard
// (e.g. in component tests rendered without LocaleProvider) rather than
// throwing, since most dashboard components are also unit-tested in isolation.
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return { locale: "en", setLocale: () => {}, t: createTranslator("en") };
}
