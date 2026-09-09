"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  type Step1Data,
  type Step2Data,
  type Step3Data,
} from "@/schemas/tenantSettings.schema";
import { OnboardingStepCompany } from "./OnboardingStepCompany";
import { OnboardingStepTaxCurrency } from "./OnboardingStepTaxCurrency";
import { OnboardingStepNumbering } from "./OnboardingStepNumbering";
import { useCompleteTenantOnboardingMutation } from "@/hooks/useTenantSettings";
import { getCountryDefaults } from "@/lib/countryDefaults";
import { t } from "@/i18n";

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const completeMutation = useCompleteTenantOnboardingMutation();

  const [formData, setFormData] = useState({
    companyName: "",
    country: "US",
    currency: "USD",
    taxEnabled: false,
    taxName: "Sales Tax",
    taxRate: 0,
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: formData.companyName,
      country: formData.country,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      currency: formData.currency,
      taxEnabled: formData.taxEnabled,
      taxName: formData.taxName,
      taxRate: formData.taxRate,
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      invoicePrefix: formData.invoicePrefix,
      nextInvoiceNumber: formData.nextInvoiceNumber,
    },
  });

  // Watch country changes and apply defaults to step2 form
  const selectedCountry = step1Form.watch("country");

  useEffect(() => {
    if (!selectedCountry) return;

    const defaults = getCountryDefaults(selectedCountry);
    const dirtyFields = step2Form.formState.dirtyFields;

    // Only update fields that haven't been manually edited by the user
    if (!dirtyFields.currency) {
      step2Form.setValue("currency", defaults.currency);
      setFormData(prev => ({ ...prev, currency: defaults.currency }));
    }

    if (!dirtyFields.taxEnabled) {
      step2Form.setValue("taxEnabled", defaults.taxEnabled);
      setFormData(prev => ({ ...prev, taxEnabled: defaults.taxEnabled }));
    }

    if (!dirtyFields.taxName) {
      step2Form.setValue("taxName", defaults.taxName);
      setFormData(prev => ({ ...prev, taxName: defaults.taxName }));
    }

    if (!dirtyFields.taxRate) {
      step2Form.setValue("taxRate", defaults.taxRate);
      setFormData(prev => ({ ...prev, taxRate: defaults.taxRate }));
    }
  }, [selectedCountry]);

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) {
        setFormData({ ...formData, ...step1Form.getValues() });
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) {
        setFormData({ ...formData, ...step2Form.getValues() });
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      isValid = await step3Form.trigger();
      if (isValid) {
        const finalData = {
          ...formData,
          ...step3Form.getValues(),
        };

        completeMutation.mutate(finalData, {
          onSuccess: () => {
            toast({
              title: t().system.onboarding.successTitle,
              description: t().system.onboarding.successDescription,
            });
            router.push("/system/dashboard");
          },
          onError: () => {
            toast({
              title: t().system.onboarding.errorTitle,
              description: t().system.onboarding.errorDescription,
              variant: "destructive",
            });
          },
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-2xl p-8 space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 ${
                    step < currentStep
                      ? "text-primary"
                      : step === currentStep
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step < currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : step === currentStep
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {step < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm">{step}</span>
                    )}
                  </div>
                  {step < TOTAL_STEPS && (
                    <div
                      className={`w-16 h-0.5 ${
                        step < currentStep ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {t().system.onboarding.stepLabel} {currentStep} {t().system.onboarding.ofLabel} {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <Form {...step1Form}>
              <OnboardingStepCompany form={step1Form} />
            </Form>
          )}

          {currentStep === 2 && (
            <Form {...step2Form}>
              <OnboardingStepTaxCurrency form={step2Form} />
            </Form>
          )}

          {currentStep === 3 && (
            <Form {...step3Form}>
              <OnboardingStepNumbering form={step3Form} />
            </Form>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || completeMutation.isPending}
          >
            {t().system.onboarding.backButton}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t().system.onboarding.savingButton}
              </>
            ) : currentStep === TOTAL_STEPS ? (
              t().system.onboarding.finishButton
            ) : (
              t().system.onboarding.nextButton
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
