import { z } from "zod";

export const step1Schema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  country: z.string().min(1, "El país es requerido"),
});

export const step2Schema = z.object({
  currency: z.string().min(1, "La moneda es requerida"),
  taxEnabled: z.boolean(),
  taxName: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    if (data.taxEnabled) {
      return data.taxName && data.taxName.length > 0;
    }
    return true;
  },
  {
    message: "El nombre del impuesto es requerido cuando está habilitado",
    path: ["taxName"],
  }
).refine(
  (data) => {
    if (data.taxEnabled) {
      return data.taxRate !== undefined && data.taxRate >= 0 && data.taxRate <= 100;
    }
    return true;
  },
  {
    message: "La tasa de impuesto debe estar entre 0 y 100",
    path: ["taxRate"],
  }
);

export const step3Schema = z.object({
  invoicePrefix: z.string(),
  nextInvoiceNumber: z.number().min(1, "El número inicial debe ser al menos 1"),
});

export const tenantSettingsSchema = z.object({
  companyName: z.string().min(2),
  country: z.string().min(1),
  countryPack: z.object({
    code: z.string().min(2),
    enabled: z.boolean().default(true),
    source: z.enum(["backend", "derived", "legacy-local"]).default("derived"),
  }).optional(),
  currency: z.string().min(1),
  taxEnabled: z.boolean(),
  taxName: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string(),
  nextInvoiceNumber: z.number().min(1),
  // Separate numbering for different document types
  draftPrefix: z.string().optional().default("DRF-"),
  nextDraftNumber: z.number().min(1).optional().default(1),
  quotePrefix: z.string().optional().default("COT-"),
  nextQuoteNumber: z.number().min(1).optional().default(1),
  // Payment methods accepted by the company
  acceptedPaymentMethods: z.array(z.string()).optional().default([]),
  onboardingCompleted: z.boolean(),
  // Premium features (controlled by subscription plan)
  features: z.object({
    allowRecurringInvoices: z.boolean().default(false),
    allowScheduledSend: z.boolean().default(false),
    allowUnlimitedCC: z.boolean().default(false), // More than 2 CC recipients
  }).optional(),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
