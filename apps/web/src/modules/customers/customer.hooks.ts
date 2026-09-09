import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Customer, CustomerInput } from "./customer.schema";
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from "./customer.storage";

const QUERY_KEYS = {
  customers: ["customers"] as const,
  customer: (id: string) => ["customers", id] as const,
  search: (query: string) => ["customers", "search", query] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.customers,
    queryFn: listCustomers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.customer(id),
    queryFn: () => getCustomerById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchCustomers(query),
    enabled: query.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      queryClient.setQueryData(QUERY_KEYS.customer(newCustomer.id), newCustomer);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) =>
      updateCustomer(id, input),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      queryClient.setQueryData(QUERY_KEYS.customer(updatedCustomer.id), updatedCustomer);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.customer(deletedId) });
    },
  });
}
