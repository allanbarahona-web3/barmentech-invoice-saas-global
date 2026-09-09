import { useQuery } from "@tanstack/react-query";
import { getTrial, getTrialStatus, isTrialActive, getTrialDaysLeft } from "./trial.storage";

const QUERY_KEYS = {
  trial: ["trial"] as const,
  trialStatus: ["trial", "status"] as const,
};

/**
 * Get trial data
 * Automatically starts trial if it doesn't exist
 */
export function useTrial() {
  return useQuery({
    queryKey: QUERY_KEYS.trial,
    queryFn: getTrial,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get complete trial status including active state and days left
 */
export function useTrialStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.trialStatus,
    queryFn: getTrialStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Check if trial is currently active
 */
export function useIsTrialActive() {
  return useQuery({
    queryKey: [...QUERY_KEYS.trial, "active"],
    queryFn: isTrialActive,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get remaining trial days
 */
export function useTrialDaysLeft() {
  return useQuery({
    queryKey: [...QUERY_KEYS.trial, "daysLeft"],
    queryFn: getTrialDaysLeft,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
