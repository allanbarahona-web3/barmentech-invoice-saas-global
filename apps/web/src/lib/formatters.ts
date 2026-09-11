import { getPersistedLocale, type Locale } from "@/i18n";

type DateValue = Date | string | number;

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-US";
}

export function formatNumber(amount: number, locale: Locale = getPersistedLocale(), options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(locale), options).format(amount);
}

export function formatCurrency(amount: number, currency = "USD", locale: Locale = getPersistedLocale()): string {
  return formatNumber(amount, locale, { style: "currency", currency });
}

export function formatDate(value: DateValue, locale: Locale = getPersistedLocale(), timeZone?: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeZone }).format(toDate(value));
}

export function formatDateTime(value: DateValue, locale: Locale = getPersistedLocale(), timeZone?: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short", timeZone }).format(toDate(value));
}
