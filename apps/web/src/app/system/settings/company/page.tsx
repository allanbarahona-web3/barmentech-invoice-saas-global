"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyBrandingForm } from "@/modules/company/components/CompanyBrandingForm";
import { CompanyLegalForm } from "@/modules/company/components/CompanyLegalForm";
import { CompanyFiscalForm } from "@/modules/company/components/CompanyFiscalForm";
import { CompanyPaymentMethodsForm } from "@/modules/company/components/CompanyPaymentMethodsForm";
import { useCompanyProfile, useSaveCompanyProfile } from "@/modules/company/company.hooks";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CompanySettingsPage() {
  const { data: profile, isLoading } = useCompanyProfile();
  const { mutate: saveProfile, isPending: isSaving } = useSaveCompanyProfile();
  const [country, setCountry] = useState<string | undefined>();
  const [currency, setCurrency] = useState<string | undefined>();

  useEffect(() => {
    const loadTenantData = async () => {
      const settings = await tenantSettingsService.getTenantSettings();
      if (settings) {
        setCountry(settings.country);
        setCurrency(settings.currency);
      }
    };
    loadTenantData();
  }, []);

  const handleInitializeProfile = () => {
    if (!country || !currency) return;

    saveProfile({
      branding: {},
      legal: {
        legalName: "",
        country,
        currency,
      },
      fiscal: {},
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t().companySettings.title}</h1>
        <p className="text-muted-foreground mt-2">{t().companySettings.description}</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {t().companySettings.notice}
        </p>
      </div>

      {!profile ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">{t().companySettings.emptyTitle}</h2>
            <p className="text-muted-foreground max-w-md">
              {t().companySettings.emptyDescription}
            </p>
          </div>
          <Button onClick={handleInitializeProfile} disabled={isSaving || !country || !currency}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t().companySettings.initializing}
              </>
            ) : (
              t().companySettings.initialize
            )}
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="branding">{t().companySettings.branding}</TabsTrigger>
            <TabsTrigger value="legal">{t().companySettings.legalData}</TabsTrigger>
            <TabsTrigger value="fiscal">{t().companySettings.fiscalData}</TabsTrigger>
            <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <CompanyBrandingForm initialData={profile.branding} />
          </TabsContent>

          <TabsContent value="legal">
            <CompanyLegalForm initialData={profile.legal} />
          </TabsContent>

          <TabsContent value="fiscal">
            <CompanyFiscalForm initialData={profile.fiscal} country={profile.legal.country} />
          </TabsContent>

          <TabsContent value="payments">
            <CompanyPaymentMethodsForm country={profile.legal.country} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
