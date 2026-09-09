"use client";

import { useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SendReportEmailDialogProps {
  disabled?: boolean;
  reportType: string;
  onSend: (emails: string[]) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
}

export function SendReportEmailDialog({
  disabled = false,
  reportType,
  onSend,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideButton = false,
}: SendReportEmailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const trimmedEmail = currentEmail.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast({
        title: "Email duplicado",
        description: "Este email ya está en la lista.",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setCurrentEmail("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      toast({
        title: "Sin destinatarios",
        description: "Debes agregar al menos un email.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await onSend(emails);
      toast({
        title: "Reporte enviado",
        description: `El reporte fue enviado a ${emails.length} destinatario(s).`,
      });
      setOpen(false);
      setEmails([]);
      setCurrentEmail("");
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar el reporte. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideButton && (
        <DialogTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <Send className="h-4 w-4 mr-2" />
            Enviar por Correo
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Reporte por Correo</DialogTitle>
          <DialogDescription>
            El {reportType} será enviado en formato Excel y PDF a los correos indicados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Destinatarios</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addEmail}
                disabled={sending || !currentEmail.trim()}
              >
                Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Presiona Enter o haz clic en Agregar para añadir cada email
            </p>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Lista de destinatarios ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                      disabled={sending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={emails.length === 0 || sending}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
