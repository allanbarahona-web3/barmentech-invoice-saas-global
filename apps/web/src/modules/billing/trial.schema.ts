import { z } from "zod";

/**
 * Trial period configuration
 * 14-day free trial starting from account creation
 */
export const trialSchema = z.object({
  trialStartsAt: z.string(), // ISO datetime
  trialEndsAt: z.string(), // ISO datetime
  trialDays: z.number().default(14),
});

export type Trial = z.infer<typeof trialSchema>;
