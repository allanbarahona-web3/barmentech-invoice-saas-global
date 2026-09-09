/**
 * Costa Rica Country Pack
 * 
 * Fiscal data structure, validation, and helpers for Costa Rica.
 * 
 * This is architectural preparation only:
 * - Does NOT implement XML generation
 * - Does NOT integrate with Hacienda
 * - Provides structure for future implementation
 */

// ===== SCHEMAS & TYPES =====
export {
  crFiscalProfileSchema,
  crFiscalSchema,
  crLocationSchema,
  crActivityCodeSchema,
  crBranchCodeSchema,
  crTerminalCodeSchema,
  CRTaxpayerTypeEnum,
} from "./cr.schema";

export type {
  CRFiscalProfile,
  CRLocation,
  CRTaxpayerType,
} from "./cr.schema";

// ===== HELPERS =====
export {
  isCR,
  normalizeCRActivityCode,
  normalizeCRCodes,
  normalizeCRLocation,
  buildCRFiscalSummary,
  hasCRFiscalData,
  hasRequiredCRFields,
} from "./cr.helpers";

// ===== SANITIZATION =====
export {
  sanitizeCRFiscal,
  applyCRFiscalSanitization,
  validateCRFiscal,
} from "./cr.apply";

// ===== MANIFEST =====
export {
  CR_MANIFEST,
  CR_DOCUMENT_TYPES,
  CR_STATUS_IDS,
} from "./manifest";

export type {
  CRDocumentType,
  CRDocumentStatus,
} from "./manifest";
