import { z } from "zod";

export const customerTypeSchema = z.enum(["PERSON", "ORGANIZATION"]);
export const customerAddressPurposeSchema = z.enum(["BUSINESS", "BILLING", "SHIPPING", "OTHER"]);

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const optionalCountryCode = z.string().trim().regex(/^[a-zA-Z]{2}$/, "countryCode").optional().or(z.literal(""));

const emailSchema = z.object({
  label: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("emailInvalid").optional().or(z.literal("")),
  isPrimary: z.boolean(),
  isBilling: z.boolean(),
});

const phoneSchema = z.object({
  label: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(100).optional().or(z.literal("")),
  isPrimary: z.boolean(),
});

const addressPurposeSchema = z.object({
  purpose: customerAddressPurposeSchema,
  isPrimaryForPurpose: z.boolean(),
});

const addressSchema = z.object({
  countryCode: optionalCountryCode,
  region: optionalText,
  city: optionalText,
  district: optionalText,
  postalCode: z.string().trim().max(50).optional().or(z.literal("")),
  addressLine1: optionalText,
  addressLine2: optionalText,
  purposes: z.array(addressPurposeSchema).min(1, "addressPurpose"),
});

export const customerEditorSchema = z.object({
  type: customerTypeSchema,
  displayName: z.string().trim().min(1, "displayName").max(300),
  firstName: z.string().trim().max(150).optional().or(z.literal("")),
  middleName: z.string().trim().max(150).optional().or(z.literal("")),
  lastName: z.string().trim().max(150).optional().or(z.literal("")),
  secondLastName: z.string().trim().max(150).optional().or(z.literal("")),
  legalName: z.string().trim().max(300).optional().or(z.literal("")),
  tradeName: z.string().trim().max(300).optional().or(z.literal("")),
  identificationType: z.string().trim().min(1, "identificationType").max(100),
  identificationValue: z.string().trim().min(1, "identificationNumber").max(200),
  countryCode: optionalCountryCode,
  emails: z.array(emailSchema),
  phones: z.array(phoneSchema),
  addresses: z.array(addressSchema),
}).superRefine((data, ctx) => {
  if (data.type === "PERSON") {
    if (!data.firstName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["firstName"], message: "firstName" });
    if (!data.lastName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lastName"], message: "lastName" });
  }
  if (data.type === "ORGANIZATION" && !data.legalName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["legalName"], message: "legalName" });
  }

  const emailsWithValues = data.emails.filter((item) => item.email || item.label);
  if (emailsWithValues.some((item) => !item.email)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emails"], message: "emailRequired" });
  }
  if (emailsWithValues.filter((item) => item.isPrimary).length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emails"], message: "onePrimaryEmail" });
  }

  const phonesWithValues = data.phones.filter((item) => item.phone || item.label);
  if (phonesWithValues.some((item) => !item.phone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phones"], message: "phoneRequired" });
  }
  if (phonesWithValues.filter((item) => item.isPrimary).length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phones"], message: "onePrimaryPhone" });
  }

  const primaryPurposes = new Set<string>();
  data.addresses.forEach((address, index) => {
    const hasAddressValue = [address.countryCode, address.region, address.city, address.district, address.postalCode, address.addressLine1, address.addressLine2].some(Boolean);
    if (!hasAddressValue) return;
    address.purposes.forEach((assignment) => {
      if (!assignment.isPrimaryForPurpose) return;
      if (primaryPurposes.has(assignment.purpose)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["addresses", index, "purposes"], message: "onePrimaryAddress" });
      }
      primaryPurposes.add(assignment.purpose);
    });
  });
});

export type CustomerEditorValues = z.infer<typeof customerEditorSchema>;
export type CustomerEmailPayload = { label?: string | null; email: string; isPrimary: boolean; isBilling: boolean };
export type CustomerPhonePayload = { label?: string | null; phone: string; isPrimary: boolean };
export type CustomerAddressPurposePayload = { purpose: z.infer<typeof customerAddressPurposeSchema>; isPrimaryForPurpose: boolean };
export type CustomerAddressPayload = {
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  purposes: CustomerAddressPurposePayload[];
};

export type CustomerMutationPayload = {
  type: z.infer<typeof customerTypeSchema>;
  displayName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  identificationType: string;
  identificationValue: string;
  countryCode?: string | null;
  emails: CustomerEmailPayload[];
  phones: CustomerPhonePayload[];
  addresses: CustomerAddressPayload[];
};

export type CustomerEditorInitialCustomer = Partial<Omit<CustomerMutationPayload, "identificationType" | "identificationValue" | "emails" | "phones" | "addresses">> & {
  id: string;
  identificationType: string;
  identificationValue: string;
  emails?: CustomerEmailPayload[];
  phones?: CustomerPhonePayload[];
  addresses?: CustomerAddressPayload[];
};

