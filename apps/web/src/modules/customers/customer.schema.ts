import { z } from "zod";

// ===== CONTACT PREFERENCES ENUMS =====
export const PreferredChannelEnum = z.enum(["whatsapp", "email", "phone", "unspecified"]);
export const ConsentStatusEnum = z.enum(["unknown", "granted", "denied"]);
export const PreferredTimeEnum = z.enum(["any", "morning", "afternoon", "evening"]);

export type PreferredChannel = z.infer<typeof PreferredChannelEnum>;
export type ConsentStatus = z.infer<typeof ConsentStatusEnum>;
export type PreferredTime = z.infer<typeof PreferredTimeEnum>;

// ===== CONTACT PREFERENCES SCHEMA =====
export const contactPreferencesSchema = z.object({
  preferredChannel: PreferredChannelEnum,
  consentStatus: ConsentStatusEnum,
  preferredTime: PreferredTimeEnum,
  allowEmail: z.boolean(),
  allowWhatsApp: z.boolean(),
});

export type ContactPreferences = z.infer<typeof contactPreferencesSchema>;

// ===== CUSTOMER SCHEMA =====
export const customerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  // Structured address fields
  country: z.string().optional(),
  state: z.string().optional(), // State/Province
  city: z.string().optional(), // City/District
  zipCode: z.string().optional(), // ZIP/Postal code
  addressDetail: z.string().optional(), // Street address, building, etc.
  // Legacy field for migration
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  contactPreferences: contactPreferencesSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ===== CUSTOMER INPUT SCHEMA WITH VALIDATIONS =====
export const customerInputSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    idNumber: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    addressDetail: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    contactPreferences: contactPreferencesSchema,
  })
  .superRefine((data, ctx) => {
    // If allowEmail is true, email must exist and be valid
    if (data.contactPreferences.allowEmail) {
      if (!data.email || data.email === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required when email notifications are allowed",
          path: ["email"],
        });
      }
    }

    // If allowWhatsApp is true, phone must exist
    if (data.contactPreferences.allowWhatsApp) {
      if (!data.phone || data.phone === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone is required when WhatsApp notifications are allowed",
          path: ["phone"],
        });
      }
    }

    // If consentStatus is denied, both channels must be false
    if (data.contactPreferences.consentStatus === "denied") {
      if (data.contactPreferences.allowEmail || data.contactPreferences.allowWhatsApp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cannot allow notifications when consent is denied",
          path: ["contactPreferences", "consentStatus"],
        });
      }
    }

    // If preferredChannel is email, allowEmail must be true
    if (data.contactPreferences.preferredChannel === "email" && !data.contactPreferences.allowEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot set email as preferred channel when email is not allowed",
        path: ["contactPreferences", "preferredChannel"],
      });
    }

    // If preferredChannel is whatsapp, allowWhatsApp must be true
    if (data.contactPreferences.preferredChannel === "whatsapp" && !data.contactPreferences.allowWhatsApp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot set WhatsApp as preferred channel when WhatsApp is not allowed",
        path: ["contactPreferences", "preferredChannel"],
      });
    }
  });

export type Customer = z.infer<typeof customerSchema>;
export type CustomerInput = z.infer<typeof customerInputSchema>;

// ===== UTILITY: DEFAULT CONTACT PREFERENCES =====
export function getDefaultContactPreferences(email?: string, phone?: string): ContactPreferences {
  return {
    preferredChannel: "unspecified",
    consentStatus: "unknown",
    preferredTime: "any",
    allowEmail: !!(email && email !== ""),
    allowWhatsApp: !!(phone && phone !== ""),
  };
}

// ===== UTILITY: MIGRATE CUSTOMER (for existing customers without contactPreferences) =====
export function migrateCustomer(customer: any): Customer {
  const migrated = { ...customer };
  
  // Migrate contactPreferences if not present
  if (!migrated.contactPreferences) {
    migrated.contactPreferences = getDefaultContactPreferences(customer.email, customer.phone);
  }
  
  // Migrate legacy address to structured fields if needed
  if (migrated.address && !migrated.country && !migrated.state && !migrated.city && !migrated.addressDetail) {
    // Keep legacy address in addressDetail for now
    migrated.addressDetail = migrated.address;
  }
  
  return migrated as Customer;
}
