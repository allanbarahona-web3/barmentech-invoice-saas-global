/**
 * Two-Factor Authentication Storage
 * Manages 2FA configuration in localStorage
 */

import { TwoFactorConfig, twoFactorSchema } from "./twoFactor.schema";

const STORAGE_KEY = "twoFactor";

/**
 * Generate a random secret for TOTP
 * In production, this should be done on the backend
 */
function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // Base32
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Get 2FA configuration for a user
 */
export function getTwoFactorConfig(email: string): TwoFactorConfig | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:${email}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const validated = twoFactorSchema.safeParse(parsed);

    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

/**
 * Enable 2FA for a user
 */
export function enableTwoFactor(email: string): {
  secret: string;
  backupCodes: string[];
  qrCodeUrl: string;
} {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  
  const config: TwoFactorConfig = {
    enabled: true,
    secret,
    backupCodes,
    enrolledAt: new Date().toISOString(),
  };

  localStorage.setItem(`${STORAGE_KEY}:${email}`, JSON.stringify(config));

  // Generate QR code URL for Google Authenticator
  // Format: otpauth://totp/Barmentech:email?secret=SECRET&issuer=Barmentech
  const qrCodeUrl = `otpauth://totp/Barmentech:${email}?secret=${secret}&issuer=Barmentech&algorithm=SHA1&digits=6&period=30`;

  return { secret, backupCodes, qrCodeUrl };
}

/**
 * Disable 2FA for a user
 */
export function disableTwoFactor(email: string): void {
  localStorage.removeItem(`${STORAGE_KEY}:${email}`);
}

/**
 * Verify a TOTP code
 * Simplified implementation - in production use speakeasy or similar
 */
export function verifyTwoFactorCode(email: string, code: string): boolean {
  const config = getTwoFactorConfig(email);
  if (!config || !config.enabled) return false;

  // Check if it's a backup code
  if (config.backupCodes?.includes(code)) {
    // Remove used backup code
    const newBackupCodes = config.backupCodes.filter(c => c !== code);
    const newConfig = { ...config, backupCodes: newBackupCodes };
    localStorage.setItem(`${STORAGE_KEY}:${email}`, JSON.stringify(newConfig));
    return true;
  }

  // Simplified TOTP verification for demo
  // In production, this MUST be done on the backend with proper TOTP library
  // For now, we'll accept any 6-digit code starting with '1' for demo purposes
  return /^1\d{5}$/.test(code);
}

/**
 * Check if user has 2FA enabled
 */
export function hasTwoFactorEnabled(email: string): boolean {
  const config = getTwoFactorConfig(email);
  return config?.enabled ?? false;
}
