import { TenantSettings } from "@/schemas/tenantSettings.schema";
import { getTenantSlug } from "@/lib/tenantContext";

const STORAGE_KEY = "tenantSettings";

function resolveCountryPack(
  country: string,
  storedCountryPack?: { code?: string; enabled?: boolean; source?: string }
) {
  if (storedCountryPack?.code) {
    return {
      code: storedCountryPack.code.toUpperCase(),
      enabled: storedCountryPack.enabled ?? true,
      source:
        storedCountryPack.source === "backend" ||
        storedCountryPack.source === "legacy-local" ||
        storedCountryPack.source === "derived"
          ? storedCountryPack.source
          : "backend",
    } as const;
  }

  const legacyCountryCode = country.toLowerCase();
  const legacyPack = localStorage.getItem(`countryPack:${legacyCountryCode}`);

  if (legacyPack !== null) {
    return {
      code: country.toUpperCase(),
      enabled: JSON.parse(legacyPack),
      source: "legacy-local",
    } as const;
  }

  return {
    code: country.toUpperCase(),
    enabled: true,
    source: "derived",
  } as const;
}

// Mock API functions - estructura lista para reemplazar con API real
export const tenantSettingsService = {
  async getTenantSettings(): Promise<TenantSettings | null> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenantSlug = getTenantSlug();
    if (!tenantSlug) return null;

    const key = `${STORAGE_KEY}:${tenantSlug}`;
    const stored = localStorage.getItem(key);
    
    // Defaults para features (siempre aplicar para nuevas features)
    const defaultFeatures = {
      allowRecurringInvoices: false, // TODO: Set based on subscription plan (Premium+)
      allowScheduledSend: false, // TODO: Set based on subscription plan (Premium+)
      allowUnlimitedCC: false, // TODO: Set based on subscription plan (Business+)
    };
    
    if (stored) {
      const settings = JSON.parse(stored);
      const country = settings.country || "CR";
      // Merge con defaults de features para asegurar que nuevas features estén disponibles
      return {
        ...settings,
        countryPack: resolveCountryPack(country, settings.countryPack),
        features: {
          ...defaultFeatures,
          ...settings.features,
        },
      };
    }

    // Retornar defaults si no existe
    return {
      companyName: "",
      country: "CR",
      countryPack: {
        code: "CR",
        enabled: true,
        source: "derived",
      },
      currency: "CRC",
      taxEnabled: true,
      taxName: "IVA",
      taxRate: 13,
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1,
      draftPrefix: "DRF-",
      nextDraftNumber: 1,
      quotePrefix: "COT-",
      nextQuoteNumber: 1,
      acceptedPaymentMethods: [],
      onboardingCompleted: false,
      features: defaultFeatures,
    };
  },

  async saveTenantSettings(settings: TenantSettings): Promise<TenantSettings> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const tenantSlug = getTenantSlug();
    if (!tenantSlug) {
      throw new Error("No tenant context found");
    }

    const key = `${STORAGE_KEY}:${tenantSlug}`;
    localStorage.setItem(key, JSON.stringify(settings));
    
    return settings;
  },

  async completeTenantOnboarding(settings: Partial<TenantSettings>): Promise<TenantSettings> {
    const current = await this.getTenantSettings();
    const countryCode = (settings.country || current?.country || "CR").toUpperCase();
    
    const updated: TenantSettings = {
      ...current!,
      ...settings,
      countryPack: {
        code: countryCode,
        enabled: true,
        source: "derived",
      },
      onboardingCompleted: true,
    };

    const result = await this.saveTenantSettings(updated);

    // Legacy compatibility while UI migrates away from localStorage-only assumptions
    if (settings.country) {
      const countryCode = settings.country.toLowerCase();
      const countryPackKey = `countryPack:${countryCode}`;
      
      // Activate the country pack for the selected country
      localStorage.setItem(countryPackKey, JSON.stringify(true));
    }

    return result;
  },
};
