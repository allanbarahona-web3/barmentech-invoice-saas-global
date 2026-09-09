import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Invoice, InvoiceInput } from "./invoice.schema";
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  recordInvoiceExportPdf,
  recordInvoiceSent,
  archiveInvoice,
  convertQuoteToInvoice,
} from "./invoice.storage";

const QUERY_KEYS = {
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
};

export function useInvoices() {
  return useQuery({
    queryKey: QUERY_KEYS.invoices,
    queryFn: listInvoices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invoice(id),
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InvoiceInput) => createInvoice(input),
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(newInvoice.id), newInvoice);
      // Also invalidate tenant settings since nextInvoiceNumber changed
      queryClient.invalidateQueries({ queryKey: ["tenantSettings"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvoiceInput }) =>
      updateInvoice(id, input),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(updatedInvoice.id), updatedInvoice);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.invoice(deletedId) });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Invoice["status"] }) =>
      updateInvoiceStatus(id, status),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(updatedInvoice.id), updatedInvoice);
    },
  });
}

export function useRecordInvoiceExportPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recordInvoiceExportPdf(id),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(updatedInvoice.id), updatedInvoice);
    },
  });
}

export function useRecordInvoiceSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, toEmail, message }: { id: string; toEmail?: string; message?: string }) =>
      recordInvoiceSent(id, toEmail, message),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(updatedInvoice.id), updatedInvoice);
    },
  });
}

export function useArchiveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveInvoice(id),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.setQueryData(QUERY_KEYS.invoice(updatedInvoice.id), updatedInvoice);
    },
  });
}

export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => convertQuoteToInvoice(quoteId),
    onSuccess: (newInvoice, quoteId) => {
      // Invalidate both lists and queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoice(quoteId) });
      queryClient.setQueryData(QUERY_KEYS.invoice(newInvoice.id), newInvoice);
      // Invalidate tenant settings since nextInvoiceNumber changed
      queryClient.invalidateQueries({ queryKey: ["tenantSettings"] });
    },
  });
}
