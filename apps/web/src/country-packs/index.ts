import { CR_MANIFEST } from "./cr/manifest";
import { CountryCode, CountryPackManifest } from "./types";

const COUNTRY_PACKS: Record<string, CountryPackManifest> = {
  CR: CR_MANIFEST,
};

export function getCountryPackManifest(countryCode?: CountryCode): CountryPackManifest {
  const normalized = countryCode?.toUpperCase() || "CR";
  return COUNTRY_PACKS[normalized] || CR_MANIFEST;
}

export function hasCountryPack(countryCode?: CountryCode): boolean {
  if (!countryCode) return false;
  return Boolean(COUNTRY_PACKS[countryCode.toUpperCase()]);
}

export { COUNTRY_PACKS, CR_MANIFEST };
export * from "./types";
