"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { getPaymentMethodsByCountry, getDefaultPaymentMethods } from "@/constants/paymentMethods";

const paymentMethodsSchema = z.object({
  acceptedPaymentMethods: z.array(z.string()).min(1, "Debe seleccionar al menos un método de pago"),
});

type PaymentMethodsFormValues = z.infer<typeof paymentMethodsSchema>;

interface CompanyPaymentMethodsFormProps {
  country: string;
}

export function CompanyPaymentMethodsForm({ country }: CompanyPaymentMethodsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const availablePaymentMethods = getPaymentMethodsByCountry(country);

  const form = useForm<PaymentMethodsFormValues>({
    resolver: zodResolver(paymentMethodsSchema),
    defaultValues: {
      acceptedPaymentMethods: [],
    },
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const settings = await tenantSettingsService.getTenantSettings();
        if (settings?.acceptedPaymentMethods && settings.acceptedPaymentMethods.length > 0) {
          form.reset({
            acceptedPaymentMethods: settings.acceptedPaymentMethods,
          });
        } else {
          // Set default payment methods for the country
          const defaults = getDefaultPaymentMethods(country);
          form.reset({
            acceptedPaymentMethods: defaults,
          });
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los métodos de pago configurados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentMethods();
  }, [country, form, toast]);

  const onSubmit = async (data: PaymentMethodsFormValues) => {
    setIsSaving(true);
    try {
      const currentSettings = await tenantSettingsService.getTenantSettings();
      if (!currentSettings) {
        throw new Error("No se encontró la configuración del tenant");
      }

      await tenantSettingsService.saveTenantSettings({
        ...currentSettings,
        acceptedPaymentMethods: data.acceptedPaymentMethods,
      });

      toast({
        title: "Métodos de pago actualizados",
        description: "Los métodos de pago han sido guardados correctamente",
      });
    } catch (error) {
      console.error("Error saving payment methods:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los métodos de pago",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Métodos de Pago Aceptados</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona los métodos de pago que tu empresa acepta. Estos métodos estarán disponibles al registrar pagos de facturas.
            </p>
          </div>

          <FormField
            control={form.control}
            name="acceptedPaymentMethods"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Métodos Disponibles</FormLabel>
                  <FormDescription>
                    Según tu país ({country}), estos son los métodos de pago disponibles
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePaymentMethods.map((method) => (
                    <FormField
                      key={method.id}
                      control={form.control}
                      name="acceptedPaymentMethods"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={method.id}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(method.id)}
                                onCheckedChange={(checked: boolean) => {
                                  return checked
                                    ? field.onChange([...field.value, method.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: string) => value !== method.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <FormLabel className="text-sm font-medium flex items-center gap-2">
                                <span className="text-2xl">{method.icon}</span>
                                {method.nameEs}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {method.requiresReference && "Requiere referencia"}
                                {method.requiresBankInfo && " • Requiere info bancaria"}
                              </p>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
