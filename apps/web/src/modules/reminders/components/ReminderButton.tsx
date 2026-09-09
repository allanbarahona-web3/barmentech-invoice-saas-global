"use client";

import { useState } from "react";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/modules/invoices/invoice.schema";
import { Customer } from "@/modules/customers/customer.schema";
import { SendReminderDialog } from "./SendReminderDialog";
import { useInvoiceReminders } from "@/modules/reminders/reminder.hooks";
import { getReminderUrgency } from "@/modules/reminders/reminder.core";
import { usePlanFeatures } from "@/modules/billing/features.hooks";

interface ReminderButtonProps {
  invoice: Invoice;
  customer: Customer;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showBadge?: boolean;
}

export function ReminderButton({
  invoice,
  customer,
  variant = "outline",
  size = "sm",
  showBadge = true,
}: ReminderButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: reminderLogs } = useInvoiceReminders(invoice.id);
  const { hasFeature } = usePlanFeatures();
  
  const canSendReminders = hasFeature("reminders_manual");
  const urgency = getReminderUrgency(invoice);
  const reminderCount = reminderLogs?.length || 0;
  
  // Don't show button if invoice is paid or draft
  if (invoice.status === "paid" || invoice.status === "draft" || invoice.status === "archived") {
    return null;
  }
  
  // Don't show if no urgency and no reminders sent
  if (!urgency && reminderCount === 0) {
    return null;
  }
  
  const getUrgencyColor = () => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };
  
  return (
    <>
      <div className="relative inline-block">
        <Button
          variant={variant}
          size={size}
          onClick={() => setDialogOpen(true)}
          disabled={!canSendReminders || !customer.email}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          {size !== "icon" && "Recordatorio"}
        </Button>
        
        {showBadge && reminderCount > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {reminderCount}
          </Badge>
        )}
        
        {urgency && showBadge && (
          <div className="absolute -top-1 -right-1">
            <Clock 
              className={`h-3 w-3 ${
                urgency === "high" ? "text-destructive" : 
                urgency === "medium" ? "text-warning" : 
                "text-secondary"
              }`}
            />
          </div>
        )}
      </div>
      
      <SendReminderDialog
        invoice={invoice}
        customer={customer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
