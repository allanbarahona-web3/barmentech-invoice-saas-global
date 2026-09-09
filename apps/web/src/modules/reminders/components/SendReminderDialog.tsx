"use client";

import { useState } from "react";
import { Bell, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/modules/invoices/invoice.schema";
import { Customer } from "@/modules/customers/customer.schema";
import { useCompanyProfile } from "@/modules/company/company.hooks";
import {
  useReminderTemplates,
  useSendManualReminder,
  useInvoiceReminders,
  ReminderTemplate,
} from "@/modules/reminders";
import { renderReminderTemplate } from "@/modules/reminders/reminder.core";
import { usePlanFeatures } from "@/modules/billing/features.hooks";

interface SendReminderDialogProps {
  invoice: Invoice;
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendReminderDialog({
  invoice,
  customer,
  open,
  onOpenChange,
}: SendReminderDialogProps) {
  const { data: templates, isLoading: loadingTemplates } = useReminderTemplates();
  const { data: company } = useCompanyProfile();
  const { data: reminderLogs } = useInvoiceReminders(invoice.id);
  const sendMutation = useSendManualReminder();
  const { getReminderLimit, isUnlimited } = usePlanFeatures();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  
  const reminderLimit = getReminderLimit();
  const remainingReminders = isUnlimited(reminderLimit) 
    ? -1 
    : Math.max(0, reminderLimit - (reminderLogs?.length || 0));
  
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (!company || !templates) return;
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const rendered = renderReminderTemplate(template, { invoice, customer, company });
      setPreview(rendered);
    }
  };
  
  const handleSend = async () => {
    if (!company || !templates || !selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    await sendMutation.mutateAsync({
      invoice,
      customer,
      company,
      template,
    });
    
    onOpenChange(false);
    setSelectedTemplateId("");
    setPreview(null);
  };
  
  const reminderCount = reminderLogs?.length || 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📧 Enviar Recordatorio de Pago</DialogTitle>
          <DialogDescription>
            Envía un recordatorio a {customer.name} sobre la factura {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Reminder count info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Recordatorios enviados para esta factura:
              </span>
              <Badge variant="outline">{reminderCount}</Badge>
            </div>
            
            {!isUnlimited(reminderLimit) && (
              <Badge variant={remainingReminders < 5 ? "destructive" : "secondary"}>
                {remainingReminders} restantes este mes
              </Badge>
            )}
          </div>
          
          {/* Recipient info */}
          <div className="space-y-2">
            <Label>Para:</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {customer.email || "Sin email registrado"}
              </p>
            </div>
            
            {!customer.email && (
              <p className="text-sm text-destructive">
                ⚠️ Este cliente no tiene email registrado
              </p>
            )}
          </div>
          
          {/* Template selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Plantilla</Label>
            <Select 
              value={selectedTemplateId} 
              onValueChange={handleTemplateChange}
              disabled={loadingTemplates || !customer.email}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.tone === "friendly" ? "😊 Amable" : 
                         template.tone === "formal" ? "📋 Formal" : 
                         "⚠️ Urgente"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <Label>Vista previa</Label>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Asunto:</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    {preview.subject}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mensaje:</Label>
                  <Textarea
                    value={preview.body}
                    readOnly
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={sendMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSend}
            disabled={
              !selectedTemplateId || 
              !customer.email || 
              sendMutation.isPending ||
              (remainingReminders === 0 && !isUnlimited(reminderLimit))
            }
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Recordatorio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
