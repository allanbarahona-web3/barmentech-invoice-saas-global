"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { InvoicePreviewLive } from "./InvoicePreviewLive";
import { CustomHeaderFieldsManager } from "./CustomHeaderFieldsManager";
import { useUpdateCompanyProfile, useCompanyProfile } from "../company.hooks";
import { brandingSchema, type CustomHeaderField } from "../company.schema";
import { t } from "@/i18n";

type BrandingFormData = z.infer<typeof brandingSchema>;

interface CompanyBrandingFormProps {
  initialData?: BrandingFormData;
}

export function CompanyBrandingForm({ initialData }: CompanyBrandingFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateCompanyProfile();
  const { data: companyProfile } = useCompanyProfile();
  const [customHeaderFields, setCustomHeaderFields] = useState<CustomHeaderField[]>([]);

  // Load custom header fields from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("customHeaderFields");
    if (stored) {
      try {
        setCustomHeaderFields(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse custom header fields:", e);
      }
    }
  }, []);

  // Save custom header fields to localStorage when they change
  useEffect(() => {
    localStorage.setItem("customHeaderFields", JSON.stringify(customHeaderFields));
  }, [customHeaderFields]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: initialData || {},
    mode: "onChange",
  });

  const logoUrl = watch("logoUrl");
  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");
  const invoiceFooter = watch("invoiceFooter");

  // Register fields for controlled inputs
  register("logoUrl");
  register("primaryColor");
  register("secondaryColor");
  register("invoiceFooter");

  const onSubmit = (data: BrandingFormData) => {
    updateProfile(
      { branding: data },
      {
        onSuccess: () => {
          toast.success(t().companySettings.brandingSaved);
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
          <CardTitle>{t().companySettings.branding}</CardTitle>
          <CardDescription>{t().companySettings.brandingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t().companySettings.logoUrl}
              </label>
              <ImageUploader
                value={logoUrl}
                onChange={(value) => setValue("logoUrl", value, { shouldValidate: true, shouldDirty: true })}
                maxSizeMB={2}
                acceptedFormats={[".png", ".jpg", ".jpeg"]}
                disabled={isPending}
              />
              {errors.logoUrl && (
                <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="primaryColor" className="text-sm font-medium">
                {t().companySettings.primaryColor}
              </label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  className="w-20 h-10 p-1 cursor-pointer"
                  value={primaryColor || "#000000"}
                  onChange={(e) => setValue("primaryColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  className="flex-1"
                  value={primaryColor || ""}
                  onChange={(e) => setValue("primaryColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                />
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="secondaryColor" className="text-sm font-medium">
                {t().companySettings.secondaryColor}
              </label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  className="w-20 h-10 p-1 cursor-pointer"
                  value={secondaryColor || "#666666"}
                  onChange={(e) => setValue("secondaryColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  className="flex-1"
                  value={secondaryColor || ""}
                  onChange={(e) => setValue("secondaryColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                />
              </div>
              {errors.secondaryColor && (
                <p className="text-sm text-destructive">{errors.secondaryColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="invoiceFooter" className="text-sm font-medium">
                {t().companySettings.invoiceFooter}
              </label>
              <Textarea
                id="invoiceFooter"
                placeholder={t().companySettings.invoiceFooterPlaceholder}
                rows={3}
                value={invoiceFooter || ""}
                onChange={(e) => setValue("invoiceFooter", e.target.value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.invoiceFooter && (
                <p className="text-sm text-destructive">{errors.invoiceFooter.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? t().companySettings.saving : t().companySettings.saveChanges}
            </Button>
          </form>

          {/* Custom Header Fields Section */}
          <div className="mt-6 pt-6 border-t">
            <CustomHeaderFieldsManager
              fields={customHeaderFields}
              onChange={setCustomHeaderFields}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Column */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <InvoicePreviewLive
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          invoiceFooter={invoiceFooter}
          legalName={companyProfile?.legal?.legalName}
          commercialName={companyProfile?.legal?.commercialName}
          email={companyProfile?.legal?.email}
          phone={companyProfile?.legal?.phone}
          address={companyProfile?.legal?.address}
          taxId={companyProfile?.fiscal?.taxId}
          currency={companyProfile?.legal?.currency}
          customHeaderFields={customHeaderFields}
        />
      </div>
    </div>
  );
}
