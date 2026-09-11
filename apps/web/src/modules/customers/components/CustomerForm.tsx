"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useForm, type Path, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/constants/countries";
import {
  customerEditorDefaults,
  customerEditorSchema,
  emptyAddress,
  emptyEmail,
  emptyPhone,
  type CustomerEditorInitialCustomer,
  type CustomerEditorValues,
} from "../customer-editor.schema";
import { customerIdentificationTypes, customerIdentificationTypeLabel, isKnownCustomerIdentificationType } from "../customer-identification";

type CustomerFormProps = {
  customer?: CustomerEditorInitialCustomer;
  open: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CustomerEditorValues) => Promise<void> | void;
};

const purposeLabels = {
  BUSINESS: "Dirección principal / negocio",
  BILLING: "Facturación",
  SHIPPING: "Entrega",
  OTHER: "Otro",
} as const;

export function CustomerForm({ customer, open, isSubmitting = false, onCancel, onSubmit }: CustomerFormProps) {
  const form = useForm<CustomerEditorValues>({ resolver: zodResolver(customerEditorSchema), defaultValues: customerEditorDefaults(customer) });
  const emails = useFieldArray({ control: form.control, name: "emails" });
  const phones = useFieldArray({ control: form.control, name: "phones" });
  const addresses = useFieldArray({ control: form.control, name: "addresses" });
  const displayNameEdited = useRef(Boolean(customer?.displayName));

  const type = form.watch("type");
  const firstName = form.watch("firstName");
  const middleName = form.watch("middleName");
  const lastName = form.watch("lastName");
  const secondLastName = form.watch("secondLastName");
  const legalName = form.watch("legalName");
  const tradeName = form.watch("tradeName");
  const identificationType = form.watch("identificationType");

  useEffect(() => {
    if (!open) return;
    form.reset(customerEditorDefaults(customer));
    displayNameEdited.current = Boolean(customer?.displayName);
  }, [customer, form, open]);

  useEffect(() => {
    if (displayNameEdited.current) return;
    const suggestion = type === "PERSON"
      ? suggestedDisplayName(firstName, middleName, lastName, secondLastName)
      : suggestedDisplayName(tradeName || legalName || "");
    if (suggestion) form.setValue("displayName", suggestion, { shouldValidate: true });
  }, [firstName, form, lastName, legalName, middleName, secondLastName, tradeName, type]);

  const displayNameRegistration = form.register("displayName");
  const setPrimaryEmail = (index: number) => form.setValue("emails", form.getValues("emails").map((email, itemIndex) => ({ ...email, isPrimary: itemIndex === index })), { shouldValidate: true });
  const setPrimaryPhone = (index: number) => form.setValue("phones", form.getValues("phones").map((phone, itemIndex) => ({ ...phone, isPrimary: itemIndex === index })), { shouldValidate: true });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-8 pb-6">
            <FormSection title="Información principal" description="Empieza con la información que identifica al cliente.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de cliente" required error={errorFor(form, "type")}>
                  <Select value={type} onValueChange={(value) => form.setValue("type", value as CustomerEditorValues["type"], { shouldValidate: true })} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PERSON">Persona</SelectItem><SelectItem value="ORGANIZATION">Organización</SelectItem></SelectContent>
                  </Select>
                </Field>
                <CountryField form={form} name="countryCode" label="País" disabled={isSubmitting} />
              </div>

              {type === "PERSON" ? <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="firstName" label="Nombre" required disabled={isSubmitting} />
                <TextField form={form} name="middleName" label="Segundo nombre" disabled={isSubmitting} />
                <TextField form={form} name="lastName" label="Primer apellido" required disabled={isSubmitting} />
                <TextField form={form} name="secondLastName" label="Segundo apellido" disabled={isSubmitting} />
              </div> : <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="legalName" label="Razón social" required disabled={isSubmitting} />
                <TextField form={form} name="tradeName" label="Nombre comercial" disabled={isSubmitting} />
              </div>}

              <Field label="Nombre para mostrar" required error={errorFor(form, "displayName")}>
                <Input {...displayNameRegistration} onChange={(event) => { displayNameEdited.current = true; displayNameRegistration.onChange(event); }} placeholder={type === "PERSON" ? "Nombre completo" : "Nombre visible del cliente"} disabled={isSubmitting} />
                <p className="text-muted-foreground mt-1 text-xs">Se sugiere automáticamente; puedes ajustarlo si lo necesitas.</p>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de identificación" required error={errorFor(form, "identificationType")}>
                  <Select value={identificationType || undefined} onValueChange={(value) => form.setValue("identificationType", value, { shouldValidate: true })} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                    <SelectContent>
                      {!isKnownCustomerIdentificationType(identificationType) && identificationType ? <SelectItem value={identificationType}>{customerIdentificationTypeLabel(identificationType)} (valor existente)</SelectItem> : null}
                      {customerIdentificationTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <TextField form={form} name="identificationValue" label="Número de identificación" required disabled={isSubmitting} />
              </div>
            </FormSection>

            <FormSection title="Contacto" description="Agrega los correos y teléfonos que este cliente realmente utiliza.">
              <div className="space-y-3">
                {emails.fields.map((field, index) => <ContactCard key={field.id} title={`Correo ${index + 1}`} onRemove={() => emails.remove(index)} canRemove={emails.fields.length > 1} disabled={isSubmitting}>
                  <div className="grid gap-4 sm:grid-cols-2"><TextField form={form} name={`emails.${index}.label`} label="Etiqueta" placeholder="Ej. General" disabled={isSubmitting} /><TextField form={form} name={`emails.${index}.email`} label="Correo" type="email" disabled={isSubmitting} /></div>
                  <div className="flex flex-wrap gap-4"><BooleanField label="Principal" checked={Boolean(form.watch(`emails.${index}.isPrimary`))} onChange={(checked) => checked ? setPrimaryEmail(index) : form.setValue(`emails.${index}.isPrimary`, false, { shouldValidate: true })} disabled={isSubmitting} /><BooleanField label="Facturación" checked={Boolean(form.watch(`emails.${index}.isBilling`))} onChange={(checked) => form.setValue(`emails.${index}.isBilling`, checked, { shouldValidate: true })} disabled={isSubmitting} /></div>
                </ContactCard>)}
                <p className="text-destructive text-sm">{errorFor(form, "emails")}</p>
                <Button type="button" variant="outline" onClick={() => emails.append({ ...emptyEmail(), isPrimary: emails.fields.length === 0 })} disabled={isSubmitting}><Plus className="mr-2 size-4" />Agregar correo</Button>
              </div>

              <div className="space-y-3 border-t pt-5">
                {phones.fields.map((field, index) => <ContactCard key={field.id} title={`Teléfono ${index + 1}`} onRemove={() => phones.remove(index)} canRemove={phones.fields.length > 1} disabled={isSubmitting}>
                  <div className="grid gap-4 sm:grid-cols-2"><TextField form={form} name={`phones.${index}.label`} label="Etiqueta" placeholder="Ej. Oficina" disabled={isSubmitting} /><TextField form={form} name={`phones.${index}.phone`} label="Teléfono" type="tel" disabled={isSubmitting} /></div>
                  <BooleanField label="Principal" checked={Boolean(form.watch(`phones.${index}.isPrimary`))} onChange={(checked) => checked ? setPrimaryPhone(index) : form.setValue(`phones.${index}.isPrimary`, false, { shouldValidate: true })} disabled={isSubmitting} />
                </ContactCard>)}
                <p className="text-destructive text-sm">{errorFor(form, "phones")}</p>
                <Button type="button" variant="outline" onClick={() => phones.append({ ...emptyPhone(), isPrimary: phones.fields.length === 0 })} disabled={isSubmitting}><Plus className="mr-2 size-4" />Agregar teléfono</Button>
              </div>
            </FormSection>

            <FormSection title="Direcciones" description="Una misma dirección puede servir para negocio, facturación y entrega.">
              <div className="space-y-4">
                {addresses.fields.map((field, index) => <AddressCard key={field.id} form={form} index={index} title={index === 0 ? "Dirección principal" : `Otra dirección ${index}`} onRemove={() => addresses.remove(index)} canRemove={addresses.fields.length > 1} disabled={isSubmitting} />)}
                <p className="text-destructive text-sm">{errorFor(form, "addresses")}</p>
                <Button type="button" variant="outline" onClick={() => addresses.append(emptyAddress())} disabled={isSubmitting}><Plus className="mr-2 size-4" />Agregar otra dirección</Button>
              </div>
            </FormSection>
          </div>
        </div>
        <div className="sticky bottom-0 border-t bg-background px-6 py-4"><div className="mx-auto flex max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar cliente"}</Button></div></div>
      </form>
    </Form>
  );
}

