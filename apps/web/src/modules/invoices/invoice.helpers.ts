import { Invoice } from "./invoice.schema";
import { Payment } from "@/modules/payments/payments.types";
import { getInvoicePaymentInfo } from "@/modules/payments/payments.utils";

/**
 * Filter invoices by customer ID
 */
export function getInvoicesByCustomer(invoices: Invoice[], customerId: string): Invoice[] {
  return invoices.filter(invoice => invoice.customerId === customerId);
}

/**
 * Calculate customer statistics from invoices and payments
 */
export function calculateCustomerStats(invoices: Invoice[], payments: Payment[] = []) {
  const customerInvoices = invoices;
  
  const totalInvoiced = customerInvoices.reduce((sum, inv) => {
    if (inv.type === 'invoice' && inv.status !== 'archived') {
      return sum + inv.total;
    }
    return sum;
  }, 0);

  const pendingInvoices = customerInvoices.filter(
    inv => inv.type === 'invoice' && (inv.status === 'issued' || inv.status === 'sent')
  );

  // Calculate total pending considering payments
  const totalPending = pendingInvoices.reduce((sum, inv) => {
    const paymentInfo = getInvoicePaymentInfo(inv.id, inv.total, payments);
    // Only add the balance (what's still owed), not the full total
    return sum + paymentInfo.balance;
  }, 0);

  const lastInvoice = customerInvoices
    .filter(inv => inv.type === 'invoice')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return {
    totalInvoiced,
    totalPending,
    pendingCount: pendingInvoices.length,
    totalInvoices: customerInvoices.filter(inv => inv.type === 'invoice').length,
    totalQuotes: customerInvoices.filter(inv => inv.type === 'quote').length,
    lastInvoiceDate: lastInvoice?.createdAt,
  };
}
