"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Send, CheckCircle, FileText, Archive, Pencil, Wallet, Receipt } from "lucide-react";
import {
  useInvoice,
  useUpdateInvoice,
  useUpdateInvoiceStatus,
  useRecordInvoiceExportPdf,
  useRecordInvoiceSent,
  useConvertQuoteToInvoice,
  useArchiveInvoice,
} from "@/modules/invoices/invoice.hooks";
import { useCustomer } from "@/modules/customers/customer.hooks";
import { useCompanyProfile } from "@/modules/company/company.hooks";
import { useProducts } from "@/modules/products/product.hooks";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { InvoicePreview } from "@/modules/invoices/components/InvoicePreview";
import { InvoiceActivity } from "@/modules/invoices/components/InvoiceActivity";
import { SendInvoiceDialog } from "@/modules/invoices/components/SendInvoiceDialog";
import { RegisterPaymentDialog } from "@/modules/payments/components/RegisterPaymentDialog";
import { InvoicePaymentsHistory } from "@/modules/payments/components/InvoicePaymentsHistory";
import { getInvoicePaymentInfo } from "@/modules/payments/payments.utils";
import { usePayments } from "@/modules/payments/payments.hooks";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/i18n";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [country, setCountry] = useState<string>("");

  // Get return URL from query params, default to invoices list
  const returnTo = searchParams.get('returnTo') || '/system/invoices';

  // Get payments for this invoice
  const { data: allPayments = [] } = usePayments();

  const { data: invoice, isLoading: loadingInvoice, isError: invoiceError } = useInvoice(invoiceId);
  
  // Filter payments after invoice is loaded
  const invoicePayments = invoice ? allPayments.filter(p => p.invoiceId === invoice.id) : [];
  
  // Only fetch customer when invoice is loaded and has a customerId
  const { data: customer, isLoading: loadingCustomer, isError: customerError } = useCustomer(
    invoice?.customerId || ""
  );
  const { data: companyProfile, isLoading: loadingCompany } = useCompanyProfile();
  const { data: tenantSettings, isLoading: loadingSettings } = useTenantSettingsQuery();
  const { data: products } = useProducts();
  
  const updateInvoice = useUpdateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const recordExportPdf = useRecordInvoiceExportPdf();
  const recordSent = useRecordInvoiceSent();
  const convertToInvoice = useConvertQuoteToInvoice();
  const archiveMutation = useArchiveInvoice();

  // Calculate loading state: initial load or dependent data still loading
  const isLoading = loadingInvoice || loadingCompany || loadingSettings || (invoice && loadingCustomer);

  // Debug logs
  useEffect(() => {
    console.log('[InvoiceDetailPage] Query States:', {
      invoiceId,
      loadingInvoice,
      invoiceError,
      hasInvoice: !!invoice,
      invoiceCustomerId: invoice?.customerId,
      loadingCustomer,
      customerError,
      hasCustomer: !!customer,
      loadingCompany,
      hasCompanyProfile: !!companyProfile,
      loadingSettings,
      hasTenantSettings: !!tenantSettings,
      calculatedIsLoading: isLoading,
    });
  }, [invoiceId, loadingInvoice, invoiceError, invoice, loadingCustomer, customerError, customer, loadingCompany, companyProfile, loadingSettings, tenantSettings, isLoading]);

  useEffect(() => {
    if (invoiceError) {
      console.error('[InvoiceDetailPage] Error loading invoice:', invoiceError);
    }
    if (customerError) {
      console.error('[InvoiceDetailPage] Error loading customer:', customerError);
    }
  }, [invoiceError, customerError]);

  useEffect(() => {
    if (invoice) {
      console.log('[InvoiceDetailPage] Invoice loaded:', {
        id: invoice.id,
        number: invoice.invoiceNumber,
        type: invoice.type,
        status: invoice.status,
        customerId: invoice.customerId,
        total: invoice.total,
      });
    }
  }, [invoice]);

  useEffect(() => {
    if (customer) {
      console.log('[InvoiceDetailPage] Customer loaded:', {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      });
    }
  }, [customer]);

  useEffect(() => {
    if (companyProfile) {
      console.log('[InvoiceDetailPage] Company profile loaded:', {
        hasLogo: !!companyProfile.branding?.logoUrl,
        hasName: !!companyProfile.legal?.legalName,
      });
    } else {
      console.warn('[InvoiceDetailPage] Company profile is missing');
    }
  }, [companyProfile]);

  useEffect(() => {
    if (tenantSettings) {
      console.log('[InvoiceDetailPage] Tenant settings loaded:', {
        currency: tenantSettings.currency,
        taxEnabled: tenantSettings.taxEnabled,
      });
    } else {
      console.warn('[InvoiceDetailPage] Tenant settings are missing');
    }
  }, [tenantSettings]);

  useEffect(() => {
    const loadCountry = async () => {
      if (tenantSettings) {
        setCountry(tenantSettings.country);
      }
    };
    loadCountry();
  }, [tenantSettings]);

  // Calculate payment info
  const paymentInfo = invoice ? getInvoicePaymentInfo(invoice.id, invoice.total, allPayments) : null;

  const handleExportPdf = async () => {
    if (!invoice) return;
    console.log('[InvoiceDetailPage] Exporting PDF for invoice:', invoice.id);

    // Record the export event
    try {
      await recordExportPdf.mutateAsync(invoice.id);
      console.log('[InvoiceDetailPage] PDF export recorded successfully');
      toast.success(t().invoiceActions.pdfExported);
    } catch (error) {
      // Even if recording fails, still show print dialog
      console.error('[InvoiceDetailPage] Failed to record PDF export:', error);
    }

    // Trigger print dialog
    window.print();
  };

  const handleMarkAsIssued = async () => {
    if (!invoice) return;
    console.log('[InvoiceDetailPage] Marking invoice as issued:', invoice.id);

    try {
      await updateStatus.mutateAsync({
        id: invoice.id,
        status: "issued",
      });
      console.log('[InvoiceDetailPage] Invoice marked as issued successfully');
      toast.success(t().invoiceActions.markedAsIssued);
    } catch (error) {
      console.error('[InvoiceDetailPage] Error marking invoice as issued:', error);
      toast.error(t().invoiceActions.errorUpdatingStatus);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!invoice || invoice.type !== "quote") return;
    console.log('[InvoiceDetailPage] Converting quote to invoice:', invoice.id);

    try {
      const newInvoice = await convertToInvoice.mutateAsync(invoice.id);
      console.log('[InvoiceDetailPage] Quote converted successfully, new invoice ID:', newInvoice.id);
      toast.success(t().invoiceActions.quoteConverted);
      // Navigate to the new invoice
      router.push(`/system/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error('[InvoiceDetailPage] Error converting quote to invoice:', error);
      toast.error(t().invoiceActions.errorConverting);
    }
  };

  const handleArchive = async () => {
    if (!invoice) return;
    console.log('[InvoiceDetailPage] Archiving document:', invoice.id);

    try {
      await archiveMutation.mutateAsync(invoice.id);
      console.log('[InvoiceDetailPage] Document archived successfully');
      toast.success(t().invoiceActions.documentArchived);
      router.push("/system/invoices");
    } catch (error) {
      console.error('[InvoiceDetailPage] Error archiving document:', error);
      toast.error(t().invoiceActions.errorArchiving);
    }
  };

  const handleSendInvoice = async (toEmail?: string, message?: string, cc?: string[]) => {
    if (!invoice) return;
    console.log('[InvoiceDetailPage] Sending document:', { invoiceId: invoice.id, toEmail, hasMessage: !!message, ccCount: cc?.length });

    try {
      await recordSent.mutateAsync({
        id: invoice.id,
        toEmail,
        message,
      });
      console.log('[InvoiceDetailPage] Document sent successfully');
      const successMessage = invoice.type === "quote" 
        ? t().invoiceActions.quoteSent 
        : t().invoiceActions.invoiceSent;
      toast.success(successMessage);
      setSendDialogOpen(false);
    } catch (error) {
      console.error('[InvoiceDetailPage] Error sending document:', error);
      toast.error(t().invoiceActions.errorUpdatingStatus);
    }
  };

  const handleScheduleSend = async (toEmail: string, message: string, scheduledFor: string, cc?: string[]) => {
    if (!invoice) return;
    console.log('[InvoiceDetailPage] Scheduling send:', { invoiceId: invoice.id, toEmail, scheduledFor, ccCount: cc?.length });

    try {
      // Create invoice input with scheduled send configuration
      const invoiceInput = {
        type: invoice.type,
        customerId: invoice.customerId,
        currency: invoice.currency,
        paymentTerms: invoice.paymentTerms,
        customNetDays: invoice.customNetDays,
        items: invoice.items.map(item => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          discount: item.discount,
          productId: item.productId,
        })),
        deliveryFee: invoice.deliveryFee ?? 0,
        status: invoice.status,
        recurringConfig: invoice.recurringConfig,
        scheduledSend: {
          enabled: true,
          scheduledFor,
          toEmail,
          cc,
          message,
          status: "pending" as const,
        },
      };

      await updateInvoice.mutateAsync({
        id: invoice.id,
        input: invoiceInput,
      });

      console.log('[InvoiceDetailPage] Send scheduled successfully');
      toast.success('Envío programado correctamente');
      setSendDialogOpen(false);
    } catch (error) {
      console.error('[InvoiceDetailPage] Error scheduling send:', error);
      toast.error('Error al programar el envío');
    }
  };

  const invoiceUrl = typeof window !== "undefined" ? window.location.href : "";

  // Loading state
  if (isLoading) {
    console.log('[InvoiceDetailPage] Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t().invoicePreview.loading}</p>
        </div>
      </div>
    );
  }

  // Empty state - invoice not found or error loading invoice
  if (!invoice || invoiceError) {
    console.log('[InvoiceDetailPage] Rendering not found state:', { hasInvoice: !!invoice, invoiceError });
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">{t().invoicePreview.notFound}</h2>
          <p className="text-muted-foreground">{t().invoicePreview.notFoundDescription}</p>
        </div>
        <Button onClick={() => router.push(returnTo)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t().invoicePreview.backToInvoices}
        </Button>
      </div>
    );
  }

  // Empty state - missing related data (only check after loading is complete)
  if (!customer || !companyProfile || !tenantSettings) {
    console.error('[InvoiceDetailPage] Missing required data:', {
      hasCustomer: !!customer,
      hasCompanyProfile: !!companyProfile,
      hasTenantSettings: !!tenantSettings,
    });
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">{t().invoicePreview.errorLoading}</h2>
          <p className="text-muted-foreground">
            {t().invoicePreview.errorLoadingDescription}
          </p>
        </div>
        <Button onClick={() => router.push(returnTo)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t().invoicePreview.backToInvoices}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-background p-4 rounded-lg border no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(returnTo)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t().invoicePreview.back}
          </Button>
          
          {invoice?.status === "draft" && (
            <Button variant="outline" onClick={() => router.push(`/system/invoices/${invoice.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Export PDF - Available for all documents */}
          <Button 
            variant="outline" 
            onClick={handleExportPdf}
            disabled={recordExportPdf.isPending}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {t().invoiceActions.exportPdf}
          </Button>

          {/* Send - Available for all documents */}
          <Button
            variant="outline"
            onClick={() => setSendDialogOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            {invoice?.type === "quote" ? t().invoiceActions.sendQuote : t().invoiceActions.sendInvoice}
          </Button>

          {/* Payment Button - Show for issued/sent invoices that are not fully paid */}
          {invoice?.type === "invoice" && 
           (invoice?.status === "issued" || invoice?.status === "sent") && 
           paymentInfo?.status !== "paid" && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}

          {/* Payment History Button - Show for invoices with payments */}
          {invoice?.type === "invoice" && invoicePayments.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setPaymentHistoryOpen(true)}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Historial de Pagos ({invoicePayments.length})
            </Button>
          )}

          {/* Invoice-specific actions */}
          {invoice?.type === "invoice" && (
            <>
              {invoice?.status === "draft" && (
                <Button
                  onClick={handleMarkAsIssued}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {updateStatus.isPending
                    ? t().invoiceActions.markingAsIssued
                    : t().invoiceActions.markAsIssued}
                </Button>
              )}
            </>
          )}

          {/* Quote-specific actions */}
          {invoice?.type === "quote" && invoice?.status !== "archived" && (
            <Button
              onClick={handleConvertToInvoice}
              disabled={convertToInvoice.isPending}
            >
              <FileText className="mr-2 h-4 w-4" />
              {convertToInvoice.isPending
                ? t().invoiceActions.convertingToInvoice
                : t().invoiceActions.convertToInvoice}
            </Button>
          )}

          {/* Archive - Available for all documents */}
          {invoice?.status !== "archived" && (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              {archiveMutation.isPending
                ? t().invoiceActions.archiving
                : t().invoiceActions.archive}
            </Button>
          )}
        </div>
      </div>

      {/* Payment Status Info */}
      {invoice?.type === "invoice" && paymentInfo && paymentInfo.status !== "unpaid" && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Estado de Pago</p>
                <p className="text-lg font-semibold">
                  {paymentInfo.status === "paid" && (
                    <Badge className="bg-green-600">Pagada Completamente</Badge>
                  )}
                  {paymentInfo.status === "partial" && (
                    <Badge className="bg-amber-600">Pago Parcial</Badge>
                  )}
                  {paymentInfo.status === "overpaid" && (
                    <Badge variant="secondary">Sobrepago</Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total: ${paymentInfo.invoiceTotal.toFixed(2)}</p>
              <p className="text-sm text-green-600 font-medium">Pagado: ${paymentInfo.totalPaid.toFixed(2)}</p>
              {paymentInfo.balance > 0 && (
                <p className="text-sm text-amber-600 font-medium">Saldo: ${paymentInfo.balance.toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Preview + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoice Preview (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <InvoicePreview
            invoice={invoice}
            companyProfile={companyProfile}
            customer={customer}
            tenantSettings={tenantSettings}
            products={products}
          />
        </div>

        {/* Activity Timeline (1 column on large screens, hidden on print) */}
        <div className="no-print">
          <InvoiceActivity events={invoice?.events} />
        </div>
      </div>

      {/* Send Dialog */}
      {invoice && customer && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceNumber={invoice.invoiceNumber}
          customerEmail={customer.email}
          invoiceUrl={invoiceUrl}
          allowScheduledSend={tenantSettings?.features?.allowScheduledSend || false}
          allowUnlimitedCC={tenantSettings?.features?.allowUnlimitedCC || false}
          onSend={handleSendInvoice}
          onScheduleSend={handleScheduleSend}
        />
      )}

      {/* Payment Dialog */}
      {invoice && paymentInfo && (
        <RegisterPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total,
            totalPaid: paymentInfo.totalPaid,
          }}
          country={country}
        />
      )}

      {/* Payment History Modal */}
      {invoice && customer && (
        <InvoicePaymentsHistory
          open={paymentHistoryOpen}
          onOpenChange={setPaymentHistoryOpen}
          payments={invoicePayments}
          country={country}
          invoiceTotal={invoice.total}
          invoiceNumber={invoice.invoiceNumber}
          customerName={customer.name}
          companyName={companyProfile?.legal?.legalName || "Mi Empresa"}
        />
      )}
    </div>
  );
}
