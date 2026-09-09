"use client";

import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTrialStatus } from "../trial.hooks";
import { t } from "@/i18n";
import Link from "next/link";

export function TrialBanner() {
  const { data: trialStatus, isLoading } = useTrialStatus();

  if (isLoading || !trialStatus) return null;

  // Don't show banner if trial expired
  if (!trialStatus.isActive) return null;

  const { daysLeft, isExpiringSoon } = trialStatus;

  return (
    <Alert
      variant={isExpiringSoon ? "destructive" : "default"}
      className="mb-4"
    >
      <div className="flex items-start gap-3">
        {isExpiringSoon ? (
          <AlertCircle className="h-5 w-5 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle>
            {isExpiringSoon
              ? t().trial.expiringSoonTitle
              : t().trial.activeTitle}
          </AlertTitle>
          <AlertDescription>
            {daysLeft === 1
              ? t().trial.lastDay
              : t().trial.daysLeftMessage.replace("{days}", daysLeft.toString())}
          </AlertDescription>
        </div>
        <Button variant={isExpiringSoon ? "secondary" : "outline"} size="sm" asChild>
          <Link href="/system/billing">{t().trial.viewPlans}</Link>
        </Button>
      </div>
    </Alert>
  );
}
