import { CRFiscalProfile, CRLocation } from "./cr.schema";

/**
 * Costa Rica Country Pack - Helpers
 * 
 * Pure functions for normalizing and formatting CR fiscal data.
 * No side effects, no API calls, no storage operations.
 */

// ===== COUNTRY CHECK =====

/**
 * Check if country code is Costa Rica
 */
export function isCR(country?: string): boolean {
  return country?.toUpperCase() === "CR";
}

// ===== NORMALIZATION =====

/**
 * Normalize activity code: trim whitespace, keep only digits
 * @returns normalized code or undefined if invalid
 */
export function normalizeCRActivityCode(input?: string): string | undefined {
  if (!input) return undefined;

  const cleaned = input.trim().replace(/\D/g, ""); // Remove non-digits

  if (cleaned.length === 0 || cleaned.length > 10) {
    return undefined;
  }

  return cleaned;
}

/**
 * Normalize branch and terminal codes: trim, pad to 3 digits
 * @returns normalized codes object
 */
export function normalizeCRCodes(
  branchCode?: string,
  terminalCode?: string
): { branchCode?: string; terminalCode?: string } {
  const normalizeSingleCode = (code?: string): string | undefined => {
    if (!code) return undefined;

    const cleaned = code.trim().replace(/\D/g, "");

    if (cleaned.length === 0) return undefined;

    // Pad to 3 digits (e.g., "1" -> "001")
    return cleaned.padStart(3, "0").slice(0, 3);
  };

  return {
    branchCode: normalizeSingleCode(branchCode),
    terminalCode: normalizeSingleCode(terminalCode),
  };
}

/**
 * Normalize location: trim whitespace from all fields
 */
export function normalizeCRLocation(location?: CRLocation): CRLocation | undefined {
  if (!location) return undefined;

  const normalized: CRLocation = {};

  if (location.province) {
    const province = location.province.trim();
    if (province) normalized.province = province;
  }

  if (location.canton) {
    const canton = location.canton.trim();
    if (canton) normalized.canton = canton;
  }

  if (location.district) {
    const district = location.district.trim();
    if (district) normalized.district = district;
  }

  // Return undefined if no fields have values
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// ===== FORMATTING FOR DISPLAY =====

/**
 * Build human-readable summary lines for CR fiscal data
 * Useful for invoice previews, PDFs, etc.
 * @returns array of formatted strings (empty if no data)
 */
export function buildCRFiscalSummary(cr?: CRFiscalProfile): string[] {
  if (!cr) return [];

  const lines: string[] = [];

  if (cr.taxpayerType) {
    const typeLabel = getTaxpayerTypeLabel(cr.taxpayerType);
    lines.push(`Tipo: ${typeLabel}`);
  }

  if (cr.activityCode) {
    lines.push(`Actividad: ${cr.activityCode}`);
  }

  if (cr.location) {
    const locationParts: string[] = [];
    if (cr.location.province) locationParts.push(cr.location.province);
    if (cr.location.canton) locationParts.push(cr.location.canton);
    if (cr.location.district) locationParts.push(cr.location.district);

    if (locationParts.length > 0) {
      lines.push(`Ubicación: ${locationParts.join(", ")}`);
    }
  }

  if (cr.branchCode) {
    lines.push(`Sucursal: ${cr.branchCode}`);
  }

  if (cr.terminalCode) {
    lines.push(`Terminal: ${cr.terminalCode}`);
  }

  return lines;
}

/**
 * Get human-readable label for taxpayer type
 * (adjust labels as needed for official terminology)
 */
function getTaxpayerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    individual: "Persona Física",
    company: "Persona Jurídica",
    other: "Otro",
  };

  return labels[type] || type;
}

// ===== VALIDATION HELPERS =====

/**
 * Check if CR fiscal profile has any data
 */
export function hasCRFiscalData(cr?: CRFiscalProfile): boolean {
  if (!cr) return false;

  return !!(
    cr.taxpayerType ||
    cr.activityCode ||
    cr.branchCode ||
    cr.terminalCode ||
    cr.location
  );
}

/**
 * Check if required CR fields are present (for future validation)
 * Currently no fields are strictly required, but this provides extension point
 */
export function hasRequiredCRFields(cr?: CRFiscalProfile): boolean {
  if (!cr) return false;

  // For now, no fields are strictly required
  // In future, could enforce: taxpayerType, activityCode, etc.
  return true;
}
