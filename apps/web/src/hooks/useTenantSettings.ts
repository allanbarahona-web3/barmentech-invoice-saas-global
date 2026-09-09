import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { TenantSettings } from "@/schemas/tenantSettings.schema";

const QUERY_KEY = ["tenantSettings"];

export function useTenantSettingsQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => tenantSettingsService.getTenantSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useSaveTenantSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: TenantSettings) =>
      tenantSettingsService.saveTenantSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}

export function useCompleteTenantOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<TenantSettings>) =>
      tenantSettingsService.completeTenantOnboarding(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
