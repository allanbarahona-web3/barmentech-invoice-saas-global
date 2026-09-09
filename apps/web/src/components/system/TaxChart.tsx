"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scale, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { formatCurrency } from "@/lib/utils";
import { TimeRange, filterByDateRange } from "./DashboardTimeFilter";

interface TaxChartProps {
  timeRange?: TimeRange;
}

export function TaxChart({ timeRange = "all" }: TaxChartProps) {
  const { data: invoices, isLoading } = useInvoices();
  const { data: settings } = useTenantSettingsQuery();

  const taxData = useMemo(() => {
    if (!invoices || !settings?.taxEnabled) {
      return {
        collected: 0,      // Impuestos cobrados (de facturas pagadas)
        pending: 0,        // Impuestos por cobrar (facturas emitidas/enviadas)
        totalDue: 0,       // Total de impuestos que debes pagar al gobierno
        netPosition: 0,    // collected - totalDue (positivo = a favor, negativo = deuda)
      };
    }

    const filteredInvoices = filterByDateRange(
      invoices.filter(inv => inv.type === 'invoice'),
      timeRange
    );

    // Impuestos cobrados (facturas pagadas)
    const collected = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.tax, 0);

    // Impuestos por cobrar (facturas emitidas/enviadas pero no pagadas)
    const pending = filteredInvoices
      .filter(inv => inv.status === 'issued' || inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.tax, 0);

    // En un sistema completo, totalDue incluiría:
    // - Impuestos de ventas (lo que cobras a clientes)
    // - Menos impuestos de compras (lo que pagas a proveedores)
    // Por ahora, asumimos que debes pagar todos los impuestos cobrados
    const totalDue = collected;

    // Posición neta (simplificado para MVP)
    const netPosition = collected - totalDue;

    return {
      collected,
      pending,
      totalDue,
      netPosition,
    };
  }, [invoices, settings, timeRange]);

  const chartData = useMemo(() => {
    if (!settings?.taxEnabled) return [];

    return [
      {
        name: 'Impuestos',
        cobrados: taxData.collected,
        pendientes: taxData.pending,
        porPagar: taxData.totalDue,
      },
    ];
  }, [taxData, settings]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && settings) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">Resumen de Impuestos</p>
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
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Gestión de Impuestos
          </CardTitle>
          <CardDescription>Impuestos cobrados vs. por pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings.taxEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Gestión de Impuestos
          </CardTitle>
          <CardDescription>Impuestos cobrados vs. por pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Scale className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Impuestos deshabilitados</p>
              <p className="text-sm mt-1">
                Activa los impuestos en configuración para ver este reporte
              </p>
            </div>
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
              <Scale className="h-5 w-5" />
              Gestión de Impuestos
            </CardTitle>
            <CardDescription>
              Impuestos cobrados, pendientes y por pagar ({settings.taxName} {settings.taxRate}%)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Cobrados</p>
            </div>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatCurrency(taxData.collected, settings.currency)}
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendientes</p>
            </div>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
              {formatCurrency(taxData.pending, settings.currency)}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Por Pagar</p>
            </div>
            <p className="text-lg font-bold text-red-900 dark:text-red-100">
              {formatCurrency(taxData.totalDue, settings.currency)}
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${
            taxData.netPosition >= 0 
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
              : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Scale className={`h-4 w-4 ${
                taxData.netPosition >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`} />
              <p className={`text-xs font-medium ${
                taxData.netPosition >= 0 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                Balance
              </p>
            </div>
            <p className={`text-lg font-bold ${
              taxData.netPosition >= 0 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-orange-900 dark:text-orange-100'
            }`}>
              {formatCurrency(Math.abs(taxData.netPosition), settings.currency)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {taxData.collected === 0 && taxData.pending === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-center">
              <Scale className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay datos de impuestos en este período</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
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
                dataKey="cobrados" 
                name="Cobrados" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="pendientes" 
                name="Pendientes" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="porPagar" 
                name="Por Pagar" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Info Note */}
        <div className="mt-4 bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">📝 Nota:</p>
          <p>
            Este reporte muestra los impuestos de tus ventas. Para un cálculo completo de impuestos por pagar,
            deberás restar los impuestos de tus compras (IVA acreditable) en tu declaración fiscal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
