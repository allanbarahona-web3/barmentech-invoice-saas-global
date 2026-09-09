import { es } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";

const dictionaries = {
  es,
  en,
};

function getLocale(): Locale {
  // Client-side only: read from cookie
  if (typeof window === "undefined") {
    return "es"; // SSR default
  }

  const cookies = document.cookie.split("; ");
  const localeCookie = cookies.find((c) => c.startsWith("locale="));
  
  if (localeCookie) {
    const value = localeCookie.split("=")[1] as Locale;
    if (value === "es" || value === "en") {
      return value;
    }
  }

  return "es"; // fallback
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  // Save to cookie (1 year expiry)
  document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function t() {
  const locale = getLocale();
  return dictionaries[locale] ?? dictionaries.es;
}
