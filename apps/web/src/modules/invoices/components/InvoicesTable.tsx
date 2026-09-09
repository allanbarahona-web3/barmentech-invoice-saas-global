"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Loader2, FileText, Repeat, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice, InvoiceEvent } from "../invoice.schema";
import { useInvoices, useDeleteInvoice } from "../invoice.hooks";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n";
import { RegisterPaymentDialog } from "@/modules/payments/components/RegisterPaymentDialog";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { usePayments } from "@/modules/payments/payments.hooks";
import { getInvoicePaymentInfo, getPaymentStatusLabel, getPaymentStatusVariant } from "@/modules/payments/payments.utils";
import { ReminderButton } from "@/modules/reminders/components";
import { getDocumentTypeLabel, getStatusDefinition, getStatusLabel } from "@/lib/countryRegistry";

function getLastEvent(invoice: Invoice): InvoiceEvent | undefined {
  if (!invoice.events || invoice.events.length === 0) return undefined;
  return invoice.events[invoice.events.length - 1];
}

function getEventLabel(eventType: InvoiceEvent["type"]): string {
  const labels: Record<InvoiceEvent["type"], string> = {
    CREATED: t().invoiceActivity.eventCreated,
    CREATED_DRAFT: t().invoiceActivity.eventCreatedDraft,
    CREATED_FROM_QUOTE: t().invoiceActivity.eventCreatedFromQuote,
    UPDATED: t().invoiceActivity.eventUpdated,
    EXPORTED_PDF: t().invoiceActivity.eventExportedPdf,
    MARKED_ISSUED: t().invoiceActivity.eventMarkedIssued,
    SENT: t().invoiceActivity.eventSent,
    QUOTE_SENT: t().invoiceActivity.eventQuoteSent,
    CONVERTED_TO_INVOICE: t().invoiceActivity.eventConvertedToInvoice,
    ARCHIVED: t().invoiceActivity.eventArchived,
    MARKED_PAID: "Marcada como Pagada",
    PAYMENT_REGISTERED: "Pago Registrado",
    PAYMENT_DELETED: "Pago Eliminado",
  };
  return labels[eventType] || eventType;
}