function AddressCard({ form, index, title, onRemove, canRemove, disabled }: { form: UseFormReturn<CustomerEditorValues>; index: number; title: string; onRemove: () => void; canRemove: boolean; disabled?: boolean }) {
  const prefix = `addresses.${index}` as const;
  const purposes = form.watch(`${prefix}.purposes`);
  const hasPurpose = (purpose: keyof typeof purposeLabels) => purposes.some((item) => item.purpose === purpose);
  const setPurposes = (next: CustomerEditorValues["addresses"][number]["purposes"]) => form.setValue(`${prefix}.purposes`, next, { shouldValidate: true });
  const togglePurpose = (purpose: keyof typeof purposeLabels, checked: boolean) => setPurposes(checked ? [...purposes, { purpose, isPrimaryForPurpose: false }] : purposes.filter((item) => item.purpose !== purpose));
  const setPrimary = (purpose: keyof typeof purposeLabels, checked: boolean) => {
    const addresses = form.getValues("addresses").map((address, addressIndex) => ({
      ...address,
      purposes: address.purposes.map((assignment) => assignment.purpose === purpose ? { ...assignment, isPrimaryForPurpose: checked && addressIndex === index } : assignment),
    }));
    form.setValue("addresses", addresses, { shouldValidate: true });
  };

  return <div className="space-y-4 rounded-lg border bg-muted/20 p-4"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-medium">{title}</h4>{canRemove ? <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}><Trash2 className="mr-2 size-4" />Eliminar</Button> : null}</div>
    <div className="grid gap-4 sm:grid-cols-2"><CountryField form={form} name={`${prefix}.countryCode`} label="País" disabled={disabled} /><TextField form={form} name={`${prefix}.region`} label="Estado / provincia / región" disabled={disabled} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><TextField form={form} name={`${prefix}.city`} label="Ciudad" disabled={disabled} /><TextField form={form} name={`${prefix}.district`} label="Distrito / localidad" disabled={disabled} /></div>
    <TextField form={form} name={`${prefix}.postalCode`} label="Código postal / ZIP" disabled={disabled} />
    <TextField form={form} name={`${prefix}.addressLine1`} label="Dirección" disabled={disabled} />
    <TextField form={form} name={`${prefix}.addressLine2`} label="Detalles adicionales" disabled={disabled} />
    <div className="space-y-3 border-t pt-4"><p className="text-sm font-medium">Usos de esta dirección</p>{(Object.keys(purposeLabels) as Array<keyof typeof purposeLabels>).map((purpose) => <div key={purpose} className="flex flex-wrap items-center gap-4"><BooleanField label={purposeLabels[purpose]} checked={hasPurpose(purpose)} onChange={(checked) => togglePurpose(purpose, checked)} disabled={disabled} />{hasPurpose(purpose) ? <BooleanField label="Principal para este uso" checked={purposes.find((item) => item.purpose === purpose)?.isPrimaryForPurpose ?? false} onChange={(checked) => setPrimary(purpose, checked)} disabled={disabled} /> : null}</div>)}</div>
  </div>;
}

