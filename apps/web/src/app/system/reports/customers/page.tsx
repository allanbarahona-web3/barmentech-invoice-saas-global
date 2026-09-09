"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Download, FileDown, Loader2, AlertCircle, Eye, FileText } from "lucide-react";
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
import { CustomerBalanceDialog } from "@/components/system/CustomerBalanceDialog";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useCompanyProfile } from "@/modules/company/company.hooks";
import { usePayments } from "@/modules/payments/payments.hooks";
import { getInvoicePaymentInfo } from "@/modules/payments/payments.utils";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type FilterType = 'all' | 'overdue' | 'current' | 'paid';

interface CustomerBalance {
  customerId: string;
  customerName: string;
  totalBalance: number;
  overdueBalance: number;
  currentBalance: number;
  invoiceCount: number;
  oldestDueDate: Date | null;
  daysOverdue: number;
  aging: {
    current: number;     // 0-30 días
    days30: number;      // 31-60 días
    days60: number;      // 61-90 días
    days90Plus: number;  // +90 días
  };
}

export default function CustomersReportPage() {
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: companyProfile } = useCompanyProfile();
  const { data: payments = [] } = usePayments();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter invoices by date range
  const dateFilteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (!dateRange) return invoices;

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= fromDate && invoiceDate <= toDate;
    });
  }, [invoices, dateRange]);

  // Calculate balances for each customer
  const customerBalances = useMemo((): CustomerBalance[] => {
    if (!dateFilteredInvoices || !customers) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const balanceMap = new Map<string, CustomerBalance>();

    // Initialize all customers
    customers.forEach(customer => {
      balanceMap.set(customer.id, {
        customerId: customer.id,
        customerName: customer.name,
        totalBalance: 0,
        overdueBalance: 0,
        currentBalance: 0,
        invoiceCount: 0,
        oldestDueDate: null,
        daysOverdue: 0,
        aging: {
          current: 0,
          days30: 0,
          days60: 0,
          days90Plus: 0,
        },
      });
    });

    // Calculate balances from pending invoices
    dateFilteredInvoices.forEach(invoice => {
      // Only count issued and sent invoices (not drafts or archived)
      if (invoice.type !== 'invoice' || 
          (invoice.status !== 'issued' && invoice.status !== 'sent')) {
        return;
      }

      const balance = balanceMap.get(invoice.customerId);
      if (!balance) return;

      // Get payment info to calculate actual balance owed
      const paymentInfo = getInvoicePaymentInfo(invoice.id, invoice.total, payments);
      const invoiceBalance = paymentInfo.balance; // Amount still owed

      // Skip fully paid invoices
      if (invoiceBalance <= 0) return;

      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = dueDate ? dueDate < today : false;
      const daysDiff = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      balance.totalBalance += invoiceBalance;
      balance.invoiceCount += 1;

      if (isOverdue) {
        balance.overdueBalance += invoiceBalance;
        
        // Update oldest due date
        if (!balance.oldestDueDate || (dueDate && dueDate < balance.oldestDueDate)) {
          balance.oldestDueDate = dueDate;
          balance.daysOverdue = daysDiff;
        }

        // Aging analysis
        if (daysDiff <= 30) {
          balance.aging.current += invoiceBalance;
        } else if (daysDiff <= 60) {
          balance.aging.days30 += invoiceBalance;
        } else if (daysDiff <= 90) {
          balance.aging.days60 += invoiceBalance;
        } else {
          balance.aging.days90Plus += invoiceBalance;
        }
      } else {
        balance.currentBalance += invoiceBalance;
        balance.aging.current += invoiceBalance;
      }
    });

    return Array.from(balanceMap.values())
      .filter(b => b.totalBalance > 0 || activeFilter === 'all') // Show all or only with balance
      .sort((a, b) => b.totalBalance - a.totalBalance); // Sort by balance desc
  }, [dateFilteredInvoices, customers, activeFilter, payments]);

  // Filter customers based on active filter
  const filteredCustomers = useMemo(() => {
    if (activeFilter === 'all') return customerBalances;
    if (activeFilter === 'overdue') return customerBalances.filter(c => c.overdueBalance > 0);
    if (activeFilter === 'current') return customerBalances.filter(c => c.currentBalance > 0 && c.overdueBalance === 0);
    if (activeFilter === 'paid') return customerBalances.filter(c => c.totalBalance === 0);
    return customerBalances;
  }, [customerBalances, activeFilter]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalBalance = customerBalances.reduce((sum, c) => sum + c.totalBalance, 0);
    const totalOverdue = customerBalances.reduce((sum, c) => sum + c.overdueBalance, 0);
    const totalCurrent = customerBalances.reduce((sum, c) => sum + c.currentBalance, 0);
    const customersWithBalance = customerBalances.filter(c => c.totalBalance > 0).length;
    const customersOverdue = customerBalances.filter(c => c.overdueBalance > 0).length;

    return {
      totalBalance,
      totalOverdue,
      totalCurrent,
      customersWithBalance,
      customersOverdue,
    };
  }, [customerBalances]);

  const getReportTitle = () => {
    switch (activeFilter) {
      case 'overdue':
        return 'Reporte de Clientes - Morosos';
      case 'current':
        return 'Reporte de Clientes - Al Día';
      case 'paid':
        return 'Reporte de Clientes - Pagados';
      default:
        return 'Reporte de Clientes - Estado de Cuenta';
    }
  };

  const getReportSubtitle = () => {
    switch (activeFilter) {
      case 'overdue':
        return 'Solo clientes con facturas vencidas';
      case 'current':
        return 'Solo clientes con facturas al día';
      case 'paid':
        return 'Clientes sin balance pendiente';
      default:
        return 'Balance y estado de cuenta de todos los clientes';
    }
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days === 0) return <Badge variant="success">Al día</Badge>;
    if (days <= 15) return <Badge variant="warning">{days} días</Badge>;
    return <Badge variant="destructive">{days} días</Badge>;
  };

  const exportToExcel = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay clientes para exportar.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    const headers = [
      "Cliente",
      "Balance Total",
      "Balance Vencido",
      "Balance Corriente",
      "Facturas Pendientes",
      "Días Mora",
      "0-30 días",
      "31-60 días",
      "61-90 días",
      "+90 días",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.customerName,
      customer.totalBalance.toFixed(2),
      customer.overdueBalance.toFixed(2),
      customer.currentBalance.toFixed(2),
      customer.invoiceCount.toString(),
      customer.daysOverdue.toString(),
      customer.aging.current.toFixed(2),
      customer.aging.days30.toFixed(2),
      customer.aging.days60.toFixed(2),
      customer.aging.days90Plus.toFixed(2),
    ]);

    // Add summary rows
    rows.push([], ["RESUMEN"], []);
    rows.push(["Total Balance:", formatCurrency(summary.totalBalance)]);
    rows.push(["Balance Vencido:", formatCurrency(summary.totalOverdue)]);
    rows.push(["Balance Corriente:", formatCurrency(summary.totalCurrent)]);
    rows.push(["Clientes con Balance:", summary.customersWithBalance.toString()]);
    rows.push(["Clientes Morosos:", summary.customersOverdue.toString()]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filterSuffix = activeFilter === 'all' ? '' : 
      activeFilter === 'overdue' ? '_morosos' :
      activeFilter === 'current' ? '_al_dia' : '_pagados';
    
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_clientes${filterSuffix}_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
    toast({
      title: "Exportación exitosa",
      description: `${getReportTitle()}: ${filteredCustomers.length} clientes exportados a Excel.`,
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
    // TODO: Implement backend endpoint
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log("Sending report to:", emails);
        console.log("Total customers:", filteredCustomers.length);
        resolve();
      }, 2000);
    });
  };

  const handleOpenCustomerDetails = (customer: CustomerBalance) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleGenerateAccountStatement = (customer: CustomerBalance, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    const printContent = generateAccountStatementHTML(customer);
    
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  };

  const generateAccountStatementHTML = (customer: CustomerBalance) => {
    const customerInvoices = dateFilteredInvoices?.filter(inv => 
      inv.customerId === customer.customerId && 
      inv.type === 'invoice' &&
      (inv.status === 'issued' || inv.status === 'sent')
    ) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = customerInvoices.filter(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      return dueDate && dueDate < today;
    });

    const currentInvoices = customerInvoices.filter(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      return !dueDate || dueDate >= today;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estado de Cuenta - ${customer.customerName}</title>
        <style>
          @page { margin: 2cm; }
          body { 
            font-family: Arial, sans-serif; 
            color: #333;
            line-height: 1.6;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info h1 { margin: 0; font-size: 24px; }
          .company-info p { margin: 5px 0; color: #666; }
          .document-info { text-align: right; }
          .document-info h2 { margin: 0; font-size: 20px; color: #333; }
          .customer-info {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
          }
          .customer-info h3 { margin: 0 0 10px 0; }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            border: 2px solid #e5e7eb;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .summary-card.highlight {
            border-color: #ef4444;
            background: #fef2f2;
          }
          .summary-card p { margin: 5px 0; color: #666; font-size: 12px; }
          .summary-card h3 { margin: 0; font-size: 28px; }
          .summary-card.highlight h3 { color: #dc2626; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th { 
            background: #f3f4f6; 
            padding: 12px; 
            text-align: left; 
            border-bottom: 2px solid #d1d5db;
            font-weight: 600;
          }
          td { 
            padding: 10px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .overdue { color: #dc2626; font-weight: bold; }
          .current { color: #16a34a; }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${companyProfile?.branding?.logoUrl ? `<img src="${companyProfile.branding.logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 10px;">` : ''}
            <h1>${companyProfile?.legal?.legalName || 'Barmentech Invoice System'}</h1>
            <p>${companyProfile?.legal?.commercialName || ''}</p>
          </div>
          <div class="document-info">
            <h2>ESTADO DE CUENTA</h2>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Cliente</h3>
          <p><strong>${customer.customerName}</strong></p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <p>Balance Total</p>
            <h3>${formatCurrency(customer.totalBalance)}</h3>
          </div>
          <div class="summary-card ${customer.overdueBalance > 0 ? 'highlight' : ''}">
            <p>Balance Vencido</p>
            <h3>${formatCurrency(customer.overdueBalance)}</h3>
          </div>
          <div class="summary-card">
            <p>Balance Corriente</p>
            <h3 class="current">${formatCurrency(customer.currentBalance)}</h3>
          </div>
        </div>

        ${overdueInvoices.length > 0 ? `
          <div class="section-title">Facturas Vencidas</div>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Días Mora</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${overdueInvoices.map(inv => {
                const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
                const days = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                return `
                  <tr>
                    <td><strong>${inv.invoiceNumber}</strong></td>
                    <td>${new Date(inv.createdAt).toLocaleDateString('es-ES')}</td>
                    <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-ES') : '—'}</td>
                    <td class="overdue">${days} días</td>
                    <td style="text-align: right;" class="overdue">${formatCurrency(inv.total)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        ${currentInvoices.length > 0 ? `
          <div class="section-title">Facturas Por Vencer</div>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th>Vence en</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${currentInvoices.map(inv => {
                const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
                const days = dueDate ? Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                return `
                  <tr>
                    <td><strong>${inv.invoiceNumber}</strong></td>
                    <td>${new Date(inv.createdAt).toLocaleDateString('es-ES')}</td>
                    <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-ES') : '—'}</td>
                    <td class="current">${days} días</td>
                    <td style="text-align: right;">${formatCurrency(inv.total)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p>Estado de cuenta generado el ${new Date().toLocaleDateString('es-ES')}</p>
          <p>${companyProfile?.legal?.legalName || 'Barmentech Invoice System'}</p>
        </div>
      </body>
      </html>
    `;
  };

  const isLoading = loadingInvoices;

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
              Fecha: {new Date().toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        {/* Summary for Print - Compact */}
        <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Balance Total</p>
            <p className="text-lg font-bold">{formatCurrency(summary.totalBalance)}</p>
            <p className="text-xs text-gray-500">{summary.customersWithBalance} clientes</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Balance Vencido</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(summary.totalOverdue)}</p>
            <p className="text-xs text-gray-500">{summary.customersOverdue} morosos</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">Balance Corriente</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(summary.totalCurrent)}</p>
            <p className="text-xs text-gray-500">Por vencer</p>
          </div>
          <div className="border rounded p-2">
            <p className="text-gray-600 text-xs">% Morosidad</p>
            <p className="text-lg font-bold text-amber-700">
              {summary.totalBalance > 0 ? ((summary.totalOverdue / summary.totalBalance) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500">Del total</p>
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
            disabled={!filteredCustomers.length}
          />
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!filteredCustomers.length || exporting}
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
            disabled={!filteredCustomers.length || exporting}
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
        {dateRange && (
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando clientes con facturas del {new Date(dateRange.from).toLocaleDateString('es-ES')} al {new Date(dateRange.to).toLocaleDateString('es-ES')}
          </p>
        )}
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
            <CardDescription>Balance Total</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(summary.totalBalance)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.customersWithBalance} clientes con balance
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
            activeFilter === 'overdue' ? 'ring-2 ring-red-600' : ''
          }`}
          onClick={() => setActiveFilter('overdue')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Balance Vencido</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {formatCurrency(summary.totalOverdue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.customersOverdue} clientes morosos
            </p>
            {activeFilter === 'overdue' && (
              <p className="text-xs font-medium text-red-600 mt-1">
                Filtrando morosos
              </p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'current' ? 'ring-2 ring-green-600' : ''
          }`}
          onClick={() => setActiveFilter('current')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Balance Corriente</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatCurrency(summary.totalCurrent)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Facturas por vencer
            </p>
            {activeFilter === 'current' && (
              <p className="text-xs font-medium text-green-600 mt-1">
                Filtrando al día
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>% Morosidad</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {summary.totalBalance > 0 
                ? ((summary.totalOverdue / summary.totalBalance) * 100).toFixed(1)
                : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Del balance total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="no-print print:hidden">
          <CardTitle>{getReportTitle()}</CardTitle>
          <CardDescription>
            {activeFilter !== 'all' && (
              <span className="font-medium">
                {activeFilter === 'overdue' && '⚠️ Solo Morosos • '}
                {activeFilter === 'current' && '✅ Solo Al Día • '}
                {activeFilter === 'paid' && '💚 Solo Pagados • '}
              </span>
            )}
            Mostrando {filteredCustomers.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="print:p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No hay clientes con el filtro seleccionado
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
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Balance Total</TableHead>
                    <TableHead className="text-right">Vencido</TableHead>
                    <TableHead className="text-right">Corriente</TableHead>
                    <TableHead className="text-center">Facturas</TableHead>
                    <TableHead className="text-center">Mora</TableHead>
                    <TableHead className="text-right no-print">0-30d</TableHead>
                    <TableHead className="text-right no-print">31-60d</TableHead>
                    <TableHead className="text-right no-print">61-90d</TableHead>
                    <TableHead className="text-right no-print">+90d</TableHead>
                    <TableHead className="text-center no-print">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.customerId}
                      className="cursor-pointer hover:bg-muted/50 transition-colors no-print"
                      onClick={() => handleOpenCustomerDetails(customer)}
                    >
                      <TableCell className="font-medium">
                        {customer.customerName}
                        {customer.daysOverdue > 30 && (
                          <AlertCircle className="h-3 w-3 inline ml-2 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.totalBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.overdueBalance > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(customer.overdueBalance)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.currentBalance > 0 ? (
                          <span className="text-green-600">
                            {formatCurrency(customer.currentBalance)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.invoiceCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {getDaysOverdueBadge(customer.daysOverdue)}
                      </TableCell>
                      <TableCell className="text-right text-xs no-print">
                        {customer.aging.current > 0 ? formatCurrency(customer.aging.current) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs no-print">
                        {customer.aging.days30 > 0 ? formatCurrency(customer.aging.days30) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs no-print">
                        {customer.aging.days60 > 0 ? formatCurrency(customer.aging.days60) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs no-print">
                        {customer.aging.days90Plus > 0 ? formatCurrency(customer.aging.days90Plus) : '—'}
                      </TableCell>
                      <TableCell className="text-center no-print">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomerDetails(customer);
                            }}
                            title="Ver facturas"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleGenerateAccountStatement(customer, e)}
                            title="Generar estado de cuenta"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Customer Balance Dialog */}
      {selectedCustomer && (
        <CustomerBalanceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customerName={selectedCustomer.customerName}
          customerId={selectedCustomer.customerId}
          invoices={invoices?.filter(inv => 
            inv.customerId === selectedCustomer.customerId && 
            inv.type === 'invoice' &&
            (inv.status === 'issued' || inv.status === 'sent')
          ) || []}
          totalBalance={selectedCustomer.totalBalance}
          overdueBalance={selectedCustomer.overdueBalance}
          currentBalance={selectedCustomer.currentBalance}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
}
