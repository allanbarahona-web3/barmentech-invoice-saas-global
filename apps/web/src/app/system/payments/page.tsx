"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, DollarSign, CreditCard, TrendingUp, Receipt } from "lucide-react";
import { usePayments, usePaymentSummary } from "@/modules/payments/payments.hooks";
import { PaymentsTable } from "@/modules/payments/components/PaymentsTable";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { getPaymentMethodById } from "@/constants/paymentMethods";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const router = useRouter();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: summary, isLoading: summaryLoading } = usePaymentSummary();
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    const loadCountry = async () => {
      const settings = await tenantSettingsService.getTenantSettings();
      if (settings) {
        setCountry(settings.country);
      }
    };
    loadCountry();
  }, []);

  const isLoading = paymentsLoading || summaryLoading;

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/system/invoices?id=${invoiceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los pagos recibidos de tus clientes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pagos</p>
              <p className="text-2xl font-bold">{summary?.totalPayments || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.totalAmount || 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Métodos Activos</p>
              <p className="text-2xl font-bold">
                {summary?.paymentsByMethod ? Object.keys(summary.paymentsByMethod).length : 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Promedio por Pago</p>
              <p className="text-2xl font-bold">
                {summary && summary.totalPayments > 0
                  ? formatCurrency(summary.totalAmount / summary.totalPayments)
                  : formatCurrency(0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      {summary?.paymentsByMethod && Object.keys(summary.paymentsByMethod).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pagos por Método</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(summary.paymentsByMethod).map(([methodId, data]) => {
              const method = getPaymentMethodById(methodId, country);
              return (
                <div key={methodId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{method?.icon || "💳"}</span>
                    <div>
                      <p className="font-medium text-sm">{method?.nameEs || methodId}</p>
                      <p className="text-xs text-muted-foreground">{data.count} pagos</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(data.amount)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> Para registrar un pago, ve a la sección de{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => router.push("/system/invoices")}
          >
            Facturas
          </span>{" "}
          y usa el botón "Pagar" en la factura correspondiente. También puedes aplicar pagos parciales
          o múltiples pagos a una misma factura.
        </p>
      </div>

      {/* Payments Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Historial de Pagos</h2>
        <PaymentsTable
          payments={payments || []}
          country={country}
          onViewInvoice={handleViewInvoice}
        />
      </div>
    </div>
  );
}
