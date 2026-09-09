"use client";

import { useState } from "react";
import { FileDown, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendReportEmailDialog } from "@/components/system/SendReportEmailDialog";
import { Invoice } from "@/modules/invoices/invoice.schema";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CustomerBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerId: string;
  invoices: Invoice[];
  totalBalance: number;
  overdueBalance: number;
  currentBalance: number;
  companyProfile: any;
}

export function CustomerBalanceDialog({
  open,
  onOpenChange,
  customerName,
  customerId,
  invoices,
  totalBalance,
  overdueBalance,
  currentBalance,
  companyProfile,
}: CustomerBalanceDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Separate overdue and current invoices
  const overdueInvoices = invoices.filter(inv => {
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    return dueDate && dueDate < today;
  });

  const currentInvoices = invoices.filter(inv => {
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    return !dueDate || dueDate >= today;
  });

  const getDaysInfo = (dueDate: string | undefined) => {
    if (!dueDate) return { days: 0, isOverdue: false };
    const due = new Date(dueDate);
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return { days: Math.abs(diff), isOverdue: diff > 0 };
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

  const generateAccountStatement = () => {
    setGenerating(true);
    
    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estado de Cuenta - ${customerName}</title>
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
          .no-invoices {
            text-align: center;
            padding: 30px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${companyProfile?.branding?.logoUrl ? `<img src="${companyProfile.branding.logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 10px;">` : ''}
            <h1>${companyProfile?.legal?.legalName || 'Barmentech Invoice System'}</h1>
            <p>${companyProfile?.legal?.commercialName || ''}</p>
            <p>${companyProfile?.legal?.email || ''}</p>
            <p>${companyProfile?.legal?.phone || ''}</p>
          </div>
          <div class="document-info">
            <h2>ESTADO DE CUENTA</h2>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Cliente</h3>
          <p><strong>${customerName}</strong></p>
          <p>Período: Desde el inicio hasta ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <p>Balance Total</p>
            <h3>${formatCurrency(totalBalance)}</h3>
          </div>
          <div class="summary-card ${overdueBalance > 0 ? 'highlight' : ''}">
            <p>Balance Vencido</p>
            <h3>${formatCurrency(overdueBalance)}</h3>
          </div>
          <div class="summary-card">
            <p>Balance Corriente</p>
            <h3 class="current">${formatCurrency(currentBalance)}</h3>
          </div>
        </div>

        ${overdueInvoices.length > 0 ? `
          <div class="section-title">Facturas Vencidas</div>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha Emisión</th>
                <th>Fecha Vencimiento</th>
                <th>Días de Mora</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${overdueInvoices.map(inv => {
                const { days } = getDaysInfo(inv.dueDate);
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
                <th>Fecha Vencimiento</th>
                <th>Vence en</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${currentInvoices.map(inv => {
                const { days } = getDaysInfo(inv.dueDate);
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

        ${invoices.length === 0 ? `
          <div class="no-invoices">
            No hay facturas pendientes para este cliente
          </div>
        ` : ''}

        <div class="footer">
          <p>Este documento es un estado de cuenta generado el ${new Date().toLocaleDateString('es-ES')}</p>
          <p>${companyProfile?.legal?.legalName || 'Barmentech Invoice System'}</p>
        </div>
      </body>
      </html>
    `;

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
        setTimeout(() => {
          document.body.removeChild(iframe);
          setGenerating(false);
          toast({
            title: "Estado de cuenta generado",
            description: `Estado de cuenta de ${customerName} listo para imprimir/guardar.`,
          });
        }, 1000);
      }, 500);
    } else {
      setGenerating(false);
      toast({
        title: "Error",
        description: "No se pudo generar el estado de cuenta.",
        variant: "destructive",
      });
    }
  };

  const sendAccountStatementEmail = async (emails: string[]) => {
    // TODO: Implement backend endpoint to send account statement
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log("Sending account statement to:", emails);
        console.log("Customer:", customerName);
        resolve();
      }, 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{customerName}</DialogTitle>
          <DialogDescription>
            Balance detallado y facturas pendientes
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 my-4">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Balance Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
          <div className={`border rounded-lg p-4 text-center ${overdueBalance > 0 ? 'border-red-300 bg-red-50' : ''}`}>
            <p className="text-sm text-muted-foreground mb-1">Balance Vencido</p>
            <p className={`text-2xl font-bold ${overdueBalance > 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(overdueBalance)}
            </p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Balance Corriente</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(currentBalance)}</p>
          </div>
        </div>

        {/* Generate Statement Button */}
        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={generateAccountStatement} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Generar Estado de Cuenta PDF
              </>
            )}
          </Button>
          <Button 
            onClick={() => setIsEmailDialogOpen(true)} 
            variant="secondary"
            disabled={generating}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar por Correo
          </Button>
        </div>

        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-red-600">
              Facturas Vencidas ({overdueInvoices.length})
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Mora</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueInvoices.map((invoice) => {
                    const { days } = getDaysInfo(invoice.dueDate);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell>
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{days} días</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Current Invoices */}
        {currentInvoices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">
              Facturas Por Vencer ({currentInvoices.length})
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Vence en</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInvoices.map((invoice) => {
                    const { days } = getDaysInfo(invoice.dueDate);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell>
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">{days} días</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay facturas pendientes para este cliente
          </div>
        )}

        {/* Email Dialog */}
        <SendReportEmailDialog
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          onSend={sendAccountStatementEmail}
          reportType={`Estado de Cuenta - ${customerName}`}
          hideButton={true}
        />
      </DialogContent>
    </Dialog>
  );
}
