"use client";

import { t } from "@/i18n";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Plan } from "../plans";

interface PlanCardProps {
  plan: Plan;
  onUpgrade?: (planId: string) => void;
  currentPlan?: boolean;
}

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

export function PlanCard({ plan, onUpgrade, currentPlan }: PlanCardProps) {
  const isHighlighted = plan.highlighted;

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isHighlighted && "border-primary shadow-lg scale-105"
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-3 py-1">
            {getNestedTranslation(plan.badge)}
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{getNestedTranslation(plan.name)}</CardTitle>
        <CardDescription>
          {getNestedTranslation(plan.description)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          {plan.monthlyPrice === null ? (
            <div className="text-4xl font-bold">{t().plans.free}</div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
              <span className="text-muted-foreground">
                {plan.currency}/{t().plans.month}
              </span>
            </div>
          )}
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">
                {getNestedTranslation(feature)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {currentPlan ? (
          <Button disabled className="w-full">
            {t().plans.currentPlan}
          </Button>
        ) : (
          <Button
            onClick={() => onUpgrade?.(plan.id)}
            disabled={plan.disabled}
            variant={isHighlighted ? "default" : "outline"}
            className="w-full"
          >
            {getNestedTranslation(plan.ctaLabel)}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
