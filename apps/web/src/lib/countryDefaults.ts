export type CountryCode = "CR" | "MX" | "CO" | "US" | "GLOBAL" | string;

export const COUNTRY_DEFAULTS: Record<string, {
  currency: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
}> = {
  CR: { currency: "CRC", taxEnabled: true, taxName: "IVA", taxRate: 13 },
  MX: { currency: "MXN", taxEnabled: true, taxName: "IVA", taxRate: 16 },
  CO: { currency: "COP", taxEnabled: true, taxName: "IVA", taxRate: 19 },
  US: { currency: "USD", taxEnabled: false, taxName: "Sales Tax", taxRate: 0 },
  GLOBAL: { currency: "USD", taxEnabled: false, taxName: "Tax", taxRate: 0 }
};

export function getCountryDefaults(countryCode: string) {
  return COUNTRY_DEFAULTS[countryCode] ?? COUNTRY_DEFAULTS["GLOBAL"];
}
