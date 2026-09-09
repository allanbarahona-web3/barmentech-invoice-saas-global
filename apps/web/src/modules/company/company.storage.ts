// TODO: replace with API calls

import {
  CompanyProfile,
  CompanyProfileInput,
  companyProfileSchema,
} from "./company.schema";
import { applyCRFiscalSanitization } from "@/country-packs/cr";

const STORAGE_KEY = "company_profile";

function getStoredProfile(): CompanyProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Don't validate with Zod here - just return the stored data
    // Validation happens at the form level with react-hook-form
    return parsed as CompanyProfile;
  } catch {
    return null;
  }
}

function saveProfile(profile: CompanyProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  return getStoredProfile();
}

export async function saveCompanyProfile(
  input: CompanyProfileInput
): Promise<CompanyProfile> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const now = new Date().toISOString();

  // Sanitize CR fiscal data if applicable
  const sanitizedFiscal = {
    ...input.fiscal,
    cr: applyCRFiscalSanitization(input.fiscal.cr, input.legal.country),
  };

  const profile: CompanyProfile = {
    ...input,
    fiscal: sanitizedFiscal,
    createdAt: now,
    updatedAt: now,
  };

  saveProfile(profile);
  return profile;
}

export async function updateCompanyProfile(
  partial: Partial<CompanyProfileInput>
): Promise<CompanyProfile> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  let current = getStoredProfile();

  // If no profile exists, create a default one
  if (!current) {
    const now = new Date().toISOString();
    current = {
      branding: {},
      legal: {
        legalName: "",
        country: "CR",
        currency: "CRC",
      },
      fiscal: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  // Merge fiscal data
  const mergedFiscal = {
    ...current.fiscal,
    ...(partial.fiscal || {}),
  };

  // Sanitize CR fiscal data if applicable
  const country = partial.legal?.country || current.legal.country;
  const sanitizedFiscal = {
    ...mergedFiscal,
    cr: applyCRFiscalSanitization(
      partial.fiscal?.cr || current.fiscal.cr,
      country
    ),
  };

  const updated: CompanyProfile = {
    ...current,
    branding: {
      ...current.branding,
      ...(partial.branding || {}),
    },
    legal: {
      ...current.legal,
      ...(partial.legal || {}),
    },
    fiscal: sanitizedFiscal,
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

export async function clearCompanyProfile(): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  localStorage.removeItem(STORAGE_KEY);
}