export const emptyEmail = (): CustomerEditorValues["emails"][number] => ({ label: "", email: "", isPrimary: true, isBilling: false });
export const emptyPhone = (): CustomerEditorValues["phones"][number] => ({ label: "", phone: "", isPrimary: true });
export const emptyAddress = (main = false): CustomerEditorValues["addresses"][number] => ({
  countryCode: "", region: "", city: "", district: "", postalCode: "", addressLine1: "", addressLine2: "",
  purposes: [{ purpose: main ? "BUSINESS" : "OTHER", isPrimaryForPurpose: main }],
});

function addressFormValues(address: CustomerAddressPayload): CustomerEditorValues["addresses"][number] {
  return {
    countryCode: address.countryCode ?? "",
    region: address.region ?? "",
    city: address.city ?? "",
    district: address.district ?? "",
    postalCode: address.postalCode ?? "",
    addressLine1: address.addressLine1 ?? "",
    addressLine2: address.addressLine2 ?? "",
    purposes: address.purposes.map((purpose) => ({ ...purpose })),
  };
}

export function customerEditorDefaults(customer?: CustomerEditorInitialCustomer): CustomerEditorValues {
  return {
    type: customer?.type ?? "PERSON",
    displayName: customer?.displayName ?? "",
    firstName: customer?.firstName ?? "",
    middleName: customer?.middleName ?? "",
    lastName: customer?.lastName ?? "",
    secondLastName: customer?.secondLastName ?? "",
    legalName: customer?.legalName ?? "",
    tradeName: customer?.tradeName ?? "",
    identificationType: customer?.identificationType ?? "",
    identificationValue: customer?.identificationValue ?? "",
    countryCode: customer?.countryCode ?? "",
    emails: customer?.emails?.length ? customer.emails.map((email) => ({ label: email.label ?? "", email: email.email, isPrimary: email.isPrimary, isBilling: email.isBilling })) : [emptyEmail()],
    phones: customer?.phones?.length ? customer.phones.map((phone) => ({ label: phone.label ?? "", phone: phone.phone, isPrimary: phone.isPrimary })) : [emptyPhone()],
    addresses: customer?.addresses?.length ? customer.addresses.map(addressFormValues) : [emptyAddress(true)],
  };
}

function optionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function optionalValueOrNull(value: string | undefined, clearEmptyValues: boolean): string | null | undefined {
  return optionalValue(value) ?? (clearEmptyValues ? null : undefined);
}

function hasAddressValue(address: CustomerEditorValues["addresses"][number]) {
  return [address.countryCode, address.region, address.city, address.district, address.postalCode, address.addressLine1, address.addressLine2].some((value) => Boolean(optionalValue(value)));
}

export function toCustomerMutationPayload(values: CustomerEditorValues, clearEmptyValues = false): CustomerMutationPayload {
  return {
    type: values.type,
    displayName: values.displayName.trim(),
    firstName: optionalValueOrNull(values.firstName, clearEmptyValues),
    middleName: optionalValueOrNull(values.middleName, clearEmptyValues),
    lastName: optionalValueOrNull(values.lastName, clearEmptyValues),
    secondLastName: optionalValueOrNull(values.secondLastName, clearEmptyValues),
    legalName: optionalValueOrNull(values.legalName, clearEmptyValues),
    tradeName: optionalValueOrNull(values.tradeName, clearEmptyValues),
    identificationType: values.identificationType.trim(),
    identificationValue: values.identificationValue.trim(),
    countryCode: optionalValueOrNull(values.countryCode, clearEmptyValues)?.toUpperCase() ?? (clearEmptyValues ? null : undefined),
    emails: values.emails.filter((email) => Boolean(optionalValue(email.email))).map((email) => ({ label: optionalValue(email.label) ?? null, email: email.email?.trim() ?? "", isPrimary: email.isPrimary, isBilling: email.isBilling })),
    phones: values.phones.filter((phone) => Boolean(optionalValue(phone.phone))).map((phone) => ({ label: optionalValue(phone.label) ?? null, phone: phone.phone?.trim() ?? "", isPrimary: phone.isPrimary })),
    addresses: values.addresses.filter(hasAddressValue).map((address) => ({
      countryCode: optionalValue(address.countryCode)?.toUpperCase(),
      region: optionalValue(address.region),
      city: optionalValue(address.city),
      district: optionalValue(address.district),
      postalCode: optionalValue(address.postalCode),
      addressLine1: optionalValue(address.addressLine1),
      addressLine2: optionalValue(address.addressLine2),
      purposes: address.purposes.map((purpose) => ({ ...purpose })),
    })),
  };
}
