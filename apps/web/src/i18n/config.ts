import { en } from "./en";
import { es } from "./es";
import { foundationMessages } from "./foundation";

export const supportedLocales = ["es", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "locale";

function mergeLocale<
  TBase extends { auth: object; common: object; customers: object },
  TFoundation extends (typeof foundationMessages)["es"] | (typeof foundationMessages)["en"],
>(base: TBase, foundation: TFoundation) {
  return { ...base, auth: { ...base.auth, ...foundation.auth }, common: { ...base.common, ...foundation.common }, customers: { ...base.customers, ...foundation.customers }, shell: foundation.shell };
}

export const dictionaries = { es: mergeLocale(es, foundationMessages.es), en: mergeLocale(en, foundationMessages.en) };
export type Dictionary = (typeof dictionaries)[Locale];

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && supportedLocales.includes(value as Locale));
}

export function getPersistedLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const value = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
