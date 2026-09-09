"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    invoiceService,
    Invoice,
    CreateInvoicePayload,
    InvoiceFilters,
} from "@/services/invoiceService";

/**
 * Query keys for invoice-related queries
 */
const invoiceQueryKeys = {
    all: ["invoices"] as const,
    lists: () => [...invoiceQueryKeys.all, "list"] as const,
    list: (filters?: InvoiceFilters) =>
        [...invoiceQueryKeys.lists(), { ...filters }] as const,
    details: () => [...invoiceQueryKeys.all, "detail"] as const,
    detail: (id: string) => [...invoiceQueryKeys.details(), id] as const,
};

/**
 * Hook to fetch list of invoices
 */
export function useInvoicesList(filters?: InvoiceFilters) {
    return useQuery({
        queryKey: invoiceQueryKeys.list(filters),
        queryFn: () => invoiceService.listInvoices(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to fetch a single invoice
 */
export function useInvoice(id: string) {
    return useQuery({
        queryKey: invoiceQueryKeys.detail(id),
        queryFn: () => invoiceService.getInvoice(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateInvoicePayload) =>
            invoiceService.createInvoice(payload),
        onSuccess: (newInvoice) => {
            // Invalidate the invoices list query
            queryClient.invalidateQueries({
                queryKey: invoiceQueryKeys.lists(),
            });

            // Optionally add the new invoice to the cache
            queryClient.setQueryData<Invoice[]>(
                invoiceQueryKeys.list(),
                (oldData) => {
                    return oldData ? [newInvoice, ...oldData] : [newInvoice];
                }
            );
        },
    });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<CreateInvoicePayload>;
        }) => invoiceService.updateInvoice(id, payload),
        onSuccess: (updatedInvoice) => {
            // Invalidate the invoices list query
            queryClient.invalidateQueries({
                queryKey: invoiceQueryKeys.lists(),
            });

            // Update the specific invoice in cache
            queryClient.setQueryData(
                invoiceQueryKeys.detail(updatedInvoice.id),
                updatedInvoice
            );
        },
    });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invoiceService.deleteInvoice(id),
        onSuccess: (_, id) => {
            // Invalidate the invoices list query
            queryClient.invalidateQueries({
                queryKey: invoiceQueryKeys.lists(),
            });

            // Remove from cache
            queryClient.removeQueries({
                queryKey: invoiceQueryKeys.detail(id),
            });
        },
    });
}
