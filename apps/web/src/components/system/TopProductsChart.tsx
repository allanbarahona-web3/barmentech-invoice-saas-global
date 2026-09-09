"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useProducts } from "@/modules/products/product.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { formatCurrency } from "@/lib/utils";
import { TimeRange, filterByDateRange } from "./DashboardTimeFilter";

interface TopProductsChartProps {
  timeRange?: TimeRange;
}

export function TopProductsChart({ timeRange = "all" }: TopProductsChartProps) {
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: settings } = useTenantSettingsQuery();

  const chartData = useMemo(() => {
    if (!invoices || !products) return [];

    // Filter invoices by time range and only actual invoices (not quotes)
    const filteredInvoices = filterByDateRange(
      invoices.filter(inv => inv.type === 'invoice' && inv.status !== 'draft'),
      timeRange
    );

    // Aggregate sales by product
    const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};

    filteredInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.productId) {
          if (!productSales[item.productId]) {
            const product = products.find(p => p.id === item.productId);
            productSales[item.productId] = {
              quantity: 0,
              revenue: 0,
              name: product?.name || 'Producto desconocido',
            };
          }
          
          // Calculate line total with discount
          const lineSubtotal = item.qty * item.unitPrice;
          const discount = lineSubtotal * ((item.discount || 0) / 100);
          const lineTotal = lineSubtotal - discount;
          
          productSales[item.productId].quantity += item.qty;
          productSales[item.productId].revenue += lineTotal;
        }
      });
    });

    // Convert to array and sort by revenue
    const sortedProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.name.length > 20 ? data.name.substring(0, 20) + '...' : data.name,
        fullName: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 products

    return sortedProducts;
  }, [invoices, products, timeRange]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  }, [chartData]);

  const totalQuantity = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.quantity, 0);
  }, [chartData]);

  const COLORS = [
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && settings) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Cantidad: <span className="font-semibold text-foreground">{data.quantity}</span>
            </p>
            <p className="text-muted-foreground">
              Ingresos: <span className="font-semibold text-foreground">
                {formatCurrency(data.revenue, settings.currency)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loadingInvoices || loadingProducts || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Más Vendidos
          </CardTitle>
          <CardDescription>Top 10 por ingresos generados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px]">
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
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>Top 10 por ingresos generados</CardDescription>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Total vendido:
              </span>
              <span className="text-sm font-bold text-green-600">
                {totalQuantity} unidades
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Ingresos: {formatCurrency(totalRevenue, settings.currency)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay ventas de productos en este período</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <YAxis 
                type="category" 
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
