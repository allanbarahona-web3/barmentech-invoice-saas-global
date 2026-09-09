"use client";

import { UseFormReturn } from "react-hook-form";
import { Step3Data } from "@/schemas/tenantSettings.schema";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";

interface OnboardingStepNumberingProps {
  form: UseFormReturn<Step3Data>;
}

export function OnboardingStepNumbering({ form }: OnboardingStepNumberingProps) {
  const prefix = form.watch("invoicePrefix");
  const nextNumber = form.watch("nextInvoiceNumber");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t().system.onboarding.numberingTitle}</h2>
        <p className="text-muted-foreground">
          {t().system.onboarding.numberingSubtitle}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <FormField
          control={form.control}
          name="invoicePrefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t().system.onboarding.invoicePrefixLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t().system.onboarding.invoicePrefixPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t().system.onboarding.invoicePrefixDescription}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextInvoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t().system.onboarding.nextInvoiceNumberLabel}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={t().system.onboarding.nextInvoiceNumberPlaceholder}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                {t().system.onboarding.nextInvoiceNumberDescription} {prefix}{nextNumber}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">{t().system.onboarding.previewTitle}</p>
          <p className="text-2xl font-bold text-center">
            {prefix}{nextNumber}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            {t().system.onboarding.previewDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
