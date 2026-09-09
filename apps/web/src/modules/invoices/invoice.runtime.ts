import { getCountryCapabilities } from "@/lib/countryRegistry";

const CR_DEFAULT_COUNTRY = "CR";

function getRuntimeCapabilities(countryCode?: string) {
  return getCountryCapabilities(countryCode || CR_DEFAULT_COUNTRY);
}

export function getInvoiceDocumentTypeIds(countryCode?: string): string[] {
  return getRuntimeCapabilities(countryCode).documentTypes.map((doc) => doc.id);
}

export function getInvoiceStatusIds(countryCode?: string): string[] {
  return getRuntimeCapabilities(countryCode).statusModel.statuses.map((status) => status.id);
}

export function getDefaultInvoiceDocumentType(countryCode?: string): string {
  return getInvoiceDocumentTypeIds(countryCode)[0] || "invoice";
}

export function getDefaultInvoiceStatus(countryCode?: string): string {
  return getRuntimeCapabilities(countryCode).statusModel.defaultStatus || "draft";
}

export function isValidInvoiceDocumentType(value: string, countryCode?: string): boolean {
  return getInvoiceDocumentTypeIds(countryCode).includes(value);
}

export function isValidInvoiceStatus(value: string, countryCode?: string): boolean {
  return getInvoiceStatusIds(countryCode).includes(value);
}

export const INVOICE_TYPE = "invoice";
export const QUOTE_TYPE = "quote";

export const DRAFT_STATUS = "draft";
export const ISSUED_STATUS = "issued";
export const SENT_STATUS = "sent";
export const PAID_STATUS = "paid";
export const ARCHIVED_STATUS = "archived";
