"use client";

import { t } from "@/i18n";
import { CreditCard, Clock, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTrialStatus } from "../trial.hooks";
import Link from "next/link";

export function CurrentPlanCard() {
  const { data: trialStatus } = useTrialStatus();

  const isTrialActive = trialStatus?.isActive ?? true;
  const daysLeft = trialStatus?.daysLeft ?? 14;
  const isExpiringSoon = trialStatus?.isExpiringSoon ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">{t().billing.currentPlan}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isTrialActive 
                ? isExpiringSoon 
                  ? "bg-orange-500" 
                  : "bg-blue-500"
                : "bg-red-500"
            }`} />
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {t().plans.trial.name}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          {isTrialActive ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {daysLeft === 1
                  ? t().trial.lastDay
                  : t().trial.daysLeftMessage.replace("{days}", daysLeft.toString())}
              </span>
            </div>
          ) : (
            <div className="text-sm text-destructive font-medium">
              {t().billing.expired}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/system/billing" className="cursor-pointer">
            <Sparkles className="h-4 w-4 mr-2" />
            {t().trial.viewPlans}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
