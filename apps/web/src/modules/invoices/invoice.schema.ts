import { z } from "zod";
import {
  getDefaultInvoiceDocumentType,
  getDefaultInvoiceStatus,
  isValidInvoiceDocumentType,
  isValidInvoiceStatus,
} from "./invoice.runtime";

export const paymentTermsSchema = z.enum([
  "due_on_receipt",
  "net_15",
  "net_30",
  "net_60",
  "net_90",
  "custom",
]);

export const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  qty: z.number().min(0.01),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  productId: z.string().optional(),
});

export const invoiceSentSchema = z.object({
  toEmail: z.string().optional(),
  message: z.string().optional(),
  sentAt: z.string(),
  method: z.enum(["manual", "email"]).default("manual"),
});

export const scheduledSendSchema = z.object({
  enabled: z.boolean(),
  scheduledFor: z.string(), // ISO datetime - cuando se enviará
  toEmail: z.string().email(),
  cc: z.array(z.string().email()).optional(), // Emails en copia
  message: z.string().optional(),
  status: z.enum(["pending", "sent", "failed", "cancelled"]).default("pending"),
});

export const recurringFrequencySchema = z.enum([
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
]);

export const recurringConfigSchema = z.object({
  enabled: z.boolean(),
  frequency: recurringFrequencySchema,
  startDate: z.string(), // ISO date - cuando empieza la recurrencia
  endDate: z.string().optional(), // ISO date - cuando termina (null = sin fin)
  nextGenerationDate: z.string(), // ISO date - próxima factura a generar
  lastGeneratedDate: z.string().optional(), // ISO date - última factura generada
  parentInvoiceId: z.string().optional(), // ID de la factura original/plantilla
});

export const invoiceEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "CREATED",
    "CREATED_DRAFT",
    "UPDATED",
    "EXPORTED_PDF",
    "MARKED_ISSUED",
    "SENT",
    "QUOTE_SENT",
    "CONVERTED_TO_INVOICE",
    "CREATED_FROM_QUOTE",
    "ARCHIVED",
    "MARKED_PAID",
    "PAYMENT_REGISTERED",
    "PAYMENT_DELETED",
  ]),
  at: z.string(), // ISO datetime
  meta: z.record(z.string()).optional(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  type: z
    .string()
    .refine((value) => isValidInvoiceDocumentType(value), "Tipo de documento inválido")
    .default(getDefaultInvoiceDocumentType()),
  invoiceNumber: z.string(),
  customerId: z.string(),
  currency: z.string(),
  items: z.array(invoiceItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  deliveryFee: z.number().default(0),
  total: z.number(),
  status: z.string().refine((value) => isValidInvoiceStatus(value), "Estado de documento inválido"),
  createdAt: z.string(),
  updatedAt: z.string(),
  paymentTerms: paymentTermsSchema.default("due_on_receipt"),
  customNetDays: z.number().int().min(1).max(365).optional(),
  dueDate: z.string().optional(),
  // Exchange rate for currency conversion
  exchangeRate: z.number().optional(), // Rate to convert to company's base currency
  exchangeRateDate: z.string().optional(), // Date when rate was captured
  // Recurring configuration (premium feature)
  recurringConfig: recurringConfigSchema.optional(),
  // Scheduled send configuration
  scheduledSend: scheduledSendSchema.optional(),
  // Metadata and audit trail
  originQuoteId: z.string().optional(), // For invoices created from quotes
  archivedAt: z.string().optional(),
  sent: invoiceSentSchema.optional(),
  events: z.array(invoiceEventSchema).optional(),
});

export const invoiceInputSchema = z
  .object({
    type: z
      .string()
      .refine((value) => isValidInvoiceDocumentType(value), "Tipo de documento inválido")
      .default(getDefaultInvoiceDocumentType()),
    customerId: z.string().min(1),
    currency: z.string().min(3).max(3).optional(), // Optional: uses company default if not provided
    paymentTerms: paymentTermsSchema.default("due_on_receipt"),
    customNetDays: z.number().int().min(1).max(365).optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1),
          qty: z.number().min(0.01),
          unitPrice: z.number().min(0),
          discount: z.number().min(0).default(0),
          productId: z.string().optional(),
        })
      )
      .min(1),
    deliveryFee: z.number().min(0).default(0),
    status: z
      .string()
      .refine((value) => isValidInvoiceStatus(value), "Estado de documento inválido")
      .default(getDefaultInvoiceStatus()),
    recurringConfig: recurringConfigSchema.optional(),
    scheduledSend: scheduledSendSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentTerms === "custom" && !data.customNetDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customNetDays"],
        message: "Ingresa los días para el crédito personalizado",
      });
    }
  });

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceSent = z.infer<typeof invoiceSentSchema>;
export type ScheduledSend = z.infer<typeof scheduledSendSchema>;
export type InvoiceEvent = z.infer<typeof invoiceEventSchema>;
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;
export type RecurringConfig = z.infer<typeof recurringConfigSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
