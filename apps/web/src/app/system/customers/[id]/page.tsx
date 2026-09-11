"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, Power, UserRound } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CustomerDrawer } from "@/modules/customers/components/CustomerDrawer";
import { useActivateCustomerMutation, useCustomerDetail, useDeactivateCustomerMutation } from "@/modules/customers/customer.hooks";
import { customerIdentificationTypeLabel } from "@/modules/customers/customer-identification";
import { customerErrorMessage, type CustomerAddressPurpose } from "@/modules/customers/customer.service";

const purposeLabels: Record<CustomerAddressPurpose, string> = { BUSINESS: "Principal / Negocio", BILLING: "Facturación", SHIPPING: "Entrega", OTHER: "Otro" };

function formatDate(value: string) { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value)); }

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const detail = useCustomerDetail(params.id);
  const activateCustomer = useActivateCustomerMutation();
  const deactivateCustomer = useDeactivateCustomerMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeactivation, setConfirmDeactivation] = useState(false);
  const customer = detail.data;

  const changeStatus = async (isActive: boolean) => {
    if (!customer) return;
    try {
      if (isActive) await activateCustomer.mutateAsync(customer.id);
      else await deactivateCustomer.mutateAsync(customer.id);
      toast({ title: isActive ? "Cliente activado" : "Cliente desactivado", description: isActive ? "El cliente vuelve a estar disponible." : "El cliente quedó inactivo." });
      setConfirmDeactivation(false);
    } catch (error) {
      toast({ title: "No se pudo actualizar el cliente", description: customerErrorMessage(error), variant: "destructive" });
    }
  };

  if (detail.isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>;
  if (detail.isError || !customer) return <div className="flex min-h-72 flex-col items-center justify-center text-center"><h1 className="text-xl font-semibold">Cliente no disponible</h1><p className="mt-2 text-muted-foreground">{detail.isError ? customerErrorMessage(detail.error) : "El cliente ya no está disponible."}</p><Button className="mt-5" onClick={() => router.push("/system/customers")}><ArrowLeft />Volver a Clientes</Button></div>;

  const personName = [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter(Boolean).join(" ");
  const isChangingStatus = activateCustomer.isPending || deactivateCustomer.isPending;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><Button variant="ghost" size="icon" aria-label="Volver a Clientes" onClick={() => router.push("/system/customers")}><ArrowLeft className="size-4" /></Button><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">{customer.displayName}</h1><Badge variant={customer.isActive ? "success" : "destructive"}>{customer.isActive ? "Activo" : "Inactivo"}</Badge></div><p className="mt-1 text-muted-foreground">Cliente desde {formatDate(customer.createdAt)}</p></div></div><div className="flex gap-2 self-end sm:self-auto"><Button variant="outline" onClick={() => setEditOpen(true)}><Pencil />Editar</Button>{customer.isActive ? <Button variant="outline" onClick={() => setConfirmDeactivation(true)} disabled={isChangingStatus}><Power />Desactivar</Button> : <Button onClick={() => void changeStatus(true)} disabled={isChangingStatus}><Power />Activar</Button>}</div></div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2">{customer.type === "PERSON" ? <UserRound className="size-5" /> : <Building2 className="size-5" />}Información del cliente</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Tipo" value={customer.type === "PERSON" ? "Persona" : "Organización"} /><Info label="Nombre para mostrar" value={customer.displayName} />{customer.type === "PERSON" ? <Info label="Nombre completo" value={personName || "—"} /> : <><Info label="Razón social" value={customer.legalName ?? "—"} /><Info label="Nombre comercial" value={customer.tradeName ?? "—"} /></>}<Info label="Identificación" value={`${customerIdentificationTypeLabel(customer.identificationType) ?? ""}: ${customer.identificationValue}`} /><Info label="País" value={customer.countryCode ?? "—"} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Contacto</CardTitle></CardHeader><CardContent className="space-y-6"><ContactGroup icon={<Mail />} title="Correos" empty="Este cliente no tiene correos registrados.">{customer.emails.map((email) => <div key={email.id} className="space-y-1"><p className="text-sm">{email.email}</p><div className="flex flex-wrap gap-1">{email.label ? <Badge variant="secondary">{email.label}</Badge> : null}{email.isPrimary ? <Badge>Principal</Badge> : null}{email.isBilling ? <Badge variant="outline">Facturación</Badge> : null}</div></div>)}</ContactGroup><ContactGroup icon={<Phone />} title="Teléfonos" empty="Este cliente no tiene teléfonos registrados.">{customer.phones.map((phone) => <div key={phone.id} className="space-y-1"><p className="text-sm">{phone.phone}</p><div className="flex flex-wrap gap-1">{phone.label ? <Badge variant="secondary">{phone.label}</Badge> : null}{phone.isPrimary ? <Badge>Principal</Badge> : null}</div></div>)}</ContactGroup></CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Direcciones</CardTitle></CardHeader><CardContent>{customer.addresses.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Este cliente todavía no tiene direcciones registradas.</p> : <div className="grid gap-4 md:grid-cols-2">{customer.addresses.map((address) => <div key={address.id} className="rounded-lg border p-4"><div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><p className="font-medium">Dirección</p></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{[address.addressLine1, address.addressLine2, address.district, address.city, address.region, address.postalCode, address.countryCode].filter(Boolean).join(", ") || "Sin detalles de dirección"}</p><div className="mt-3 flex flex-wrap gap-1">{address.purposes.map((purpose) => <Badge key={purpose.purpose} variant={purpose.isPrimaryForPurpose ? "default" : "secondary"}>{purposeLabels[purpose.purpose]}{purpose.isPrimaryForPurpose ? " · Principal" : ""}</Badge>)}</div></div>)}</div>}</CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Registro</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Creado" value={formatDate(customer.createdAt)} /><Info label="Última actualización" value={formatDate(customer.updatedAt)} /></CardContent></Card>
    </div>
    <CustomerDrawer open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    <AlertDialog open={confirmDeactivation} onOpenChange={setConfirmDeactivation}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Desactivar cliente?</AlertDialogTitle><AlertDialogDescription>{customer.displayName} seguirá disponible para consulta, pero quedará inactivo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void changeStatus(false)}>Desactivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p><p className="mt-1 text-sm">{value}</p></div>; }
function ContactGroup({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode[] }) { return <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>{children.length ? <div className="space-y-4">{children}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}</div>; }
