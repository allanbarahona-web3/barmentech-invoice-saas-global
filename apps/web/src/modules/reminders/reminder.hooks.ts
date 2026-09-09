import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReminders,
  getRemindersByInvoice,
  getReminderSettings,
  saveReminderSettings,
  getReminderTemplates,
  getReminderStats,
} from "./reminder.storage";
import { sendManualReminder } from "./reminder.core";
import { Invoice } from "@/modules/invoices/invoice.schema";
import { Customer } from "@/modules/customers/customer.schema";
import { CompanyProfile } from "@/modules/company/company.schema";
import { ReminderTemplate, ReminderSettings } from "./reminder.schema";
import { toast } from "sonner";

/**
 * Hook to get all reminders
 */
export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: listReminders,
  });
}

/**
 * Hook to get reminders for a specific invoice
 */
export function useInvoiceReminders(invoiceId: string) {
  return useQuery({
    queryKey: ["reminders", "invoice", invoiceId],
    queryFn: () => getRemindersByInvoice(invoiceId),
  });
}

/**
 * Hook to get reminder settings
 */
export function useReminderSettings() {
  return useQuery({
    queryKey: ["reminder-settings"],
    queryFn: getReminderSettings,
  });
}

/**
 * Hook to update reminder settings
 */
export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: ReminderSettings) => saveReminderSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-settings"] });
      toast.success("Configuración de recordatorios actualizada");
    },
    onError: () => {
      toast.error("Error al guardar configuración");
    },
  });
}

/**
 * Hook to get reminder templates
 */
export function useReminderTemplates() {
  return useQuery({
    queryKey: ["reminder-templates"],
    queryFn: getReminderTemplates,
  });
}

/**
 * Hook to get reminder statistics
 */
export function useReminderStats() {
  return useQuery({
    queryKey: ["reminder-stats"],
    queryFn: getReminderStats,
  });
}

/**
 * Hook to send manual reminder
 */
export function useSendManualReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      invoice,
      customer,
      company,
      template,
    }: {
      invoice: Invoice;
      customer: Customer;
      company: CompanyProfile;
      template: ReminderTemplate;
    }) => {
      return sendManualReminder(invoice, customer, company, template);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ 
        queryKey: ["reminders", "invoice", variables.invoice.id] 
      });
      queryClient.invalidateQueries({ queryKey: ["reminder-stats"] });
      
      toast.success("Recordatorio enviado", {
        description: `Enviado a ${variables.customer.email}`,
      });
    },
    onError: (error) => {
      console.error("Error sending reminder:", error);
      toast.error("Error al enviar recordatorio", {
        description: "Por favor intenta de nuevo",
      });
    },
  });
}
