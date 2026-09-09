"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, TrendingUp } from "lucide-react";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useReminderStats, shouldShowReminderBadge, getReminderUrgency } from "@/modules/reminders";
import { useRouter } from "next/navigation";
import { usePlanFeatures } from "@/modules/billing/features.hooks";

export function ReminderAlertCard() {
  const router = useRouter();
  const { data: invoices } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: stats } = useReminderStats();
  const { hasFeature, getReminderLimit, isUnlimited } = usePlanFeatures();
  
  const canSendReminders = hasFeature("reminders_manual");
  const reminderLimit = getReminderLimit();
  
  const needsReminder = useMemo(() => {
    if (!invoices || !customers) return { total: 0, high: 0, medium: 0, low: 0, invoices: [] };
    
    const invoicesNeedingReminder = invoices.filter(inv => 
      inv.type === "invoice" && shouldShowReminderBadge(inv)
    );
    
    return {
      total: invoicesNeedingReminder.length,
      high: invoicesNeedingReminder.filter(inv => getReminderUrgency(inv) === "high").length,
      medium: invoicesNeedingReminder.filter(inv => getReminderUrgency(inv) === "medium").length,
      low: invoicesNeedingReminder.filter(inv => getReminderUrgency(inv) === "low").length,
      invoices: invoicesNeedingReminder.slice(0, 3), // Top 3 most urgent
    };
  }, [invoices, customers]);
  
  if (!canSendReminders || needsReminder.total === 0) {
    return null;
  }
  
  const remainingReminders = isUnlimited(reminderLimit) 
    ? -1 
    : Math.max(0, reminderLimit - (stats?.thisMonth || 0));
  
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Recordatorios Pendientes</CardTitle>
          </div>
          <Badge variant="warning" className="text-lg px-3">
            {needsReminder.total}
          </Badge>
        </div>
        <CardDescription>
          {needsReminder.total === 1 
            ? "1 factura necesita recordatorio" 
            : `${needsReminder.total} facturas necesitan recordatorio`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgency breakdown */}
        <div className="flex gap-2">
          {needsReminder.high > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {needsReminder.high} Vencidas
            </Badge>
          )}
          {needsReminder.medium > 0 && (
            <Badge variant="warning" className="gap-1">
              {needsReminder.medium} Vencen pronto
            </Badge>
          )}
          {needsReminder.low > 0 && (
            <Badge variant="secondary" className="gap-1">
              {needsReminder.low} Próximas
            </Badge>
          )}
        </div>
        
        {/* Reminder limit info */}
        {!isUnlimited(reminderLimit) && (
          <div className="flex items-center justify-between p-2 bg-background rounded-md text-sm">
            <span className="text-muted-foreground">Recordatorios este mes:</span>
            <Badge variant={remainingReminders < 10 ? "destructive" : "secondary"}>
              {remainingReminders} restantes
            </Badge>
          </div>
        )}
        
        {/* Top invoices */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Más urgentes:</p>
          {needsReminder.invoices.map((invoice) => {
            const customer = customers?.find(c => c.id === invoice.customerId);
            const urgency = getReminderUrgency(invoice);
            
            return (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-2 bg-background rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/system/invoices/${invoice.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer?.name || "Cliente desconocido"}
                  </p>
                </div>
                <Badge 
                  variant={
                    urgency === "high" ? "destructive" : 
                    urgency === "medium" ? "warning" : 
                    "secondary"
                  }
                  className="ml-2 shrink-0"
                >
                  ${invoice.total.toFixed(2)}
                </Badge>
              </div>
            );
          })}
        </div>
        
        {/* CTA */}
        <Button 
          className="w-full" 
          variant="default"
          onClick={() => router.push("/system/invoices?tab=issued")}
        >
          Ver Facturas Pendientes
        </Button>
        
        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <TrendingUp className="h-3 w-3" />
            <span>{stats.sent} recordatorios enviados en total</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
