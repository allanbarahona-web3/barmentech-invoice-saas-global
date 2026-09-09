import { tenantSettingsService } from "@/services/tenantSettingsService";

/**
 * Generate draft number (for draft invoices)
 * Uses separate counter: DRF-001, DRF-002, etc.
 */
export async function generateDraftNumber(): Promise<string> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const prefix = settings.draftPrefix || "DRF-";
  const number = settings.nextDraftNumber || 1;

  return `${prefix}${number}`;
}

/**
 * Generate quote number (for quotations/cotizaciones)
 * Uses separate counter: COT-001, COT-002, etc.
 */
export async function generateQuoteNumber(): Promise<string> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const prefix = settings.quotePrefix || "COT-";
  const number = settings.nextQuoteNumber || 1;

  return `${prefix}${number}`;
}

/**
 * Generate official invoice number (for issued invoices)
 * Uses official counter: INV-001, INV-002, etc.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const prefix = settings.invoicePrefix || "";
  const number = settings.nextInvoiceNumber || 1;

  return `${prefix}${number}`;
}

/**
 * Increment draft number counter
 */
export async function incrementDraftNumber(): Promise<void> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const updatedSettings = {
    ...settings,
    nextDraftNumber: (settings.nextDraftNumber || 1) + 1,
  };

  await tenantSettingsService.saveTenantSettings(updatedSettings);
}

/**
 * Increment quote number counter
 */
export async function incrementQuoteNumber(): Promise<void> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const updatedSettings = {
    ...settings,
    nextQuoteNumber: (settings.nextQuoteNumber || 1) + 1,
  };

  await tenantSettingsService.saveTenantSettings(updatedSettings);
}

/**
 * Increment official invoice number counter
 */
export async function incrementInvoiceNumber(): Promise<void> {
  const settings = await tenantSettingsService.getTenantSettings();
  
  if (!settings) {
    throw new Error("Tenant settings not found");
  }

  const updatedSettings = {
    ...settings,
    nextInvoiceNumber: settings.nextInvoiceNumber + 1,
  };

  await tenantSettingsService.saveTenantSettings(updatedSettings);
}

/**
 * Format invoice number for display
 */
export function formatInvoiceNumber(prefix: string, number: number): string {
  return `${prefix}${number}`;
}
