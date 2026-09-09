import { z } from "zod";

/**
 * Two-Factor Authentication Configuration
 */
export const twoFactorSchema = z.object({
  enabled: z.boolean(),
  secret: z.string().optional(), // TOTP secret
  backupCodes: z.array(z.string()).optional(),
  enrolledAt: z.string().optional(), // ISO date
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

export type TwoFactorConfig = z.infer<typeof twoFactorSchema>;
export type VerifyTwoFactorData = z.infer<typeof verifyTwoFactorSchema>;
