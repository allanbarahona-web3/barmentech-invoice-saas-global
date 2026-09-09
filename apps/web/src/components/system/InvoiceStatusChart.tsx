"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
    paid: "#10b981",      // green
    sent: "#3b82f6",      // blue
    issued: "#8b5cf6",    // purple
    draft: "#6b7280",     // gray
    archived: "#9ca3af",  // light gray
};

const STATUS_LABELS = {
    paid: "Pagadas",
    sent: "Enviadas",
    issued: "Emitidas",
    draft: "Cotizaciones",
    archived: "Archivadas",
};

export function InvoiceStatusChart() {
    const { data: invoices, isLoading } = useInvoices();

    const chartData = useMemo(() => {
        if (!invoices) return [];

        const actualInvoices = invoices.filter(inv => inv.type === 'invoice');
        
        const statusCount = actualInvoices.reduce((acc, invoice) => {
            acc[invoice.status] = (acc[invoice.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCount)
            .map(([status, count]) => ({
                name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
                value: count,
                color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#888",
                status,
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [invoices]);

    const totalInvoices = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = totalInvoices > 0 ? ((data.value / totalInvoices) * 100).toFixed(1) : 0;
            
            return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-sm mb-1">{data.name}</p>
                    <p className="text-sm">
                        <span className="font-semibold">{data.value}</span> facturas ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                    <CardDescription>Distribución por estado</CardDescription>
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
                <CardTitle>Estado de Facturas</CardTitle>
                <CardDescription>Distribución actual de {totalInvoices} facturas</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No hay facturas para mostrar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={2}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend with counts */}
                        <div className="grid grid-cols-2 gap-2">
                            {chartData.map((item, index) => {
                                const percentage = totalInvoices > 0 ? ((item.value / totalInvoices) * 100).toFixed(0) : 0;
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                        <Badge variant="outline">
                                            {item.value} ({percentage}%)
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
