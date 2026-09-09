// Utility functions for recurring invoice date calculations
// NOTE: This is for DEMO purposes. In production, use a proper date library like date-fns

import type { RecurringFrequency } from "./invoice.schema";

/**
 * Calculate the next generation date based on frequency
 * @param startDate - ISO date string (start date)
 * @param frequency - Recurring frequency
 * @returns ISO date string for next generation
 */
export function calculateNextGenerationDate(
  startDate: string,
  frequency: RecurringFrequency
): string {
  const date = new Date(startDate);
  
  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 15);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "semiannual":
      date.setMonth(date.getMonth() + 6);
      break;
    case "annual":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString();
}

/**
 * Get human-readable label for frequency (Spanish)
 */
export function getFrequencyLabel(frequency: RecurringFrequency): string {
  const labels: Record<RecurringFrequency, string> = {
    weekly: "Semanal (cada 7 días)",
    biweekly: "Quincenal (cada 15 días)",
    monthly: "Mensual (cada mes)",
    quarterly: "Trimestral (cada 3 meses)",
    semiannual: "Semestral (cada 6 meses)",
    annual: "Anual (cada año)",
  };
  return labels[frequency];
}
