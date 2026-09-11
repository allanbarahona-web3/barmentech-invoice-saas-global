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
import { formatDate } from "@/lib/formatters";
import { interpolate, useTranslations } from "@/i18n";
import { CustomerDrawer } from "@/modules/customers/components/CustomerDrawer";
import { useActivateCustomerMutation, useCustomerDetail, useDeactivateCustomerMutation } from "@/modules/customers/customer.hooks";
import { customerIdentificationTypeLabel } from "@/modules/customers/customer-identification";
import { customerErrorCode, type CustomerAddressPurpose } from "@/modules/customers/customer.service";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { messages, locale } = useTranslations();
  const detail = useCustomerDetail(params.id);
  const activateCustomer = useActivateCustomerMutation();
  const deactivateCustomer = useDeactivateCustomerMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeactivation, setConfirmDeactivation] = useState(false);
  const customer = detail.data;
  const purposeLabels: Record<CustomerAddressPurpose, string> = { BUSINESS: messages.customers.form.businessPurpose, BILLING: messages.customers.form.billingPurpose, SHIPPING: messages.customers.form.shippingPurpose, OTHER: messages.customers.form.otherPurpose };
  const changeStatus = async (isActive: boolean) => {
    if (!customer) return;
    try {
      if (isActive) await activateCustomer.mutateAsync(customer.id); else await deactivateCustomer.mutateAsync(customer.id);
      toast({ title: isActive ? messages.customers.customerActivated : messages.customers.customerDeactivated, description: isActive ? messages.customers.customerActivatedDescription : messages.customers.customerDeactivatedDescription });
      setConfirmDeactivation(false);
    } catch (error) { toast({ title: messages.customers.updateError, description: messages.customers.errors[customerErrorCode(error)], variant: "destructive" }); }
  };
  if (detail.isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-72" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>;
  if (detail.isError || !customer) return <div className="flex min-h-72 flex-col items-center justify-center text-center"><h1 className="text-xl font-semibold">{messages.customers.unavailableTitle}</h1><p className="mt-2 text-muted-foreground">{detail.isError ? messages.customers.errors[customerErrorCode(detail.error)] : messages.customers.unavailableDescription}</p><Button className="mt-5" onClick={() => router.push("/system/customers")}><ArrowLeft />{messages.customers.backToCustomers}</Button></div>;
  const personName = [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter(Boolean).join(" ");
  const isChangingStatus = activateCustomer.isPending || deactivateCustomer.isPending;
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><Button variant="ghost" size="icon" aria-label={messages.customers.backToCustomers} onClick={() => router.push("/system/customers")}><ArrowLeft className="size-4" /></Button><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">{customer.displayName}</h1><Badge variant={customer.isActive ? "success" : "destructive"}>{customer.isActive ? messages.customers.active : messages.customers.inactive}</Badge></div><p className="mt-1 text-muted-foreground">{interpolate(messages.customers.customerSince, { date: formatDate(customer.createdAt, locale) })}</p></div></div><div className="flex gap-2 self-end sm:self-auto"><Button variant="outline" onClick={() => setEditOpen(true)}><Pencil />{messages.customers.edit}</Button>{customer.isActive ? <Button variant="outline" onClick={() => setConfirmDeactivation(true)} disabled={isChangingStatus}><Power />{messages.customers.deactivate}</Button> : <Button onClick={() => void changeStatus(true)} disabled={isChangingStatus}><Power />{messages.customers.activate}</Button>}</div></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2">{customer.type === "PERSON" ? <UserRound className="size-5" /> : <Building2 className="size-5" />}{messages.customers.customerInformation}</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label={messages.customers.type} value={customer.type === "PERSON" ? messages.customers.person : messages.customers.organization} /><Info label={messages.customers.displayName} value={customer.displayName} />{customer.type === "PERSON" ? <Info label={messages.customers.fullName} value={personName || "—"} /> : <><Info label={messages.customers.legalName} value={customer.legalName ?? "—"} /><Info label={messages.customers.tradeName} value={customer.tradeName ?? "—"} /></>}<Info label={messages.customers.identification} value={`${customerIdentificationTypeLabel(customer.identificationType, messages.customers.identificationTypes) ?? ""}: ${customer.identificationValue}`} /><Info label={messages.customers.country} value={customer.countryCode ?? "—"} /></CardContent></Card>
      <Card><CardHeader><CardTitle>{messages.customers.contact}</CardTitle></CardHeader><CardContent className="space-y-6"><ContactGroup icon={<Mail />} title={messages.customers.emails} empty={messages.customers.noEmails}>{customer.emails.map((email) => <div key={email.id} className="space-y-1"><p className="text-sm">{email.email}</p><div className="flex flex-wrap gap-1">{email.label ? <Badge variant="secondary">{email.label}</Badge> : null}{email.isPrimary ? <Badge>{messages.common.primary}</Badge> : null}{email.isBilling ? <Badge variant="outline">{messages.common.billing}</Badge> : null}</div></div>)}</ContactGroup><ContactGroup icon={<Phone />} title={messages.customers.phones} empty={messages.customers.noPhones}>{customer.phones.map((phone) => <div key={phone.id} className="space-y-1"><p className="text-sm">{phone.phone}</p><div className="flex flex-wrap gap-1">{phone.label ? <Badge variant="secondary">{phone.label}</Badge> : null}{phone.isPrimary ? <Badge>{messages.common.primary}</Badge> : null}</div></div>)}</ContactGroup></CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>{messages.customers.addresses}</CardTitle></CardHeader><CardContent>{customer.addresses.length === 0 ? <p className="py-6 text-sm text-muted-foreground">{messages.customers.noAddresses}</p> : <div className="grid gap-4 md:grid-cols-2">{customer.addresses.map((address) => <div key={address.id} className="rounded-lg border p-4"><div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><p className="font-medium">{messages.customers.address}</p></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{[address.addressLine1, address.addressLine2, address.district, address.city, address.region, address.postalCode, address.countryCode].filter(Boolean).join(", ") || messages.customers.noAddressDetails}</p><div className="mt-3 flex flex-wrap gap-1">{address.purposes.map((purpose) => <Badge key={purpose.purpose} variant={purpose.isPrimaryForPurpose ? "default" : "secondary"}>{purposeLabels[purpose.purpose]}{purpose.isPrimaryForPurpose ? ` · ${messages.common.primary}` : ""}</Badge>)}</div></div>)}</div>}</CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>{messages.customers.record}</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label={messages.customers.created} value={formatDate(customer.createdAt, locale)} /><Info label={messages.customers.updated} value={formatDate(customer.updatedAt, locale)} /></CardContent></Card></div>
    <CustomerDrawer open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    <AlertDialog open={confirmDeactivation} onOpenChange={setConfirmDeactivation}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{messages.customers.deactivateTitle}</AlertDialogTitle><AlertDialogDescription>{interpolate(messages.customers.deactivateDescription, { name: customer.displayName })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => void changeStatus(false)}>{messages.customers.deactivate}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p><p className="mt-1 text-sm">{value}</p></div>; }
function ContactGroup({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode[] }) { return <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>{children.length ? <div className="space-y-4">{children}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}</div>; }
