import { tenantSettingsService } from "@/services/tenantSettingsService";

/**
 * Get company country from tenant settings
 */
export async function getCompanyCountry(): Promise<string | undefined> {
  try {
    const settings = await tenantSettingsService.getTenantSettings();
    return settings?.country;
  } catch {
    return undefined;
  }
}

/**
 * Check if current country matches expected
 */
export function isCountry(country: string | undefined, expected: string): boolean {
  return country?.toUpperCase() === expected.toUpperCase();
}

/**
 * Get enabled country extensions based on current country
 * Returns object with country codes as keys and boolean as values
 */
export function getEnabledCountryExtensions(country?: string): Record<string, boolean> {
  const upperCountry = country?.toUpperCase();

  return {
    cr: upperCountry === "CR",
    mx: upperCountry === "MX",
    co: upperCountry === "CO",
    us: upperCountry === "US",
    // Add more countries as needed
  };
}

/**
 * Check if Costa Rica extensions should be enabled
 */
export function isCREnabled(country?: string): boolean {
  return isCountry(country, "CR");
}

/**
 * Check if Mexico extensions should be enabled (future)
 */
export function isMXEnabled(country?: string): boolean {
  return isCountry(country, "MX");
}

/**
 * Get list of supported countries with fiscal extensions
 */
export function getSupportedCountriesWithExtensions(): string[] {
  return ["CR"]; // Add more as implemented: "MX", "CO", etc.
}

/**
 * Check if a country has fiscal extensions implemented
 */
export function hasCountryExtensions(country?: string): boolean {
  if (!country) return false;
  return getSupportedCountriesWithExtensions().includes(country.toUpperCase());
}
