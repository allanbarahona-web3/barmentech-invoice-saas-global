import { CRFiscalProfile, crFiscalProfileSchema } from "./cr.schema";
import {
  normalizeCRActivityCode,
  normalizeCRCodes,
  normalizeCRLocation,
  hasCRFiscalData,
} from "./cr.helpers";

/**
 * Costa Rica Country Pack - Apply/Sanitization
 * 
 * Functions for validating and sanitizing CR fiscal data before persistence.
 * Pure functions with no side effects.
 */

/**
 * Sanitize CR fiscal profile:
 * - Validates with Zod schema
 * - Normalizes activity code
 * - Normalizes branch/terminal codes
 * - Normalizes location
 * - Returns undefined if no valid data remains
 * 
 * @param cr - Raw CR fiscal profile data
 * @returns Sanitized profile or undefined if invalid/empty
 */
export function sanitizeCRFiscal(cr?: CRFiscalProfile): CRFiscalProfile | undefined {
  // Early return if no data
  if (!cr || !hasCRFiscalData(cr)) {
    return undefined;
  }

  // Normalize fields
  const normalized: CRFiscalProfile = {
    taxpayerType: cr.taxpayerType, // Enum values are already validated by schema
    activityCode: normalizeCRActivityCode(cr.activityCode),
    location: normalizeCRLocation(cr.location),
  };

  // Normalize codes
  const codes = normalizeCRCodes(cr.branchCode, cr.terminalCode);
  normalized.branchCode = codes.branchCode;
  normalized.terminalCode = codes.terminalCode;

  // Validate with Zod schema
  const validation = crFiscalProfileSchema.safeParse(normalized);

  if (!validation.success) {
    // If validation fails, log error (in production, could send to monitoring)
    console.warn("CR fiscal validation failed:", validation.error.issues);
    return undefined;
  }

  const sanitized = validation.data;

  // Final check: return undefined if all fields are empty after sanitization
  if (!hasCRFiscalData(sanitized)) {
    return undefined;
  }

  return sanitized;
}

/**
 * Apply CR fiscal sanitization to a company profile's fiscal.cr field
 * This is a convenience wrapper for use in storage operations
 * 
 * @param fiscalCR - Raw fiscal.cr data
 * @param country - Country code (to verify CR)
 * @returns Sanitized fiscal.cr or undefined
 */
export function applyCRFiscalSanitization(
  fiscalCR?: CRFiscalProfile,
  country?: string
): CRFiscalProfile | undefined {
  // Only apply if country is CR
  if (country?.toUpperCase() !== "CR") {
    return fiscalCR; // Return as-is for non-CR countries
  }

  return sanitizeCRFiscal(fiscalCR);
}

/**
 * Validate CR fiscal profile without sanitization
 * Useful for form validation before submission
 * 
 * @param cr - CR fiscal profile data
 * @returns Validation result with typed data or error details
 */
export function validateCRFiscal(cr?: CRFiscalProfile): {
  success: boolean;
  data?: CRFiscalProfile;
  errors?: string[];
} {
  if (!cr) {
    return { success: true, data: undefined };
  }

  const validation = crFiscalProfileSchema.safeParse(cr);

  if (validation.success) {
    return {
      success: true,
      data: validation.data,
    };
  }

  return {
    success: false,
    errors: validation.error.issues.map((err) => err.message),
  };
}
