import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer as LegacyCustomer } from "./customer.schema";
import {
  activateCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomer,
  listCustomers,
  type Customer,
  type CustomerListParams,
  type CustomerListResponse,
  updateCustomer,
} from "./customer.service";
import type { CustomerMutationPayload } from "./customer-editor.schema";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomerList(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomerDetail(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerMutationPayload) => createCustomer(payload),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerMutationPayload }) => updateCustomer(id, payload),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

function useCustomerStatusMutation(mutationFn: (id: string) => Promise<Customer>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useActivateCustomerMutation() {
  return useCustomerStatusMutation(activateCustomer);
}

export function useDeactivateCustomerMutation() {
  return useCustomerStatusMutation(deactivateCustomer);
}

// Compatibility reads for inherited consumers. They are derived from the
// backend response and never read or write browser storage.
export function useCustomers() {
  const query = useCustomerList({ page: 1, pageSize: 100 });
  return { ...query, data: query.data?.items.map(toLegacyCustomer) };
}

export function useCustomer(id: string) {
  const query = useCustomerDetail(id);
  return { ...query, data: query.data ? toLegacyCustomer(query.data) : undefined };
}

function toLegacyCustomer(customer: Customer | CustomerListResponse["items"][number]): LegacyCustomer {
  const isDetail = "addresses" in customer;
  const address = isDetail
    ? customer.addresses.find((item) => item.purposes.some((purpose) => purpose.purpose === "BUSINESS" && purpose.isPrimaryForPurpose)) ?? customer.addresses[0]
    : undefined;
  const email = isDetail
    ? customer.emails.find((item) => item.isPrimary)?.email ?? customer.emails[0]?.email ?? ""
    : customer.email ?? "";
  const phone = isDetail
    ? customer.phones.find((item) => item.isPrimary)?.phone ?? customer.phones[0]?.phone ?? ""
    : customer.phone ?? "";

  return {
    id: customer.id,
    name: customer.displayName,
    email,
    phone,
    idNumber: customer.identificationValue ?? "",
    country: isDetail ? customer.countryCode ?? "" : "",
    state: address?.region ?? "",
    city: address?.city ?? "",
    zipCode: address?.postalCode ?? "",
    addressDetail: address?.addressLine1 ?? "",
    status: customer.isActive ? "active" : "inactive",
    createdAt: "createdAt" in customer ? customer.createdAt : "",
    updatedAt: "updatedAt" in customer ? customer.updatedAt : "",
  };
}
