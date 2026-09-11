export const customerIdentificationTypes = ["NATIONAL_ID", "LEGAL_ENTITY_ID", "RESIDENCY_ID", "PASSPORT", "TAX_ID", "SSN", "EIN", "OTHER"] as const;
type CustomerIdentificationType = (typeof customerIdentificationTypes)[number];
type IdentificationMessages = Record<CustomerIdentificationType, string>;

export function getCustomerIdentificationTypes(messages: IdentificationMessages) {
  return customerIdentificationTypes.map((value) => ({ value, label: messages[value] }));
}

export function customerIdentificationTypeLabel(value: string | null | undefined, messages: IdentificationMessages): string | undefined {
  if (!value) return undefined;
  return customerIdentificationTypes.includes(value as CustomerIdentificationType) ? messages[value as CustomerIdentificationType] : `${messages.OTHER} (${value})`;
}

export function isKnownCustomerIdentificationType(value: string | null | undefined): boolean {
  return Boolean(value && customerIdentificationTypes.includes(value as CustomerIdentificationType));
}
