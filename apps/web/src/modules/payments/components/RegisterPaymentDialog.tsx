"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign, AlertTriangle } from "lucide-react";
import { useCreatePayment } from "@/modules/payments/payments.hooks";
import { getPaymentMethodById } from "@/constants/paymentMethods";
import { tenantSettingsService } from "@/services/tenantSettingsService";
import { validatePaymentAmount } from "@/modules/payments/payments.utils";

const paymentSchema = z.object({
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
  paymentDate: z.string().min(1, "La fecha es requerida"),
  reference: z.string().optional(),
  bankInfo: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number;
    totalPaid?: number;
  };
  country: string;
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  invoice,
  country,
}: RegisterPaymentDialogProps) {
  const [acceptedMethods, setAcceptedMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const createPayment = useCreatePayment();

  const balance = invoice.total - (invoice.totalPaid || 0);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balance > 0 ? balance : 0,
      paymentMethod: "",
      paymentDate: new Date().toISOString().split("T")[0],
      reference: "",
      bankInfo: "",
      notes: "",
    },
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      const settings = await tenantSettingsService.getTenantSettings();
      if (settings?.acceptedPaymentMethods) {
        setAcceptedMethods(settings.acceptedPaymentMethods);
      }
    };
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (open) {
      form.reset({
        amount: balance > 0 ? balance : 0,
        paymentMethod: "",
        paymentDate: new Date().toISOString().split("T")[0],
        reference: "",
        bankInfo: "",
        notes: "",
      });
      setSelectedMethod(null);
      setAmountError(null);
    }
  }, [open, balance, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    // Validate payment amount
    const validation = validatePaymentAmount(
      data.amount,
      invoice.total,
      invoice.totalPaid || 0
    );

    if (!validation.valid) {
      setAmountError(validation.error || "Monto inválido");
      return;
    }

    try {
      await createPayment.mutateAsync({
        invoiceId: invoice.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        reference: data.reference,
        bankInfo: data.bankInfo,
        notes: data.notes,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
      console.error("Error registering payment:", error);
    }
  };

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    form.setValue("paymentMethod", methodId);
  };

  const currentMethod = selectedMethod ? getPaymentMethodById(selectedMethod, country) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Factura: {invoice.invoiceNumber} • Saldo pendiente: ${balance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto del Pago</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-9"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value));
                            setAmountError(null);
                          }}
                        />
                      </div>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue("amount", balance);
                        setAmountError(null);
                      }}
                      disabled={balance <= 0}
                    >
                      Saldo Total
                    </Button>
                  </div>
                  <FormDescription>
                    Total factura: ${invoice.total.toFixed(2)} • Pagado: ${(invoice.totalPaid || 0).toFixed(2)}
                  </FormDescription>
                  {amountError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {amountError}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select onValueChange={handleMethodChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {acceptedMethods.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Configura los métodos de pago en Ajustes
                        </div>
                      ) : (
                        acceptedMethods.map((methodId) => {
                          const method = getPaymentMethodById(methodId, country);
                          return method ? (
                            <SelectItem key={method.id} value={method.id}>
                              <span className="flex items-center gap-2">
                                <span>{method.icon}</span>
                                <span>{method.nameEs}</span>
                              </span>
                            </SelectItem>
                          ) : null;
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentMethod?.requiresReference && (
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia / Número de Transacción</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: SINPE 1234567890, Cheque #123" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número de referencia de la transacción
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentMethod?.requiresBankInfo && (
              <FormField
                control={form.control}
                name="bankInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Información Bancaria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Banco Nacional, Cuenta 123456" {...field} />
                    </FormControl>
                    <FormDescription>
                      Banco y cuenta donde se realizó la transacción
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el pago..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPayment.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createPayment.isPending || acceptedMethods.length === 0 || !!amountError}
              >
                {createPayment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
