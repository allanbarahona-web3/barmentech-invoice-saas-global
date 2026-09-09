/**
 * Payment Hooks
 * React Query hooks for payment data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "./payments.service";
import { CreatePaymentDto } from "./payments.types";
import { useToast } from "@/hooks/use-toast";

/**
 * Get all payments
 */
export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: paymentsService.getPayments,
  });
};

/**
 * Get payments for a specific invoice
 */
export const useInvoicePayments = (invoiceId: string) => {
  return useQuery({
    queryKey: ["payments", "invoice", invoiceId],
    queryFn: () => paymentsService.getPaymentsByInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};

/**
 * Get payments for a specific customer
 */
export const useCustomerPayments = (customerId: string) => {
  return useQuery({
    queryKey: ["payments", "customer", customerId],
    queryFn: () => paymentsService.getPaymentsByCustomer(customerId),
    enabled: !!customerId,
  });
};

/**
 * Get payment summary
 */
export const usePaymentSummary = () => {
  return useQuery({
    queryKey: ["payments", "summary"],
    queryFn: paymentsService.getPaymentSummary,
  });
};

/**
 * Create a new payment
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payment: CreatePaymentDto) => paymentsService.createPayment(payment),
    onSuccess: (newPayment) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "invoice", newPayment.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "customer", newPayment.customerId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] }); // Invoices status might change

      toast({
        title: "Pago registrado",
        description: `El pago de ${newPayment.amount} ha sido registrado correctamente`,
      });
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      });
    },
  });
};

/**
 * Delete a payment
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentId: string) => paymentsService.deletePayment(paymentId),
    onSuccess: () => {
      // Invalidate all payment queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      toast({
        title: "Pago eliminado",
        description: "El pago ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pago",
        variant: "destructive",
      });
    },
  });
};
