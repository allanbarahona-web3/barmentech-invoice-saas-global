"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, getDictionary, getPersistedLocale, persistLocale, type Dictionary, type Locale } from "./config";

type I18nContextValue = { locale: Locale; messages: Dictionary; setLocale: (locale: Locale) => void };
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrentLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => { setCurrentLocale(getPersistedLocale()); }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo<I18nContextValue>(() => ({ locale, messages: getDictionary(locale), setLocale: (nextLocale) => { persistLocale(nextLocale); setCurrentLocale(nextLocale); } }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslations must be used within I18nProvider");
  return context;
}
