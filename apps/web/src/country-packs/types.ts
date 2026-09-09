export type CountryCode = "CR" | string;

export interface CountryPackDocumentType {
  id: string;
  labelToken?: string;
  defaultLabel: string;
}

export interface CountryPackStatusDefinition {
  id: string;
  labelToken?: string;
  defaultLabel: string;
  emphasized?: boolean;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClassName?: string;
}

export interface CountryPackStatusModel {
  defaultStatus: string;
  statuses: CountryPackStatusDefinition[];
}

export interface CountryPackLocaleConfig {
  language: string;
  dateLocale: string;
  currencyLocales: Record<string, string>;
}

export interface CountryPackTaxDefinition {
  id: string;
  label: string;
  rate: number;
  enabledByDefault: boolean;
}

export interface CountryPackTaxConfig {
  mode: "single_rate" | "multi_rate";
  taxes: CountryPackTaxDefinition[];
  defaultTaxId?: string;
}

export interface CountryPackFeatureFlags {
  allowRecurringInvoices: boolean;
  allowScheduledSend: boolean;
  allowUnlimitedCC: boolean;
  [key: string]: boolean;
}

export interface CountryPackManifest {
  countryCode: CountryCode;
  documentTypes: CountryPackDocumentType[];
  statusModel: CountryPackStatusModel;
  localeConfig: CountryPackLocaleConfig;
  taxConfig: CountryPackTaxConfig;
  enabledModules: string[];
  featureFlags: CountryPackFeatureFlags;
}

export interface ActiveCountryPack {
  manifest: CountryPackManifest;
  source: "tenant-country-pack" | "tenant-country" | "fallback";
}

export interface CountryCapabilities {
  countryCode: CountryCode;
  documentTypes: CountryPackDocumentType[];
  statusModel: CountryPackStatusModel;
  localeConfig: CountryPackLocaleConfig;
  taxConfig: CountryPackTaxConfig;
  enabledModules: string[];
  featureFlags: CountryPackFeatureFlags;
}
