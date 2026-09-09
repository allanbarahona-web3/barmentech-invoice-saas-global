import { getCountryPackManifest } from "@/country-packs";
import {
  ActiveCountryPack,
  CountryCapabilities,
  CountryCode,
  CountryPackDocumentType,
  CountryPackManifest,
  CountryPackStatusDefinition,
} from "@/country-packs";
import { tenantSettingsService } from "@/services/tenantSettingsService";

function resolveManifest(countryCode?: CountryCode): CountryPackManifest {
  return getCountryPackManifest(countryCode);
}

export async function getActiveCountryPack(): Promise<ActiveCountryPack> {
  const settings = await tenantSettingsService.getTenantSettings();

  if (settings?.countryPack?.code) {
    return {
      manifest: resolveManifest(settings.countryPack.code),
      source: "tenant-country-pack",
    };
  }

  if (settings?.country) {
    return {
      manifest: resolveManifest(settings.country),
      source: "tenant-country",
    };
  }

  return {
    manifest: resolveManifest("CR"),
    source: "fallback",
  };
}

export function getCountryCapabilities(countryCode?: CountryCode): CountryCapabilities {
  const manifest = resolveManifest(countryCode);

  return {
    countryCode: manifest.countryCode,
    documentTypes: manifest.documentTypes,
    statusModel: manifest.statusModel,
    localeConfig: manifest.localeConfig,
    taxConfig: manifest.taxConfig,
    enabledModules: manifest.enabledModules,
    featureFlags: manifest.featureFlags,
  };
}

export function getDocumentTypes(countryCode?: CountryCode): CountryPackDocumentType[] {
  return resolveManifest(countryCode).documentTypes;
}

export function getStatusDefinitions(countryCode?: CountryCode): CountryPackStatusDefinition[] {
  return resolveManifest(countryCode).statusModel.statuses;
}

export function getStatusDefinition(status: string, countryCode?: CountryCode): CountryPackStatusDefinition | undefined {
  return getStatusDefinitions(countryCode).find((item) => item.id === status);
}

export function getStatusLabel(
  status: string,
  countryCode?: CountryCode,
  translations?: Record<string, unknown>
): string {
  const definition = getStatusDefinition(status, countryCode);
  if (!definition) return status;

  const token = definition.labelToken;
  if (token && translations && typeof translations[token] === "string") {
    return translations[token] as string;
  }

  return definition.defaultLabel;
}

export function getDocumentTypeLabel(
  type: string,
  countryCode?: CountryCode,
  translations?: Record<string, unknown>
): string {
  const definition = getDocumentTypes(countryCode).find((item) => item.id === type);
  if (!definition) return type;

  const token = definition.labelToken;
  if (token && translations && typeof translations[token] === "string") {
    return translations[token] as string;
  }

  return definition.defaultLabel;
}
