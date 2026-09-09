import { InvoiceItem } from "./invoice.schema";
import { calculateTaxAmount, getResolvedTaxConfig } from "@/lib/taxConfig";
import { TenantSettings } from "@/schemas/tenantSettings.schema";

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

/**
 * Calculate line total for an invoice item (including discount)
 */
export function calcLineTotal(item: InvoiceItem): number {
  const lineSubtotal = item.qty * item.unitPrice;
  const discountAmount = lineSubtotal * ((item.discount || 0) / 100);
  return roundToTwo(lineSubtotal - discountAmount);
}

/**
 * Calculate total discount from all invoice items
 */
export function calcTotalDiscount(items: InvoiceItem[]): number {
  const sum = items.reduce((acc, item) => {
    const lineSubtotal = item.qty * item.unitPrice;
    const discountAmount = lineSubtotal * ((item.discount || 0) / 100);
    return acc + discountAmount;
  }, 0);
  return roundToTwo(sum);
}

/**
 * Calculate subtotal from invoice items (after discounts)
 */
export function calcSubtotal(items: InvoiceItem[]): number {
  const sum = items.reduce((acc, item) => acc + calcLineTotal(item), 0);
  return roundToTwo(sum);
}

/**
 * Calculate tax amount based on subtotal and tax settings
 */
export function calcInvoiceTotals(
  items: InvoiceItem[],
  tenantSettings: Pick<TenantSettings, "taxEnabled" | "taxName" | "taxRate" | "country">,
  countryCode?: string,
  deliveryFee: number = 0
): InvoiceTotals {
  const subtotal = calcSubtotal(items);
  const taxConfig = getResolvedTaxConfig(tenantSettings, countryCode || tenantSettings.country);
  const tax = roundToTwo(calculateTaxAmount(subtotal, taxConfig));
  const normalizedDeliveryFee = roundToTwo(deliveryFee);
  const total = roundToTwo(subtotal + tax + normalizedDeliveryFee);

  return { subtotal, tax, deliveryFee: normalizedDeliveryFee, total };
}

/**
 * Round number to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
