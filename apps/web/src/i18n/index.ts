export { DEFAULT_LOCALE, getDictionary, getPersistedLocale, persistLocale, supportedLocales, type Dictionary, type Locale } from "./config";
export { I18nProvider, useTranslations } from "./provider";

import { getDictionary, getPersistedLocale } from "./config";

// Compatibility accessor for inherited screens. New or migrated UI must use useTranslations().
export function t() {
  return getDictionary(getPersistedLocale());
}

export function interpolate(message: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), message);
}
