"use client";

import { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye } from "lucide-react";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";

type InvoiceStatus = "draft" | "issued" | "sent" | "paid" | "archived";

function getStatusBadge(status: InvoiceStatus, dueDate?: string): {
    variant: "default" | "secondary" | "success" | "warning" | "destructive";
    label: string;
} {
    // Check if overdue
    if (dueDate && (status === "issued" || status === "sent")) {
        const due = new Date(dueDate);
        const now = new Date();
        if (due < now) {
            return { variant: "destructive", label: "Vencida" };
        }
    }

    switch (status) {
        case "paid":
            return { variant: "success", label: "Pagada" };
        case "sent":
            return { variant: "warning", label: "Enviada" };
        case "issued":
            return { variant: "warning", label: "Emitida" };
        case "draft":
            return { variant: "secondary", label: "Borrador" };
        case "archived":
            return { variant: "default", label: "Archivada" };
        default:
            return { variant: "default", label: "Pendiente" };
    }
}

export function RecentInvoicesTable() {
    const router = useRouter();
    const { data: invoices, isLoading: loadingInvoices } = useInvoices();
    const { data: customers, isLoading: loadingCustomers } = useCustomers();
    const { data: settings } = useTenantSettingsQuery();

    const recentInvoices = useMemo(() => {
        if (!invoices || !customers) return [];

        // Get only invoices (not quotes), sorted by creation date
        const actualInvoices = invoices
            .filter(inv => inv.type === 'invoice')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5); // Get top 5 most recent

        return actualInvoices.map(invoice => {
            const customer = customers.find(c => c.id === invoice.customerId);
            return {
                ...invoice,
                customerName: customer?.name || "Cliente desconocido",
            };
        });
    }, [invoices, customers]);

    const isLoading = loadingInvoices || loadingCustomers;

    const handleViewInvoice = (invoiceId: string) => {
        router.push(`/system/invoices/${invoiceId}`);
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{t().system.recentInvoicesTitle}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t().system.recentInvoicesDescription}
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/system/invoices')}
                    >
                        Ver todas
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : recentInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No hay facturas recientes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Factura</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentInvoices.map((invoice) => {
                                    const statusBadge = getStatusBadge(invoice.status, invoice.dueDate);
                                    const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('es-CR', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    });

                                    return (
                                        <TableRow 
                                            key={invoice.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleViewInvoice(invoice.id)}
                                        >
                                            <TableCell className="font-medium">
                                                {invoice.invoiceNumber}
                                            </TableCell>
                                            <TableCell>{invoice.customerName}</TableCell>
                                            <TableCell>
                                                {settings ? formatCurrency(invoice.total, settings.currency) : invoice.total}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusBadge.variant}>
                                                    {statusBadge.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {invoiceDate}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewInvoice(invoice.id);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </Card>
    );
}
