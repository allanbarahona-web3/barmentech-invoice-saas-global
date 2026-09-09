"use client";

import { t } from "@/i18n";
import { Clock, AlertCircle, CreditCard, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/modules/billing/components/PlanCard";
import { UpgradeDialog } from "@/modules/billing/components/UpgradeDialog";
import { getActivePlans, type PlanId } from "@/modules/billing/plans";
import { useTrialStatus } from "@/modules/billing/trial.hooks";
import { useState } from "react";

export default function BillingPage() {
  const { data: trialStatus } = useTrialStatus();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | undefined>();

  const plans = getActivePlans();

  const handleUpgrade = (planId: string) => {
    setSelectedPlanId(planId as PlanId);
    setUpgradeDialogOpen(true);
  };

  const isTrialActive = trialStatus?.isActive ?? true;
  const daysLeft = trialStatus?.daysLeft ?? 14;
  const isExpiringSoon = trialStatus?.isExpiringSoon ?? false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t().billing.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t().billing.description}
        </p>
      </div>

      {/* Trial Status Banner */}
      {isTrialActive ? (
        <Alert variant={isExpiringSoon ? "destructive" : "default"}>
          {isExpiringSoon ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <AlertTitle>
            {isExpiringSoon
              ? t().trial.expiringSoonTitle
              : t().trial.activeTitle}
          </AlertTitle>
          <AlertDescription>
            {daysLeft === 1
              ? t().trial.lastDay
              : t().trial.daysLeftMessage.replace(
                  "{days}",
                  daysLeft.toString()
                )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t().trial.expiredTitle}</AlertTitle>
          <AlertDescription>{t().trial.expiredDescription}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                {t().billing.currentPlan}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t().billing.currentPlanDescription}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-medium">{t().plans.trial.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {isTrialActive
              ? `${daysLeft} ${t().billing.daysRemaining}`
              : t().billing.expired}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">{t().billing.upgradePlans}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onUpgrade={handleUpgrade}
              currentPlan={false}
            />
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="font-semibold mb-4">{t().billing.faq.title}</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">{t().billing.faq.q1}</p>
            <p className="text-muted-foreground">{t().billing.faq.a1}</p>
          </div>
          <div>
            <p className="font-medium mb-1">{t().billing.faq.q2}</p>
            <p className="text-muted-foreground">{t().billing.faq.a2}</p>
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        planId={selectedPlanId}
      />
    </div>
  );
}
