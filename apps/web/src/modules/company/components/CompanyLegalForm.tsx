"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoicePreviewLive } from "./InvoicePreviewLive";
import { useUpdateCompanyProfile, useCompanyProfile } from "../company.hooks";
import { legalSchema } from "../company.schema";
import { CURRENCIES } from "@/constants/currencies";
import { t } from "@/i18n";

type LegalFormData = z.infer<typeof legalSchema>;

interface CompanyLegalFormProps {
  initialData?: LegalFormData;
}

export function CompanyLegalForm({ initialData }: CompanyLegalFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateCompanyProfile();
  const { data: companyProfile } = useCompanyProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LegalFormData>({
    resolver: zodResolver(legalSchema),
    defaultValues: initialData || {},
    mode: "onChange",
  });

  const currency = watch("currency");
  const enableMultiCurrency = watch("enableMultiCurrency");
  const legalName = watch("legalName");
  const commercialName = watch("commercialName");
  const email = watch("email");
  const phone = watch("phone");
  const address = watch("address");

  // Register fields for controlled inputs
  register("legalName");
  register("commercialName");
  register("email");
  register("phone");
  register("address");

  const onSubmit = (data: LegalFormData) => {
    updateProfile(
      { legal: data },
      {
        onSuccess: () => {
          toast.success(t().companySettings.legalSaved);
        },
        onError: () => {
          toast.error(t().companySettings.saveError);
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Column */}
      <Card>
        <CardHeader>
          <CardTitle>{t().companySettings.legalData}</CardTitle>
          <CardDescription>{t().companySettings.legalDescription}</CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="legalName" className="text-sm font-medium">
              {t().companySettings.legalName} <span className="text-destructive">*</span>
            </label>
            <Input
              id="legalName"
              placeholder={t().companySettings.legalNamePlaceholder}
              value={legalName || ""}
              onChange={(e) => setValue("legalName", e.target.value, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.legalName && (
              <p className="text-sm text-destructive">{errors.legalName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="commercialName" className="text-sm font-medium">
              {t().companySettings.commercialName}
            </label>
            <Input
              id="commercialName"
              placeholder={t().companySettings.commercialNamePlaceholder}
              value={commercialName || ""}
              onChange={(e) => setValue("commercialName", e.target.value, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.commercialName && (
              <p className="text-sm text-destructive">{errors.commercialName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t().companySettings.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="empresa@ejemplo.com"
                value={email || ""}
                onChange={(e) => setValue("email", e.target.value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                {t().companySettings.phone}
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+506 8888-8888"
                value={phone || ""}
                onChange={(e) => setValue("phone", e.target.value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              {t().companySettings.address}
            </label>
            <Textarea
              id="address"
              placeholder={t().companySettings.addressPlaceholder}
              rows={2}
              value={address || ""}
              onChange={(e) => setValue("address", e.target.value, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                {t().companySettings.country}
              </label>
              <Input
                id="country"
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
                {...register("country")}
              />
              <p className="text-xs text-muted-foreground">
                {t().companySettings.countryReadonly}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                {t().companySettings.currency} <span className="text-destructive">*</span>
              </label>
              <Select
                value={currency}
                onValueChange={(value) => setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t().companySettings.selectCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t().companySettings.currencyHelp}
              </p>
            </div>
          </div>

          {/* Multi-currency toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label htmlFor="enableMultiCurrency" className="text-sm font-medium">
                {t().companySettings.enableMultiCurrency}
              </label>
              <p className="text-xs text-muted-foreground">
                {t().companySettings.enableMultiCurrencyDescription}
              </p>
              {/* TODO: Add premium badge when plan validation is implemented */}
            </div>
            <Switch
              id="enableMultiCurrency"
              checked={enableMultiCurrency || false}
              onCheckedChange={(checked) => setValue("enableMultiCurrency", checked)}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? t().companySettings.saving : t().companySettings.saveChanges}
          </Button>
        </form>
      </CardContent>
    </Card>

      {/* Preview Column */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <InvoicePreviewLive
          logoUrl={companyProfile?.branding?.logoUrl}
          primaryColor={companyProfile?.branding?.primaryColor}
          secondaryColor={companyProfile?.branding?.secondaryColor}
          invoiceFooter={companyProfile?.branding?.invoiceFooter}
          legalName={legalName}
          commercialName={commercialName}
          email={email}
          phone={phone}
          address={address}
          taxId={companyProfile?.fiscal?.taxId}
          currency={currency}
        />
      </div>
    </div>
  );
}
