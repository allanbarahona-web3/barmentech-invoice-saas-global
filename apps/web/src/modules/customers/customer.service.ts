import axios from "axios";
import { getHttpClient } from "@/lib/httpClient";
import type { CustomerMutationPayload } from "./customer-editor.schema";

export type CustomerType = "PERSON" | "ORGANIZATION";
export type CustomerAddressPurpose = "BUSINESS" | "BILLING" | "SHIPPING" | "OTHER";

export type CustomerEmail = {
  id: string;
  label: string | null;
  email: string;
  isPrimary: boolean;
  isBilling: boolean;
};

export type CustomerPhone = {
  id: string;
  label: string | null;
  phone: string;
  isPrimary: boolean;
};

export type CustomerAddress = {
  id: string;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  purposes: Array<{
    purpose: CustomerAddressPurpose;
    isPrimaryForPurpose: boolean;
  }>;
};

export type Customer = {
  id: string;
  type: CustomerType;
  displayName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  secondLastName: string | null;
  legalName: string | null;
  tradeName: string | null;
  identificationType: string;
  identificationValue: string;
  countryCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  emails: CustomerEmail[];
  phones: CustomerPhone[];
  addresses: CustomerAddress[];
};

export type CustomerListItem = {
  id: string;
  type: CustomerType;
  displayName: string;
  identificationType: string;
  identificationValue: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};
export type CustomerListParams = { search?: string; isActive?: boolean; page?: number; pageSize?: number };
export type CustomerListResponse = {
  items: CustomerListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function listCustomers(params: CustomerListParams = {}): Promise<CustomerListResponse> {
  const response = await getHttpClient().get<CustomerListResponse>("/customers", { params });
  return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const response = await getHttpClient().get<Customer>(`/customers/${id}`);
  return response.data;
}

export async function createCustomer(payload: CustomerMutationPayload): Promise<Customer> {
  const response = await getHttpClient().post<Customer>("/customers", payload);
  return response.data;
}

export async function updateCustomer(id: string, payload: CustomerMutationPayload): Promise<Customer> {
  const response = await getHttpClient().patch<Customer>(`/customers/${id}`, payload);
  return response.data;
}

export async function activateCustomer(id: string): Promise<Customer> {
  const response = await getHttpClient().patch<Customer>(`/customers/${id}/activate`);
  return response.data;
}

export async function deactivateCustomer(id: string): Promise<Customer> {
  const response = await getHttpClient().patch<Customer>(`/customers/${id}/deactivate`);
  return response.data;
}

export type CustomerErrorCode = "requestFailed" | "sessionExpired" | "forbidden" | "unavailable" | "duplicateIdentification" | "identificationRequired" | "primaryEmail" | "primaryPhone" | "primaryAddress" | "addressPurpose" | "invalidTypeFields" | "saveFailed";

export function customerErrorCode(error: unknown): CustomerErrorCode {
  if (!axios.isAxiosError(error)) return "requestFailed";
  const status = error.response?.status;
  const message = error.response?.data?.message;
  if (status === 401) return "sessionExpired";
  if (status === 403) return "forbidden";
  if (status === 404 || message === "CUSTOMER_NOT_FOUND") return "unavailable";
  if (message === "DUPLICATE_CUSTOMER_IDENTIFICATION") return "duplicateIdentification";
  if (message === "IDENTIFICATION_REQUIRED" || message === "INVALID_IDENTIFICATION_PAIR") return "identificationRequired";
  if (message === "PRIMARY_EMAIL_CONFLICT") return "primaryEmail";
  if (message === "PRIMARY_PHONE_CONFLICT") return "primaryPhone";
  if (message === "PRIMARY_ADDRESS_CONFLICT") return "primaryAddress";
  if (message === "ADDRESS_PURPOSE_REQUIRED" || message === "DUPLICATE_ADDRESS_PURPOSE") return "addressPurpose";
  if (message === "INVALID_CUSTOMER_TYPE_FIELDS") return "invalidTypeFields";
  return "saveFailed";
}
