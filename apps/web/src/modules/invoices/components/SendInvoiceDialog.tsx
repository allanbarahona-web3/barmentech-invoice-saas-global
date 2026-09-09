"use client";

import { useState } from "react";
import { Copy, Send, Clock, X, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { t } from "@/i18n";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerEmail?: string;
  invoiceUrl: string;
  allowScheduledSend?: boolean;
  allowUnlimitedCC?: boolean;
  onSend?: (toEmail?: string, message?: string, cc?: string[]) => void | Promise<void>;
  onScheduleSend?: (toEmail: string, message: string, scheduledFor: string, cc?: string[]) => void | Promise<void>;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerEmail = "",
  invoiceUrl,
  allowScheduledSend = false,
  allowUnlimitedCC = false,
  onSend,
  onScheduleSend,
}: SendInvoiceDialogProps) {
  const [email, setEmail] = useState(customerEmail);
  const [message, setMessage] = useState(
    t().invoiceActions.defaultMessage.replace("{invoiceNumber}", invoiceNumber)
  );
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      toast.success(t().invoiceActions.linkCopied);
    } catch (error) {
      toast.error(t().invoiceActions.linkCopyError);
    }
  };

  const addCcEmail = () => {
    const trimmed = ccInput.trim();
    if (!trimmed) return;
    
    // Check limit: 2 emails max without unlimited feature
    if (!allowUnlimitedCC && ccEmails.length >= 2) {
      toast.error(
        "Límite alcanzado",
        {
          description: "Puedes agregar hasta 2 destinatarios en copia. Para más destinatarios, actualiza a un plan superior.",
        }
      );
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Email inválido");
      return;
    }
    
    if (ccEmails.includes(trimmed)) {
      toast.error("Este email ya está agregado");
      return;
    }
    
    setCcEmails([...ccEmails, trimmed]);
    setCcInput("");
  };

  const removeCcEmail = (emailToRemove: string) => {
    setCcEmails(ccEmails.filter(email => email !== emailToRemove));
  };

  const handleSend = async () => {
    if (sendMode === "scheduled") {
      // Programar envío
      if (!scheduledDateTime) {
        toast.error("Por favor selecciona la fecha y hora de envío");
        return;
      }
      if (onScheduleSend) {
        setSending(true);
        try {
          await onScheduleSend(email, message, scheduledDateTime, ccEmails.length > 0 ? ccEmails : undefined);
          toast.success("Envío programado correctamente");
          onOpenChange(false);
        } catch (error) {
          toast.error("Error al programar el envío");
        } finally {
          setSending(false);
        }
      }
    } else {
      // Envío inmediato
      if (onSend) {
        setSending(true);
        try {
          await onSend(email, message, ccEmails.length > 0 ? ccEmails : undefined);
        } finally {
          setSending(false);
        }
      } else {
        toast.info(t().invoiceActions.sendPlaceholder);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t().invoiceActions.sendInvoice}</DialogTitle>
          <DialogDescription>
            {t().invoiceActions.sendInvoiceDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tabs: Send Now or Schedule */}
          <Tabs value={sendMode} onValueChange={(value) => setSendMode(value as "now" | "scheduled")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="now">
                <Send className="h-4 w-4 mr-2" />
                Enviar ahora
              </TabsTrigger>
              <TabsTrigger value="scheduled" disabled={!allowScheduledSend}>
                <Clock className="h-4 w-4 mr-2" />
                Programar
                {!allowScheduledSend && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-purple-600 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="now" className="space-y-4 mt-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">{t().invoiceActions.recipientEmail}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t().invoiceActions.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* CC Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cc">CC (Copia)</Label>
                  {!allowUnlimitedCC && (
                    <span className="text-xs text-muted-foreground">
                      {ccEmails.length}/2 usados
                      {ccEmails.length >= 2 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-purple-600 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Más en plan superior
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="cc"
                    type="email"
                    placeholder="otro@ejemplo.com"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCcEmail();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCcEmail}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ccEmails.map((email) => (
                      <div
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeCcEmail(email)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {allowUnlimitedCC 
                    ? "Agrega emails adicionales que recibirán una copia"
                    : "Agrega hasta 2 emails adicionales (plan superior para más)"}
                </p>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message">{t().invoiceActions.message}</Label>
                <Textarea
                  id="message"
                  placeholder={t().invoiceActions.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4 mt-4">
              {/* Scheduled Date/Time */}
              <div className="space-y-2">
                <Label htmlFor="scheduledDateTime">
                  Fecha y hora de envío <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduledDateTime"
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">
                  La factura se enviará automáticamente en esta fecha y hora
                </p>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email-scheduled">{t().invoiceActions.recipientEmail}</Label>
                <Input
                  id="email-scheduled"
                  type="email"
                  placeholder={t().invoiceActions.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* CC Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cc-scheduled">CC (Copia)</Label>
                  {!allowUnlimitedCC && (
                    <span className="text-xs text-muted-foreground">
                      {ccEmails.length}/2 usados
                      {ccEmails.length >= 2 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-purple-600 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Más en plan superior
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="cc-scheduled"
                    type="email"
                    placeholder="otro@ejemplo.com"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCcEmail();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCcEmail}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ccEmails.map((email) => (
                      <div
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeCcEmail(email)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {allowUnlimitedCC 
                    ? "Agrega emails adicionales que recibirán una copia"
                    : "Agrega hasta 2 emails adicionales (plan superior para más)"}
                </p>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message-scheduled">{t().invoiceActions.message}</Label>
                <Textarea
                  id="message-scheduled"
                  placeholder={t().invoiceActions.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Info message */}
              <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  <strong>Nota:</strong> El envío programado se guardará y la factura se enviará automáticamente en la fecha indicada.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Copy Link Section - Always visible */}
          <div className="space-y-2 pt-2 border-t">
            <Label>{t().invoiceActions.invoiceLink}</Label>
            <div className="flex gap-2">
              <Input
                value={invoiceUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {t().invoiceActions.cancel}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!email || sending || (sendMode === "scheduled" && !scheduledDateTime)}
          >
            {sendMode === "scheduled" ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                {sending ? "Programando..." : "Programar envío"}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {sending ? t().invoiceActions.markingAsIssued : t().invoiceActions.send}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
