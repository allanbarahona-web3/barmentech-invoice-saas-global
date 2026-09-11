"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, Pencil, Power, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { interpolate, useTranslations } from "@/i18n";
import { useActivateCustomerMutation, useCustomerDetail, useCustomerList, useDeactivateCustomerMutation } from "../customer.hooks";
import { customerErrorCode, type CustomerListItem } from "../customer.service";
import { customerIdentificationTypeLabel } from "../customer-identification";
import { CustomerDrawer } from "./CustomerDrawer";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "inactive";

export function CustomersTable() {
  const { toast } = useToast();
  const { messages } = useTranslations();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string>();
  const [customerToDeactivate, setCustomerToDeactivate] = useState<CustomerListItem>();
  useEffect(() => setPage(1), [deferredSearch, statusFilter]);
  const list = useCustomerList({ search: deferredSearch || undefined, isActive: statusFilter === "all" ? undefined : statusFilter === "active", page, pageSize: PAGE_SIZE });
  const detail = useCustomerDetail(editingId);
  const activateCustomer = useActivateCustomerMutation();
  const deactivateCustomer = useDeactivateCustomerMutation();

  useEffect(() => { if (detail.isError) { toast({ title: messages.customers.openError, description: messages.customers.errors[customerErrorCode(detail.error)], variant: "destructive" }); setEditingId(undefined); } }, [detail.error, detail.isError, messages.customers.errors, messages.customers.openError, toast]);
  const changeStatus = async (customer: CustomerListItem, isActive: boolean) => {
    try {
      if (isActive) await activateCustomer.mutateAsync(customer.id); else await deactivateCustomer.mutateAsync(customer.id);
      toast({ title: isActive ? messages.customers.customerActivated : messages.customers.customerDeactivated, description: isActive ? messages.customers.customerActivatedDescription : messages.customers.customerDeactivatedDescription });
    } catch (error) {
      toast({ title: messages.customers.updateError, description: messages.customers.errors[customerErrorCode(error)], variant: "destructive" });
    } finally { setCustomerToDeactivate(undefined); }
  };
  const pagination = list.data?.pagination;
  const customers = list.data?.items ?? [];
  const changingStatus = activateCustomer.isPending || deactivateCustomer.isPending;

  return <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder={messages.customers.searchPlaceholder} /></div><Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={messages.customers.status} /></SelectTrigger><SelectContent><SelectItem value="all">{messages.customers.allStatuses}</SelectItem><SelectItem value="active">{messages.customers.activePlural}</SelectItem><SelectItem value="inactive">{messages.customers.inactivePlural}</SelectItem></SelectContent></Select></div>
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b bg-muted/50 text-left text-muted-foreground"><tr><th className="px-5 py-3 font-medium">{messages.customers.customer}</th><th className="px-4 py-3 font-medium">{messages.customers.type}</th><th className="px-4 py-3 font-medium">{messages.customers.identification}</th><th className="px-4 py-3 font-medium">{messages.customers.contact}</th><th className="px-4 py-3 font-medium">{messages.customers.status}</th><th className="w-16 px-4 py-3 font-medium">{messages.customers.actions}</th></tr></thead><tbody className="divide-y">
      {list.isLoading ? <tr><td colSpan={6} className="h-56 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 size-5 animate-spin" />{messages.customers.loading}</td></tr> : list.isError ? <tr><td colSpan={6} className="h-56 px-5 text-center"><p className="font-medium">{messages.customers.loadError}</p><p className="mt-1 text-muted-foreground">{messages.customers.errors[customerErrorCode(list.error)]}</p><Button className="mt-4" variant="outline" onClick={() => void list.refetch()}>{messages.common.retry}</Button></td></tr> : customers.length === 0 ? <tr><td colSpan={6} className="h-56 px-5 text-center"><p className="font-medium">{messages.customers.emptyTitle}</p><p className="mt-1 text-muted-foreground">{messages.customers.emptyDescription}</p></td></tr> : customers.map((customer) => <tr key={customer.id} className="hover:bg-muted/30"><td className="px-5 py-4"><Link href={`/system/customers/${customer.id}`} className="rounded-sm font-medium hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{customer.displayName}</Link></td><td className="px-4 py-4">{customer.type === "PERSON" ? messages.customers.person : messages.customers.organization}</td><td className="px-4 py-4 text-muted-foreground">{customer.identificationValue ? <>{customerIdentificationTypeLabel(customer.identificationType, messages.customers.identificationTypes) ? `${customerIdentificationTypeLabel(customer.identificationType, messages.customers.identificationTypes)}: ` : ""}{customer.identificationValue}</> : "—"}</td><td className="px-4 py-4 text-muted-foreground"><p>{customer.email ?? "—"}</p>{customer.phone ? <p className="mt-0.5 text-xs">{customer.phone}</p> : null}</td><td className="px-4 py-4"><Badge variant={customer.isActive ? "success" : "destructive"}>{customer.isActive ? messages.customers.active : messages.customers.inactive}</Badge></td><td className="px-4 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={interpolate(messages.customers.actionsFor, { name: customer.displayName })}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/system/customers/${customer.id}`}><Eye />{messages.customers.viewProfile}</Link></DropdownMenuItem><DropdownMenuItem onSelect={() => setEditingId(customer.id)} disabled={detail.isFetching && editingId === customer.id}><Pencil />{messages.customers.edit}</DropdownMenuItem>{customer.isActive ? <DropdownMenuItem variant="destructive" onSelect={() => setCustomerToDeactivate(customer)} disabled={changingStatus}><Power />{messages.customers.deactivate}</DropdownMenuItem> : <DropdownMenuItem onSelect={() => void changeStatus(customer, true)} disabled={changingStatus}><Power />{messages.customers.activate}</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>
      {pagination && pagination.total > 0 ? <div className="flex flex-col gap-3 border-t px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">{interpolate(pagination.total === 1 ? messages.customers.totalSingular : messages.customers.totalPlural, { count: pagination.total })}</span><div className="flex items-center gap-2 self-end sm:self-auto"><Button variant="outline" size="sm" disabled={page <= 1 || list.isFetching} onClick={() => setPage((current) => current - 1)}><ChevronLeft />{messages.customers.previous}</Button><span className="text-muted-foreground">{interpolate(messages.customers.pageOf, { page: pagination.page, total: Math.max(pagination.totalPages, 1) })}</span><Button variant="outline" size="sm" disabled={page >= pagination.totalPages || list.isFetching} onClick={() => setPage((current) => current + 1)}>{messages.customers.next}<ChevronRight /></Button></div></div> : null}
    </div>
    <CustomerDrawer open={Boolean(editingId && detail.data)} customer={detail.data} onOpenChange={(open) => !open && setEditingId(undefined)} onSaved={() => setEditingId(undefined)} />
    <AlertDialog open={Boolean(customerToDeactivate)} onOpenChange={(open) => !open && setCustomerToDeactivate(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{messages.customers.deactivateTitle}</AlertDialogTitle><AlertDialogDescription>{customerToDeactivate ? interpolate(messages.customers.deactivateDescription, { name: customerToDeactivate.displayName }) : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => customerToDeactivate && void changeStatus(customerToDeactivate, false)}>{messages.customers.deactivate}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
