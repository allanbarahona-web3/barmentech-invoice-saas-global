"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeFilter, DateRange } from "@/components/shared/DateRangeFilter";
import { SendReportEmailDialog } from "@/components/system/SendReportEmailDialog";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useCompanyProfile } from "@/modules/company/company.hooks";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type FilterType = 'all' | 'invoiced' | 'pending' | 'quoted';

export default function InvoicesReportPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: companyProfile } = useCompanyProfile();
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Get report title based on active filter
  const getReportTitle = () => {
    switch (activeFilter) {
      case 'invoiced':
        return 'Reporte de Facturación - Total Facturado';
      case 'pending':
        return 'Reporte de Facturación - Pendientes de Pago';
      case 'quoted':
        return 'Reporte de Facturación - Total Cotizado';
      default:
        return 'Reporte de Facturación - Todos los Documentos';
    }
  };

  const getReportSubtitle = () => {
    switch (activeFilter) {
      case 'invoiced':
        return 'Solo facturas emitidas';
      case 'pending':
        return 'Solo facturas pendientes de pago';
      case 'quoted':
        return 'Solo cotizaciones';
      default:
        return 'Facturas y cotizaciones';
    }
  };

  // Filter invoices by date range
  const dateFilteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (!dateRange) return invoices;

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999); // Include full end date

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= fromDate && invoiceDate <= toDate;
    });
  }, [invoices, dateRange]);

  // Filter by type/status based on active filter
  const filteredInvoices = useMemo(() => {
    if (activeFilter === 'all') return dateFilteredInvoices;
    
    if (activeFilter === 'invoiced') {
      return dateFilteredInvoices.filter(inv => inv.type === 'invoice');
    }
    
    if (activeFilter === 'pending') {
      return dateFilteredInvoices.filter(inv => 
        inv.type === 'invoice' && (inv.status === 'issued' || inv.status === 'sent')
      );
    }
    
    if (activeFilter === 'quoted') {
      return dateFilteredInvoices.filter(inv => inv.type === 'quote');
    }
    
    return dateFilteredInvoices;
  }, [dateFilteredInvoices, activeFilter]);

  // Calculate summary
  const summary = useMemo(() => {
    const types = {
      invoices: dateFilteredInvoices.filter(inv => inv.type === 'invoice'),
      quotes: dateFilteredInvoices.filter(inv => inv.type === 'quote'),
    };

    const statuses = {
      draft: dateFilteredInvoices.filter(inv => inv.status === 'draft'),
      issued: dateFilteredInvoices.filter(inv => inv.status === 'issued'),
      sent: dateFilteredInvoices.filter(inv => inv.status === 'sent'),
      archived: dateFilteredInvoices.filter(inv => inv.status === 'archived'),
    };

    const totalInvoiced = types.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalQuoted = types.quotes.reduce((sum, inv) => sum + inv.total, 0);
    const totalPending = [...statuses.issued, ...statuses.sent].reduce((sum, inv) => sum + inv.total, 0);

    return {
      total: dateFilteredInvoices.length,
      totalInvoices: types.invoices.length,
      totalQuotes: types.quotes.length,
      totalInvoiced,
      totalQuoted,
      totalPending,
      byStatus: {
        draft: statuses.draft.length,
        issued: statuses.issued.length,
        sent: statuses.sent.length,
        archived: statuses.archived.length,
      },
    };
  }, [dateFilteredInvoices]);

  const getCustomerName = (customerId: string): string => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "—";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge variant="success">Emitida</Badge>;
      case "sent":
        return <Badge variant="warning">Enviada</Badge>;
      case "draft":
        return <Badge variant="secondary">Borrador</Badge>;
      case "archived":
        return <Badge variant="outline">Archivada</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600 text-white">Pagada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const exportToExcel = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay facturas para exportar.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    const headers = [
      "Número",
      "Cliente",
      "Tipo",
      "Estado",
      "Fecha",
      "Subtotal",
      "Impuesto",
      "Total",
    ];

    const rows = filteredInvoices.map((invoice) => [
      invoice.invoiceNumber,
      getCustomerName(invoice.customerId),
      invoice.type === 'invoice' ? 'Factura' : 'Cotización',
      invoice.status === 'issued' ? 'Emitida' :
        invoice.status === 'sent' ? 'Enviada' :
        invoice.status === 'draft' ? 'Borrador' : 'Archivada',
      new Date(invoice.createdAt).toLocaleDateString('es-ES'),
      invoice.subtotal.toString(),
      invoice.tax.toString(),
      invoice.total.toString(),
    ]);

    // Add summary rows
    rows.push([], ["RESUMEN"], []);
    rows.push(["Total Facturas:", summary.totalInvoices.toString()]);
    rows.push(["Total Cotizaciones:", summary.totalQuotes.toString()]);
    rows.push(["Total Facturado:", formatCurrency(summary.totalInvoiced)]);
    rows.push(["Total Cotizado:", formatCurrency(summary.totalQuoted)]);
    rows.push(["Pendiente de Pago:", formatCurrency(summary.totalPending)]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const dateStr = dateRange 
      ? `${dateRange.from}_${dateRange.to}`
      : new Date().toISOString().split('T')[0];
    
    const filterSuffix = activeFilter === 'all' ? '' : 
      activeFilter === 'invoiced' ? '_facturado' :
      activeFilter === 'pending' ? '_pendientes' : '_cotizado';
    
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_facturas${filterSuffix}_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
    toast({
      title: "Exportación exitosa",
      description: `${getReportTitle()}: ${filteredInvoices.length} documentos exportados a Excel.`,
    });
  };

  const exportToPDF = () => {
    setExporting(true);
    toast({
      title: "Generando PDF",
      description: `${getReportTitle()}...`,
    });
    
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 500);
  };

  const sendEmailReport = async (emails: string[]) => {
    // TODO: Implement backend endpoint to send report via email
    // This should generate both Excel and PDF on the server and send them
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simulate API call
        console.log("Sending report to:", emails);
        console.log("Date range:", dateRange);
        console.log("Total invoices:", filteredInvoices.length);
        resolve();
      }, 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible in PDF */}
      <div className="print-only hidden print:block mb-8 pb-4 border-b-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            {companyProfile?.branding?.logoUrl && (
              <img 
                src={companyProfile.branding.logoUrl} 
                alt="Logo" 
                className="h-12 mb-2"
              />
            )}
            <h1 className="text-2xl font-bold">
              {companyProfile?.legal?.legalName || "Barmentech Invoice System"}
            </h1>
            <p className="text-sm text-gray-600">
              {companyProfile?.legal?.commercialName || ""}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold mb-1">{getReportTitle().toUpperCase()}</h2>
            <p className="text-xs text-gray-500 mb-2">{getReportSubtitle()}</p>
            <p className="text-sm text-gray-600">
              Fecha de generación: {new Date().toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            {dateRange && (
              <p className="text-sm text-gray-600 mt-1">
                Período: {new Date(dateRange.from).toLocaleDateString('es-ES')} - {new Date(dateRange.to).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        </div>
        
        {/* Summary for Print - Compact */}
        <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Total Documentos</p>
            <p className="text-lg font-bold">{summary.total}</p>
            <p className="text-xs text-gray-500">{summary.totalInvoices} fact. • {summary.totalQuotes} cot.</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Total Facturado</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(summary.totalInvoiced)}</p>
            <p className="text-xs text-gray-500">{summary.totalInvoices} facturas</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Pendiente de Pago</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalPending)}</p>
            <p className="text-xs text-gray-500">{summary.byStatus.issued + summary.byStatus.sent} facturas</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Total Cotizado</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(summary.totalQuoted)}</p>
            <p className="text-xs text-gray-500">{summary.totalQuotes} cotizaciones</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between no-print print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/system/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getReportTitle()}</h1>
            <p className="text-muted-foreground mt-2">
              {getReportSubtitle()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <SendReportEmailDialog
            reportType={getReportTitle()}
            onSend={sendEmailReport}
            disabled={!filteredInvoices.length}
          />
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!filteredInvoices.length || exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={!filteredInvoices.length || exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="no-print print:hidden">
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Summary Cards - Screen Only */}
      <div className="grid gap-4 md:grid-cols-4 no-print print:hidden">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setActiveFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Documentos</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.totalInvoices} facturas • {summary.totalQuotes} cotizaciones
            </p>
            {activeFilter === 'all' && (
              <p className="text-xs font-medium text-primary mt-1">
                Mostrando todos
              </p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'invoiced' ? 'ring-2 ring-green-600' : ''
          }`}
          onClick={() => setActiveFilter('invoiced')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Facturado</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatCurrency(summary.totalInvoiced)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {summary.totalInvoices} facturas
            </p>
            {activeFilter === 'invoiced' && (
              <p className="text-xs font-medium text-green-600 mt-1">
                Filtrando facturas
              </p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'pending' ? 'ring-2 ring-amber-600' : ''
          }`}
          onClick={() => setActiveFilter('pending')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Pendiente de Pago</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {formatCurrency(summary.totalPending)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.byStatus.issued + summary.byStatus.sent} facturas
            </p>
            {activeFilter === 'pending' && (
              <p className="text-xs font-medium text-amber-600 mt-1">
                Filtrando pendientes
              </p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'quoted' ? 'ring-2 ring-blue-600' : ''
          }`}
          onClick={() => setActiveFilter('quoted')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Cotizado</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {formatCurrency(summary.totalQuoted)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              De {summary.totalQuotes} cotizaciones
            </p>
            {activeFilter === 'quoted' && (
              <p className="text-xs font-medium text-blue-600 mt-1">
                Filtrando cotizaciones
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="no-print print:hidden">
          <CardTitle>{getReportTitle()}</CardTitle>
          <CardDescription>
            {activeFilter !== 'all' && (
              <span className="font-medium">
                {activeFilter === 'invoiced' && '📊 Solo Facturas • '}
                {activeFilter === 'pending' && '⏳ Solo Pendientes de Pago • '}
                {activeFilter === 'quoted' && '📋 Solo Cotizaciones • '}
              </span>
            )}
            {dateRange ? (
              <>
                Mostrando {filteredInvoices.length} documentos del{' '}
                {new Date(dateRange.from).toLocaleDateString('es-ES')} al{' '}
                {new Date(dateRange.to).toLocaleDateString('es-ES')}
              </>
            ) : (
              <>Mostrando {filteredInvoices.length} documentos</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="print:p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {dateRange
                  ? "No hay facturas en el período seleccionado"
                  : "No hay facturas registradas"}
              </p>
            </div>
          ) : (
            <>
              {/* Title for print only */}
              <h3 className="hidden print:block text-base font-semibold mb-3 mt-6">
                Detalle - {getReportSubtitle()}
              </h3>
              <div className="rounded-md border print:border-collapse">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.type === 'invoice' ? 'info' : 'secondary'}>
                          {invoice.type === 'invoice' ? 'Factura' : 'Cotización'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
