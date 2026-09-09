/**
 * Payment Utilities
 * Helper functions for payment calculations
 */

import { Payment, PaymentStatus, InvoicePaymentInfo } from "./payments.types";

/**
 * Calculate total paid amount for an invoice
 */
export function calculateTotalPaid(invoiceId: string, payments: Payment[]): number {
  return payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calculate payment status based on invoice total and payments
 */
export function calculatePaymentStatus(
  invoiceTotal: number,
  totalPaid: number
): PaymentStatus {
  if (totalPaid === 0) return "unpaid";
  if (totalPaid < invoiceTotal) return "partial";
  if (totalPaid === invoiceTotal) return "paid";
  return "overpaid";
}

/**
 * Get complete payment information for an invoice
 */
export function getInvoicePaymentInfo(
  invoiceId: string,
  invoiceTotal: number,
  allPayments: Payment[]
): InvoicePaymentInfo {
  const payments = allPayments.filter((p) => p.invoiceId === invoiceId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoiceTotal - totalPaid;
  const status = calculatePaymentStatus(invoiceTotal, totalPaid);

  return {
    invoiceId,
    invoiceTotal,
    totalPaid,
    balance,
    status,
    payments,
  };
}

/**
 * Check if a payment amount is valid for an invoice
 */
export function validatePaymentAmount(
  amount: number,
  invoiceTotal: number,
  totalPaid: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "El monto debe ser mayor a 0" };
  }

  const balance = invoiceTotal - totalPaid;
  
  if (amount > balance) {
    return {
      valid: false,
      error: `El monto excede el saldo pendiente de $${balance.toFixed(2)}`,
    };
  }

  return { valid: true };
}

/**
 * Format payment status to display label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "Sin pagar",
    partial: "Pago parcial",
    paid: "Pagada",
    overpaid: "Sobrepago",
  };
  return labels[status];
}

/**
 * Get payment status badge variant
 */
export function getPaymentStatusVariant(status: PaymentStatus): "destructive" | "warning" | "success" | "secondary" {
  const variants: Record<PaymentStatus, "destructive" | "warning" | "success" | "secondary"> = {
    unpaid: "destructive",
    partial: "warning",
    paid: "success",
    overpaid: "secondary",
  };
  return variants[status];
}
