"use client";

import { AlertCircle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import Link from "next/link";

interface TrialExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialExpiredDialog({ open, onOpenChange }: TrialExpiredDialogProps) {
  const handleContactWhatsApp = () => {
    const message = "Hola, mi período de prueba expiró y quiero información sobre los planes";
    window.open(
      `https://wa.me/50612345678?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
            <div>
              <DialogTitle>{t().trial.expiredTitle}</DialogTitle>
              <DialogDescription className="mt-1">
                {t().trial.expiredDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">
            {t().trial.expiredMessage}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContactWhatsApp} className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            {t().trial.contact}
          </Button>
          <Button asChild className="flex-1" onClick={() => onOpenChange(false)}>
            <Link href="/system/billing">{t().trial.viewPlans}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
