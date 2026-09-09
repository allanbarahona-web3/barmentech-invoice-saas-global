"use client";

import { getHttpClient } from "@/lib/httpClient";

export interface Invoice {
    id: string;
    number: string;
    customerId: string;
    customerName: string;
    amount: number;
    status: "draft" | "sent" | "paid" | "overdue";
    dueDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoicePayload {
    customerId: string;
    customerName: string;
    amount: number;
    dueDate: string;
}

export interface InvoiceFilters {
    status?: Invoice["status"];
    skip?: number;
    take?: number;
}

/**
 * Invoice Service
 * Handles all invoice-related API calls
 */
export const invoiceService = {
    /**
     * Fetch list of invoices with optional filters
     */
    async listInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
        try {
            const httpClient = getHttpClient();
            const response = await httpClient.get<Invoice[]>("/invoices", {
                params: filters,
            });
            return response.data;
        } catch (error) {
            // For now, return mock data if API call fails
            return getMockInvoices();
        }
    },

    /**
     * Create a new invoice
     */
    async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
        try {
            const httpClient = getHttpClient();
            const response = await httpClient.post<Invoice>("/invoices", payload);
            return response.data;
        } catch (error) {
            // For now, return mock data if API call fails
            return getMockInvoice(payload);
        }
    },

    /**
     * Get a single invoice by ID
     */
    async getInvoice(id: string): Promise<Invoice> {
        try {
            const httpClient = getHttpClient();
            const response = await httpClient.get<Invoice>(`/invoices/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update an invoice
     */
    async updateInvoice(
        id: string,
        payload: Partial<CreateInvoicePayload>
    ): Promise<Invoice> {
        try {
            const httpClient = getHttpClient();
            const response = await httpClient.put<Invoice>(
                `/invoices/${id}`,
                payload
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete an invoice
     */
    async deleteInvoice(id: string): Promise<void> {
        try {
            const httpClient = getHttpClient();
            await httpClient.delete(`/invoices/${id}`);
        } catch (error) {
            throw error;
        }
    },
};

/**
 * Mock helpers for development
 */
function getMockInvoices(): Invoice[] {
    return [
        {
            id: "invoice_1",
            number: "INV-001",
            customerId: "customer_1",
            customerName: "Acme Corporation",
            amount: 2500,
            status: "paid",
            dueDate: "2026-02-28",
            createdAt: "2026-02-01",
            updatedAt: "2026-02-15",
        },
        {
            id: "invoice_2",
            number: "INV-002",
            customerId: "customer_2",
            customerName: "Tech Solutions Inc",
            amount: 1800,
            status: "sent",
            dueDate: "2026-02-28",
            createdAt: "2026-02-02",
            updatedAt: "2026-02-02",
        },
        {
            id: "invoice_3",
            number: "INV-003",
            customerId: "customer_3",
            customerName: "Global Services Ltd",
            amount: 3200,
            status: "paid",
            dueDate: "2026-02-25",
            createdAt: "2026-02-03",
            updatedAt: "2026-02-20",
        },
        {
            id: "invoice_4",
            number: "INV-004",
            customerId: "customer_4",
            customerName: "Digital Ventures",
            amount: 950,
            status: "overdue",
            dueDate: "2026-01-28",
            createdAt: "2026-01-28",
            updatedAt: "2026-02-01",
        },
        {
            id: "invoice_5",
            number: "INV-005",
            customerId: "customer_5",
            customerName: "Innovation Labs",
            amount: 4100,
            status: "draft",
            dueDate: "2026-03-05",
            createdAt: "2026-02-04",
            updatedAt: "2026-02-04",
        },
    ];
}

function getMockInvoice(payload: CreateInvoicePayload): Invoice {
    const invoices = getMockInvoices();
    const nextNumber = `INV-${String(invoices.length + 1).padStart(3, "0")}`;

    return {
        id: `invoice_${Date.now()}`,
        number: nextNumber,
        customerId: payload.customerId,
        customerName: payload.customerName,
        amount: payload.amount,
        status: "draft",
        dueDate: payload.dueDate,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
    };
}
