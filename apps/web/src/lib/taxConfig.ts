import { CountryCode } from "@/country-packs";
import { getCountryCapabilities } from "@/lib/countryRegistry";
import { TenantSettings } from "@/schemas/tenantSettings.schema";

export interface ResolvedTaxLine {
  id: string;
  label: string;
  rate: number;
  enabled: boolean;
}

export interface ResolvedTaxConfig {
  mode: "single_rate" | "multi_rate";
  taxes: ResolvedTaxLine[];
}

export function getResolvedTaxConfig(
  tenantSettings?: Pick<TenantSettings, "taxEnabled" | "taxName" | "taxRate" | "country">,
  countryCode?: CountryCode
): ResolvedTaxConfig {
  const capabilities = getCountryCapabilities(countryCode || tenantSettings?.country);
  const baseTaxes = capabilities.taxConfig.taxes;

  if (baseTaxes.length === 0) {
    return {
      mode: capabilities.taxConfig.mode,
      taxes: [],
    };
  }

  const primaryTax = baseTaxes[0];
  const resolvedPrimary: ResolvedTaxLine = {
    id: primaryTax.id,
    label: tenantSettings?.taxName || primaryTax.label,
    rate: tenantSettings?.taxRate ?? primaryTax.rate,
    enabled: tenantSettings?.taxEnabled ?? primaryTax.enabledByDefault,
  };

  const additionalTaxes = baseTaxes.slice(1).map((tax) => ({
    id: tax.id,
    label: tax.label,
    rate: tax.rate,
    enabled: tax.enabledByDefault,
  }));

  return {
    mode: capabilities.taxConfig.mode,
    taxes: [resolvedPrimary, ...additionalTaxes],
  };
}

export function calculateTaxAmount(subtotal: number, config: ResolvedTaxConfig): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;

  return config.taxes.reduce((sum, tax) => {
    if (!tax.enabled || tax.rate <= 0) return sum;
    return sum + subtotal * (tax.rate / 100);
  }, 0);
}

export function getPrimaryTax(config: ResolvedTaxConfig): ResolvedTaxLine | undefined {
  return config.taxes[0];
}
