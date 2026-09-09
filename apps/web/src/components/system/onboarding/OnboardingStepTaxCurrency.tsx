"use client";

import { UseFormReturn } from "react-hook-form";
import { Step2Data } from "@/schemas/tenantSettings.schema";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { t } from "@/i18n";

interface OnboardingStepTaxCurrencyProps {
  form: UseFormReturn<Step2Data>;
}

export function OnboardingStepTaxCurrency({ form }: OnboardingStepTaxCurrencyProps) {
  const taxEnabled = form.watch("taxEnabled");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t().system.onboarding.taxCurrencyTitle}</h2>
        <p className="text-muted-foreground">
          {t().system.onboarding.taxCurrencySubtitle}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t().system.onboarding.currencyLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t().system.onboarding.currencyPlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CRC">CRC - Colón costarricense</SelectItem>
                  <SelectItem value="USD">USD - Dólar estadounidense</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="MXN">MXN - Peso mexicano</SelectItem>
                  <SelectItem value="COP">COP - Peso colombiano</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t().system.onboarding.taxEnabledLabel}
                </FormLabel>
                <FormDescription>
                  {t().system.onboarding.taxEnabledDescription}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {taxEnabled && (
          <>
            <FormField
              control={form.control}
              name="taxName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().system.onboarding.taxNameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t().system.onboarding.taxNamePlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().system.onboarding.taxRateLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder={t().system.onboarding.taxRatePlaceholder}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t().system.onboarding.taxRateDescription}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
