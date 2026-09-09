"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { FileText, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { usePayments } from "@/modules/payments/payments.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { formatCurrency } from "@/lib/utils";
import { t } from "@/i18n";

interface MetricCard {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
}

export function TenantDashboardCards() {
    const { data: invoices, isLoading: loadingInvoices } = useInvoices();
    const { data: payments, isLoading: loadingPayments } = usePayments();
    const { data: settings } = useTenantSettingsQuery();

    const metrics = useMemo(() => {
        if (!invoices || !payments || !settings) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Filter only invoices (not quotes)
        const actualInvoices = invoices.filter(inv => inv.type === 'invoice');

        // Current month invoices
        const currentMonthInvoices = actualInvoices.filter(inv => {
            const date = new Date(inv.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Last month invoices
        const lastMonthInvoices = actualInvoices.filter(inv => {
            const date = new Date(inv.createdAt);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        });

        // Calculate total revenue (paid invoices)
        const paidInvoices = actualInvoices.filter(inv => inv.status === 'paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate pending payments
        const pendingInvoices = actualInvoices.filter(
            inv => inv.status === 'issued' || inv.status === 'sent'
        );
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Calculate paid percentage
        const totalInvoicesCount = actualInvoices.length;
        const paidCount = paidInvoices.length;
        const paidPercentage = totalInvoicesCount > 0 
            ? Math.round((paidCount / totalInvoicesCount) * 100) 
            : 0;

        // Calculate trends
        const currentMonthCount = currentMonthInvoices.length;
        const lastMonthCount = lastMonthInvoices.length;
        const invoiceTrend = lastMonthCount > 0 
            ? Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100)
            : (currentMonthCount > 0 ? 100 : 0);

        const cards: MetricCard[] = [
            {
                label: t().system.totalInvoices,
                value: totalInvoicesCount,
                icon: <FileText className="w-6 h-6 text-blue-500" />,
                trend: {
                    value: Math.abs(invoiceTrend),
                    label: "Este mes",
                    positive: invoiceTrend >= 0,
                },
            },
            {
                label: t().system.totalRevenue,
                value: formatCurrency(totalRevenue, settings.currency),
                icon: <DollarSign className="w-6 h-6 text-green-500" />,
                trend: paidCount > 0 ? {
                    value: paidCount,
                    label: "facturas pagadas",
                    positive: true,
                } : undefined,
            },
            {
                label: t().system.pendingPayment,
                value: formatCurrency(pendingAmount, settings.currency),
                icon: <Clock className="w-6 h-6 text-amber-500" />,
                trend: pendingInvoices.length > 0 ? {
                    value: pendingInvoices.length,
                    label: "facturas",
                    positive: false,
                } : undefined,
            },
            {
                label: t().system.paidInvoices,
                value: `${paidPercentage}%`,
                icon: <CheckCircle className="w-6 h-6 text-green-500" />,
                trend: paidCount > 0 ? {
                    value: paidCount,
                    label: `de ${totalInvoicesCount}`,
                    positive: true,
                } : undefined,
            },
        ];

        return cards;
    }, [invoices, payments, settings]);

    if (loadingInvoices || loadingPayments || !metrics) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="flex items-center justify-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
                <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                {metric.label}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold">{metric.value}</p>
                            </div>
                            {metric.trend && (
                                <div className="flex items-center gap-1">
                                    <span
                                        className={`text-xs font-medium ${
                                            metric.trend.positive
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-amber-600 dark:text-amber-400"
                                        }`}
                                    >
                                        {metric.trend.positive && metric.trend.value > 0 ? "+" : ""}
                                        {metric.trend.value > 0 ? `${metric.trend.value}` : ""}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {metric.trend.label}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="text-muted-foreground">
                            {metric.icon}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
