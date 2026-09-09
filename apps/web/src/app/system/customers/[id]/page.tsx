'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, FileText, CreditCard, TrendingUp, Pencil, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/modules/customers/customer.hooks';
import { useInvoices } from '@/modules/invoices/invoice.hooks';
import { getInvoicesByCustomer, calculateCustomerStats } from '@/modules/invoices/invoice.helpers';
import { usePayments } from '@/modules/payments/payments.hooks';
import { CustomerDialog } from '@/modules/customers/components/CustomerDialog';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { t } from '@/i18n';

type FilterType = "all" | "pending" | "quotes" | "recent";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: allInvoices, isLoading: loadingInvoices } = useInvoices();
  const { data: payments = [] } = usePayments();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const customer = customers?.find(c => c.id === customerId);
  const customerInvoices = allInvoices ? getInvoicesByCustomer(allInvoices, customerId) : [];
  const stats = allInvoices ? calculateCustomerStats(customerInvoices, payments) : null;

  // Filter invoices based on active filter
  const displayedInvoices = useMemo(() => {
    let filtered = [...customerInvoices];
    
    switch(activeFilter) {
      case "pending":
        filtered = filtered.filter(inv => 
          inv.type === "invoice" && (inv.status === "issued" || inv.status === "sent")
        );
        break;
      case "quotes":
        filtered = filtered.filter(inv => inv.type === "quote");
        break;
      case "recent":
        // Already sorted by date below
        break;
      case "all":
      default:
        // Keep all
        break;
    }
    
    // Sort by date (most recent first) for all filters
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customerInvoices, activeFilter]);

  // Get filter label for display
  const getFilterLabel = () => {
    switch(activeFilter) {
      case "pending":
        return "facturas pendientes de pago";
      case "quotes":
        return "cotizaciones";
      case "recent":
        return "documentos ordenados por fecha";
      default:
        return "documentos";
    }
  };

  if (loadingCustomers || loadingInvoices) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Cliente no encontrado</h2>
        <p className="text-muted-foreground mb-4">El cliente que buscas no existe.</p>
        <Button onClick={() => router.push('/system/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Clientes
        </Button>
      </div>
    );
  }

  // Build full address string
  const addressParts = [
    customer.addressDetail,
    customer.city,
    customer.state,
    customer.zipCode,
    customer.country
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/system/customers')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <p className="text-muted-foreground">Cliente desde {new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button asChild>
            <Link href={`/system/invoices/new?customerId=${customer.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md relative ${activeFilter === 'all' ? 'border-primary border-2' : 'hover:border-primary'}`}
            onClick={() => setActiveFilter('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalInvoiced)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalInvoices} {stats.totalInvoices === 1 ? 'factura' : 'facturas'}
              </p>
            </CardContent>
            {activeFilter === 'all' && (
              <Badge className="absolute top-2 right-2">Activo</Badge>
            )}
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md relative ${activeFilter === 'pending' ? 'border-primary border-2' : 'hover:border-primary'}`}
            onClick={() => setActiveFilter('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingCount} {stats.pendingCount === 1 ? 'factura' : 'facturas'}
              </p>
            </CardContent>
            {activeFilter === 'pending' && (
              <Badge className="absolute top-2 right-2">Activo</Badge>
            )}
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md relative ${activeFilter === 'quotes' ? 'border-primary border-2' : 'hover:border-primary'}`}
            onClick={() => setActiveFilter('quotes')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuotes}</div>
              <p className="text-xs text-muted-foreground">
                Enviadas
              </p>
            </CardContent>
            {activeFilter === 'quotes' && (
              <Badge className="absolute top-2 right-2">Activo</Badge>
            )}
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md relative ${activeFilter === 'recent' ? 'border-primary border-2' : 'hover:border-primary'}`}
            onClick={() => setActiveFilter('recent')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Factura</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastInvoiceDate 
                  ? new Date(stats.lastInvoiceDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })
                  : '—'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastInvoiceDate 
                  ? new Date(stats.lastInvoiceDate).toLocaleDateString('es', { year: 'numeric' })
                  : 'Sin facturas'
                }
              </p>
            </CardContent>
            {activeFilter === 'recent' && (
              <Badge className="absolute top-2 right-2">Activo</Badge>
            )}
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                {customer.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
            )}

            {fullAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">{fullAddress}</p>
                </div>
              </div>
            )}

            {customer.idNumber && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Identificación</p>
                  <p className="text-sm text-muted-foreground">{customer.idNumber}</p>
                </div>
              </div>
            )}

            {customer.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Notas</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>Historial de Facturas y Cotizaciones</CardTitle>
                <CardDescription>
                  Mostrando <strong>{displayedInvoices.length}</strong> {getFilterLabel()} de {customerInvoices.length} totales
                </CardDescription>
              </div>
              {activeFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                  className="flex items-center gap-2"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {customerInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Sin facturas aún</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea la primera factura para este cliente
                </p>
                <Button asChild>
                  <Link href={`/system/invoices/new?customerId=${customer.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Crear Factura
                  </Link>
                </Button>
              </div>
            ) : displayedInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No hay {getFilterLabel()}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Este cliente no tiene documentos que coincidan con este filtro
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setActiveFilter('all')}
                >
                  Ver todos los documentos
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.type === 'invoice' ? 'info' : 'secondary'}>
                              {invoice.type === 'invoice' ? 'Factura' : 'Cotización'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                invoice.status === 'issued' ? 'success' : 
                                invoice.status === 'sent' ? 'warning' :
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'draft' ? 'secondary' : 'outline'
                              }
                              className={invoice.status === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                              {invoice.status === 'issued' ? 'Emitida' :
                               invoice.status === 'sent' ? 'Enviada' :
                               invoice.status === 'draft' ? 'Borrador' :
                               invoice.status === 'paid' ? 'Pagada' : 'Archivada'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/system/invoices/${invoice.id}?returnTo=/system/customers/${customer.id}`}>
                                Ver
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <CustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customer}
      />
    </div>
  );
}
