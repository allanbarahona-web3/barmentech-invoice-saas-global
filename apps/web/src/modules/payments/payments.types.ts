/**
 * Payment Module Types
 */

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: string; // ID from paymentMethods constants
  paymentDate: string; // ISO date
  reference?: string; // Transaction reference, check number, etc.
  bankInfo?: string; // Bank account details if applicable
  notes?: string;
  createdAt: string;
  createdBy: string;
  tenantId: string;
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  bankInfo?: string;
  notes?: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  paymentsByMethod: Record<string, { count: number; amount: number }>;
  recentPayments: Payment[];
}

/**
 * Payment status derived from invoice and payments
 */
export type PaymentStatus = "unpaid" | "partial" | "paid" | "overpaid";

export interface InvoicePaymentInfo {
  invoiceId: string;
  invoiceTotal: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
  payments: Payment[];
}
