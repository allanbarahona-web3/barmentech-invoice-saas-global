import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyProfile, CompanyProfileInput } from "./company.schema";
import {
  getCompanyProfile,
  saveCompanyProfile,
  updateCompanyProfile,
  clearCompanyProfile,
} from "./company.storage";

const QUERY_KEY = ["company-profile"];

export function useCompanyProfile() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCompanyProfile,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useSaveCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompanyProfileInput) => saveCompanyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEY, profile);
    },
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (partial: Partial<CompanyProfileInput>) => updateCompanyProfile(partial),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEY, profile);
    },
  });
}

export function useClearCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCompanyProfile,
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEY, null);
    },
  });
}