function ContactCard({ title, children, onRemove, canRemove, disabled }: { title: string; children: React.ReactNode; onRemove: () => void; canRemove: boolean; disabled?: boolean }) {
  return <div className="space-y-4 rounded-lg border p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{title}</p>{canRemove ? <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}><Trash2 className="mr-2 size-4" />Eliminar</Button> : null}</div>{children}</div>;
}

function BooleanField({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} disabled={disabled} />{label}</label>;
}

function suggestedDisplayName(...parts: Array<string | undefined>) { return parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part)).join(" ").replace(/\s+/g, " "); }
function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="space-y-4"><div><h3 className="font-semibold">{title}</h3><p className="text-muted-foreground mt-1 text-sm">{description}</p></div>{children}</section>; }
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) { return <div className="space-y-2"><label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-1">*</span>}</label>{children}{error && <p className="text-destructive text-sm">{error}</p>}</div>; }
function TextField({ form, name, label, required, disabled, type = "text", placeholder }: { form: UseFormReturn<CustomerEditorValues>; name: Path<CustomerEditorValues>; label: string; required?: boolean; disabled?: boolean; type?: string; placeholder?: string }) { return <Field label={label} required={required} error={errorFor(form, name)}><Input {...form.register(name)} type={type} placeholder={placeholder} disabled={disabled} /></Field>; }
function CountryField({ form, name, label, disabled }: { form: UseFormReturn<CustomerEditorValues>; name: Path<CustomerEditorValues>; label: string; disabled?: boolean }) { return <Field label={label} error={errorFor(form, name)}><Select value={String(form.watch(name) ?? "")} onValueChange={(value) => form.setValue(name, value, { shouldValidate: true })} disabled={disabled}><SelectTrigger><SelectValue placeholder="Selecciona un país" /></SelectTrigger><SelectContent className="max-h-72">{COUNTRIES.map((country) => <SelectItem key={country.code} value={country.code}>{country.nameEs}</SelectItem>)}</SelectContent></Select></Field>; }
function errorFor(form: UseFormReturn<CustomerEditorValues>, name: Path<CustomerEditorValues>): string | undefined { return form.getFieldState(name, form.formState).error?.message; }
