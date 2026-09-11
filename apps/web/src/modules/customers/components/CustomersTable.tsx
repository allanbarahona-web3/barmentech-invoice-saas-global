"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Power,
  Search,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useActivateCustomerMutation,
  useCustomerDetail,
  useCustomerList,
  useDeactivateCustomerMutation,
} from "../customer.hooks";
import { customerErrorMessage, type CustomerListItem } from "../customer.service";
import { customerIdentificationTypeLabel } from "../customer-identification";
import { CustomerDrawer } from "./CustomerDrawer";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "inactive";

function customerTypeLabel(type: CustomerListItem["type"]) {
  return type === "PERSON" ? "Persona" : "Organización";
}

export function CustomersTable() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string>();
  const [customerToDeactivate, setCustomerToDeactivate] = useState<CustomerListItem>();

  useEffect(() => setPage(1), [deferredSearch, statusFilter]);

  const list = useCustomerList({
    search: deferredSearch || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    page,
    pageSize: PAGE_SIZE,
  });
  const detail = useCustomerDetail(editingId);
  const activateCustomer = useActivateCustomerMutation();
  const deactivateCustomer = useDeactivateCustomerMutation();

  useEffect(() => {
    if (!detail.isError) return;
    toast({ title: "No se pudo abrir el cliente", description: customerErrorMessage(detail.error), variant: "destructive" });
    setEditingId(undefined);
  }, [detail.error, detail.isError, toast]);

  const changeStatus = async (customer: CustomerListItem, isActive: boolean) => {
    try {
      if (isActive) {
        await activateCustomer.mutateAsync(customer.id);
      } else {
        await deactivateCustomer.mutateAsync(customer.id);
      }
      toast({
        title: isActive ? "Cliente activado" : "Cliente desactivado",
        description: isActive ? "El cliente vuelve a estar disponible." : "El cliente quedó inactivo.",
      });
    } catch (error) {
      toast({ title: "No se pudo actualizar el cliente", description: customerErrorMessage(error), variant: "destructive" });
    } finally {
      setCustomerToDeactivate(undefined);
    }
  };

  const pagination = list.data?.pagination;
  const customers = list.data?.items ?? [];
  const changingStatus = activateCustomer.isPending || deactivateCustomer.isPending;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por nombre, correo o identificación" />
        </div>
        <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Identificación</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="w-16 px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.isLoading ? (
                <tr><td colSpan={6} className="h-56 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 size-5 animate-spin" />Cargando clientes…</td></tr>
              ) : list.isError ? (
                <tr><td colSpan={6} className="h-56 px-5 text-center"><p className="font-medium">No pudimos cargar los clientes</p><p className="mt-1 text-muted-foreground">{customerErrorMessage(list.error)}</p><Button className="mt-4" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="h-56 px-5 text-center"><p className="font-medium">No hay clientes para mostrar</p><p className="mt-1 text-muted-foreground">Crea un cliente o ajusta los filtros.</p></td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4"><Link href={`/system/customers/${customer.id}`} className="font-medium hover:text-primary hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none">{customer.displayName}</Link></td>
                  <td className="px-4 py-4">{customerTypeLabel(customer.type)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{customer.identificationValue ? <>{customerIdentificationTypeLabel(customer.identificationType) ? `${customerIdentificationTypeLabel(customer.identificationType)}: ` : ""}{customer.identificationValue}</> : "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground"><p>{customer.email ?? "—"}</p>{customer.phone ? <p className="mt-0.5 text-xs">{customer.phone}</p> : null}</td>
                  <td className="px-4 py-4"><Badge variant={customer.isActive ? "success" : "destructive"}>{customer.isActive ? "Activo" : "Inactivo"}</Badge></td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones para ${customer.displayName}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/system/customers/${customer.id}`}><Eye />Ver perfil</Link></DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditingId(customer.id)} disabled={detail.isFetching && editingId === customer.id}><Pencil />Editar</DropdownMenuItem>
                        {customer.isActive ? <DropdownMenuItem variant="destructive" onSelect={() => setCustomerToDeactivate(customer)} disabled={changingStatus}><Power />Desactivar</DropdownMenuItem> : <DropdownMenuItem onSelect={() => void changeStatus(customer, true)} disabled={changingStatus}><Power />Activar</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.total > 0 ? (
          <div className="flex flex-col gap-3 border-t px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">{pagination.total} cliente{pagination.total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2 self-end sm:self-auto"><Button variant="outline" size="sm" disabled={page <= 1 || list.isFetching} onClick={() => setPage((current) => current - 1)}><ChevronLeft />Anterior</Button><span className="text-muted-foreground">Página {pagination.page} de {Math.max(pagination.totalPages, 1)}</span><Button variant="outline" size="sm" disabled={page >= pagination.totalPages || list.isFetching} onClick={() => setPage((current) => current + 1)}>Siguiente<ChevronRight /></Button></div>
          </div>
        ) : null}
      </div>

      <CustomerDrawer open={Boolean(editingId && detail.data)} customer={detail.data} onOpenChange={(open) => !open && setEditingId(undefined)} onSaved={() => setEditingId(undefined)} />

      <AlertDialog open={Boolean(customerToDeactivate)} onOpenChange={(open) => !open && setCustomerToDeactivate(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Desactivar cliente?</AlertDialogTitle><AlertDialogDescription>{customerToDeactivate ? `${customerToDeactivate.displayName} seguirá disponible para consulta, pero quedará inactivo.` : ""}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => customerToDeactivate && void changeStatus(customerToDeactivate, false)}>Desactivar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
