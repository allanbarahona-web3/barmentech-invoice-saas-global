export const customerIdentificationTypes = [
  { value: "NATIONAL_ID", label: "ID Nacional" },
  { value: "LEGAL_ENTITY_ID", label: "ID Empresa" },
  { value: "RESIDENCY_ID", label: "Residencia / DIMEX" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "TAX_ID", label: "NIT / Tax ID" },
  { value: "SSN", label: "SSN" },
  { value: "EIN", label: "EIN" },
  { value: "OTHER", label: "Otro" },
] as const;

export function customerIdentificationTypeLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return customerIdentificationTypes.find((type) => type.value === value)?.label ?? `Otro (${value})`;
}

export function isKnownCustomerIdentificationType(value: string | null | undefined): boolean {
  return Boolean(value && customerIdentificationTypes.some((type) => type.value === value));
}
