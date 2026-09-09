import { Invoice } from "@/modules/invoices/invoice.schema";
import { Customer } from "@/modules/customers/customer.schema";
import { CompanyProfile } from "@/modules/company/company.schema";
import { ReminderTemplate, ReminderLog } from "./reminder.schema";
import { createReminderLog } from "./reminder.storage";

/**
 * Replace template variables with actual values
 */
export function renderReminderTemplate(
  template: ReminderTemplate,
  data: {
    invoice: Invoice;
    customer: Customer;
    company: CompanyProfile;
  }
): { subject: string; body: string } {
  const { invoice, customer, company } = data;
  
  // Calculate days overdue
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
  const now = new Date();
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Format amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(amount);
  };
  
  // Format dates
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };
  
  // Variable replacements
  const variables: Record<string, string> = {
    customerName: customer.name,
    invoiceNumber: invoice.invoiceNumber,
    invoiceAmount: formatCurrency(invoice.total),
    dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : "N/A",
    status: invoice.status === "issued" ? "Pendiente" : invoice.status === "sent" ? "Enviada" : "Vencida",
    daysOverdue: daysOverdue.toString(),
    invoiceLink: `${window.location.origin}/system/invoices/${invoice.id}`,
    companyName: company.legal.commercialName || company.legal.legalName,
  };
  
  // Replace in subject
  let subject = template.subject;
  let body = template.body;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });
  
  return { subject, body };
}

/**
 * Send reminder (manual mode)
 * In production, this would call a backend API to send actual email
 */
export async function sendManualReminder(
  invoice: Invoice,
  customer: Customer,
  company: CompanyProfile,
  template: ReminderTemplate
): Promise<ReminderLog> {
  // Render template
  const { subject, body } = renderReminderTemplate(template, { invoice, customer, company });
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, call backend API:
  // await fetch('/api/reminders/send', {
  //   method: 'POST',
  //   body: JSON.stringify({ to: customer.email, subject, body })
  // });
  
  // For now, just log to console
  console.log("[Reminder] Email would be sent:", {
    to: customer.email,
    subject,
    body: body.substring(0, 100) + "...",
  });
  
  // Create log entry
  const log = await createReminderLog({
    invoiceId: invoice.id,
    customerId: customer.id,
    type: "manual",
    channel: "email",
    template: template.id,
    status: "sent",
    sentAt: new Date().toISOString(),
    metadata: {
      subject,
      to: customer.email || "",
    },
  });
  
  return log;
}

/**
 * Check if invoice needs reminder (helper for UI)
 */
export function shouldShowReminderBadge(invoice: Invoice): boolean {
  // Show badge if invoice is pending/sent and approaching or past due date
  if (invoice.status !== "issued" && invoice.status !== "sent") {
    return false;
  }
  
  if (!invoice.dueDate) {
    return false;
  }
  
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Show badge if due in 3 days or less, or already overdue
  return daysUntilDue <= 3;
}

/**
 * Get reminder urgency level
 */
export function getReminderUrgency(invoice: Invoice): "low" | "medium" | "high" | null {
  if (invoice.status !== "issued" && invoice.status !== "sent") {
    return null;
  }
  
  if (!invoice.dueDate) {
    return null;
  }
  
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) {
    return "high"; // Overdue
  } else if (daysUntilDue <= 2) {
    return "medium"; // Due very soon
  } else if (daysUntilDue <= 7) {
    return "low"; // Due soon
  }
  
  return null;
}
