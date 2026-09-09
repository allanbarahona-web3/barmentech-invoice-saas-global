// TODO: replace with API calls

import { Trial, trialSchema } from "./trial.schema";

const STORAGE_KEY = "trial";
const TRIAL_DURATION_DAYS = 14;

/**
 * Get trial data from localStorage
 */
function getStoredTrial(): Trial | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const validated = trialSchema.safeParse(parsed);

    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

/**
 * Save trial data to localStorage
 */
function saveTrial(trial: Trial): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trial));
}

/**
 * Get current trial or create one if it doesn't exist
 */
export async function getTrial(): Promise<Trial> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const existing = getStoredTrial();
  if (existing) {
    return existing;
  }

  // Create new trial starting now
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + TRIAL_DURATION_DAYS);

  const newTrial: Trial = {
    trialStartsAt: now.toISOString(),
    trialEndsAt: endsAt.toISOString(),
    trialDays: TRIAL_DURATION_DAYS,
  };

  saveTrial(newTrial);
  return newTrial;
}

/**
 * Start trial if it doesn't exist yet
 * This is called automatically when the user first accesses the system
 */
export async function startTrialIfNotExists(): Promise<Trial> {
  return getTrial();
}

/**
 * Check if trial is currently active
 */
export async function isTrialActive(): Promise<boolean> {
  const trial = await getTrial();
  const now = new Date();
  const endsAt = new Date(trial.trialEndsAt);

  return now < endsAt;
}

/**
 * Get remaining trial days (rounded)
 */
export async function getTrialDaysLeft(): Promise<number> {
  const trial = await getTrial();
  const now = new Date();
  const endsAt = new Date(trial.trialEndsAt);

  const diffMs = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get trial status with all relevant information
 */
export async function getTrialStatus(): Promise<{
  trial: Trial;
  isActive: boolean;
  daysLeft: number;
  isExpiringSoon: boolean; // ≤ 3 days
}> {
  const trial = await getTrial();
  const isActive = await isTrialActive();
  const daysLeft = await getTrialDaysLeft();

  return {
    trial,
    isActive,
    daysLeft,
    isExpiringSoon: isActive && daysLeft <= 3,
  };
}
