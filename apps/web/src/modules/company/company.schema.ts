import { z } from "zod";
import { crFiscalProfileSchema, type CRFiscalProfile } from "@/country-packs/cr";

// ===== CUSTOM HEADER FIELDS =====
export const customHeaderFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
  value: z.string().max(200),
  enabled: z.boolean(),
});

// ===== BRANDING (GLOBAL) =====
export const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  invoiceFooter: z.string().optional(),
  customHeaderFields: z.array(customHeaderFieldSchema).optional(),
});

// ===== LEGAL (GLOBAL) =====
export const legalSchema = z.object({
  legalName: z.string().min(1),
  commercialName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(2).max(2), // ISO code (CR, MX, US, etc.)
  currency: z.string().min(3).max(3), // ISO code (CRC, MXN, USD, etc.)
  enableMultiCurrency: z.boolean().optional(), // TODO: Validate against plan (premium feature)
});

// ===== FISCAL BASE (GLOBAL) =====
export const fiscalBaseSchema = z.object({
  taxId: z.string().optional(),
  taxRegime: z.string().optional(),
});

// ===== FISCAL EXTENSIONS (per country) =====

// Costa Rica extension (imported from country pack)
export const fiscalCRSchema = crFiscalProfileSchema;

// Future extensions (examples)
// export const fiscalMXSchema = z.object({ ... });
// export const fiscalCOSchema = z.object({ ... });

export const fiscalExtensionsSchema = z.object({
  cr: fiscalCRSchema.optional(),
  // mx: fiscalMXSchema.optional(),
  // co: fiscalCOSchema.optional(),
});

// ===== FISCAL COMPLETE =====
export const fiscalSchema = fiscalBaseSchema.merge(fiscalExtensionsSchema);

// ===== COMPANY PROFILE =====
export const companyProfileSchema = z.object({
  branding: brandingSchema,
  legal: legalSchema,
  fiscal: fiscalSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const companyProfileInputSchema = z.object({
  branding: brandingSchema,
  legal: legalSchema,
  fiscal: fiscalSchema,
});

// ===== TYPES =====
export type CustomHeaderField = z.infer<typeof customHeaderFieldSchema>;
export type Branding = z.infer<typeof brandingSchema>;
export type Legal = z.infer<typeof legalSchema>;
export type FiscalBase = z.infer<typeof fiscalBaseSchema>;
export type FiscalCR = CRFiscalProfile; // Use type from country pack
export type FiscalExtensions = z.infer<typeof fiscalExtensionsSchema>;
export type Fiscal = z.infer<typeof fiscalSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileInputSchema>;

// Re-export country pack type for convenience
export type { CRFiscalProfile };
