import { z } from "zod";

/**
 * Reminder Types
 */
export const reminderChannelSchema = z.enum(["email", "whatsapp", "sms"]);
export const reminderTypeSchema = z.enum([
  "manual",
  "scheduled",
  "auto_before_due",
  "auto_on_due",
  "auto_after_due",
]);
export const reminderStatusSchema = z.enum(["pending", "sent", "failed", "skipped"]);

/**
 * Reminder Template
 */
export const reminderTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  tone: z.enum(["friendly", "formal", "urgent"]),
  variables: z.array(z.string()).optional(), // {invoiceNumber}, {customerName}, etc
});

/**
 * Reminder Log (historial de recordatorios enviados)
 */
export const reminderLogSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  customerId: z.string(),
  type: reminderTypeSchema,
  channel: reminderChannelSchema,
  template: z.string(), // template ID
  status: reminderStatusSchema,
  sentAt: z.string().optional(), // ISO datetime
  scheduledFor: z.string().optional(), // ISO datetime (for scheduled/auto)
  opened: z.boolean().optional(),
  clicked: z.boolean().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  createdAt: z.string(),
});

/**
 * Reminder Rule (for Pro/Premium plans)
 */
export const reminderRuleSchema = z.object({
  id: z.string(),
  type: z.enum(["before_due", "on_due", "after_due"]),
  daysOffset: z.number(), // -7, 0, 3, 7, etc
  enabled: z.boolean(),
  template: z.string(), // template ID
  channel: reminderChannelSchema,
});

/**
 * Reminder Settings (user configuration)
 */
export const reminderSettingsSchema = z.object({
  manualEnabled: z.boolean().default(true),
  scheduledEnabled: z.boolean().default(false), // Pro+
  autoEnabled: z.boolean().default(false), // Premium+
  rules: z.array(reminderRuleSchema).default([]),
  defaultChannel: reminderChannelSchema.default("email"),
  defaultTemplate: z.string().optional(),
});

/**
 * Types
 */
export type ReminderChannel = z.infer<typeof reminderChannelSchema>;
export type ReminderType = z.infer<typeof reminderTypeSchema>;
export type ReminderStatus = z.infer<typeof reminderStatusSchema>;
export type ReminderTemplate = z.infer<typeof reminderTemplateSchema>;
export type ReminderLog = z.infer<typeof reminderLogSchema>;
export type ReminderRule = z.infer<typeof reminderRuleSchema>;
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

/**
 * Default Templates
 */
export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: "friendly",
    name: "Recordatorio Amable",
    subject: "Recordatorio de pago - Factura {invoiceNumber}",
    body: `Hola {customerName},

Esperamos que te encuentres bien. Este es un recordatorio amistoso sobre la factura {invoiceNumber} por {invoiceAmount}.

Fecha de vencimiento: {dueDate}
Estado: {status}

Puedes revisar y pagar tu factura en cualquier momento desde este enlace:
{invoiceLink}

Si ya realizaste el pago, por favor ignora este mensaje.

Gracias por tu preferencia,
{companyName}`,
    tone: "friendly",
    variables: ["customerName", "invoiceNumber", "invoiceAmount", "dueDate", "status", "invoiceLink", "companyName"],
  },
  {
    id: "formal",
    name: "Recordatorio Formal",
    subject: "Notificación de pago pendiente - {invoiceNumber}",
    body: `Estimado/a {customerName},

Le recordamos que tiene una factura pendiente de pago:

Factura: {invoiceNumber}
Monto: {invoiceAmount}
Fecha de vencimiento: {dueDate}
Estado actual: {status}

Para proceder con el pago, puede acceder al siguiente enlace:
{invoiceLink}

Agradecemos su pronta atención a este asunto.

Atentamente,
{companyName}`,
    tone: "formal",
    variables: ["customerName", "invoiceNumber", "invoiceAmount", "dueDate", "status", "invoiceLink", "companyName"],
  },
  {
    id: "urgent",
    name: "Recordatorio Urgente",
    subject: "URGENTE: Factura vencida {invoiceNumber}",
    body: `{customerName},

Notificamos que la factura {invoiceNumber} está vencida:

Factura: {invoiceNumber}
Monto: {invoiceAmount}
Venció el: {dueDate}
Días de retraso: {daysOverdue}

Es importante que realice el pago lo antes posible para evitar interrupciones en el servicio.

Pagar ahora: {invoiceLink}

Si tiene alguna dificultad para realizar el pago, por favor contáctenos de inmediato.

{companyName}`,
    tone: "urgent",
    variables: ["customerName", "invoiceNumber", "invoiceAmount", "dueDate", "daysOverdue", "invoiceLink", "companyName"],
  },
];
