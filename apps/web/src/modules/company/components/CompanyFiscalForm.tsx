"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoicePreviewLive } from "./InvoicePreviewLive";
import { useUpdateCompanyProfile, useCompanyProfile } from "../company.hooks";
import { fiscalSchema } from "../company.schema";
import { isCREnabled } from "../company.country";
import { t } from "@/i18n";

type FiscalFormData = z.infer<typeof fiscalSchema>;

interface CompanyFiscalFormProps {
  initialData?: FiscalFormData;
  country?: string;
}

export function CompanyFiscalForm({ initialData, country }: CompanyFiscalFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateCompanyProfile();
  const { data: companyProfile } = useCompanyProfile();
  const showCRFields = isCREnabled(country);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FiscalFormData>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      ...initialData,
      cr: {
        ...initialData?.cr,
        taxpayerType: initialData?.cr?.taxpayerType || "company",
      },
    },
    mode: "onChange",
  });

  const taxId = watch("taxId");
  const taxpayerType = watch("cr.taxpayerType");

  // Register fields for controlled inputs
  register("taxId");
  register("cr.taxpayerType");

  const onSubmit = (data: FiscalFormData) => {
    updateProfile(
      { fiscal: data },
      {
        onSuccess: () => {
          toast.success(t().companySettings.fiscalSaved);
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
          <CardTitle>{t().companySettings.fiscalData}</CardTitle>
          <CardDescription>{t().companySettings.fiscalDescription}</CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Base Fiscal Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t().companySettings.fiscalBase}
            </h3>

            <div className="space-y-2">
              <label htmlFor="taxId" className="text-sm font-medium">
                {t().companySettings.taxId}
              </label>
              <Input
                id="taxId"
                placeholder={t().companySettings.taxIdPlaceholder}
                value={taxId || ""}
                onChange={(e) => setValue("taxId", e.target.value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.taxId && (
                <p className="text-sm text-destructive">{errors.taxId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="taxRegime" className="text-sm font-medium">
                {t().companySettings.taxRegime}
              </label>
              <Input
                id="taxRegime"
                placeholder={t().companySettings.taxRegimePlaceholder}
                {...register("taxRegime")}
              />
              {errors.taxRegime && (
                <p className="text-sm text-destructive">{errors.taxRegime.message}</p>
              )}
            </div>
          </div>

          {/* Costa Rica Extension */}
          {showCRFields && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t().companySettings.fiscalCR}
                </h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                  Costa Rica
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cr-taxpayerType" className="text-sm font-medium">
                    {t().companySettings.taxpayerType}
                  </label>
                  <Select
                    value={taxpayerType || "company"}
                    onValueChange={(value) => {
                      const typedValue = value as "individual" | "company" | "other" | undefined;
                      setValue("cr.taxpayerType", typedValue, { shouldValidate: true, shouldDirty: true });
                    }}
                  >
                    <SelectTrigger id="cr-taxpayerType">
                      <SelectValue placeholder={t().companySettings.taxpayerTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Persona Jurídica (Empresa)</SelectItem>
                      <SelectItem value="individual">Persona Física</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.cr?.taxpayerType && (
                    <p className="text-sm text-destructive">{errors.cr.taxpayerType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cr-activityCode" className="text-sm font-medium">
                    {t().companySettings.activityCode}
                  </label>
                  <Input
                    id="cr-activityCode"
                    placeholder={t().companySettings.activityCodePlaceholder}
                    {...register("cr.activityCode")}
                  />
                  {errors.cr?.activityCode && (
                    <p className="text-sm text-destructive">{errors.cr.activityCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cr-province" className="text-sm font-medium">
                    {t().companySettings.province}
                  </label>
                  <Input
                    id="cr-province"
                    placeholder={t().companySettings.provincePlaceholder}
                    {...register("cr.location.province")}
                  />
                  {errors.cr?.location?.province && (
                    <p className="text-sm text-destructive">{errors.cr.location.province.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cr-canton" className="text-sm font-medium">
                    {t().companySettings.canton}
                  </label>
                  <Input
                    id="cr-canton"
                    placeholder={t().companySettings.cantonPlaceholder}
                    {...register("cr.location.canton")}
                  />
                  {errors.cr?.location?.canton && (
                    <p className="text-sm text-destructive">{errors.cr.location.canton.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cr-district" className="text-sm font-medium">
                    {t().companySettings.district}
                  </label>
                  <Input
                    id="cr-district"
                    placeholder={t().companySettings.districtPlaceholder}
                    {...register("cr.location.district")}
                  />
                  {errors.cr?.location?.district && (
                    <p className="text-sm text-destructive">{errors.cr.location.district.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cr-branchCode" className="text-sm font-medium">
                    {t().companySettings.branchCode}
                  </label>
                  <Input
                    id="cr-branchCode"
                    placeholder={t().companySettings.branchCodePlaceholder}
                    {...register("cr.branchCode")}
                  />
                  {errors.cr?.branchCode && (
                    <p className="text-sm text-destructive">{errors.cr.branchCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cr-terminalCode" className="text-sm font-medium">
                    {t().companySettings.terminalCode}
                  </label>
                  <Input
                    id="cr-terminalCode"
                    placeholder={t().companySettings.terminalCodePlaceholder}
                    {...register("cr.terminalCode")}
                  />
                  {errors.cr?.terminalCode && (
                    <p className="text-sm text-destructive">{errors.cr.terminalCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
          legalName={companyProfile?.legal?.legalName}
          commercialName={companyProfile?.legal?.commercialName}
          email={companyProfile?.legal?.email}
          phone={companyProfile?.legal?.phone}
          address={companyProfile?.legal?.address}
          taxId={taxId}
          currency={companyProfile?.legal?.currency}
        />
      </div>
    </div>
  );
}
