"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Loader2, Mail, Phone, Eye, Search, Filter, MoreVertical, FileText, Download, Upload, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
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
import { Customer } from "../customer.schema";
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from "../customer.hooks";
import { CustomerDialog } from "./CustomerDialog";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n";
import { useInvoices } from "@/modules/invoices/invoice.hooks";
import { calculateCustomerStats } from "@/modules/invoices/invoice.helpers";
import { formatCurrency } from "@/lib/utils";
import { usePayments } from "@/modules/payments/payments.hooks";

// Extended customer type with calculated balance
type CustomerWithBalance = Customer & {
  balanceDue?: number;
};

export function CustomersTable() {
  const { data: customers, isLoading } = useCustomers();
  const { data: invoices } = useInvoices();
  const { data: payments = [] } = usePayments();
  const deleteMutation = useDeleteCustomer();
  const updateMutation = useUpdateCustomer();
  const { toast } = useToast();

  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "recent" | "balance">("name");

  // Calculate balance for each customer
  const customersWithBalance = useMemo(() => {
    if (!customers || !invoices) return customers || [];

    return customers.map(customer => {
      const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
      const stats = calculateCustomerStats(customerInvoices, payments);
      return {
        ...customer,
        balanceDue: stats.totalPending,
      } as CustomerWithBalance;
    });
  }, [customers, invoices, payments]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    if (!customersWithBalance) return [];

    let filtered: CustomerWithBalance[] = [...customersWithBalance];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.idNumber?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "email":
          return (a.email || "").localeCompare(b.email || "");
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "balance":
          return (b.balanceDue || 0) - (a.balanceDue || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customersWithBalance, searchQuery, statusFilter, sortBy]);

  const handleToggleStatus = (customer: Customer) => {
    const newStatus = customer.status === "active" ? "inactive" : "active";
    
    updateMutation.mutate(
      { 
        id: customer.id, 
        input: { 
          ...customer, 
          status: newStatus,
          contactPreferences: customer.contactPreferences,
        } 
      },
      {
        onSuccess: () => {
          toast({
            title: "Estado actualizado",
            description: `Cliente ${newStatus === "active" ? "activado" : "desactivado"} correctamente.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado del cliente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleExportCSV = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay clientes para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Nombre", "Email", "Teléfono", "ID", "Estado", "Pendiente de Pago", "País", "Ciudad"];
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.email || "",
      customer.phone || "",
      customer.idNumber || "",
      customer.status,
      customer.balanceDue?.toString() || "0",
      customer.country || "",
      customer.city || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación exitosa",
      description: `${filteredCustomers.length} clientes exportados a CSV.`,
    });
  };

  const handleDelete = () => {
    if (!deletingCustomer) return;

    deleteMutation.mutate(deletingCustomer.id, {
      onSuccess: () => {
        toast({
          title: t().customers.deleteSuccessTitle,
          description: t().customers.deleteSuccessDescription,
        });
        setDeletingCustomer(undefined);
      },
      onError: () => {
        toast({
          title: t().customers.deleteErrorTitle,
          description: t().customers.deleteErrorDescription,
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

  const hasNoCustomers = !customers || customers.length === 0;

  if (hasNoCustomers) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">{t().customers.emptyTitle}</h3>
        <p className="text-muted-foreground">{t().customers.emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, teléfono o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Ordenar por nombre</SelectItem>
              <SelectItem value="email">Ordenar por email</SelectItem>
              <SelectItem value="balance">Mayor deuda</SelectItem>
              <SelectItem value="recent">Más recientes</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!filteredCustomers || filteredCustomers.length === 0}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredCustomers.length} de {customers.length} {customers.length === 1 ? 'cliente' : 'clientes'}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
          <p className="text-muted-foreground mb-4">
            Intenta ajustar los filtros o búsqueda
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t().customers.tableHeaderName}</TableHead>
              <TableHead>{t().customers.tableHeaderEmail}</TableHead>
              <TableHead>{t().customers.tableHeaderPhone}</TableHead>
              <TableHead>{t().customers.tableHeaderStatus}</TableHead>
              <TableHead className="text-right">Pendiente de Pago</TableHead>
              <TableHead className="text-right">{t().customers.tableHeaderActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/system/customers/${customer.id}`}
                    className="hover:underline hover:text-primary transition-colors"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {customer.email ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.status === "active" ? "success" : "secondary"}>
                    {customer.status === "active"
                      ? t().customers.statusActive
                      : t().customers.statusInactive}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {customer.balanceDue && customer.balanceDue > 0 ? (
                    <span className="font-medium text-warning">
                      {formatCurrency(customer.balanceDue)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/system/customers/${customer.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(customer)}
                          disabled={updateMutation.isPending}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          {customer.status === "active" ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/system/invoices/new?customerId=${customer.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Nueva Factura
                          </Link>
                        </DropdownMenuItem>
                        {customer.email && (
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${customer.email}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar Email
                            </a>
                          </DropdownMenuItem>
                        )}
                        {customer.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${customer.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Llamar
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingCustomer(customer)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Edit Dialog */}
      <CustomerDialog
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(undefined)}
        customer={editingCustomer}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t().customers.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t().customers.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCustomer(undefined)}
              disabled={deleteMutation.isPending}
            >
              {t().customers.cancelButton}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t().customers.deleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
