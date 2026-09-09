"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerInput, customerInputSchema, getDefaultContactPreferences } from "../customer.schema";
import { COUNTRIES } from "@/constants/countries";
import { t } from "@/i18n";

interface CustomerFormProps {
  initialData?: CustomerInput;
  onSubmit: (data: CustomerInput) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
}: CustomerFormProps) {
  const [currentStep, setCurrentStep] = useState("basic");
  
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: initialData ?? {
      name: "",
      email: "",
      phone: "",
      idNumber: "",
      country: "",
      state: "",
      city: "",
      zipCode: "",
      addressDetail: "",
      notes: "",
      status: "active",
      contactPreferences: getDefaultContactPreferences("", ""),
    },
  });

  const email = form.watch("email");
  const phone = form.watch("phone");
  const consentStatus = form.watch("contactPreferences.consentStatus");
  const allowEmail = form.watch("contactPreferences.allowEmail");
  const allowWhatsApp = form.watch("contactPreferences.allowWhatsApp");

  // Auto-disable channels when consent is denied
  useEffect(() => {
    if (consentStatus === "denied") {
      form.setValue("contactPreferences.allowEmail", false);
      form.setValue("contactPreferences.allowWhatsApp", false);
    }
  }, [consentStatus, form]);

  const handleNext = () => {
    if (currentStep === "basic") setCurrentStep("address");
    else if (currentStep === "address") setCurrentStep("preferences");
  };

  const handlePrev = () => {
    if (currentStep === "preferences") setCurrentStep("address");
    else if (currentStep === "address") setCurrentStep("basic");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" disabled={isSubmitting}>
              {t().customers.stepBasic}
            </TabsTrigger>
            <TabsTrigger value="address" disabled={isSubmitting}>
              {t().customers.stepAddress}
            </TabsTrigger>
            <TabsTrigger value="preferences" disabled={isSubmitting}>
              {t().customers.stepPreferences}
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Basic Information */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.nameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t().customers.namePlaceholder}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t().customers.emailLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t().customers.emailPlaceholder}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t().customers.phoneLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t().customers.phonePlaceholder}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.idNumberLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t().customers.idNumberPlaceholder}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.statusLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t().customers.statusPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t().customers.statusActive}</SelectItem>
                      <SelectItem value="inactive">{t().customers.statusInactive}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.notesLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t().customers.notesPlaceholder}
                      disabled={isSubmitting}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                {t().customers.nextStep}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Address */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.countryLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t().customers.countryPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.nameEs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t().customers.stateLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t().customers.statePlaceholder}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t().customers.cityLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t().customers.cityPlaceholder}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.zipCodeLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t().customers.zipCodePlaceholder}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.addressDetailLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t().customers.addressDetailPlaceholder}
                      disabled={isSubmitting}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t().customers.addressDetailDescription}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isSubmitting}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t().customers.prevStep}
              </Button>
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                {t().customers.nextStep}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Contact Preferences */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              {t().customers.contactPreferencesDescription}
            </p>

            {/* Consent Status */}
            <FormField
              control={form.control}
              name="contactPreferences.consentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.consentStatusLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unknown">{t().customers.consentUnknown}</SelectItem>
                      <SelectItem value="granted">{t().customers.consentGranted}</SelectItem>
                      <SelectItem value="denied">{t().customers.consentDenied}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {consentStatus === "denied" && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {t().customers.consentDeniedHint}
              </div>
            )}

            {/* Allow Email Toggle */}
            <FormField
              control={form.control}
              name="contactPreferences.allowEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t().customers.allowEmailLabel}
                    </FormLabel>
                    <FormDescription>
                      {!email || email === ""
                        ? t().customers.allowEmailNoEmail
                        : t().customers.allowEmailDescription}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={
                        isSubmitting ||
                        consentStatus === "denied" ||
                        !email ||
                        email === ""
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Allow WhatsApp Toggle */}
            <FormField
              control={form.control}
              name="contactPreferences.allowWhatsApp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t().customers.allowWhatsAppLabel}
                    </FormLabel>
                    <FormDescription>
                      {!phone || phone === ""
                        ? t().customers.allowWhatsAppNoPhone
                        : t().customers.allowWhatsAppDescription}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={
                        isSubmitting ||
                        consentStatus === "denied" ||
                        !phone ||
                        phone === ""
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Preferred Channel */}
            <FormField
              control={form.control}
              name="contactPreferences.preferredChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.preferredChannelLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unspecified">
                        {t().customers.channelUnspecified}
                      </SelectItem>
                      <SelectItem value="email" disabled={!allowEmail}>
                        {t().customers.channelEmail}
                      </SelectItem>
                      <SelectItem value="whatsapp" disabled={!allowWhatsApp}>
                        {t().customers.channelWhatsApp}
                      </SelectItem>
                      <SelectItem value="phone">
                        {t().customers.channelPhone}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Time */}
            <FormField
              control={form.control}
              name="contactPreferences.preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t().customers.preferredTimeLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="any">{t().customers.timeAny}</SelectItem>
                      <SelectItem value="morning">{t().customers.timeMorning}</SelectItem>
                      <SelectItem value="afternoon">{t().customers.timeAfternoon}</SelectItem>
                      <SelectItem value="evening">{t().customers.timeEvening}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isSubmitting}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t().customers.prevStep}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel ?? t().customers.saveButton}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
