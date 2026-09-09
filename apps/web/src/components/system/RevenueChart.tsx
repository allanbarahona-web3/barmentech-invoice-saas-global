"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart() {
    const { data: invoices, isLoading } = useInvoices();
    const { data: settings } = useTenantSettingsQuery();

    const chartData = useMemo(() => {
        if (!invoices) return [];

        const actualInvoices = invoices.filter(inv => inv.type === 'invoice');

        // Get last 6 months
        const months: Array<{
            month: string;
            monthKey: string;
            issued: number;
            paid: number;
        }> = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('es-CR', { month: 'short', year: 'numeric' });
            
            months.push({
                month: monthName,
                monthKey,
                issued: 0,
                paid: 0,
            });
        }

        // Calculate totals per month
        actualInvoices.forEach(invoice => {
            const date = new Date(invoice.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            const monthData = months.find(m => m.monthKey === monthKey);
            if (monthData) {
                if (invoice.status === 'paid') {
                    monthData.paid += invoice.total;
                } else if (invoice.status === 'issued' || invoice.status === 'sent') {
                    monthData.issued += invoice.total;
                }
            }
        });

        return months;
    }, [invoices]);

    const totals = useMemo(() => {
        if (!chartData.length) return { issued: 0, paid: 0 };

        return chartData.reduce(
            (acc, month) => ({
                issued: acc.issued + month.issued,
                paid: acc.paid + month.paid,
            }),
            { issued: 0, paid: 0 }
        );
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && settings) {
            return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value, settings.currency)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading || !settings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos</CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Ingresos</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Total pagado:
                            </span>
                            <span className="text-sm font-bold text-green-600">
                                {formatCurrency(totals.paid, settings.currency)}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Por cobrar: {formatCurrency(totals.issued, settings.currency)}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 || (totals.paid === 0 && totals.issued === 0) ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No hay datos de ingresos para mostrar</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="month" 
                                className="text-xs"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <YAxis 
                                className="text-xs"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                tickFormatter={(value) => {
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                    return value.toString();
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                                iconType="circle"
                            />
                            <Bar 
                                dataKey="paid" 
                                name="Pagado" 
                                fill="#10b981" 
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                                dataKey="issued" 
                                name="Por Cobrar" 
                                fill="#f59e0b" 
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