export function InvoicesTable() {
  const router = useRouter();
  const { data: invoices, isLoading } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: allPayments = [] } = usePayments();
  const deleteMutation = useDeleteInvoice();
  const { toast } = useToast();

  console.log('[InvoicesTable] Invoices loaded:', invoices?.length || 0);
  console.log('[InvoicesTable] isLoading:', isLoading);

  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | undefined>();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | undefined>();
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

  const getPaymentTermsLabel = (invoice: Invoice): string => {
    switch (invoice.paymentTerms) {
      case "due_on_receipt":
        return "Contado";
      case "net_15":
        return "Net 15";
      case "net_30":
        return "Net 30";
      case "net_60":
        return "Net 60";
      case "net_90":
        return "Net 90";
      case "custom":
        return invoice.customNetDays ? `Custom (${invoice.customNetDays} días)` : "Custom";
      default:
        return "—";
    }
  };

  const isCreditInvoice = (invoice: Invoice): boolean => {
    return invoice.paymentTerms !== "due_on_receipt";
  };

  // Filter invoices based on active tab
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    switch (activeTab) {
      case "all":
        return invoices;
      case "invoices":
        return invoices.filter(inv => inv.type === "invoice");
      case "quotes":
        return invoices.filter(inv => inv.type === "quote");
      case "credit":
        return invoices.filter(isCreditInvoice);
      case "draft":
        return invoices.filter(inv => inv.status === "draft");
      case "issued":
        return invoices.filter(inv => inv.status === "issued");
      case "sent":
        return invoices.filter(inv => inv.status === "sent");
      case "paid":
        return invoices.filter(inv => inv.status === "paid");
      case "archived":
        return invoices.filter(inv => inv.status === "archived");
      default:
        return invoices;
    }
  }, [invoices, activeTab]);

  // Count invoices by category
  const counts = useMemo(() => {
    if (!invoices) return { all: 0, invoices: 0, quotes: 0, credit: 0, draft: 0, issued: 0, sent: 0, paid: 0, archived: 0 };
    
    return {
      all: invoices.length,
      invoices: invoices.filter(inv => inv.type === "invoice").length,
      quotes: invoices.filter(inv => inv.type === "quote").length,
      credit: invoices.filter(isCreditInvoice).length,
      draft: invoices.filter(inv => inv.status === "draft").length,
      issued: invoices.filter(inv => inv.status === "issued").length,
      sent: invoices.filter(inv => inv.status === "sent").length,
      paid: invoices.filter(inv => inv.status === "paid").length,
      archived: invoices.filter(inv => inv.status === "archived").length,
    };
  }, [invoices]);

  const getCustomerName = (customerId: string): string => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "—";
  };

  const handleDelete = () => {
    if (!deletingInvoice) return;

    deleteMutation.mutate(deletingInvoice.id, {
      onSuccess: () => {
        toast({
          title: t().invoices.deleteSuccessTitle,
          description: t().invoices.deleteSuccessDescription,
        });
        setDeletingInvoice(undefined);
      },
      onError: () => {
        toast({
          title: t().invoices.deleteErrorTitle,
          description: t().invoices.deleteErrorDescription,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t().invoices.emptyTitle}</h3>
        <p className="text-muted-foreground">{t().invoices.emptyDescription}</p>
      </div>
    );
  }

  const renderTable = () => {
    if (filteredInvoices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay resultados</h3>
          <p className="text-muted-foreground">No se encontraron facturas con este filtro</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>{t().invoices.tableHeaderNumber}</TableHead>
              <TableHead>{t().invoices.tableHeaderCustomer}</TableHead>
              <TableHead className="text-right">{t().invoices.tableHeaderTotal}</TableHead>
              <TableHead>{t().invoices.tableHeaderStatus}</TableHead>
              <TableHead>Estado Pago</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Términos</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>{t().invoices.tableHeaderDate}</TableHead>
              <TableHead className="hidden md:table-cell">Última acción</TableHead>
              <TableHead className="text-right">{t().invoices.tableHeaderActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const paymentInfo = invoice.type === "invoice" 
                ? getInvoicePaymentInfo(invoice.id, invoice.total, allPayments)
                : null;
                
              return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Badge variant={invoice.type === "invoice" ? "default" : "secondary"}>
                    {getDocumentTypeLabel(invoice.type, country, t().invoices as Record<string, unknown>)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium font-mono">
                  <div className="flex items-center gap-2">
                    <span>{invoice.invoiceNumber}</span>
                    {invoice.recurringConfig?.enabled && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-normal flex items-center gap-1 px-2 py-0 h-5 border-blue-200 text-blue-600 bg-blue-50"
                        title={`Factura recurrente ${invoice.recurringConfig.frequency === "weekly" ? "Semanal" : invoice.recurringConfig.frequency === "biweekly" ? "Quincenal" : invoice.recurringConfig.frequency === "monthly" ? "Mensual" : invoice.recurringConfig.frequency === "quarterly" ? "Trimestral" : invoice.recurringConfig.frequency === "semiannual" ? "Semestral" : "Anual"} - Próxima: ${invoice.recurringConfig.nextGenerationDate ? new Date(invoice.recurringConfig.nextGenerationDate).toLocaleDateString() : "—"}`}
                      >
                        <Repeat className="h-3 w-3" />
                        <span className="hidden sm:inline">Recurrente</span>
                      </Badge>
                    )}
                    {invoice.scheduledSend?.enabled && invoice.scheduledSend.status === "pending" && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-normal flex items-center gap-1 px-2 py-0 h-5 border-emerald-200 text-emerald-600 bg-emerald-50"
                        title={`Envío programado para: ${new Date(invoice.scheduledSend.scheduledFor).toLocaleString()} - Email: ${invoice.scheduledSend.toEmail}`}
                      >
                        <Clock className="h-3 w-3" />
                        <span className="hidden sm:inline">Programado</span>
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                <TableCell className="text-right font-medium">
                  {invoice.currency} {invoice.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  {(() => {
                    const statusDefinition = getStatusDefinition(invoice.status, country);
                    const statusLabel = getStatusLabel(
                      invoice.status,
                      country,
                      t().invoices as Record<string, unknown>
                    );

                    return (
                  <Badge 
                    variant={statusDefinition?.badgeVariant || "secondary"}
                    className={statusDefinition?.badgeClassName || ""}
                  >
                    {statusLabel}
                  </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {invoice.type === "invoice" && paymentInfo ? (
                    <Badge variant={getPaymentStatusVariant(paymentInfo.status)}>
                      {getPaymentStatusLabel(paymentInfo.status)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {invoice.type === "invoice" && paymentInfo ? (
                    <span className={
                      paymentInfo.balance > 0 
                        ? "font-medium text-amber-600" 
                        : "text-green-600"
                    }>
                      ${paymentInfo.balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {isCreditInvoice(invoice) ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {getPaymentTermsLabel(invoice)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.dueDate && isCreditInvoice(invoice)
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {(() => {
                    const lastEvent = getLastEvent(invoice);
                    if (!lastEvent) return <span className="text-xs text-muted-foreground">—</span>;
                    return (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {getEventLabel(lastEvent.type)}
                        </Badge>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {(invoice.status === "issued" || invoice.status === "sent") && 
                     invoice.type === "invoice" && 
                     paymentInfo && 
                     paymentInfo.status !== "paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPaymentInvoice(invoice)}
                        title="Registrar pago"
                      >
                        <Wallet className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {invoice.type === "invoice" && (
                      <ReminderButton
                        invoice={invoice}
                        customer={customers?.find(c => c.id === invoice.customerId) || { id: invoice.customerId, name: "Cliente desconocido", email: "", status: "active", contactPreferences: { preferredChannel: "email", consentStatus: "unknown", preferredTime: "any", allowEmail: true, allowWhatsApp: false }, createdAt: "", updatedAt: "" }}
                        variant="ghost"
                        size="icon"
                        showBadge
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/system/invoices/${invoice.id}`)}
                      title={t().invoices.viewInvoice}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingInvoice(invoice)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-8 w-full mb-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todas ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm">
            Facturas ({counts.invoices})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="text-xs sm:text-sm">
            Cotizaciones ({counts.quotes})
          </TabsTrigger>
          <TabsTrigger value="credit" className="text-xs sm:text-sm">
            Crédito ({counts.credit})
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm">
            Borradores ({counts.draft})
          </TabsTrigger>
          <TabsTrigger value="issued" className="text-xs sm:text-sm">
            Emitidas ({counts.issued})
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs sm:text-sm">
            Enviadas ({counts.sent})
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs sm:text-sm">
            Archivadas ({counts.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {renderTable()}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t().invoices.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t().invoices.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingInvoice(undefined)}
              disabled={deleteMutation.isPending}
            >
              {t().invoices.cancelButton}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t().invoices.deleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {paymentInvoice && (
        <RegisterPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(undefined)}
          invoice={{
            id: paymentInvoice.id,
            invoiceNumber: paymentInvoice.invoiceNumber,
            total: paymentInvoice.total,
            totalPaid: getInvoicePaymentInfo(paymentInvoice.id, paymentInvoice.total, allPayments).totalPaid,
          }}
          country={country}
        />
      )}
    </>
  );
}
