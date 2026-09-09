/**
 * Payments Service
 * Handles payment data operations
 */

import { Payment, CreatePaymentDto, PaymentSummary } from "./payments.types";
import { updateInvoicePaymentStatus } from "@/modules/invoices/invoice.storage";

const STORAGE_KEY = "payments";

function getStoredPayments(): Payment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function savePayments(payments: Payment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

export const paymentsService = {
  /**
   * Get all payments
   */
  getPayments: async (): Promise<Payment[]> => {
    // TODO: Replace with actual API call
    // return httpClient.get<Payment[]>("/api/payments");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    return getStoredPayments();
  },

  /**
   * Get payments for a specific invoice
   */
  getPaymentsByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    // TODO: Replace with actual API call
    // return httpClient.get<Payment[]>(`/api/payments/invoice/${invoiceId}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const payments = getStoredPayments();
    return payments.filter((p) => p.invoiceId === invoiceId);
  },

  /**
   * Get payments for a specific customer
   */
  getPaymentsByCustomer: async (customerId: string): Promise<Payment[]> => {
    // TODO: Replace with actual API call
    // return httpClient.get<Payment[]>(`/api/payments/customer/${customerId}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const payments = getStoredPayments();
    return payments.filter((p) => p.customerId === customerId);
  },

  /**
   * Create a new payment
   */
  createPayment: async (payment: CreatePaymentDto): Promise<Payment> => {
    // TODO: Replace with actual API call
    // return httpClient.post<Payment>("/api/payments", payment);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Get invoice info to populate payment details
    const invoices = localStorage.getItem("invoices");
    let invoiceData = null;
    if (invoices) {
      const parsedInvoices = JSON.parse(invoices);
      invoiceData = parsedInvoices.find((inv: any) => inv.id === payment.invoiceId);
    }
    
    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      ...payment,
      invoiceNumber: invoiceData?.invoiceNumber || "TEMP-000",
      customerName: invoiceData?.customerId || "Cliente Temporal",
      customerId: invoiceData?.customerId || "TEMP-CUSTOMER",
      createdAt: new Date().toISOString(),
      createdBy: "current-user", // Should come from auth context
      tenantId: "current-tenant", // Should come from auth context
    };

    const payments = getStoredPayments();
    payments.push(newPayment);
    savePayments(payments);
    
    // Update invoice status based on payments
    await updateInvoicePaymentStatus(payment.invoiceId, payments);
    
    return newPayment;
  },

  /**
   * Delete a payment
   */
  deletePayment: async (paymentId: string): Promise<void> => {
    // TODO: Replace with actual API call
    // return httpClient.delete(`/api/payments/${paymentId}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const payments = getStoredPayments();
    const paymentIndex = payments.findIndex((p) => p.id === paymentId);
    
    if (paymentIndex > -1) {
      const deletedPayment = payments[paymentIndex];
      payments.splice(paymentIndex, 1);
      savePayments(payments);
      
      // Update invoice status after deleting payment
      await updateInvoicePaymentStatus(deletedPayment.invoiceId, payments);
    }
  },

  /**
   * Get payment summary statistics
   */
  getPaymentSummary: async (): Promise<PaymentSummary> => {
    // TODO: Replace with actual API call
    // return httpClient.get<PaymentSummary>("/api/payments/summary");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const payments = getStoredPayments();
    const paymentsByMethod: Record<string, { count: number; amount: number }> = {};

    payments.forEach((payment) => {
      if (!paymentsByMethod[payment.paymentMethod]) {
        paymentsByMethod[payment.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentsByMethod[payment.paymentMethod].count++;
      paymentsByMethod[payment.paymentMethod].amount += payment.amount;
    });

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paymentsByMethod,
      recentPayments: payments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  },
};
