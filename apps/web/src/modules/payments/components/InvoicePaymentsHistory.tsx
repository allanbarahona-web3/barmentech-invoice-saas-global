"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Send, Trash2, Receipt } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Payment } from "@/modules/payments/payments.types";
import { getPaymentMethodById } from "@/constants/paymentMethods";
import { useDeletePayment } from "@/modules/payments/payments.hooks";
import { formatCurrency } from "@/lib/utils";
import { SendReportEmailDialog } from "@/components/system/SendReportEmailDialog";
import { useToast } from "@/hooks/use-toast";

interface InvoicePaymentsHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  country: string;
  invoiceTotal: number;
  invoiceNumber: string;
  customerName: string;
  companyName?: string;
}

export function InvoicePaymentsHistory({
  open,
  onOpenChange,
  payments,
  country,
  invoiceTotal,
  invoiceNumber,
  customerName,
  companyName = "Mi Empresa",
}: InvoicePaymentsHistoryProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const deletePayment = useDeletePayment();
  const { toast } = useToast();

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoiceTotal - totalPaid;

  const generatePaymentHistoryPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historial de Pagos - ${invoiceNumber}</title>
        <style>
          @page { margin: 2cm; }
          body { 
            font-family: Arial, sans-serif; 
            color: #333;
            line-height: 1.6;
          }
          .header { 
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .info-box {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 5px;
          }
          .info-box p { margin: 5px 0; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold;
            color: #333;
          }
          tr:hover { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .amount { color: #059669; font-weight: bold; }
          .summary {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .summary-total {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            padding-top: 10px;
            border-top: 2px solid #ddd;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            background: #e5e7eb;
          }
          .footer {
            text-align: center;
            color: #888;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <p>Historial de Pagos</p>
        </div>

        <div class="info-box">
          <p><strong>Factura:</strong> ${invoiceNumber}</p>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString("es-ES")}</p>
        </div>

        <h2>Registro de Pagos</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Banco</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
              .map(payment => {
                const method = getPaymentMethodById(payment.paymentMethod, country);
                return `
                  <tr>
                    <td>${new Date(payment.paymentDate).toLocaleDateString("es-ES")}</td>
                    <td>${method?.icon || ""} ${method?.nameEs || payment.paymentMethod}</td>
                    <td>${payment.reference || "—"}</td>
                    <td>${payment.bankInfo || "—"}</td>
                    <td class="text-right amount">${formatCurrency(payment.amount)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Total Factura:</span>
            <span><strong>${formatCurrency(invoiceTotal)}</strong></span>
          </div>
          <div class="summary-row">
            <span>Número de Pagos:</span>
            <span><strong>${payments.length}</strong></span>
          </div>
          <div class="summary-row summary-total">
            <span>Total Pagado:</span>
            <span>${formatCurrency(totalPaid)}</span>
          </div>
          ${balance > 0 ? `
            <div class="summary-row" style="color: #d97706;">
              <span>Saldo Pendiente:</span>
              <span><strong>${formatCurrency(balance)}</strong></span>
            </div>
          ` : `
            <div class="summary-row" style="color: #059669;">
              <span>Estado:</span>
              <span><strong>✓ Pagada Completamente</strong></span>
            </div>
          `}
        </div>

        ${payments.some(p => p.notes) ? `
          <div style="margin-top: 30px;">
            <h3>Notas</h3>
            ${payments
              .filter(p => p.notes)
              .map(p => `
                <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px;">
                  <strong>${new Date(p.paymentDate).toLocaleDateString("es-ES")}:</strong> ${p.notes}
                </div>
              `)
              .join("")}
          </div>
        ` : ""}

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString("es-ES")}</p>
          <p>${companyName} - Historial de Pagos</p>
        </div>
      </body>
      </html>
    `;

    // Create hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    toast({
      title: "PDF generado",
      description: "El historial de pagos está listo para imprimir o guardar",
    });
  };

  const handleSendEmail = async (emails: string[]) => {
    // TODO: Implement backend endpoint to send payment history
    console.log("Sending payment history to:", emails);
    toast({
      title: "Funcionalidad pendiente",
      description: "El envío por correo estará disponible próximamente",
    });
  };

  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      await deletePayment.mutateAsync(paymentToDelete.id);
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      toast({
        title: "Pago eliminado",
        description: "El registro de pago ha sido eliminado correctamente",
      });
    }
  };

  if (payments.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Historial de Pagos</DialogTitle>
            <DialogDescription>
              Factura: {invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No se han registrado pagos para esta factura</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historial de Pagos
              <Badge variant="secondary">{payments.length} pago{payments.length !== 1 ? 's' : ''}</Badge>
            </DialogTitle>
            <DialogDescription>
              Factura: {invoiceNumber} • Cliente: {customerName}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={generatePaymentHistoryPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Enviar por Correo
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Factura</p>
              <p className="text-lg font-semibold">{formatCurrency(invoiceTotal)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Pagado</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${
              balance > 0 
                ? "bg-amber-50 dark:bg-amber-950/20" 
                : "bg-green-50 dark:bg-green-950/20"
            }`}>
              <p className="text-xs text-muted-foreground mb-1">
                {balance > 0 ? "Saldo Pendiente" : "Estado"}
              </p>
              <p className={`text-lg font-semibold ${
                balance > 0 ? "text-amber-600" : "text-green-600"
              }`}>
                {balance > 0 ? formatCurrency(balance) : "✓ Pagada"}
              </p>
            </div>
          </div>

          {/* Payments Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .map((payment) => {
                    const method = getPaymentMethodById(payment.paymentMethod, country);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(payment.paymentDate).toLocaleDateString("es-ES")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {method?.icon && <span>{method.icon}</span>}
                            {method?.nameEs || payment.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.reference || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.bankInfo || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="mt-4 flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              {payments.length === 1 ? (
                "Pago único"
              ) : (
                `${payments.length} abonos realizados`
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total pagado</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </div>
          </div>

          {/* Notes if any payment has notes */}
          {payments.some(p => p.notes) && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Notas:</p>
              {payments
                .filter(p => p.notes)
                .map(payment => (
                  <div key={payment.id} className="text-sm bg-muted/30 p-2 rounded">
                    <span className="font-medium">
                      {new Date(payment.paymentDate).toLocaleDateString("es-ES")}:
                    </span>{" "}
                    {payment.notes}
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <SendReportEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSend={handleSendEmail}
        reportType={`Historial de Pagos - ${invoiceNumber}`}
        hideButton={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentToDelete && (
                <div className="mt-2 space-y-1">
                  <p>
                    Monto: <strong>{formatCurrency(paymentToDelete.amount)}</strong>
                  </p>
                  <p>
                    Fecha: {new Date(paymentToDelete.paymentDate).toLocaleDateString("es-ES")}
                  </p>
                  <p className="mt-2 text-red-600">
                    Esta acción no se puede deshacer. El saldo de la factura se ajustará
                    automáticamente.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
