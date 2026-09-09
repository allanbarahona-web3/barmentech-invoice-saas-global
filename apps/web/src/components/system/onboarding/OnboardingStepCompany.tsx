"use client";

import { UseFormReturn } from "react-hook-form";
import { Step1Data } from "@/schemas/tenantSettings.schema";
import {
  FormControl,
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
import { t } from "@/i18n";

interface OnboardingStepCompanyProps {
  form: UseFormReturn<Step1Data>;
}

export function OnboardingStepCompany({ form }: OnboardingStepCompanyProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t().system.onboarding.welcome}</h2>
        <p className="text-muted-foreground">
          {t().system.onboarding.welcomeSubtitle}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t().system.onboarding.companyNameLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t().system.onboarding.companyNamePlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t().system.onboarding.countryLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t().system.onboarding.countryPlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CR">🇨🇷 Costa Rica</SelectItem>
                  <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
                  <SelectItem value="MX">🇲🇽 México</SelectItem>
                  <SelectItem value="ES">🇪🇸 España</SelectItem>
                  <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                  <SelectItem value="Global">🌎 Global</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
