"use client";

import { t } from "@/i18n";
import { Copy, Mail, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPlanById, type PlanId } from "../plans";
import { useState } from "react";

// Helper to get nested translation value
function getNestedTranslation(key: string): string {
  const translations = t();
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: PlanId;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  planId,
}: UpgradeDialogProps) {
  const [copied, setCopied] = useState(false);
  const plan = planId ? getPlanById(planId) : null;

  const handleCopyPlanInfo = () => {
    if (!plan) return;

    const planInfo = `
Plan: ${getNestedTranslation(plan.name)}
Precio: $${plan.monthlyPrice} ${plan.currency}/mes
Descripción: ${getNestedTranslation(plan.description)}
    `.trim();

    navigator.clipboard.writeText(planInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactEmail = () => {
    const subject = plan
      ? `Interesado en plan ${getNestedTranslation(plan.name)}`
      : "Consulta sobre planes";
    window.location.href = `mailto:sales@barmentech.com?subject=${encodeURIComponent(subject)}`;
  };

  const handleContactWhatsApp = () => {
    const message = plan
      ? `Hola, estoy interesado en el plan ${getNestedTranslation(plan.name)} ($${plan.monthlyPrice} ${plan.currency}/mes)`
      : "Hola, quiero información sobre los planes";
    window.open(
      `https://wa.me/50612345678?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle>{t().upgrade.title}</DialogTitle>
          <DialogDescription>{t().upgrade.description}</DialogDescription>
        </DialogHeader>

        {plan && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">
                    {getNestedTranslation(plan.name)}
                  </div>
                  <div className="text-2xl font-bold">
                    ${plan.monthlyPrice}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.currency}/{t().plans.month}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              {t().upgrade.comingSoon}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="text-sm font-medium mb-1">{t().upgrade.contactUs}</div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleContactEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t().upgrade.email}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleContactWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {plan && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyPlanInfo}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? t().upgrade.copied : t().upgrade.copyPlanInfo}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
