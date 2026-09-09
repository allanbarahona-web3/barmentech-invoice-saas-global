import { z } from "zod";

/**
 * Costa Rica Country Pack - Fiscal Schemas
 * 
 * Defines fiscal data structure for Costa Rica.
 * This is architectural preparation; does NOT implement XML generation or Hacienda integration.
 */

// ===== TAXPAYER TYPE =====
// Placeholder values - replace with official catalog if Hacienda integration is implemented
export const CRTaxpayerTypeEnum = z.enum([
  "individual", // Persona Física
  "company", // Persona Jurídica
  "other", // Otros (placeholders for future official values)
]);

export type CRTaxpayerType = z.infer<typeof CRTaxpayerTypeEnum>;

// ===== LOCATION =====
export const crLocationSchema = z.object({
  province: z.string().min(1).optional(), // Provincia
  canton: z.string().min(1).optional(), // Cantón
  district: z.string().min(1).optional(), // Distrito
});

export type CRLocation = z.infer<typeof crLocationSchema>;

// ===== ACTIVITY CODE =====
// Activity code validation: digits only, reasonable length (placeholder until official format is defined)
const activityCodeRegex = /^\d{1,10}$/;

export const crActivityCodeSchema = z
  .string()
  .regex(activityCodeRegex, "Activity code must contain only digits (1-10 chars)")
  .optional();

// ===== BRANCH AND TERMINAL CODES =====
// Branch/Terminal codes: typically 3 digits (001, 002, etc.)
const branchTerminalCodeRegex = /^\d{3}$/;

export const crBranchCodeSchema = z
  .string()
  .regex(branchTerminalCodeRegex, "Branch code must be 3 digits (e.g., 001)")
  .optional();

export const crTerminalCodeSchema = z
  .string()
  .regex(branchTerminalCodeRegex, "Terminal code must be 3 digits (e.g., 001)")
  .optional();

// ===== FISCAL PROFILE CR =====
export const crFiscalProfileSchema = z.object({
  taxpayerType: CRTaxpayerTypeEnum.optional(),
  activityCode: crActivityCodeSchema,
  branchCode: crBranchCodeSchema,
  terminalCode: crTerminalCodeSchema,
  location: crLocationSchema.optional(),
});

export type CRFiscalProfile = z.infer<typeof crFiscalProfileSchema>;

// ===== COMPLETE CR FISCAL SCHEMA (for validation) =====
export const crFiscalSchema = crFiscalProfileSchema;

// ===== EXPORTS =====
export { crFiscalProfileSchema as default };
